import {Round, RoundModel} from 'shared/model/round';

export type RawRound = {[key: string]: any};

export interface IRoundRepository {

    getCurrentRound(): Round;
    setCurrentRound(round: RoundModel): void;
    getPrevRound(): Round;
    setPrevRound(round: Round): void;
    getLastSlotInRound(round: Round): number;

}

export interface IRoundPGRepository {

    serialize(round: Round): RawRound;
    deserialize(rawRound: RawRound): Round;

    getByHeight(height: number): Promise<Round>;
    getMany(limit: number, offset: number): Promise<Array<Round>>;
    saveOrUpdate(round: Round | Array<Round>): Promise<void>;

}
