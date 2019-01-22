import { Client as client } from './newConnection';

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

export const addDocument = async (doc) => {
    return await client.index({
        index: doc.index,
        type: doc.type,
        body: doc.body,
        id: doc.id
    });
};

export const getCount = async (indexName: string) => {
    const countDoc = await client.count({ index: indexName });
    console.log('countDoc ', countDoc);
    return countDoc;
};

/**
 * @desc Make bulk data to be saved on elasticsearch server.
 * @param {Array} list
 * @param {String} index
 * @param {Array} bulk
 * @returns {Array} bulk
 */
export const makeBulk = (list, index) => {
    let bulk = [],
        indexId;
    for (const current in list) {
        if (list[current].b_id) {
            indexId = list[current].b_id;
            /**
             * TODO  -- SPLIT -- : Need to import function from "Account" (generateAddressByPublicKey)
             */
            // list[current].b_generatorId =
            //     Accounts.prototype.generateAddressByPublicKey(list[current].b_generatorPublicKey);
        } else {
            indexId = list[current].id;
        }

        bulk.push(
            { index: { _index: index, _type: index, _id: indexId } },
            list[current]
        );
    }
    return bulk;
};

/**
 * @desc creating bulk index based on data on elasticsearch server.
 * @param {String} index
 * @param {Object} bulk
 * @returns {Promise} {Resolve|Reject}
 */
export const indexall = async (bulk, index) => {
    return await client.bulk({
            maxRetries: 5,
            index,
            type: index,
            body: bulk
    });
};




