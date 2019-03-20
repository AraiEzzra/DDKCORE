import { ResponseEntity } from 'shared/model/response';
import * as crypto from 'crypto';
import SlotService from 'core/service/slot';
import Config from 'shared/util/config';
// todo delete it when find a way to mock services for tests
// import BlockService from 'test/core/mock/blockService';
// import { createTaskON } from 'test/core/mock/bus';
// import BlockRepository from 'test/core/mock/blockRepository';
import BlockRepository from 'core/repository/block';
import { Round, Slots } from 'shared/model/round';
import RoundRepository from 'core/repository/round';
import { createTaskON, resetTaskON } from 'shared/util/bus';
import DelegateRepository from 'core/repository/delegate';
import AccountRepository from 'core/repository/account';
import { ed } from 'shared/util/ed';
import { Delegate } from 'shared/model/delegate';
import { logger } from 'shared/util/logger';
import { compose } from 'core/util/common';
import RoundPGRepository from 'core/repository/round/pg';
import { Block } from 'shared/model/block';
import { ActionTypes } from 'core/util/actionTypes';
import { calculateRoundFirstSlotByTimestamp } from 'core/util/round';

const MAX_LATENESS_FORGE_TIME = 500;
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

    generateHashList(params: { activeDelegates: Array<Delegate>, blockId: string }):
        Array<{ hash: string, generatorPublicKey: string }>;

    sortHashList(hashList: Array<{ hash: string, generatorPublicKey: string }>):
        Array<{ hash: string, generatorPublicKey: string }>;

    generatorPublicKeyToSlot(
        sortedHashList: Array<{ hash: string, generatorPublicKey: string }>,
        timestamp: number
    ): Slots;

    generateRound(timestamp: number): Promise<ResponseEntity<void>>;

    getMyTurn(): number;

    sumRound(round: Round): ResponseEntity<IRoundSum>;

    rebuild(): void;

    rollBack(round: Round): Promise<void>;

    validate(): boolean;

    applyUnconfirmed(param: ResponseEntity<IRoundSum>): ResponseEntity<Array<string>>;

    undoUnconfirmed(round: Round): ResponseEntity<Array<string>>;

    apply(round: Round): Promise<void>;

    undo(round: Round): Promise<void>;
}

class RoundService implements IRoundService {
    private readonly keyPair: {
        privateKey: string,
        publicKey: string,
    };
    private logPrefix: string = '[RoundService]';
    private isBlockChainReady: boolean = false;
    // private isRoundChainRestored: boolean = false;

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

    getIsBlockChainReady(): boolean {
        return this.isBlockChainReady;
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
        let firstSlot = calculateRoundFirstSlotByTimestamp(timestamp);
        return sortedHashList.reduce(
            (acc: Slots = {}, item: IHashList, i) => {
                acc[item.generatorPublicKey] = { slot: firstSlot + i };
                return acc;
            }, {});
    }

    public async restoreRounds(block: Block = BlockRepository.getLastBlock()): Promise<void> {
        if (!this.isBlockChainReady) {
            return;
        }

        if (!RoundRepository.getCurrentRound()) {
            // this.isRoundChainRestored = true;
            await this.generateRound(block.createdAt);
            return;
        }

        const currentRound = RoundRepository.getCurrentRound();
        const lastSlot = RoundRepository.getLastSlotInRound();

        if (
            block &&
            currentRound &&
            block.createdAt < SlotService.getSlotTime(lastSlot)
        ) {
            // case when current slot in the past round
            if (SlotService.getSlotTime(lastSlot + 1) < SlotService.getTime()) {
                console.log('case when current slot in the past round');
                await this.generateRound();
                return;
            }
            // case when current slot in the current round
            console.log('case when current slot in the current round');
            this.startBlockGenerateTask();
            this.startRoundFinishTask();
            return;
        }

        // TODO check it
        // if (lastSlot >= SlotService.getSlotNumber()) {
        //     this.isRoundChainRestored = true;
        // }
        await this.generateRound();
    }

    startBlockGenerateTask(): void {
        const mySlot = this.getMyTurn();
        if (mySlot) {
            // start forging block at mySlotTime
            let cellTime = SlotService.getSlotRealTime(mySlot) - new Date().getTime();
            if (cellTime < 0 && cellTime + MAX_LATENESS_FORGE_TIME >= 0) {
                cellTime = 0;
            }
            if (cellTime >= 0) {
                logger.info(
                    `${this.logPrefix}[generateRound] Start forging block to: ${mySlot} after ${cellTime} ms`
                );
                createTaskON(ActionTypes.BlockGenerate, cellTime, {
                    timestamp: SlotService.getSlotTime(mySlot),
                    keyPair: this.keyPair,
                });
            } else {
                logger.info(
                    `${this.logPrefix}[generateRound] Skip forging block to: ${mySlot} after ${cellTime} ms`
                );
            }
        }
    }

    startRoundFinishTask(): void {
        // create event for end of current round
        // lastSlot + 1 for waiting finish last round
        const lastSlot = RoundRepository.getLastSlotInRound();
        const roundEndTime = SlotService.getSlotRealTime(lastSlot + 1) - new Date().getTime();
        logger.debug(
            `${this.logPrefix}[generateRound] The round will be completed in ${roundEndTime} ms`
        );
        createTaskON(ActionTypes.RoundFinish, roundEndTime);
    }

    public async generateRound(timestamp: number = SlotService.getTime()): Promise<ResponseEntity<void>> {
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

            // store pound as previous
            RoundRepository.setPrevRound(RoundRepository.getCurrentRound());
            // TODO update prev round
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

        const hashList = this.generateHashList({ blockId: lastBlock.id, activeDelegates: delegateResponse.data });
        const sortedHashList = this.sortHashList(hashList);
        const slots = this.generatorPublicKeyToSlot(sortedHashList, timestamp);

        const currentRound = new Round({
            startHeight: lastBlock.height + 1,
            slots: slots,
        });
        RoundRepository.setCurrentRound(currentRound);

        await this.apply(currentRound);

        logger.info(
            `${this.logPrefix}[generateRound] Start round on height: ${RoundRepository.getCurrentRound().startHeight}`
        );

        // if (!this.isRoundChainRestored) {
        //     return;
        // }

        this.startBlockGenerateTask();
        this.startRoundFinishTask();

        return new ResponseEntity<void>();
    }

    public getMyTurn(): number {
        const mySlot = RoundRepository.getCurrentRound().slots[constants.publicKey];
        return mySlot && mySlot.slot;
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
        resetTaskON(ActionTypes.BlockGenerate);
        resetTaskON(ActionTypes.RoundFinish);
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
}

export default new RoundService();
