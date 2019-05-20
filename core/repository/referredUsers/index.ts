import ReferredUsersTree from 'core/repository/referredUsers/tree/ReferredUsersTree';
import ReferredUsersFake from 'core/repository/referredUsers/ReferredUsersFake';
import ReferredUserSerializable from 'core/repository/referredUsers/utils/ReferredUserSerializable';
import { ReferredUserFactor } from 'core/repository/referredUsers/interfaces';
import config from 'shared/config';

export const referredUserSerializable = new ReferredUserSerializable();

export {
    ReferredUserFactor
};

const gerReferredUserRepository = () => {
    if (config.CORE.IS_REFERRED_USERS_ENABLED) {
        return new ReferredUsersTree();
    }
    return new ReferredUsersFake();
};

export default gerReferredUserRepository();

