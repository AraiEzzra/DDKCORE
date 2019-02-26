import {ITransactionService} from '../transaction';
import {IAssetStake, Transaction, TransactionType, IAirdropAsset} from 'shared/model/transaction';
import ResponseEntity from 'shared/model/response';
import {Address, Account} from 'shared/model/account';
import AccountRepo from 'core/repository/account';
import BlockRepo from 'core/repository/block';
import {Block} from 'shared/model/block';
import { TOTAL_PERCENTAGE } from 'core/util/const';
import config from 'shared/util/config';
import BUFFER from 'core/util/buffer';

import {
    getAirdropReward,
    verifyAirdrop,
    sendAirdropReward,
    undoAirdropReward
} from 'core/util/reward';

import {ITableObject} from 'core/util/common';

class TransactionStakeService implements ITransactionService<IAssetStake> {

    async create(trs: Transaction<IAssetStake>, data?: IAssetStake ): Promise<IAssetStake> {
        const sender: Account = AccountRepo.getByAddress(trs.senderAddress);
        const airdropReward: IAirdropAsset = await getAirdropReward(
                sender,
                data.stakeOrder.stakedAmount,
                TransactionType.STAKE
            );
        const asset: IAssetStake = {
            stakeOrder: {
                stakedAmount: data.stakeOrder.stakedAmount,
                startTime: trs.createdAt,
                nextVoteMilestone: trs.createdAt,
            },
            airdropReward: airdropReward
        };

        return asset;
    }

    getBytes(trs: Transaction<IAssetStake>): Buffer {
        let offset = 0;
        const buff = Buffer.alloc(
            BUFFER.LENGTH.INT64 +  // asset.stakeOrder.stakedAmount
            // BUFFER.LENGTH.UINT32 + // asset.stakeOrder.nextVoteMilestone
            BUFFER.LENGTH.UINT32 + // asset.stakeOrders.startTime
            BUFFER.LENGTH.BYTE +   // asset.airdropReward.withAirdropReward
            BUFFER.LENGTH.INT64    // asset.airdropReward.totalReward
        );
        offset = BUFFER.writeUInt64LE(buff, trs.asset.stakeOrder.stakedAmount || 0, offset);
        /**
         * TODO Should be async?
         */
        // const block: ResponseEntity<Block> = BlockRepo.loadFullBlockById(trs.blockId);

        // if (block.data.height <= config.constants.MASTER_NODE_MIGRATED_BLOCK) {
        //     buff.writeInt32LE(trs.asset.stakeOrder.nextVoteMilestone, offset);
        // }

        offset += BUFFER.LENGTH.UINT32;
        buff.writeInt32LE(trs.asset.stakeOrder.startTime, offset);
        offset += BUFFER.LENGTH.UINT32;
        buff.writeInt8(trs.asset.airdropReward.withAirdropReward ? 1 : 0, offset);
        offset += BUFFER.LENGTH.BYTE;
        BUFFER.writeUInt64LE(buff, trs.asset.airdropReward.totalReward || 0, offset);

        const referralBuffer = Buffer.alloc(BUFFER.LENGTH.INT64 + BUFFER.LENGTH.INT64);
        offset = 0;
        if (trs.asset.airdropReward.sponsors && Object.keys(trs.asset.airdropReward.sponsors).length > 0) {
            const address: Address = parseInt(Object.keys(trs.asset.airdropReward.sponsors)[0], 10);
            offset = BUFFER.writeUInt64LE(referralBuffer, address, offset);
            BUFFER.writeUInt64LE(referralBuffer, trs.asset.airdropReward.sponsors[address] || 0, offset);
        }

        return Buffer.concat([buff, referralBuffer]);
    }

    async verifyUnconfirmed(trs: Transaction<IAssetStake>, sender: Account): Promise<ResponseEntity<void>> {
        return new ResponseEntity();
    }

    async verify(trs: Transaction<IAssetStake>, sender: Account): Promise<ResponseEntity<any>> {
        let errors = [];
        if (trs.asset.stakeOrder.stakedAmount <= 0 && config.constants.STAKE_VALIDATE.AMOUNT_ENABLED) {
            errors.push('Invalid transaction amount');
        }

        if ((trs.asset.stakeOrder.stakedAmount % 1) !== 0 && config.constants.STAKE_VALIDATE.AMOUNT_ENABLED) {
            errors.push('Invalid stake amount: Decimal value');
        }

        const airdropCheck: ResponseEntity<any> = await verifyAirdrop(trs, trs.asset.stakeOrder.stakedAmount, sender);
        if (!airdropCheck.success && config.constants.STAKE_VALIDATE.AIRDROP_ENABLED) {
            errors = errors.concat(airdropCheck.errors);
        }
        return new ResponseEntity({ errors });
    }

    calculateFee(trs: Transaction<IAssetStake>, sender?: Account): number {
        return (trs.asset.stakeOrder.stakedAmount * config.constants.fees.froze) / TOTAL_PERCENTAGE;
    }

    calculateUndoUnconfirmed(trs: Transaction<IAssetStake>, sender: Account): void {
        return;
    }

    async applyUnconfirmed(trs: Transaction<IAssetStake>): Promise<ResponseEntity<void>> {
        const fee: number = this.calculateFee(trs);
        const totalAmount: number = fee + trs.asset.stakeOrder.stakedAmount;
        return AccountRepo.updateBalanceByAddress(trs.senderAddress, totalAmount * (-1));
    }

    async undoUnconfirmed(trs: Transaction<IAssetStake>, sender: Account): Promise<ResponseEntity<void>> {
        const fee: number = this.calculateFee(trs);
        const totalAmount: number = fee + trs.asset.stakeOrder.stakedAmount;
        return AccountRepo.updateBalanceByAddress(trs.senderAddress, totalAmount);
    }

    async apply(trs: Transaction<IAssetStake>): Promise<ResponseEntity<void>> {
        return new ResponseEntity<void>();
    }

    async undo(trs: Transaction<IAssetStake>): Promise<ResponseEntity<void>> {
        await undoAirdropReward(trs);
        return new ResponseEntity<void>();
    }

    dbRead(fullTrsObject: any): Transaction<IAssetStake> {
        return null;
    }

    dbSave(trs: Transaction<IAssetStake>): Array<ITableObject>  {
        return null;
    }
}

export default new TransactionStakeService();
