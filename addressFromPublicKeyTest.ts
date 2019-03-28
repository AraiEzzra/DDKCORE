import { EnumSize, getAddressByPublicKey } from 'shared/util/account';
import { PublicKey } from 'shared/model/account';
import * as crypto from 'crypto';

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

class Test {
    private ADDRESS_LENGTH = 8;
    private HEXADECIMAL = 16;

    getAddressByPublicKey = (publicKey: PublicKey): string => {
        // @ts-ignore
        const publicKeyHash = crypto.createHash('sha256').update(publicKey, 'hex').digest();
        const temp = Buffer.alloc(EnumSize.INT64);
        for (let i = 0; i < this.ADDRESS_LENGTH; i++) {
            temp[i] = publicKeyHash[this.ADDRESS_LENGTH - 1 - i];
        }
        return this.hexToDec(this.getBodyAddress(temp));
    }

    getBodyAddress = (buf: Buffer): string => {
        const hex = [];
        for (let i = 0; i < buf.length; i++) {
            const c = (buf[i] < this.HEXADECIMAL ? '0' : '') + buf[i].toString(this.HEXADECIMAL);
            hex.push(c);
        }
        return hex.join('');
    }

    hexToDec = (s) => {
        let i, j, digits = [0], carry;
        for (i = 0; i < s.length; i += 1) {
            carry = parseInt(s.charAt(i), 16);
            for (j = 0; j < digits.length; j += 1) {
                digits[j] = digits[j] * 16 + carry;
                carry = Math.floor(digits[j] / 10);
                digits[j] %= 10;
            }
            while (carry > 0) {
                digits.push(carry % 10);
                carry = Math.floor(carry / 10);
            }
        }
        return digits.reverse().join('');
    }
}

const test = new Test();
rawAccounts.forEach((account) => {
    const oldValue = getAddressByPublicKey(account.publicKey);
    const newValue = test.getAddressByPublicKey(account.publicKey);
    console.log(oldValue);
    console.log(newValue);
    console.log(oldValue.toString() === newValue);
});




