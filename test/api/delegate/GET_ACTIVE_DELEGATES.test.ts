// import { Fixture } from 'test/api/base/fixture';
// import { API_ACTION_TYPES } from 'shared/driver/socket/codes';
// import { socketRequest } from 'test/api/base';
// import { expect } from 'chai';
//
// describe('Test GET_DELEGATES', () => {
//
//     const TOTAL_DELEGATES_COUNT = 3;
//
//     it('GET_ACTIVE_DELEGATES Positive', async () => {
//         const REQUEST = {
//             headers: Fixture.getBaseHeaders(),
//             code: API_ACTION_TYPES.GET_DELEGATES,
//             body: {
//                 limit: 2,
//                 offset: 0
//             }
//         };
//
//         const SUCCESS = {
//             'delegates': [
//                 {
//                     'username': 'delegate2',
//                     'missedBlocks': 0,
//                     'forgedBlocks': 0,
//                     'publicKey': 'f959e6c8d279c97d3ec5ba993f04ab740a6e50bec4aad75a8a1e7808a6c5eec7',
//                     'votes': 2
//                 },
//                 {
//                     'username': 'delegate1',
//                     'missedBlocks': 0,
//                     'forgedBlocks': 0,
//                     'publicKey': '83cb3d8641c8e73735cc1b70c915602ffcb6e5a68f14a71056511699050a1a05',
//                     'votes': 1
//                 },
//                 {
//                     'username': 'delegate3',
//                     'missedBlocks': 0,
//                     'forgedBlocks': 0,
//                     'publicKey': '137b9f0f839ab3ecd2146bfecd64d31e127d79431211e352bedfeba5fd61a57a',
//                     'votes': 0
//                 }
//             ],
//             'count': 3
//         };
//
//         const response = await socketRequest(REQUEST);
//
//         expect(response.body.success).to.equal(true);
//         expect(response.body.data).to.deep.equal(SUCCESS);
//     })
// });
//
