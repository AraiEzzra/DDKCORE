import fs from 'fs';

import { ResponseEntity } from 'shared/model/response';
import { Account } from 'shared/model/account';
import { Round } from 'shared/model/round';
import { StateSaver } from 'shared/util/state/saver';
import { StateLoader } from 'shared/util/state/loader';
import AccountRepository from 'core/repository/account';
import RoundRepository from 'core/repository/round';
import BlockRepository from 'core/repository/block';
import DelegateRepository from 'core/repository/delegate';
import TransactionRepository from 'core/repository/transaction';
import { Block } from 'shared/model/block';
import { Delegate } from 'shared/model/delegate';

export class StateManager {
    private readonly path = './state';
    private readonly accountsPath = `${this.path}/accounts`;
    private readonly blocksPath = `${this.path}/blocks`;
    private readonly roundsPath = `${this.path}/rounds`;
    private readonly delegatesPath = `${this.path}/delegates`;

    async load(): Promise<ResponseEntity<void>> {
        const loader = new StateLoader();

        if (!fs.existsSync(this.path)) {
            return new ResponseEntity();
        }

        const accountsResponse = await loader.load(this.accountsPath, (row) => {
            const accountSchema = JSON.parse(row);
            return new Account(accountSchema);
        });
        if (!accountsResponse.success) {
            return new ResponseEntity({ errors: accountsResponse.errors });
        }



        accountsResponse.data.forEach(account => AccountRepository.push(account));
        AccountRepository.getAll().map(account => {
            account.referrals = account.referrals
                .map((address: string) => {
                    console.log('address', address);
                    console.log('account', account);

                    return AccountRepository.getByAddress(BigInt(address));
                });

            account.referrals.forEach(x => {
                if (!x) {
                    console.log(`ERROR: ACCOUNT NOT FOUND!`);
                    process.exit(10);
                }
            });
        });
        console.log('+');

        const delegatesResponse = await loader.load(this.delegatesPath, JSON.parse);
        if (!delegatesResponse.success) {
            return new ResponseEntity({ errors: delegatesResponse.errors });
        }
        delegatesResponse.data.forEach(delegateRow => {
            const account = AccountRepository.getByPublicKey(delegateRow.publicKey);
            const delegate = new Delegate(delegateRow);

            delegate.account = account;
            account.delegate = delegate;

            DelegateRepository.push(delegate);
        });

        const blocksResponse = await loader.load(this.blocksPath, (row) => new Block(JSON.parse(row)));
        if (!blocksResponse.success) {
            return new ResponseEntity({ errors: blocksResponse.errors });
        }
        blocksResponse.data.forEach(block => {
            BlockRepository.add(block);
            block.transactions.map(transaction => TransactionRepository.add(transaction));
        });

        const roundsResponse = await loader.load(this.roundsPath, (row) => new Round(JSON.parse(row)));
        if (!roundsResponse.success) {
            return new ResponseEntity({ errors: roundsResponse.errors });
        }
        roundsResponse.data.forEach(round => RoundRepository.add(round));

        return new ResponseEntity();
    }

    async save(): Promise<ResponseEntity<void>> {
        if (!fs.existsSync(this.path)) {
            fs.mkdirSync(this.path);
        }

        const saver = new StateSaver();

        const delegates: Array<any> = [];
        const accounts = AccountRepository.getAll().map(account => {
            if (account.delegate) {
                delegates.push({
                    ...account.delegate,
                    account: undefined,
                    publicKey: account.publicKey,
                });
            }

            return ({
                ...account,
                delegate: undefined,
                referrals: account.referrals.map(referral => referral.address),
            });
        });

        await saver.save(this.accountsPath, accounts, JSON.stringify);
        await saver.save(this.delegatesPath, delegates, JSON.stringify);
        await saver.save(this.blocksPath, BlockRepository.getAll(), JSON.stringify);
        await saver.save(this.roundsPath, RoundRepository.getAll(), JSON.stringify);

        return new ResponseEntity();
    }
}
