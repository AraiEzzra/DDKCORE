import { PublicKey } from 'shared/model/types';
import { SerializedAddress } from 'shared/model/transport/type';
import { SerializedStakeSchema } from 'shared/model/transport/stake';

export type SerializedAccountSchema = {
    address: SerializedAddress;
    publicKey: PublicKey;
    secondPublicKey: PublicKey;
    actualBalance: number;
    votes: Array<PublicKey>;
    stakes: Array<SerializedStakeSchema>;
    referrals: Array<SerializedAddress>;
};
