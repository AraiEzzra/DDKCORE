require('angular');

angular.module('ETPApp').service('blockService', function ($http, esClient) {
var blocks = {
        lastBlockId: null,
        searchForBlock: '',
        gettingBlocks: false,
        cached: {data: [], time: new Date()},
        getBlock: function (blockID, cb) {
            esClient.search({
                index: 'blocks',
                type: 'blocks',
                body: {
                    query: {
                        match: {
                            "id": blockID
                        }
                    },
                }
            }, function (error, response, status) {
                if (response.hits.hits.length == 0) {
                    cb({ blocks: [], count: 0 });
                } else {
                    cb({ blocks: [response.hits.hits[0]._source], count: 1 });
                }
            });
        },
        getBlocks: function (searchForBlock, $defer, params, filter, cb, publicKey, fromBlocks) {
            blocks.searchForBlock = searchForBlock.trim();
            if (blocks.searchForBlock != '') {
                this.getBlock(blocks.searchForBlock, function (response) {
                    if (response.count) {
                        params.total(response.count);
                        $defer.resolve(response.blocks);
                        cb(null);
                    }
                    else {
                        esClient.search({
                            index: 'blocks',
                            type: 'blocks',
                            body: {
                                query: {
                                    match: {
                                        "height": blocks.searchForBlock
                                    }
                                },
                            }
                        }, function (error, response, status) {
                            if(error) {
                                params.total(0);
                                $defer.resolve();
                                cb({ blocks: [], count: 0 });
                            }else {
                                if (response.hits.hits.length > 0) {
                                    params.total(1);
                                    $defer.resolve([response.hits.hits[0]._source]);
                                    cb(null);
                                }else {
                                    params.total(0);
                                    $defer.resolve();
                                    cb({ blocks: [], count: 0 });
                                }
                            }    
                        });
                    }
                });
            }
            else {
                if (true) {
                    esClient.search({
                        index: 'blocks',
                        type: 'blocks',
                        body: {
                            from : (params.page() - 1) * params.count(), 
                            size : params.count(),
                            query: {
                                match_all : {}
                            },
                            sort: [{ height: { order: 'desc' } } ],
                        }
                    }, function (error, response, status) {
                        if (fromBlocks) {
                            if (response.hits.hits[0]._source.height) {
                                params.total(response.hits.hits[0]._source.height);
                            } else {
                                params.total(0);
                            }
                            if (response.hits.hits.length > 0) {
                                blocksData = [];
                                blocks.lastBlockId = response.hits.hits[0]._source.id;
                                cb();
                                response.hits.hits.forEach(function(block) {
                                    blocksData.push(block._source);
                                });
                                $defer.resolve(blocksData);
                            } else {
                                blocks.lastBlockId = 0;
                                cb();
                                $defer.resolve([]);
                            }
                        }     
                    });
                }
            }
        }
    }
    return blocks;
});
