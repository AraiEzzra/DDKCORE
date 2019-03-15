require('dotenv').config();
import TransactionService from 'core/service/transaction';
import TransactionRepo from 'core/repository/transaction';
import BlockService from 'core/service/block';
import AccountRepo from 'core/repository/account';
import { IAsset, Transaction, TransactionModel, TransactionType } from 'shared/model/transaction';
import { ed } from 'shared/util/ed';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const DIR = path.resolve(__dirname);
const SECRET = 'pre worry asd thank unfair lukas smile oven gospel less latin reason';

const rawAccounts = [
    {
        address: BigInt('12384687466662805891'),
        publicKey: '49a2b5e68f851a11058748269a276b0c0d36497215548fb40d4fe4e929d0283a'
    },
    {
        address: BigInt('4995063339468361088'),
        publicKey: 'f4ae589b02f97e9ab5bce61cf187bcc96cfb3fdf9a11333703a682b7d47c8dc2'
    },
    {
        address: BigInt('933553974927686133'),
        publicKey: '83cb3d8641c8e73735cc1b70c915602ffcb6e5a68f14a71056511699050a1a05'
    },
    {
        address: BigInt('3002421063889966908'),
        publicKey: 'f959e6c8d279c97d3ec5ba993f04ab740a6e50bec4aad75a8a1e7808a6c5eec7'
    },
    {
        address: BigInt('7897332094363171058'),
        publicKey: '137b9f0f839ab3ecd2146bfecd64d31e127d79431211e352bedfeba5fd61a57a'
    }
];

const rawTransactions: Array<{trs: TransactionModel<IAsset>, privateKey: string}> = [
    {
        trs: {
            type: TransactionType.SEND,
            // DDK12384687466662805891
            senderPublicKey: '49a2b5e68f851a11058748269a276b0c0d36497215548fb40d4fe4e929d0283a',
            asset: {
                amount: 4500000000000000,
                recipientAddress: BigInt('4995063339468361088')
            }
        },
        privateKey: 'sad case cement sign ghost bamboo soap depart discover acoustic spot toilet'
    },
    {
        trs: {
            type: TransactionType.SEND,
            // DDK4995063339468361088
            senderPublicKey: 'f4ae589b02f97e9ab5bce61cf187bcc96cfb3fdf9a11333703a682b7d47c8dc2',
            asset: {
                amount: 171000000000000,
                recipientAddress: BigInt('933553974927686133')
            }
        },
        privateKey: SECRET
    },
    {
        trs: {
            type: TransactionType.SEND,
            // DDK4995063339468361088
            senderPublicKey: 'f4ae589b02f97e9ab5bce61cf187bcc96cfb3fdf9a11333703a682b7d47c8dc2',
            asset: {
                amount: 36000000000000,
                recipientAddress: BigInt('3002421063889966908')
            }
        },
        privateKey: SECRET
    },
    {
        trs: {
            type: TransactionType.SEND,
            // DDK4995063339468361088
            senderPublicKey: 'f4ae589b02f97e9ab5bce61cf187bcc96cfb3fdf9a11333703a682b7d47c8dc2',
            asset: {
                amount: 90000000000000,
                recipientAddress: BigInt('7897332094363171058')
            }
        },
        privateKey: SECRET
    },
    {
        trs: {
            type: TransactionType.DELEGATE,
            // DDK933553974927686133
            senderPublicKey: '83cb3d8641c8e73735cc1b70c915602ffcb6e5a68f14a71056511699050a1a05',
            asset: {
                username: 'DELEGATE1'
            }
        },
        privateKey: 'milk exhibit cabbage detail village hero script glory tongue post clinic wish'
    },
    {
        trs: {
            type: TransactionType.DELEGATE,
            // DDK3002421063889966908
            senderPublicKey: 'f959e6c8d279c97d3ec5ba993f04ab740a6e50bec4aad75a8a1e7808a6c5eec7',
            asset: {
                username: 'DELEGATE2'
            }
        },
        privateKey: 'artwork relax sheriff sting fruit return spider reflect cupboard dice goddess slice'
    },
    {
        trs: {
            type: TransactionType.DELEGATE,
            // DDK7897332094363171058
            senderPublicKey: '137b9f0f839ab3ecd2146bfecd64d31e127d79431211e352bedfeba5fd61a57a',
            asset: {
                username: 'DELEGATE3'
            }
        },
        privateKey: 'whale slab bridge virus merry ship bright fiber power outdoor main enforce'
    },
    /*
    {
        type: TransactionType.DELEGATE,
        // DDK3955937947011006122
        senderPublicKey: '276f0d09e64b68566fb458b7c71aeb62411d0b633ad6c038e5a4a042ec588af9',
        asset: {
            username: 'TDALLIANCE1'
        }
    },
    {
        type: TransactionType.DELEGATE,
        // DDK14521323608713415449
        senderPublicKey: '3f0348b6d3ecaeaeca0a05ee4c2d7b4b7895ef0a12d8023ba245b6b8022833e5',
        asset: {
            username: 'TDALLIANCE2'
        }
    },
    {
        type: TransactionType.DELEGATE,
        // DDK12458159079905364672
        senderPublicKey: '3f1ecf6de517a6bf2f5c7a8226a478dc571ed0100d53ee104842f4d443e49806',
        asset: {
            username: 'TDALLIANCE3'
        }
    },
    {
        type: TransactionType.DELEGATE,
        // DDK6896696291079341052
        senderPublicKey: '96c7402e487ac2c17b4667da8412044ca37e172597335b4495b154610865976f',
        asset: {
            username: 'DELEGATE4'
        }
    },
    {
        type: TransactionType.DELEGATE,
        // DDK2992231075173753241
        senderPublicKey: 'e95e54e2a278cea7ffc334b997c99780d4c21fb722545a0e705a39c1f9907fb6',
        asset: {
            username: 'DELEGATE5'
        }
    },
    {
        type: TransactionType.DELEGATE,
        // DDK2609330451270037814
        senderPublicKey: '7822d08f07cc362ae3fa536d1fd1555074a8cc2da369191051cb6f1d49773fcc',
        asset: {
            username: 'DELEGATE6'
        }
    },
    {
        type: TransactionType.DELEGATE,
        // DDK16566686158587408921
        senderPublicKey: 'df4b6a242c1e84906f0bd1f5c41f31b2b554d413388215a8c75dda177b958630',
        asset: {
            username: 'DELEGATE7'
        }
    },
    {
        type: TransactionType.DELEGATE,
        // DDK9061812427491485592
        senderPublicKey: 'c6268f7247b0ff3c1ff9f5155a0ee7289116841e853194f440d4928771487ce7',
        asset: {
            username: 'DELEGATE8'
        }
    },
    {
        type: TransactionType.VOTE,
        // DDK4995063339468361088
        senderPublicKey: 'f4ae589b02f97e9ab5bce61cf187bcc96cfb3fdf9a11333703a682b7d47c8dc2',
        asset: {
            votes: [
                '+276f0d09e64b68566fb458b7c71aeb62411d0b633ad6c038e5a4a042ec588af9',
                '+3f0348b6d3ecaeaeca0a05ee4c2d7b4b7895ef0a12d8023ba245b6b8022833e5',
                '+3f1ecf6de517a6bf2f5c7a8226a478dc571ed0100d53ee104842f4d443e49806'
            ]
        }
    },
    {
        type: TransactionType.VOTE,
        // DDK933553974927686133
        senderPublicKey: '83cb3d8641c8e73735cc1b70c915602ffcb6e5a68f14a71056511699050a1a05',
        asset: {
            votes: [
                '+83cb3d8641c8e73735cc1b70c915602ffcb6e5a68f14a71056511699050a1a05',
                '+f959e6c8d279c97d3ec5ba993f04ab740a6e50bec4aad75a8a1e7808a6c5eec7',
                '+137b9f0f839ab3ecd2146bfecd64d31e127d79431211e352bedfeba5fd61a57a'
            ]
        }
    },
    {
        type: TransactionType.VOTE,
        // DDK3002421063889966908
        senderPublicKey: 'f959e6c8d279c97d3ec5ba993f04ab740a6e50bec4aad75a8a1e7808a6c5eec7',
        asset: {
            votes: [
                '+96c7402e487ac2c17b4667da8412044ca37e172597335b4495b154610865976f',
                '+e95e54e2a278cea7ffc334b997c99780d4c21fb722545a0e705a39c1f9907fb6',
                '+7822d08f07cc362ae3fa536d1fd1555074a8cc2da369191051cb6f1d49773fcc'
            ]
        }
    },
    {
        type: TransactionType.VOTE,
        // DDK7897332094363171058
        senderPublicKey: '137b9f0f839ab3ecd2146bfecd64d31e127d79431211e352bedfeba5fd61a57a',
        asset: {
            votes: [
                '+df4b6a242c1e84906f0bd1f5c41f31b2b554d413388215a8c75dda177b958630',
                '+c6268f7247b0ff3c1ff9f5155a0ee7289116841e853194f440d4928771487ce7'
            ]
        }
    }
    */
];

// rawAccounts.forEach((rawAccount) => {
//     AccountRepo.add(rawAccount);
// });

const hash = crypto.createHash('sha256').update(SECRET, 'utf8').digest();
let keyPairBuffer = ed.makeKeyPair(hash);

const keyPair = {
    privateKey: keyPairBuffer.privateKey.toString('hex'),
    publicKey: keyPairBuffer.publicKey.toString('hex'),
};

const transactions: Array<Transaction<IAsset>> = rawTransactions.map((rawTransaction) => {
    rawTransaction.trs.createdAt = 0;
    const response = TransactionService.create(rawTransaction.trs, keyPairBuffer);
    return response.data;
});

let block = BlockService.create({
    transactions,
    timestamp: 0,
    previousBlock: { id: null },
    keyPair
});

block.height = 1;

block = BlockService.addPayloadHash(block, keyPair).data;

const resultTransactions = block.transactions.map((transaction) => {
    transaction.blockId = block.id;
    return TransactionRepo.serialize(transaction);
});
block.transactions = <Array<Transaction<IAsset>>>resultTransactions;

console.log(block);
fs.writeFileSync(path.resolve(DIR, '..', 'genesisBlock_' + Date.now().toString() + '.json'), JSON.stringify(block));
