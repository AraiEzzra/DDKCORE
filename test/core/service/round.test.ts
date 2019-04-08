// import { expect } from 'chai';
// import RoundService from 'core/service/round';
// import RoundRepository from 'core/repository/round';
// import BlockService from 'test/core/mock/blockService';
// import {Round, Slots} from 'shared/model/round';
// import SlotService from 'core/service/slot';

// FIXME
// describe('testing RoundService...', () => {
//     const delegates = RoundService.getActiveDelegates().data;
//     const blockId: string = BlockService.getLastBlock().id;
//     const hash = RoundService.generateHashList({activeDelegates: delegates, blockId: blockId});
//     const slots: Slots = RoundService.generatorPublicKeyToSlot(hash);
//
//     it('getActiveDelegates() Should return array of Delegates sorted by votes and length should be more then 0', () => {
//         expect(Array.isArray(delegates)).equal(true);
//         expect(delegates.length > 0).equal(true);
//     });
//
//     it('generateHashList() should return array the same length as delegates', () => {
//
//         expect(blockId.length > 0).equal(true);
//         expect(hash.length === delegates.length ).to.be.equal(true);
//     });
//
//     it(`generatorPublicKeyToSlot() Should match delegate to slot and
//         return Object the same size then delegates length`, () => {
//         expect(Object.keys(slots).length === delegates.length).to.be.equal(true);
//     });
//
//     it('generateRound() Should store round into Repository', () => {
//         RoundService.generateRound();
//         const currentRound = RoundRepository.getCurrentRound();
//         expect(!!currentRound).to.be.equal(true);
//         expect(currentRound).to.be.an.instanceOf(Round);
//         expect(Object.keys(currentRound.slots).length === delegates.length).to.be.equal(true);
//         expect(RoundService.getMyTurn() >= SlotService.getSlotNumber() ||
//             SlotService.getSlotNumber() > 0).to.equal(true);
//     });
//
//     it('RoundRepository.getLastSlotInRound() Should return number and should be > then current slot', () => {
//         const lastSlot: Number = RoundRepository.getLastSlotInRound();
//         expect(lastSlot > SlotService.getSlotNumber()).to.equal(true);
//     });
// });
