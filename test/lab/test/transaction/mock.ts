import { Transaction, TransactionType } from 'shared/model/transaction';
import SlotService from 'core/service/slot';

export const recipientAddress = BigInt('15984232642719285606');
export const senderAddress = BigInt('4995063339468361088');

export const amount = 10000000000;

export const TransactionRegister = new Transaction({
    'id': '85519724a269996537c1c3533f912016c34b782678f96a0d1a35459b453611de',
    'type': TransactionType.REGISTER,
    'createdAt': SlotService.getTime(),
    'senderPublicKey': '39790a5076f826d4583fa5aa9431c1e14f5ac0b3240274fa8a8478d94fe6a6df',
    'senderAddress': recipientAddress,
    'signature': '30151ea37990d405572428bc16510ae16b06614c9483c8a22c58456ac6d7fea3bb8e2a5' +
        'e8c5ed0a5699a5aa630dafdfd59919cc0b7a78c9e7b9392bbce0d100b',
    'fee': 0,
    'salt': '772c4c49eeef5df3240e1406c1283d51',
    'relay': 1,
    'confirmations': 0,
    'asset': { 'referral': senderAddress }
});

export const TransactionSend = new Transaction({
    'id': '440b6c8433b9c9784121c4f4a3a990569be32ad51d4ff6192b0e72e151b5ce26',
    'type': TransactionType.SEND,
    'createdAt': SlotService.getTime(),
    'senderPublicKey': 'f4ae589b02f97e9ab5bce61cf187bcc96cfb3fdf9a11333703a682b7d47c8dc2',
    'senderAddress': senderAddress,
    'signature': '6986fe85e0eb0236289274ec83defb81f4b3c5cf078bdeff29e3b8dfbc7670c7a56d3f3d4090d8b60c' +
        'b5b63fddbeb6452c32521488d908ce8f811979b401ef0a',
    'fee': 1000000,
    'salt': 'f74f89ef5eb66be0b8e069f854d2a7ec',
    'relay': 2,
    'confirmations': 0,
    'asset': { 'recipientAddress': recipientAddress, 'amount': amount }
});
