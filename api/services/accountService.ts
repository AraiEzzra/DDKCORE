import AccountRepository from 'shared/repository/accountRepository'

class AccountsService {
    private static instance: AccountsService = undefined;

    constructor() {
        if (!AccountsService.instance) {
            AccountsService.instance = this;
        }
        return AccountsService.instance;
    }

    async getAccount(address: string) {
        try {
            const account = await AccountRepository.getAccountsByAddress(address);
            return {
                account: {
                    address: account.address,
                    unconfirmedBalance: account.u_balance,
                    balance: account.balance,
                    publicKey: account.publicKey,
                    unconfirmedSignature: account.u_secondSignature,
                    secondSignature: account.secondSignature,
                    secondPublicKey: account.secondPublicKey,
                    multisignatures: account.multisignatures || [],
                    u_multisignatures: account.u_multisignatures || [],
                    totalFrozeAmount: account.totalFrozeAmount
                }
            };
        } catch (err) {
            return { account: null };
        }
    }
}

const accountService = new AccountsService();
export default accountService;
