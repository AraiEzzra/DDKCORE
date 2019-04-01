import crypto from 'crypto';
import SlotService, { EpochTime } from 'core/service/slot';
import config from 'shared/util/config';
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
import { ResponseEntity } from 'shared/model/response';
import BlockService from 'core/service/block';

const MAX_LATENESS_FORGE_TIME = 500;
const constants = config.constants;

interface IHashList {
    hash: string;
    generatorPublicKey: string;
}

interface IRoundSum {
    roundFees: number;
    roundDelegates: Array<string>;
}

interface IRoundService {

    generateHashList(params: { activeDelegates: Array<Delegate>, blockId: string }):
        Array<{ hash: string, generatorPublicKey: string }>;

    sortHashList(hashList: Array<{ hash: string, generatorPublicKey: string }>):
        Array<{ hash: string, generatorPublicKey: string }>;

    generatorPublicKeyToSlot(
        sortedHashList: Array<{ hash: string, generatorPublicKey: string }>,
        timestamp: number
    ): Slots;

    generateRound(timestamp: number): Promise<void>;

    getMyTurn(): number;

    sumRound(round: Round): ResponseEntity<IRoundSum>;

    rebuild(): void;

    rollBack(round: Round): Promise<void>;

    validate(): boolean;

    applyUnconfirmed(param: ResponseEntity<IRoundSum>): ResponseEntity<Array<string>>;

    undoUnconfirmed(round: Round): ResponseEntity<Array<string>>;

    apply(round: Round): Promise<void>;

    undo(round: Round): Promise<void>;

    calcRound(height: number): number;

}

type IKeyPair = {
    privateKey: string,
    publicKey: string,
};

const delegatesSecrets = [
];

class RoundService implements IRoundService {
    private logPrefix: string = '[RoundService]';
    private isBlockChainReady: boolean = false;
    private isRoundChainRestored: boolean = false;
    private delegates: { [publicKey: string]: IKeyPair };

    constructor() {
        this.delegates = {};
        delegatesSecrets.forEach(secret => {
            const hash = crypto.createHash('sha256').update(secret, 'utf8').digest();
            const keyPair = ed.makeKeyPair(hash);
            const delegateKeyPair = {
                privateKey: keyPair.privateKey.toString('hex'),
                publicKey: keyPair.publicKey.toString('hex'),
            };
            this.delegates[delegateKeyPair.publicKey] = delegateKeyPair;
        });
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

    public generatorPublicKeyToSlot(sortedHashList: Array<IHashList>, timestamp: number): Slots {
        const lastRound = RoundRepository.getPrevRound();
        const lastBlock = BlockRepository.getLastBlock();

        let firstSlot = !lastRound && lastBlock.createdAt === 0 ?
            SlotService.getTheFirstSlot(timestamp) : RoundRepository.getLastSlotInRound(lastRound) + 1;

        return sortedHashList.reduce(
            (acc: Object = {}, item: IHashList, i) => {
                acc[item.generatorPublicKey] = { slot: firstSlot + i };
                return acc;
            }, {});
    }

    public restoreRounds(block: Block = BlockRepository.getLastBlock()) {
        if (!this.isBlockChainReady) {
            return;
        }
        if (!RoundRepository.getCurrentRound()) {
            this.isRoundChainRestored = true;
            this.generateRound();
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

    public async generateRound(timestamp: number = 10): Promise<void> {
        /**
         * if triggered by ROUND_FINISH event
         */
        if (
            RoundRepository.getCurrentRound()
        ) {
            compose(
                this.applyUnconfirmed,
                this.sumRound
            )(RoundRepository.getCurrentRound());
            this.apply();

            // store pound as previous
            RoundRepository.setPrevRound(RoundRepository.getCurrentRound());
        }

        const lastBlock = BlockRepository.getLastBlock();
        if (lastBlock == null) {
            logger.error(`${this.logPrefix}[generateRound] Can't start round: lastBlock is undefined`);
            process.exit(1);
        }

        const delegateResponse = DelegateRepository.getActiveDelegates();
        if (!delegateResponse.success) {
            logger.error(`${this.logPrefix}[generateRound] error: ${delegateResponse.errors}`);
            process.exit(1);
        }

        const hashList = this.generateHashList({ blockId: lastBlock.id, activeDelegates: delegateResponse.data });
        const sortedHashList = this.sortHashList(hashList);
        const slots = this.generatorPublicKeyToSlot(sortedHashList, timestamp);

        RoundRepository.setCurrentRound({ slots, startHeight: lastBlock.height + 1 });

        if (!this.isRoundChainRestored) {
            return;
        }

        for (const publicKey of Object.keys(slots)) {
            const slotNumber = slots[publicKey].slot;
            const createdAt = SlotService.getSlotTime(slotNumber);

            await BlockService.generateBlock(this.delegates[publicKey], createdAt);
        }

        return this.generateRound();
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

        return new ResponseEntity<IRoundSum>({ data: resp });
    }

    public rebuild(): void {
    }

    public async rollBack(round: Round = RoundRepository.getCurrentRound()): Promise<void> {
        this.undoUnconfirmed(round);
        await this.undo(round);
    }

    public validate(): boolean {
        return undefined;
    }

    public applyUnconfirmed(param: ResponseEntity<IRoundSum>): ResponseEntity<Array<string>> {
        const roundSumResponse = param;
        if (!roundSumResponse.success) {
            return new ResponseEntity<Array<string>>({ errors: [...roundSumResponse.errors, 'applyUnconfirmed'] });
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

        return new ResponseEntity<Array<string>>({ data: delegates });
    }

    public undoUnconfirmed(round: Round = RoundRepository.getCurrentRound()): ResponseEntity<Array<string>> {
        const roundSumResponse = this.sumRound(round);
        if (!roundSumResponse.success) {
            return new ResponseEntity<Array<string>>({ errors: [...roundSumResponse.errors, 'undoUnconfirmed'] });
        }
        // increase delegates balance
        const delegates = roundSumResponse.data.roundDelegates;
        const fee = Math.floor(roundSumResponse.data.roundFees / delegates.length);

        for (let i = 0; i < delegates.length; i++) {
            let delegateAccount = DelegateRepository.getByPublicKey(delegates[i]).account;
            AccountRepository.updateBalance(delegateAccount, delegateAccount.actualBalance - fee);
        }

        return new ResponseEntity<Array<string>>({ data: delegates });
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
