import { IReferredUser } from 'core/repository/referredUsers/interfaces';

export default class ReferredUserSerializable {
    serialize(referredUser: IReferredUser): object {
        return {
            address: referredUser.address,
            isEmpty: referredUser.isEmpty,
            factors: [...referredUser.factors.entries()]
        };
    }
}
