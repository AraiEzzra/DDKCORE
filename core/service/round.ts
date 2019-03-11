import { ResponseEntity } from 'shared/model/response';
import crypto from 'crypto';
import SlotService from 'core/service/slot';
import Config from 'shared/util/config';
// todo delete it when find a way to mock services for tests
// import BlockService from 'test/core/mock/blockService';
// import { createTaskON } from 'test/core/mock/bus';
// import BlockRepository from 'test/core/mock/blockRepository';
import BlockRepository from 'core/repository/block';
import { Round, Slots } from 'shared/model/round';
import RoundRepository from 'core/repository/round';
import { createTaskON } from 'shared/util/bus';
import DelegateRepository from 'core/repository/delegate';
import AccountRepository from 'core/repository/account';
import { ed } from 'shared/util/ed';
import { Delegate } from 'shared/model/delegate';
import { logger } from 'shared/util/logger';
import { compose } from 'core/util/common';
import RoundPGRepository from 'core/repository/round/pg';
import { Block } from 'shared/model/block';

const constants = Config.constants;

interface IHashList {
    hash: string;
    generatorPublicKey: string;
}

interface IRoundSum {
    roundFees: number;
    roundDelegates: Array<string>;
}

interface IRoundService {

    generateHashList(params: {activeDelegates: Array<Delegate>, blockId: string}):
        Array<{hash: string, generatorPublicKey: string}>;

    sortHashList(hashList: Array<{hash: string, generatorPublicKey: string}>):
        Array<{hash: string, generatorPublicKey: string}>;

    generatorPublicKeyToSlot(sortedHashList: Array<{hash: string, generatorPublicKey: string}>): Slots;

    generateRound(): ResponseEntity<void>;

    getMyTurn(): number;

    sumRound(round): ResponseEntity<IRoundSum>;

    rebuild(): void;

    rollBack(): void;

    validate(): boolean;

    applyUnconfirmed(param: ResponseEntity<IRoundSum>): ResponseEntity<Array<string>>;

    undoUnconfirmed(round: Round): ResponseEntity<Array<string>>;

    apply(round: Round): Promise<void>;

    undo(round: Round): Promise<void>;

    calcRound(height: number): number;

}

class RoundService implements IRoundService {
    private readonly keyPair: {
        privateKey: string,
        publicKey: string,
    };
    private logPrefix: string = '[RoundService]';
    private isBlockChainReady: boolean = false;
    private isRoundChainRestored: boolean = false;

    constructor() {
        const hash = crypto.createHash('sha256').update(process.env.FORGE_SECRET, 'utf8').digest();
        const keyPair = ed.makeKeyPair(hash);

        this.keyPair = {
            privateKey: keyPair.privateKey.toString('hex'),
            publicKey: keyPair.publicKey.toString('hex'),
        };
    }

    setIsBlockChainReady(status: boolean) {
        this.isBlockChainReady = status;
    }

    public generateHashList(params: { activeDelegates: Array<Delegate>, blockId: string }): Array<IHashList> {
        return params.activeDelegates.map((delegate: Delegate) => {
            const publicKey = delegate.account.publicKey;
            const hash = crypto.createHash('md5').update(publicKey + params.blockId).digest('hex');
            return {
                hash,
                generatorPublicKey: publicKey
            };
        });
    }

    public sortHashList(hashList: Array<IHashList>): Array<IHashList> {
        return hashList.sort((a, b) => {
            if (a.hash > b.hash) {
                return 1;
            }
            if (a.hash < b.hash) {
                return -1;
            }
            return 0;
        });
    }

    public generatorPublicKeyToSlot(sortedHashList: Array<IHashList>): Slots {
        let firstSlot = SlotService.getSlotNumber();
        // set the last round slot

        return sortedHashList.reduce(
            (acc: Object = {}, item: IHashList, i) => {
            acc[item.generatorPublicKey] = { slot: firstSlot + i };
            return acc;
        }, {});
    }

    public restoreRounds(block: Block) {
        if (!this.isBlockChainReady) {
            return;
        }

        const currentRound = RoundRepository.getCurrentRound();
        const firstSlot = RoundRepository.getFirstSlotInRound();
        const lastSlot = RoundRepository.getLastSlotInRound();

        if (
            block &&
            currentRound &&
            block.createdAt >= firstSlot &&
            block.createdAt < lastSlot
        ) {
            // case when block arrive in the middle of the round
            return;
        }

        if (lastSlot >= SlotService.getSlotNumber()) {
            this.isRoundChainRestored = true;
        }

        this.generateRound();
    }

    public generateRound(): ResponseEntity<void> {
        /**
         * if triggered by ROUND_FINISH event
         */
        if (
            RoundRepository.getCurrentRound()
        ) {
            compose(
                this.apply(),
                this.applyUnconfirmed,
                this.sumRound
            )(RoundRepository.getCurrentRound());

            // store pound as previous
            RoundRepository.setPrevRound(RoundRepository.getCurrentRound());
        }

        const lastBlock = BlockRepository.getLastBlock();
        if (lastBlock == null) {
            logger.error(`${this.logPrefix}[generateRound] Can't start round: lastBlock is undefined`);
            return new ResponseEntity<void>({
                errors: [`${this.logPrefix}[generateRound] Can't start round: lastBlock is undefined`]
            });
        }

        const delegateResponse = DelegateRepository.getActiveDelegates();

        if (!delegateResponse.success) {
            logger.error(`${this.logPrefix}[generateRound] error: ${delegateResponse.errors}`);
            return new ResponseEntity<void>({
                errors: [...delegateResponse.errors, `${this.logPrefix}[generateRound] Can't get Active delegates`]
            });
        }

        const slots = compose(
            this.generatorPublicKeyToSlot,
            this.sortHashList,
            this.generateHashList
        )
        ({blockId: lastBlock.id, activeDelegates: delegateResponse.data});

        RoundRepository.setCurrentRound({slots, startHeight: lastBlock.height + 1});
        logger.info(
            `${this.logPrefix}[generateRound] Start round on height: ${RoundRepository.getCurrentRound().startHeight}`
        );

        if (!this.isRoundChainRestored) {
            return;
        }

        const mySlot = this.getMyTurn();
        if (mySlot) {
            // start forging block at mySlotTime
            const cellTime = SlotService.getSlotTime(mySlot - SlotService.getSlotNumber());
            logger.info(`${this.logPrefix}[generateRound] Start forging block to: ${mySlot} after ${cellTime} seconds`);
            createTaskON('BLOCK_GENERATE', cellTime, {
                timestamp: SlotService.getSlotTime(mySlot),
                keyPair: this.keyPair,
            });
        }

        // create event for end of current round
        // lastSlot + 1 for waiting finish last round
        const lastSlot = RoundRepository.getLastSlotInRound();
        const RoundEndTime = SlotService.getSlotTime(lastSlot + 1 - SlotService.getSlotNumber());
        createTaskON('ROUND_FINISH', RoundEndTime);

        return new ResponseEntity<void>();
    }

    public getMyTurn(): number {
        return RoundRepository.getCurrentRound().slots[constants.publicKey].slot;
    }

    public sumRound(round: Round): ResponseEntity<IRoundSum> {
        // load blocks forged in the last round

        const limit = Object.keys(round.slots).length;
        const blocks = BlockRepository.getMany(round.startHeight, limit);

        const resp: IRoundSum = {
            roundFees: 0,
            roundDelegates: []
        };

        for (let i = 0; i < blocks.length; i++) {
            resp.roundFees += blocks[i].fee;
            resp.roundDelegates.push(blocks[i].generatorPublicKey);
        }

        return new ResponseEntity<IRoundSum>({data: resp});
    }

    public rebuild(): void {
    }

    public rollBack(): void {
    }

    public validate(): boolean {
        return undefined;
    }

    public applyUnconfirmed(param: ResponseEntity<IRoundSum>): ResponseEntity<Array<string>> {
        const roundSumResponse = param;
        if (!roundSumResponse.success) {
            return new ResponseEntity<Array<string>>({errors: [...roundSumResponse.errors, 'applyUnconfirmed']});
        }
        // increase delegates balance
        const delegates = roundSumResponse.data.roundDelegates;
        const fee = Math.floor(roundSumResponse.data.roundFees / delegates.length);

        for (let i = 0; i < delegates.length; i++) {
            let delegateAccount = DelegateRepository.getByPublicKey(delegates[i]).account;
            AccountRepository.updateBalance(delegateAccount, delegateAccount.actualBalance + fee);
        }

        const lastBlock = BlockRepository.getLastBlock();
        RoundRepository.updateEndHeight(lastBlock.height);

        return new ResponseEntity<Array<string>>({data: delegates});
    }

    public undoUnconfirmed(round: Round = RoundRepository.getCurrentRound()): ResponseEntity<Array<string>> {
        const roundSumResponse = this.sumRound(round);
        if (!roundSumResponse.success) {
            return new ResponseEntity<Array<string>>({errors: [...roundSumResponse.errors, 'undoUnconfirmed']});
        }
        // increase delegates balance
        const delegates = roundSumResponse.data.roundDelegates;
        const fee = Math.floor(roundSumResponse.data.roundFees / delegates.length);

        for (let i = 0; i < delegates.length; i++) {
            let delegateAccount = DelegateRepository.getByPublicKey(delegates[i]).account;
            AccountRepository.updateBalance(delegateAccount, delegateAccount.actualBalance - fee);
        }

        return new ResponseEntity<Array<string>>({data: delegates});
    }

    public async apply(round: Round = RoundRepository.getCurrentRound()): Promise<void> {
        await RoundPGRepository.saveOrUpdate(round);
    }

    public async undo(round: Round = RoundRepository.getCurrentRound()): Promise<void> {
        await RoundPGRepository.delete(round);
    }

    public calcRound(height: number): number {
        return Math.ceil(height / constants.activeDelegates); // todo round has diff amount of blocks
    }
}

export default new RoundService();
