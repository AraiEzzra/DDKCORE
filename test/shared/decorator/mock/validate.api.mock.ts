import { Controller, POST, validate } from 'core/util/decorator';

export interface IValidateAPITest {
    addDelegate(req: any, res: any): void;
}

const schema = {
    addDelegate: {
        id: 'delegate.addDelegate',
        type: 'object',
        properties: {
            username: {
                type: 'string',
            },
            transactionId: {
                type: 'string'
            }
        },
        required: ['username', 'transactionId']
    }
};

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

@Controller('/validate')
class RestAPI implements IValidateAPITest {

    @POST('/delegates')
    @validate(schema.addDelegate)
    addDelegate(req, res) {
        const { username, transactionId } = req.body;
        mockDelegate.push({ username, transactionId });
        res.json({
            success: true,
            data: mockDelegate
        });
    }
}

export const validateMockApi = RestAPI;
