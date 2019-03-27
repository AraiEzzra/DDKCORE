import { Round } from 'shared/model/round';
import RoundRepo from 'core/repository/round/index';
import { expect } from 'chai';
import {
    getNewRoundWithHash
} from 'test/core/repository/round/mock';

describe('Round memory repository', () => {

    describe('set/get current round', () => {

        let round = getNewRoundWithHash().round;

        it('should return current round', () => {
            RoundRepo.setCurrentRound(round);
            const response = RoundRepo.getCurrentRound();
            expect(response).to.be.instanceOf(Round);
            expect(response.startHeight).to.be.equal(round.startHeight);
        });
    });

    describe('set/get previous round', () => {

        let round = getNewRoundWithHash().round;

        it('should return current round', () => {
            let response = RoundRepo.getPrevRound();
            expect(response).to.be.undefined;
            RoundRepo.setPrevRound(round);
            response = RoundRepo.getPrevRound();
            expect(response).to.be.instanceOf(Round);
            expect(response.startHeight).to.be.equal(round.startHeight);
        });
    });

    describe('getLastSlotInRound', () => {

        let roundEntity = getNewRoundWithHash();

        it('should return current round', () => {
            let response = RoundRepo.getLastSlotInRound(roundEntity.round);
            let lastHash = roundEntity.hash[roundEntity.hash.length - 1].generatorPublicKey;
            expect(response).to.be.equal(roundEntity.round.slots[lastHash].slot);
            roundEntity = getNewRoundWithHash();
            RoundRepo.setCurrentRound(roundEntity.round);
            response = RoundRepo.getLastSlotInRound();
            lastHash = roundEntity.hash[roundEntity.hash.length - 1].generatorPublicKey;
            expect(response).to.be.equal(roundEntity.round.slots[lastHash].slot);

        });
    });

    describe('getFirstSlotInRound', () => {

        let roundEntity = getNewRoundWithHash();

        it('should return current round', () => {
            let response = RoundRepo.getFirstSlotInRound(roundEntity.round);
            let firstHash = roundEntity.hash[0].generatorPublicKey;
            expect(response).to.be.equal(roundEntity.round.slots[firstHash].slot);
            roundEntity = getNewRoundWithHash();
            RoundRepo.setCurrentRound(roundEntity.round);
            response = RoundRepo.getFirstSlotInRound();
            firstHash = roundEntity.hash[0].generatorPublicKey;
            expect(response).to.be.equal(roundEntity.round.slots[firstHash].slot);

        });
    });

    describe('updateEndHeight', () => {

        let roundEntity = getNewRoundWithHash();

        it('should return current round', () => {
            RoundRepo.setCurrentRound(roundEntity.round);
            RoundRepo.updateEndHeight(400);
            const response = RoundRepo.getCurrentRound();
            expect(response.endHeight).to.be.equal(400);

        });
    });
});
