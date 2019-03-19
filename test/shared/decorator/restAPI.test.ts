// import chai, { expect } from 'chai';
// import chaiHttp from 'chai-http';
// import { server } from './mock/server.mock';
// import { restMockApi } from './mock/api.mock';
// import { setRoute } from 'core/util/decorator';
// import * as HttpStatus from 'http-status-codes';
//
// chai.use(chaiHttp);
//
// const enum EnumDefaultValues {
//     GET_SIZE_ARRAY_DELEGATES = 3,
//     POST_SIZE_ARRAY_DELEGATES = 4
// }
//
// describe('API DECORATORS', () => {
//     let conroller;
//
//     before((done) => {
//         conroller = new restMockApi();
//         setRoute(server);
//         done();
//     });
//
//     context('GET request:', () => {
//         it('It should GET all delegates. ', (done) => {
//             chai.request(server)
//                 .get('/api/delegates')
//                 .end((err, res: any) => {
//                     expect(res.body).to.have.property('data');
//                     expect(res.status).have.equals(HttpStatus.OK, 'Status is\'t 200');
//                     expect(res.body.data.length).to.equals(EnumDefaultValues.GET_SIZE_ARRAY_DELEGATES);
//                     done();
//                 });
//         });
//     });
//
//     context('POST request:', () => {
//         it ('It should add delegate and return updated array', (done) => {
//             chai.request(server)
//                 .post('/api/delegates')
//                 .send( {
//                     delegate: {
//                         username: 'DELEGATE4',
//                         transactionId: '35abe6312d680bb425d1c769aa3fa4713ef12f1b017c33d30887ea3c1089fa29'
//                     }
//                 })
//                 .end((err, res: any) => {
//                     expect(res.body).to.have.property('data');
//                     expect(res.status).have.equals(HttpStatus.OK, 'Status is\'t 200');
//                     expect(res.body.data.length).to.equals(EnumDefaultValues.POST_SIZE_ARRAY_DELEGATES);
//                     done();
//                 });
//         });
//     });
// });
