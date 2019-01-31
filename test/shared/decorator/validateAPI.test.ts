import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import { server } from './mock/server.mock';
import { validateMockApi  } from './mock/validate.api.mock';
import { setRoute } from 'core/util/decorator';
import * as HttpStatus from 'http-status-codes';

chai.use(chaiHttp);

const enum EnumDefaultValues {
    POST_SIZE_ARRAY_DELEGATES = 4
}

describe('VALIDATE API DECORATOR', () => {
    let conroller;

    before((done) => {
        conroller = new validateMockApi();
        setRoute(server);
        done();
    });

    it('It must pass validation', (done) => {
        chai.request(server)
            .post('/validate/delegates')
            .send( {
                username: 'DELEGATE4',
                transactionId: '35abe6312d680bb425d1c769aa3fa4713ef12f1b017c33d30887ea3c1089fa29'
            })
            .end((err, res) => {
                expect(res.status).to.have.equals(HttpStatus.OK);
                expect(res.body).to.have.property('data');
                expect(res.body.data).to.be.an.instanceOf(Array);
                expect(res.body).to.have.property('success');
                expect(res.body.success).to.be.true;
                expect(res.body.data).to.have.lengthOf(EnumDefaultValues.POST_SIZE_ARRAY_DELEGATES);
                done();
            });
    });

    it('It should get an error', (done) => {
        chai.request(server)
            .post('/validate/delegates')
            .send( {
                username: 1,
                transactionId: '35abe6312d680bb425d1c769aa3fa4713ef12f1b017c33d30887ea3c1089fa29'
            })
            .end((err, res) => {
                expect(res.status).to.have.equals(HttpStatus.BAD_REQUEST);
                expect(res.body).to.have.property('errors');
                expect(res.body.errors).to.be.an.instanceOf(Array);
                expect(res.body.errors).to.have.eql(['Bad request.']);
                done();
            });
    });
});
