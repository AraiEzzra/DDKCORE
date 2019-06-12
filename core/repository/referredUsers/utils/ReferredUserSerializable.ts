import { FactorType, IReferredUser } from 'core/repository/referredUsers/interfaces';

export default class ReferredUserSerializable {
    serialize(referredUser: IReferredUser): object {
        const factors = referredUser.factors;

        return {
            address: referredUser.address,
            isEmpty: referredUser.isEmpty,
            factors: {
                count: factors.getItem(FactorType.COUNT),
                reward: factors.getItem(FactorType.REWARD),
                stakeAmount: factors.getItem(FactorType.STAKE_AMOUNT)
            }
        };
    }
}
