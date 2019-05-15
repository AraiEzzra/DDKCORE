import * as path from 'path';
import db from 'shared/driver/db';
import { QueryFile } from 'pg-promise';
import TransactionDispatcher from 'core/service/transaction';
import AccountRepo from 'core/repository/account';
import { IAsset, Transaction, TransactionType } from 'shared/model/transaction';
import { messageON } from 'shared/util/bus';
import { initControllers, initShedulers } from 'core/controller';
import config, { NODE_ENV_ENUM } from 'shared/config';
import BlockPGRepository from 'core/repository/block/pg';
import BlockRepository from 'core/repository/block';
import BlockService from 'core/service/block';
import socket from 'core/repository/socket';
import { logger } from 'shared/util/logger';
import { Block } from 'shared/model/block';
import { socketRPCServer } from 'core/api/server';
import { getAddressByPublicKey } from 'shared/util/account';
import { getRandomInt } from 'shared/util/util';
import System from 'core/repository/system';
import RoundService from 'core/service/round';
import SlotService from 'core/service/slot';
import RoundRepository from 'core/repository/round';
import { getLastSlotInRound } from 'core/util/round';
import { MIN_ROUND_BLOCK } from 'core/util/block';
import { getFirstSlotNumberInRound } from 'core/util/slot';
import DelegateRepository from 'core/repository/delegate';
import { ExportToCsv } from 'export-to-csv';
import { Address } from 'shared/model/account';
// import fs from 'fs';
// const csv = require('csv-parser');
const fs = require('fs');

const mapForAccountWithNegativeBalances: Map<Address, number> = new Map();
const arrayForBadTransactions: Array<Transaction<IAsset>> = [];

// @ts-ignore
BigInt.prototype.toJSON = function () {
    return this.toString();
};

class Loader {
    private limit = 1000;

    public async start() {
        logger.debug('LOADER START');
        const historyState = config.CORE.IS_HISTORY;
        if (config.NODE_ENV_IN === NODE_ENV_ENUM.MAINNET) {
            config.CORE.IS_HISTORY = false;
        }
        
        await this.initDatabase();

        initControllers();
        System.synchronization = true;
        await this.blockWarmUp(this.limit);
        if (!BlockRepository.getGenesisBlock()) {
            await BlockService.applyGenesisBlock(config.GENESIS_BLOCK);
        }
        config.CORE.IS_HISTORY = historyState;
        socket.init();

        initShedulers();

        setInterval(
            () => messageON('EMIT_REBOOT_PEERS_CONNECTIONS'),
            getRandomInt(
                config.CONSTANTS.PEER_CONNECTION_TIME_INTERVAL_REBOOT.MIN,
                config.CONSTANTS.PEER_CONNECTION_TIME_INTERVAL_REBOOT.MAX
            )
        );
        setTimeout(() => messageON('EMIT_SYNC_BLOCKS'), config.CONSTANTS.TIMEOUT_START_SYNC_BLOCKS);
        socketRPCServer.run();
    }

    public async initDatabase() {
        const pathMockData: string = path.join(process.cwd(), 'core/database/sql');
        const filePath = path.join(pathMockData, 'init.sql');
        await db.query(new QueryFile(filePath, { minify: true }));
    }

    private async blockWarmUp(limit: number) {
        let offset: number = 0;
        // console.log(this.readAccountsToMap('./addressesWithNegativeBalance25_4_2019.csv'));
        do {
            const blockBatch: Array<Block> = await BlockPGRepository.getMany(limit, offset);

            if (!blockBatch) {
                break;
            }

            for (const block of blockBatch) {

                if (block.height === 1) {
                    BlockRepository.add(block);
                    this.transactionsWarmUp(block.transactions);
                }

                if (block.height === MIN_ROUND_BLOCK) {
                    const newRound = RoundService.generate(
                        getFirstSlotNumberInRound(
                            block.createdAt,
                            DelegateRepository.getActiveDelegates().length,
                        ),
                    );

                    RoundRepository.add(newRound);
                }

                if (block.height >= MIN_ROUND_BLOCK) {
                    let round = RoundRepository.getCurrentRound();
                    const blockSlotNumber = SlotService.getSlotNumber(block.createdAt);

                    while (blockSlotNumber !== round.slots[block.generatorPublicKey].slot) {
                        if (getLastSlotInRound(round) > blockSlotNumber) {
                            logger.error(
                                `[Loader] Impossible to build a round for block with id: ${block.id}, ` +
                                `height: ${block.height}`
                            );
                            break;
                        }

                        // forward until we find the right round
                        RoundService.forwardProcess();
                        round = RoundRepository.getCurrentRound();
                    }

                    BlockRepository.add(block);
                    this.transactionsWarmUp(block.transactions);

                    const currentRound = RoundRepository.getCurrentRound();
                    currentRound.slots[block.generatorPublicKey].isForged = true;

                    if (blockSlotNumber === getLastSlotInRound(round)) {
                        RoundService.forwardProcess();
                    }
                }
            }

            if (blockBatch.length < limit) {
                break;
            }
            offset += limit;
        } while (true);

        let totalNegative = 0;
        [...mapForAccountWithNegativeBalances.values()].forEach((value) => {
             totalNegative += value;
            }
        );

        console.log('totalNegative: ', totalNegative);
        console.log('totalNegative map size: ', mapForAccountWithNegativeBalances.size);

        const balances = [];
        for(let entry of mapForAccountWithNegativeBalances) {
            balances.push({
                address: entry[0],
                amount: entry[1],
            })
        }

        const mapToCsv = balances.map((value, index, array): any => {
            return {
                address: value.address,
                amount: value.amount,
            };
        });


        this.writeMapToCsv(mapToCsv);

        console.log('Total negative balances accounts: ', mapForAccountWithNegativeBalances);


        let negativeBalancesCounter = 0;
        let totalNegativeBalance = 0;
        let res = AccountRepo.getAll().filter((value, index, array): any => {
            if (value.actualBalance < 0) {
                ++negativeBalancesCounter;
                totalNegativeBalance += value.actualBalance;
                return value;
            }
        });

        const toCsv = res.map((value, index, array): any => {
                return {
                    address: value.address,
                    amount: value.actualBalance,
                    // publicKey: value.publicKey
                };
            }
        );
        //
        // const options = {
        //     fieldSeparator: ',',
        //     quoteStrings: '"',
        //     decimalSeparator: '.',
        //     showLabels: true,
        //     showTitle: true,
        //     useTextFile: false,
        //     useBom: true,
        //     useKeysAsHeaders: true,
        //     // headers: ['address', 'amount']
        // };

        console.log('negativeBalancesCounter: ', negativeBalancesCounter);
        console.log('totalNegativeBalance: ', totalNegativeBalance);
        console.log('negativeBalances: ', toCsv);

        // this.writeArrayToJsonFile();

        // const csvExporter = new ExportToCsv(options);
        // const csv = await csvExporter.generateCsv(toCsv, true);

        // await fs.writeFile('new144AddressesWithNegativeBalance.csv', csv, (err) => {
        //     // throws an error, you could also catch it here
        //     if (err) throw err;
        //
        //     // success case, the file was saved
        //     console.log('CSV saved!');
        // });

        // console.log('CSV GENERATED!', csv)

        // console.log('!!!!!!!!!!!!!!!!!RESULT: ', JSON.stringify({data: res}, null, 2));
        // process.exit(2);
    }

    public writeArrayToJsonFile(){
        fs.writeFile("badTrs.json", JSON.stringify(arrayForBadTransactions), 'utf8', function (err) {
            if (err) {
                console.log("An error occured while writing JSON Object to File.");
                return console.log(err);
            }

            console.log("JSON file has been saved.");
        });
    }

    public writeMapToCsv(mapToCsv) {
        // console.log('mapToCsv: ', mapToCsv);
        const options = {
            fieldSeparator: ',',
            quoteStrings: '"',
            decimalSeparator: '.',
            showLabels: true,
            showTitle: false,
            useTextFile: false,
            useBom: true,
            useKeysAsHeaders: false,
            headers: ['address', 'amount']
        };

        const csvExporter = new ExportToCsv(options);
        const csv = csvExporter.generateCsv(mapToCsv, true);

        fs.writeFile('10_05_2019_T12_00_addressesWithNegativeBalance.csv', csv, (err) => {
            // throws an error, you could also catch it here
            if (err) {
                throw err;
            }

            // success case, the file was saved
            console.log('CSV saved!');
        });
        console.log('CSV GENERATED!', csv);
        // process.exit(0);
    }


    // public readAccountsToMap(filePath) {
    //     console.log('START parse csv with negative balances accounts!');
    //     let amount: number = 0;
    //     return new Promise((resolve, reject) => {
    //         // const accounts: Map<Address, number> = new Map();
    //
    //         fs.createReadStream(filePath)
    //         .pipe(csv())
    //         .on('data', (data) => {
    //             // accounts.set(Number(data.address.replace(/DDK/ig, '')), Number(data.amount));
    //             // accounts.set(BigInt(data[Object.keys(data)[0]]), Number(data.amount));
    //             amount += Number(data.amount);
    //         })
    //         .on('end', () => {
    //             console.log('Parsed accounts with negative balance: ');
    //             console.log('amount', amount);
    //             resolve(amount);
    //         });
    //     });
    // }

    private transactionsWarmUp(transactions: Array<Transaction<IAsset>>): void {
        for (const trs of transactions) {
            let sender = AccountRepo.getByAddress(getAddressByPublicKey(trs.senderPublicKey));
            if (!sender) {
                sender = AccountRepo.add({
                    address: trs.senderAddress,
                    publicKey: trs.senderPublicKey
                });
            } else if (!sender.publicKey) {
                sender.publicKey = trs.senderPublicKey;
            }

            // if (BlockRepository.getLastBlock().height > 934) {
            //     const res = TransactionDispatcher.verifyUnconfirmed(trs, sender);
            //     if (!res.success){
            //         logger.error('ERROR!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!', trs, sender, res.errors);
            //     } else {
            //         logger.info('zzz', trs, sender);
            //     }
            // }


            // let isCorruptedVote = false;
            // if (trs.type === TransactionType.VOTE) {
            //     const verifyResult = TransactionDispatcher.verifyUnconfirmed(trs, sender);
            //     if (!verifyResult.success) {
            //         isCorruptedVote = true;
            //     }
            // }
            const diff = sender.actualBalance - (((trs.asset as any).amount || 0) + trs.fee);
            if (diff < 0) {
                const newBalance =
                    Math.min(mapForAccountWithNegativeBalances.get(sender.address) || 0, diff);
                mapForAccountWithNegativeBalances.set(sender.address, newBalance);
            }
            TransactionDispatcher.applyUnconfirmed(trs, sender);

            // if (sender.actualBalance < 0 || isCorruptedVote) {
            //     const newBalance =
            //         Math.min(mapForAccountWithNegativeBalances.get(sender.address) || 0, sender.actualBalance);
            //     mapForAccountWithNegativeBalances
            //     .set(sender.address, Math.min(newBalance, isCorruptedVote ? (newBalance - trs.fee) : 0));
            // }
        }
    }
}

export default new Loader();
