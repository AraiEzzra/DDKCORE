import { Peer } from 'shared/model/peer';

export interface IPeerRepo {

    list(): Promise<Peer[]>;

}
