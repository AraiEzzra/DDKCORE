export const HEADER_MESSAGE  = {
    id: 'HEADERS',
        type: 'object',
        properties: {
        id: {
            type: 'string'
        },
        type: {
            type: 'number'
        }
    },
    required: ['id', 'type']
};

export function SCHEMA_MESSAGE (schemaId: string) {
    return {
        id: 'message',
        properties: {
            code: {
                type: 'string'
            },
            headers: {
                $ref: 'HEADERS'
            },
            body: {
                $ref: schemaId
            }
        },
        required: ['code', 'headers', 'body']
    };
}
