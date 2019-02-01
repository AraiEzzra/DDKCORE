import { Controller, GET, POST } from 'core/util/decorator';

export interface IRestAPITest {
    getDelegates(req: any, res: any): void;
    addDelegate(req: any, res: any): void;
}

const mockDelegate = [
    {
        username: 'DELEGATE1',
        transactionId: '35abe6312d680bb425d1c769aa3fa4713ef12f1b017c33d30887ea3c1089fa29'
    },
    {
        username: 'DELEGATE2',
        transactionId: '35abe6312d680bb425d1c769aa3fa4713ef12f1b017c33d30887ea3c1089fa29'
    },
    {
        username: 'DELEGATE3',
        transactionId: '35abe6312d680bb425d1c769aa3fa4713ef12f1b017c33d30887ea3c1089fa29'
    }
];

@Controller('/api')
class RestAPI implements IRestAPITest {

    @GET('/delegates')
    getDelegates(req, res) {
        res.send({
            success: true,
            data: mockDelegate
        });
    }

    @POST('/delegates')
    addDelegate(req, res) {
        const { delegate } = req.body;
        mockDelegate.push(delegate);

        res.json({
            success: true,
            data: mockDelegate
        });
    }
}

export const restMockApi = RestAPI;
