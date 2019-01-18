import { Client as client }  from './newConnection';

/**
 *
 * @desc check if an index already exists in the cluster
 * @param {String} indexName - index name
 * @return bool - true or false
 *
 */
export const isIndexExists = async (indexName: string) => {
    return await client.indices.exists({
        index: indexName
    });
};

/**
 *
 * @desc create an index
 * @param {String} indexName - index name
 */
export const createIndex = async (indexName: string) => {
    return await client.indices.create({
        index: indexName
    });
};

/**
 *
 * @desc Delete an existing index
 * @param {String} indexName - index name
 */
export const deleteIndex = async (indexName: string) => {
    return await client.indices.delete({
        index: indexName
    });
};

/**
 *
 * @desc Search in elastic search
 * @param {String} index - index name
 * @param {Object} queryMatch - search query
 */
export const searchQuery = async (index: string, queryMatch: string) => {
    await client.search({
        index,
        type: index,
        body: {
            query: {
                match: queryMatch
            },
        }
    });
};




