const _ = require('lodash');
const async = require('async');
const crypto = require('crypto');
const DApp = require('../logic/dapp.js');
const dappCategories = require('../helpers/dappCategories.js');
const DecompressZip = require('decompress-zip');
const fs = require('fs');
const InTransfer = require('../logic/inTransfer.js');
const npm = require('npm');
const OrderBy = require('../helpers/orderBy.js');
const OutTransfer = require('../logic/outTransfer.js');
const path = require('path');
const popsicle = require('popsicle');
const rmdir = require('rimraf');
const Router = require('../helpers/router.js');
const Sandbox = require('lisk-sandbox');
const sandboxHelper = require('../helpers/sandbox.js');
const schema = require('../schema/dapps.js');
const sql = require('../sql/dapps.js');
const transactionTypes = require('../helpers/transactionTypes.js');

// Private fields
let modules,
    library,
    self,
    __private = {},
    shared = {};

__private.assetTypes = {};
__private.launched = {};
__private.loading = {};
__private.uninstalling = {};
__private.appPath = process.cwd();
__private.dappsPath = path.join(process.cwd(), 'dapps');
__private.sandboxes = {};
__private.dappready = {};
__private.routes = {};

/**
 * Initializes library with scope content and generates instances for:
 * - DApp
 * - InTransfer
 * - OutTransfer
 * Calls logic.transaction.attachAssetType().
 *
 * Listens `exit` signal.
 * Checks 'public/dapp' folder and created it if doesn't exists.
 * @memberof module:dapps
 * @class
 * @classdesc Main dapps methods.
 * @param {function} cb - Callback function.
 * @param {scope} scope - App instance.
 * @return {setImmediateCallback} Callback function with `self` as data.
 * @todo apply node pattern for callbacks: callback always at the end.
 * @todo add
 */
// Constructor
function DApps(cb, scope) {
    library = {
        logger: scope.logger,
        db: scope.db,
        public: scope.public,
        network: scope.network,
        schema: scope.schema,
        ed: scope.ed,
        balancesSequence: scope.balancesSequence,
        logic: {
            transaction: scope.logic.transaction,
        },
        config: {
            dapp: scope.config.dapp,
        },
    };
    self = this;

    __private.assetTypes[transactionTypes.DAPP] = library.logic.transaction.attachAssetType(
        transactionTypes.DAPP,
        new DApp(
            scope.db,
            scope.logger,
            scope.schema,
            scope.network
        )
    );

    __private.assetTypes[transactionTypes.IN_TRANSFER] = library.logic.transaction.attachAssetType(
        transactionTypes.IN_TRANSFER,
        new InTransfer(
            scope.db,
            scope.schema
        )
    );

    __private.assetTypes[transactionTypes.OUT_TRANSFER] = library.logic.transaction.attachAssetType(
        transactionTypes.OUT_TRANSFER,
        new OutTransfer(
            scope.db,
            scope.schema,
            scope.logger
        )
    );
    /**
     * Receives an 'exit' signal and calls stopDApp for each launched app.
     * @listens exit
     */
    process.on('exit', () => {
        const keys = Object.keys(__private.launched);

        async.eachSeries(keys, (id, eachSeriesCb) => {
            if (!__private.launched[id]) {
                return setImmediate(eachSeriesCb);
            }

            __private.stopDApp({
                transactionId: id
            }, err => setImmediate(eachSeriesCb, err));
        }, (err) => {
            library.logger.error(err);
        });
    });

    fs.exists(path.join('.', 'public', 'dapps'), (exists) => {
        if (exists) {
            rmdir(path.join('.', 'public', 'dapps'), (err) => {
                if (err) {
                    library.logger.error(err);
                }

                __private.createBasePaths(err => setImmediate(cb, err, self));
            });
        } else {
            __private.createBasePaths(() => setImmediate(cb, null, self));
        }
    });
}

// Private methods
/**
 * Gets record from `dapps` table based on id
 * @private
 * @implements {library.db.query}
 * @param {string} id
 * @param {function} cb
 * @return {setImmediateCallback} error description | row data
 */
__private.get = function (id, cb) {
    library.db.query(sql.get, { id }).then((rows) => {
        if (rows.length === 0) {
            return setImmediate(cb, 'Application not found');
        }
        return setImmediate(cb, null, rows[0]);
    }).catch((err) => {
        library.logger.error(err.stack);
        return setImmediate(cb, 'DApp#get error');
    });
};

/**
 * Gets records from `dapps` table based on id list
 * @private
 * @implements {library.db.query}
 * @param {string[]} ids
 * @param {function} cb
 * @return {setImmediateCallback} error description | rows data
 */
__private.getByIds = function (ids, cb) {
    library.db.query(sql.getByIds, [ids]).then(rows => setImmediate(cb, null, rows)).catch((err) => {
        library.logger.error(err.stack);
        return setImmediate(cb, 'DApp#getByIds error');
    });
};

/**
 * Gets records from `dapps` table based on filter
 * @private
 * @implements {library.db.query}
 * @param {Object} filter - Could contains type, name, category, link, limit,
 * offset, orderBy
 * @param {function} cb
 * @return {setImmediateCallback} error description | rows data
 */
__private.list = function (filter, cb) {
    let params = {},
        where = [];

    if (filter.type >= 0) {
        where.push('"type" = ${type}');
        params.type = filter.type;
    }

    if (filter.name) {
        where.push('"name" = ${name}');
        params.name = filter.name;
    }

    if (filter.category) {
        const category = dappCategories[filter.category];
        if (category != null && category !== undefined) {
            where.push('"category" = ${category}');
            params.category = category;
        } else {
            return setImmediate(cb, 'Invalid application category');
        }
    }

    if (filter.link) {
        where.push('"link" = ${link}');
        params.link = filter.link;
    }

    if (!filter.limit) {
        params.limit = 100;
    } else {
        params.limit = Math.abs(filter.limit);
    }

    if (!filter.offset) {
        params.offset = 0;
    } else {
        params.offset = Math.abs(filter.offset);
    }

    if (params.limit > 100) {
        return setImmediate(cb, 'Invalid limit. Maximum is 100');
    }

    const orderBy = OrderBy(
        filter.orderBy, {
            sortFields: sql.sortFields
        }
    );

    if (orderBy.error) {
        return setImmediate(cb, orderBy.error);
    }

    library.db.query(sql.list({
        where,
        sortField: orderBy.sortField,
        sortMethod: orderBy.sortMethod
    }), params).then(rows => setImmediate(cb, null, rows)).catch((err) => {
        library.logger.error(err.stack);
        return setImmediate(cb, err);
    });
};

/**
 * Creates base paths with mkdir if they don't exists for:
 * - /dapps
 * - /public/dapps
 * - /public/images/dapps
 * @private
 * @param {function} cb
 * @return {setImmediateCallback} if error
 */
__private.createBasePaths = function (cb) {
    const basePaths = [
        __private.dappsPath,                             // -> /dapps
        path.join(__private.appPath, 'public', 'dapps'), // -> /public/dapps
        path.join(__private.appPath, 'public', 'images', 'dapps'),    // -> /public/images/dapps
    ];

    async.eachSeries(basePaths, (path, eachSeriesCb) => {
        fs.exists(path, (exists) => {
            if (exists) {
                return setImmediate(eachSeriesCb);
            }
            return fs.mkdir(path, eachSeriesCb);
        });
    }, err => setImmediate(cb, err));
};

/**
 * Creates base paths with mkdir if they don't exists for:
 * - /dapps
 * - /public/dapps
 * - /public/images/dapps
 * @private
 * @param {dapp} dapp
 * @param {function} cb
 * @return {setImmediateCallback} if error
 */
__private.installDependencies = function (dapp, cb) {
    const dappPath = path.join(__private.dappsPath, dapp.transactionId);

    const packageJson = path.join(dappPath, 'package.json');
    let config = null;

    try {
        config = JSON.parse(fs.readFileSync(packageJson));
    } catch (e) {
        return setImmediate(cb, 'Failed to open package.json file');
    }

    npm.load(config, (err) => {
        if (err) {
            return setImmediate(cb, err);
        }

        npm.root = path.join(dappPath, 'node_modules');
        npm.prefix = dappPath;

        npm.commands.install(() => setImmediate(cb, null));
    });
};

/**
 * Gets ids from installed dapps, based in folder content
 * @private
 * @param {function} cb
 * @return {setImmediateCallback} error | ids
 */
__private.getInstalledIds = function (cb) {
    fs.readdir(__private.dappsPath, (err, ids) => {
        if (err) {
            return setImmediate(cb, err);
        }
        const regExp = new RegExp(/[0-9]{1,20}/);

        ids = _.filter(ids, f => regExp.test(f.toString()));

        return setImmediate(cb, null, ids);
    });
};

/**
 * Removes application folder and drops application tables.
 * @private
 * @implements {modules.sql.dropTables}
 * @param {dapp} dapp
 * @param {function} cb
 * @return {setImmediateCallback} error message | cb
 * @todo Fix this logic,triggers remove with err always.
 * @todo Implement dropTables
 */
__private.removeDApp = function (dapp, cb) {
    const dappPath = path.join(__private.dappsPath, dapp.transactionId);

    function remove(err) {
        if (err) {
            library.logger.error('Failed to uninstall application');
        }

        rmdir(dappPath, (err) => {
            if (err) {
                return setImmediate(cb, 'Failed to remove application folder');
            }
            return setImmediate(cb);
        });
    }

    fs.exists(dappPath, (exists) => {
        if (!exists) {
            return setImmediate(cb, 'Application not found');
        }
        let blockchain;

        try {
            blockchain = require(path.join(dappPath, 'blockchain.json'));
        } catch (e) {
            return remove(e.toString());
        }

        modules.sql.dropTables(dapp.transactionId, blockchain, (err) => {
            if (err) {
                library.logger.error('Failed to drop application tables');
            }
            remove(err);
        });
    });
};

/**
 * Creates a temp dir, downloads the dapp as stream and decompress it.
 * @private
 * @implements {popsicle}
 * @implements {DecompressZip}
 * @param {dapp} dapp
 * @param {string} dappPath
 * @param {function} cb
 * @return {setImmediateCallback} error message | cb
 */
__private.downloadLink = function (dapp, dappPath, cb) {
    const tmpDir = 'tmp';
    const tmpPath = path.join(__private.appPath, tmpDir, `${dapp.transactionId}.zip`);

    async.series({
            makeDirectory(serialCb) {
                fs.exists(tmpDir, (exists) => {
                    if (exists) {
                        return setImmediate(serialCb, null);
                    }
                    fs.mkdir(tmpDir, (err) => {
                        if (err) {
                            return setImmediate(serialCb, 'Failed to make tmp directory');
                        }
                        return setImmediate(serialCb, null);
                    });
                });
            },
            performDownload(serialCb) {
                library.logger.info(dapp.transactionId, `Downloading: ${dapp.link}`);

                function cleanup(err) {
                    library.logger.error(dapp.transactionId, `Download failed: ${err.message}`);

                    fs.exists(tmpPath, (exists) => {
                        if (exists) {
                            fs.unlink(tmpPath);
                        }
                        return setImmediate(serialCb, err.message);
                    });
                }

                const request = popsicle.get({
                    url: dapp.link,
                    transport: popsicle.createTransport({ type: 'stream' })
                });

                request.then((res) => {
                    if (res.status !== 200) {
                        return setImmediate(serialCb, ['Received bad response code', res.status].join(' '));
                    }

                    const stream = fs.createWriteStream(tmpPath);

                    stream.on('error', cleanup);

                    stream.on('finish', () => {
                        library.logger.info(dapp.transactionId, 'Finished downloading');
                        stream.close(serialCb);
                    });

                    res.body.pipe(stream);
                });

                request.catch(cleanup);
            },
            decompressZip(serialCb) {
                const unzipper = new DecompressZip(tmpPath);

                library.logger.info(dapp.transactionId, 'Decompressing zip file');

                unzipper.on('error', (err) => {
                    library.logger.error(dapp.transactionId, `Decompression failed: ${err.message}`);
                    fs.exists(tmpPath, (exists) => {
                        if (exists) {
                            fs.unlink(tmpPath);
                        }
                        return setImmediate(serialCb, 'Failed to decompress zip file');
                    });
                });

                unzipper.on('extract', () => {
                    library.logger.info(dapp.transactionId, 'Finished extracting');
                    fs.exists(tmpPath, (exists) => {
                        if (exists) {
                            fs.unlink(tmpPath);
                        }
                        return setImmediate(serialCb, null);
                    });
                });

                unzipper.on('progress', (fileIndex, fileCount) => {
                    library.logger.info(dapp.transactionId, ['Extracted file', (fileIndex + 1), 'of', fileCount].join(' '));
                });

                unzipper.extract({
                    path: dappPath,
                    strip: 1
                });
            }
        },
        err => setImmediate(cb, err));
};

/**
 * Implements a series process:
 * - checks if the dapp is already installed
 * - makes an application directory
 * - performs install by calling downloadLink function
 * @private
 * @implements {__private.downloadLink}
 * @param {dapp} dapp
 * @param {function} cb
 * @return {setImmediateCallback} error message | cb
 */
__private.installDApp = function (dapp, cb) {
    const dappPath = path.join(__private.dappsPath, dapp.transactionId);

    async.series({
            checkInstalled(serialCb) {
                fs.exists(dappPath, (exists) => {
                    if (exists) {
                        return setImmediate(serialCb, 'Application is already installed');
                    }
                    return setImmediate(serialCb, null);
                });
            },
            makeDirectory(serialCb) {
                fs.mkdir(dappPath, (err) => {
                    if (err) {
                        return setImmediate(serialCb, 'Failed to make application directory');
                    }
                    return setImmediate(serialCb, null);
                });
            },
            performInstall(serialCb) {
                return __private.downloadLink(dapp, dappPath, serialCb);
            }
        },
        (err) => {
            if (err) {
                return setImmediate(cb, `${dapp.transactionId} Installation failed: ${err}`);
            }
            return setImmediate(cb, null, dappPath);
        });
};

/**
 * Creates a public link (symbolic link) between public path and
 * public dapps with transaction id.
 * @private
 * @param {dapp} dapp
 * @param {function} cb
 * @return {setImmediateCallback} cb
 */
__private.createSymlink = function (dapp, cb) {
    const dappPath = path.join(__private.dappsPath, dapp.transactionId);
    const dappPublicPath = path.join(dappPath, 'public');
    const dappPublicLink = path.join(__private.appPath, 'public', 'dapps', dapp.transactionId);

    fs.exists(dappPublicPath, (exists) => {
        if (exists) {
            fs.exists(dappPublicLink, (exists) => {
                if (exists) {
                    return setImmediate(cb);
                }
                fs.symlink(dappPublicPath, dappPublicLink, cb);
            });
        } else {
            return setImmediate(cb);
        }
    });
};

/**
 * Gets module in parameter and calls `sandboxApi` with message args and dappid.
 * @private
 * @implements {sandboxApi} based on module
 * @param {Object} message
 * @param {function} callback
 * @return {setImmediateCallback} error messages
 */
__private.apiHandler = function (message, callback) {
    try {
        const strs = message.call.split('#');
        let module = strs[0],
            call = strs[1];

        if (!modules[module]) {
            return setImmediate(callback, `Invalid module in call: ${message.call}`);
        }

        if (!modules[module].sandboxApi) {
            return setImmediate(callback, 'Module does not have sandbox api');
        }

        modules[module].sandboxApi(call, { body: message.args, dappid: message.dappid }, callback);
    } catch (e) {
        return setImmediate(callback, `Invalid call ${e.toString()}`);
    }
};

/**
 * Gets `routes.json` file and creates the router
 * @private
 * @implements {Router}
 * @implements {library.network.app.use}
 * @param {dapp} dapp
 * @param {function} cb
 * @return {setImmediateCallback} error messages | cb
 */
__private.createRoutes = function (dapp, cb) {
    const dappPath = path.join(__private.dappsPath, dapp.transactionId);
    const dappRoutesPath = path.join(dappPath, 'routes.json');

    fs.exists(dappRoutesPath, (exists) => {
        if (exists) {
            let routes;

            try {
                routes = require(dappRoutesPath);
            } catch (e) {
                return setImmediate(cb, 'Failed to open routes.json file');
            }

            __private.routes[dapp.transactionId] = new Router({});

            routes.forEach((router) => {
                if (router.method === 'get' || router.method === 'post' || router.method === 'put') {
                    __private.routes[dapp.transactionId][router.method](router.path, (req, res) => {
                        self.request(dapp.transactionId, router.method, router.path, (router.method === 'get') ? req.query : req.body, (err, body) => {
                            if (!err && body.error) {
                                err = body.error;
                            }
                            if (err) {
                                body = { error: err };
                            }
                            body.success = !err;
                            res.json(body);
                        });
                    });
                }
            });

            library.network.app.use(`/api/dapps/${dapp.transactionId}/api/`, __private.routes[dapp.transactionId]);
            library.network.app.use((err, req, res, next) => {
                if (!err) {
                    return next();
                }
                library.logger.error(`API error ${req.url}`, err.message);
                res.status(500).send({ success: false, error: `API error: ${err.message}` });
            });

            return setImmediate(cb);
        }
        return setImmediate(cb);
    });
};

/**
 * Launchs daap steps:
 * - validate schema parameter
 * - check if application is already launched
 * - get the application
 * - get installed applications
 * - create public link
 * - create sandbox
 * - create application routes
 * @private
 * @implements {library.schema.validate}
 * @implements {__private.get}
 * @implements {__private.getInstalledIds}
 * @implements {__private.createSymlink}
 * @implements {__private.createSandbox}
 * @implements {__private.createRoutes}
 * @implements {__private.stopDApp}
 * @param {Object} body
 * @param {function} cb
 * @return {setImmediateCallback} cb, err
 */
__private.launchDApp = function (body, cb) {
    async.waterfall([
        function (waterCb) {
            library.schema.validate(body, schema.launch, (err) => {
                if (err) {
                    return setImmediate(waterCb, err[0].message);
                }
                return setImmediate(waterCb);
            });
        },
        function (waterCb) {
            if (__private.launched[body.id]) {
                return setImmediate(waterCb, 'Application already launched');
            }
            body.params = body.params || [''];

            if (body.params.length > 0) {
                body.params.push('modules.full.json');
            }

            __private.launched[body.id] = true;

            return setImmediate(waterCb);
        },
        function (waterCb) {
            __private.get(body.id, (err, dapp) => {
                if (err) {
                    __private.launched[body.id] = false;
                    return setImmediate(waterCb, 'Application not found');
                }
                return setImmediate(waterCb, null, dapp);
            });
        },
        function (dapp, waterCb) {
            __private.getInstalledIds((err, ids) => {
                if (err) {
                    __private.launched[body.id] = false;
                    return setImmediate(waterCb, 'Failed to get installed applications');
                } else if (ids.indexOf(body.id) < 0) {
                    __private.launched[body.id] = false;
                    return setImmediate(waterCb, 'Application not installed');
                }
                return setImmediate(waterCb, null, dapp);
            });
        },
        function (dapp, waterCb) {
            __private.createSymlink(dapp, (err) => {
                if (err) {
                    __private.launched[body.id] = false;
                    return setImmediate(waterCb, 'Failed to create public link');
                }
                return setImmediate(waterCb, null, dapp);
            });
        },
        function (dapp, waterCb) {
            __private.createSandbox(dapp, body.params || ['', 'modules.full.json'], (err) => {
                if (err) {
                    __private.launched[body.id] = false;
                    return setImmediate(waterCb, err);
                }
                return setImmediate(waterCb, null, dapp);
            });
        },
        function (dapp, waterCb) {
            __private.createRoutes(dapp, (err) => {
                if (err) {
                    __private.launched[body.id] = false;
                    __private.stopDApp(dapp, (err) => {
                        if (err) {
                            return setImmediate(waterCb, 'Failed to stop application');
                        }
                        return setImmediate(waterCb, 'Failed to create application routes');
                    });
                } else {
                    return setImmediate(waterCb, null, dapp);
                }
            });
        }
    ], (err) => {
        if (err) {
            library.logger.error('Failed to launch application', err);
        } else {
            library.logger.info('Application launched successfully');
        }
        return setImmediate(cb, err);
    });
};

/**
 * Opens dapp `config.json` file and for each peer calls update.
 * Once all peers are updated, opens `blockchain.json` file, calls
 * createTables and creates sandbox.
 * Listens sanbox events 'exit' and 'error' to stop dapp.
 * @private
 * @implements {modules.peers.update}
 * @implements {modules.sql.createTables}
 * @implements {Sandbox}
 * @implements {__private.stopDApp}
 * @param {dapp} dapp
 * @param {Object} params
 * @param {function} cb
 * @return {setImmediateCallback} cb, error
 */
__private.createSandbox = function (dapp, params, cb) {
    const dappPath = path.join(__private.dappsPath, dapp.transactionId);

    let dappConfig;

    try {
        dappConfig = require(path.join(dappPath, 'config.json'));
    } catch (e) {
        return setImmediate(cb, 'Failed to open config.json file');
    }

    async.eachSeries(dappConfig.peers, (peer, eachSeriesCb) => {
        modules.peers.update({
            ip: peer.ip,
            port: peer.port,
            dappid: dapp.transactionId
        });
        return eachSeriesCb();
    }, (err) => {
        if (err) {
            return setImmediate(cb, err);
        }

        let blockchain;

        try {
            blockchain = require(path.join(dappPath, 'blockchain.json'));
        } catch (e) {
            return setImmediate(cb, 'Failed to open blockchain.json file');
        }

        modules.sql.createTables(dapp.transactionId, blockchain, (err) => {
            if (err) {
                return setImmediate(cb, err);
            }

            let withDebug = false;
            process.execArgv.forEach((item) => {
                if (item.indexOf('--debug') >= 0) {
                    withDebug = true;
                }
            });

            const sandbox = new Sandbox(path.join(dappPath, 'index.js'), dapp.transactionId, params, __private.apiHandler, withDebug);
            __private.sandboxes[dapp.transactionId] = sandbox;

            sandbox.on('exit', () => {
                __private.stopDApp(dapp, (err) => {
                    if (err) {
                        library.logger.error('Failed to stop application', dapp.transactionId);
                    } else {
                        library.logger.info(['Application', dapp.transactionId, 'closed'].join(' '));
                    }
                });
            });

            sandbox.on('error', (err) => {
                library.logger.error(['Encountered error in application', dapp.transactionId].join(' '), err);
                __private.stopDApp(dapp, (err) => {
                    if (err) {
                        library.logger.error('Failed to stop application', dapp.transactionId);
                    } else {
                        library.logger.info(['Application', dapp.transactionId, 'closed'].join(' '));
                    }
                });
            });

            sandbox.run();

            return setImmediate(cb);
        });
    });
};

/**
 * Stops dapp:
 * - check public/dapps id is installed
 * - delete sandbox after exit() from sanbox
 * - delete routes
 * @private
 * @implements {sandboxes.exit}
 * @param {dapp} dapp
 * @param {function} cb
 * @return {setImmediateCallback} cb, error
 */
__private.stopDApp = function (dapp, cb) {
    const dappPublicLink = path.join(__private.appPath, 'public', 'dapps', dapp.transactionId);

    async.series({
        checkInstalled(seriesCb) {
            fs.exists(dappPublicLink, (exists) => {
                if (exists) {
                    return setImmediate(seriesCb);
                }
                return setImmediate(seriesCb, 'Application not found');
            });
        },
        deleteSandbox(seriesCb) {
            if (__private.sandboxes[dapp.transactionId]) {
                __private.sandboxes[dapp.transactionId].exit();
            }

            delete __private.sandboxes[dapp.transactionId];
            return setImmediate(seriesCb);
        },
        deleteRoutes(seriesCb) {
            delete __private.routes[dapp.transactionId];
            return setImmediate(seriesCb);
        }
    }, err => setImmediate(cb, err));
};

// Public methods
/**
 * Calls helpers.sandbox.callMethod().
 * @implements module:helpers#callMethod
 * @param {function} call - Method to call.
 * @param {*} args - List of arguments.
 * @param {function} cb - Callback function.
 */
DApps.prototype.sandboxApi = function (call, args, cb) {
    sandboxHelper.callMethod(shared, call, args, cb);
};

/**
 * Calls request with 'post' method and '/message' path.
 * @implements {request}
 * @param {string} dappid
 * @param {Object} body
 * @param {function} cb
 */
DApps.prototype.message = function (dappid, body, cb) {
    self.request(dappid, 'post', '/message', body, cb);
};

/**
 * Calls sendMessage for sandboxes dapp.
 * @implements {request}
 * @param {string} dappid
 * @param {string} method
 * @param {string} path
 * @param {Object} query
 * @param {function} cb
 * @return {setImmediateCallback} for errors
 */
DApps.prototype.request = function (dappid, method, path, query, cb) {
    if (!__private.sandboxes[dappid]) {
        return setImmediate(cb, 'Application sandbox not found');
    }
    if (!__private.dappready[dappid]) {
        return setImmediate(cb, 'Application not ready');
    }
    __private.sandboxes[dappid].sendMessage({
        method,
        path,
        query
    }, cb);
};

// Events
/**
 * Bounds used scope modules to private modules variable and sets params
 * to private Dapp, InTransfer and OutTransfer instances.
 * @implements module:transactions#Transfer~bind
 * @param {modules} scope - Loaded modules.
 */
DApps.prototype.onBind = function (scope) {
    modules = {
        transactions: scope.transactions,
        accounts: scope.accounts,
        peers: scope.peers,
        sql: scope.sql,
    };

    __private.assetTypes[transactionTypes.IN_TRANSFER].bind(
        scope.accounts,
        scope.rounds,
        shared
    );

    __private.assetTypes[transactionTypes.OUT_TRANSFER].bind(
        scope.accounts,
        scope.rounds,
        scope.dapps
    );
};

/**
 * Waits a second and for each library.config.dapp.autoexec calls launchDApp.
 * @implements {__private.launchDApp}
 */
DApps.prototype.onBlockchainReady = function () {
    setTimeout(() => {
        if (!library.config.dapp) {
            return;
        }

        async.eachSeries(library.config.dapp.autoexec || [], (dapp, cb) => {
            __private.launchDApp({
                params: dapp.params,
                id: dapp.dappid,
                master: library.config.dapp.masterpassword
            }, (err) => {
                if (err) {
                    library.logger.error('Failed to launch application', err);
                } else {
                    library.logger.info('Application launched successfully');
                }

                return setImmediate(cb);
            });
        });
    }, 1000);
};

/**
 * For each sandbox sends a post message with rollback and block information.
 * @implements {request}
 * @param {block} block
 */
DApps.prototype.onDeleteBlocksBefore = function (block) {
    Object.keys(__private.sandboxes).forEach((dappId) => {
        self.request(dappId, 'post', '/message', {
            topic: 'rollback',
            message: { pointId: block.id, pointHeight: block.height }
        }, (err) => {
            if (err) {
                library.logger.error('DApps#onDeleteBlocksBefore error', err);
            }
        });
    });
};

/**
 * For each sandbox sends a post message with point and block information.
 * @implements {request}
 * @param {block} block
 * @param {Object} broadcast
 */
DApps.prototype.onNewBlock = function (block, broadcast) {
    Object.keys(__private.sandboxes).forEach((dappId) => {
        if (broadcast) {
            self.request(dappId, 'post', '/message', {
                topic: 'point',
                message: { id: block.id, height: block.height }
            }, (err) => {
                if (err) {
                    library.logger.error('DApps#onNewBlock error:', err);
                }
            });
        }
    });
};

/**
 * Checks if `modules` is loaded.
 * @return {boolean} True if `modules` is loaded.
 */
DApps.prototype.isLoaded = function () {
    return !!modules;
};

/**
 * Internal & Shared
 * - DApps.prototype.internal
 * - shared.
 * @todo implement API comments with apidoc.
 * @see {@link http://apidocjs.com/}
 */
DApps.prototype.internal = {
    put(dapp, cb) {
        const hash = crypto.createHash('sha256').update(dapp.secret, 'utf8').digest();
        const keypair = library.ed.makeKeypair(hash);

        if (dapp.publicKey) {
            if (keypair.publicKey.toString('hex') !== dapp.publicKey) {
                return setImmediate(cb, 'Invalid passphrase');
            }
        }

        library.balancesSequence.add((cb) => {
            modules.accounts.setAccountAndGet({ publicKey: keypair.publicKey.toString('hex') }, (err, account) => {
                if (err) {
                    return setImmediate(cb, err);
                }

                if (!account || !account.publicKey) {
                    return setImmediate(cb, 'Account not found');
                }

                if (account.secondSignature && !dapp.secondSecret) {
                    return setImmediate(cb, 'Invalid second passphrase');
                }

                let secondKeypair = null;

                if (account.secondSignature) {
                    const secondHash = crypto.createHash('sha256').update(dapp.secondSecret, 'utf8').digest();
                    secondKeypair = library.ed.makeKeypair(secondHash);
                }

                library.logic.transaction.create({
                    type: transactionTypes.DAPP,
                    sender: account,
                    keypair,
                    secondKeypair,
                    category: dapp.category,
                    name: dapp.name,
                    description: dapp.description,
                    tags: dapp.tags,
                    dapp_type: dapp.type,
                    link: dapp.link,
                    icon: dapp.icon
                }).then((transactionDAPP) => {
                    transactionDAPP.status = 0;
                    modules.transactions.putInQueue(transactionDAPP);
                    return setImmediate(cb, null, [transactionDAPP]);
                }).catch(e => setImmediate(cb, e.toString()));
            });
        }, (err, transaction) => {
            if (err) {
                return setImmediate(cb, null, { success: false, error: err });
            }
            return setImmediate(cb, null, { success: true, transaction: transaction[0] });
        });
    },

    get(query, cb) {
        __private.get(query.id, (err, dapp) => {
            if (err) {
                return setImmediate(cb, null, { success: false, error: err });
            }
            return setImmediate(cb, null, { success: true, dapp });
        });
    },

    list(query, cb) {
        __private.list(query, (err, dapps) => {
            if (err) {
                return setImmediate(cb, 'Application not found');
            }
            return setImmediate(cb, null, { success: true, dapps });
        });
    },

    installed(req, cb) {
        __private.getInstalledIds((err, ids) => {
            if (err) {
                library.logger.error(err);
                return setImmediate(cb, 'Failed to get installed application ids');
            }

            if (ids.length === 0) {
                return setImmediate(cb, null, { success: true, dapps: [] });
            }

            __private.getByIds(ids, (err, dapps) => {
                if (err) {
                    library.logger.error(err);
                    return setImmediate(cb, 'Failed to get applications by id');
                }
                return setImmediate(cb, null, { success: true, dapps });
            });
        });
    },

    search(query, cb) {
        __private.getInstalledIds((err) => {
            if (err) {
                library.logger.error(err);
                return setImmediate(cb, 'Failed to get installed application ids');
            }

            const params = { q: `%${query.q}%`, limit: 50 };

            if (query.category) {
                if (query.category === 0 || query.category > 0) {
                    params.category = query.category;
                }
            }

            library.db.query(sql.search(params), params).then((rows) => {
                if (rows.length === 0) {
                    return setImmediate(cb, null, { success: true, dapps: rows });
                }

                if (query.installed === null || typeof query.installed === 'undefined') {
                    return setImmediate(cb, null, { success: true, dapps: rows });
                } else if (query.installed === 1) {
                    __private.getInstalledIds((err, installed) => {
                        if (err) {
                            return setImmediate(cb, null, {
                                success: false,
                                error: 'Failed to get installed ids'
                            });
                        }

                        const dapps = [];

                        rows.forEach((dapp) => {
                            if (installed.indexOf(dapp.transactionId) >= 0) {
                                dapps.push(dapp);
                            }
                        });

                        return setImmediate(cb, null, { success: true, dapps });
                    });
                } else {
                    __private.getInstalledIds((err, installed) => {
                        if (err) {
                            return setImmediate(cb, null, {
                                success: false,
                                error: 'Failed to get installed ids'
                            });
                        }

                        const dapps = [];
                        rows.forEach((dapp) => {
                            if (installed.indexOf(dapp.transactionId) < 0) {
                                dapps.push(dapp);
                            }
                        });

                        return setImmediate(cb, null, { success: true, dapps });
                    });
                }
            }).catch((err) => {
                library.logger.error(err.stack);
                return setImmediate(cb, 'Database search failed');
            });
        });
    },

    installedIds(req, cb) {
        __private.getInstalledIds((err, ids) => {
            if (err) {
                library.logger.error(err);
                return setImmediate(cb, 'Failed to get installed application ids');
            }
            return setImmediate(cb, null, { success: true, ids });
        });
    },

    isMasterPasswordEnabled(req, cb) {
        return setImmediate(cb, null, { success: true, enabled: !!library.config.dapp.masterpassword });
    },

    install(params, cb) {
        if (library.config.dapp.masterpassword && params.master !== library.config.dapp.masterpassword) {
            return setImmediate(cb, 'Invalid master passphrase');
        }

        __private.get(params.id, (err, dapp) => {
            if (err) {
                library.logger.error(err);
                return setImmediate(cb, null, { success: false, error: err });
            }

            __private.getInstalledIds((err, ids) => {
                if (err) {
                    library.logger.error(err);
                    return setImmediate(cb, null, { success: false, error: err });
                }

                if (ids.indexOf(params.id) >= 0) {
                    return setImmediate(cb, 'Application is already installed');
                }

                if (__private.loading[params.id] || __private.uninstalling[params.id]) {
                    return setImmediate(cb, 'Application is loading or being uninstalled');
                }

                __private.loading[params.id] = true;

                __private.installDApp(dapp, (err, dappPath) => {
                    if (err) {
                        __private.loading[params.id] = false;
                        return setImmediate(cb, null, { success: false, error: err });
                    } else if (dapp.type === 0) {
                        __private.installDependencies(dapp, (err) => {
                            if (err) {
                                library.logger.error(err);
                                __private.uninstalling[params.id] = true;
                                __private.removeDApp(dapp, (err) => {
                                    __private.uninstalling[params.id] = false;

                                    if (err) {
                                        library.logger.error(err);
                                    }

                                    __private.loading[params.id] = false;
                                    return setImmediate(cb, null, {
                                        success: false,
                                        error: 'Failed to install application dependencies'
                                    });
                                });
                            } else {
                                library.network.io.sockets.emit('dapps/change', dapp);

                                __private.loading[params.id] = false;
                                return setImmediate(cb, null, { success: true, path: dappPath });
                            }
                        });
                    } else {
                        library.network.io.sockets.emit('dapps/change', dapp);

                        __private.loading[params.id] = false;
                        return setImmediate(cb, null, { success: true, path: dappPath });
                    }
                });
            });
        });
    },

    uninstall(params, cb) {
        if (library.config.dapp.masterpassword && params.master !== library.config.dapp.masterpassword) {
            return setImmediate(cb, 'Invalid master passphrase');
        }

        __private.get(params.id, (err, dapp) => {
            if (err) {
                library.logger.error(err);
                return setImmediate(cb, null, { success: false, error: err });
            }

            if (__private.loading[params.id] || __private.uninstalling[params.id]) {
                return setImmediate(cb, null, { success: true, error: 'Application is loading or being uninstalled' });
            }

            __private.uninstalling[params.id] = true;

            if (__private.launched[params.id]) {
                __private.stopDApp(dapp, (err) => {
                    if (err) {
                        library.logger.error(err);
                        return setImmediate(cb, 'Failed to stop application');
                    }
                    __private.launched[params.id] = false;
                    __private.removeDApp(dapp, (err) => {
                        __private.uninstalling[params.id] = false;

                        if (err) {
                            return setImmediate(cb, null, { success: false, error: err });
                        }
                        library.network.io.sockets.emit('dapps/change', dapp);

                        return setImmediate(cb, null, { success: true });
                    });
                });
            } else {
                __private.removeDApp(dapp, (err) => {
                    __private.uninstalling[params.id] = false;

                    if (err) {
                        return setImmediate(cb, null, { success: false, error: err });
                    }
                    library.network.io.sockets.emit('dapps/change', dapp);

                    return setImmediate(cb, null, { success: true });
                });
            }
        });
    },

    launch(req, cb) {
        if (library.config.dapp.masterpassword && req.body.master !== library.config.dapp.masterpassword) {
            return setImmediate(cb, 'Invalid master passphrase');
        }

        __private.launchDApp(req.body, (err) => {
            if (err) {
                return setImmediate(cb, null, { success: false, error: err });
            }
            library.network.io.sockets.emit('dapps/change', {});
            return setImmediate(cb, null, { success: true });
        });
    },

    installing(req, cb) {
        const ids = [];
        for (const i in __private.loading) {
            if (__private.loading[i]) {
                ids.push(i);
            }
        }

        return setImmediate(cb, null, { success: true, installing: ids });
    },

    uninstalling(req, cb) {
        const ids = [];
        for (const i in __private.uninstalling) {
            if (__private.uninstalling[i]) {
                ids.push(i);
            }
        }

        return setImmediate(cb, null, { success: true, uninstalling: ids });
    },

    launched(req, cb) {
        const ids = [];
        for (const i in __private.launched) {
            if (__private.launched[i]) {
                ids.push(i);
            }
        }

        return setImmediate(cb, null, { success: true, launched: ids });
    },

    categories(req, cb) {
        return setImmediate(cb, null, { success: true, categories: dappCategories });
    },

    stop(params, cb) {
        if (!__private.launched[params.id]) {
            return setImmediate(cb, 'Application not launched');
        }

        if (library.config.dapp.masterpassword && params.master !== library.config.dapp.masterpassword) {
            return setImmediate(cb, 'Invalid master passphrase');
        }

        __private.get(params.id, (err, dapp) => {
            if (err) {
                library.logger.error(err);
                return setImmediate(cb, 'Application not found');
            }
            __private.stopDApp(dapp, (err) => {
                if (err) {
                    library.logger.error(err);
                    return setImmediate(cb, 'Failed to stop application');
                }
                library.network.io.sockets.emit('dapps/change', dapp);
                __private.launched[params.id] = false;
                return setImmediate(cb, null, { success: true });
            });
        });
    },

    addTransactions(req, cb) {
        library.schema.validate(req.body, schema.addTransactions, (err) => {
            if (err) {
                return setImmediate(cb, err[0].message);
            }

            const hash = crypto.createHash('sha256').update(req.body.secret, 'utf8').digest();
            const keypair = library.ed.makeKeypair(hash);

            if (req.body.publicKey) {
                if (keypair.publicKey.toString('hex') !== req.body.publicKey) {
                    return setImmediate(cb, 'Invalid passphrase');
                }
            }

            library.balancesSequence.add((cb) => {
                if (req.body.multisigAccountPublicKey && req.body.multisigAccountPublicKey !== keypair.publicKey.toString('hex')) {
                    modules.accounts.getAccount({ publicKey: req.body.multisigAccountPublicKey }, (err, account) => {
                        if (err) {
                            return setImmediate(cb, err);
                        }

                        if (!account || !account.publicKey) {
                            return setImmediate(cb, 'Multisignature account not found');
                        }

                        if (!account.multisignatures || !account.multisignatures) {
                            return setImmediate(cb, 'Account does not have multisignatures enabled');
                        }

                        if (account.multisignatures.indexOf(keypair.publicKey.toString('hex')) < 0) {
                            return setImmediate(cb, 'Account does not belong to multisignature group');
                        }

                        modules.accounts.getAccount({ publicKey: keypair.publicKey }, (err, requester) => {
                            if (err) {
                                return setImmediate(cb, err);
                            }

                            if (!requester || !requester.publicKey) {
                                return setImmediate(cb, 'Requester not found');
                            }

                            if (requester.secondSignature && !req.body.secondSecret) {
                                return setImmediate(cb, 'Missing requester second passphrase');
                            }

                            if (requester.publicKey === account.publicKey) {
                                return setImmediate(cb, 'Invalid requester public key');
                            }

                            let secondKeypair = null;

                            if (requester.secondSignature) {
                                const secondHash = crypto.createHash('sha256').update(req.body.secondSecret, 'utf8').digest();
                                secondKeypair = library.ed.makeKeypair(secondHash);
                            }

                            library.logic.transaction.create({
                                type: transactionTypes.IN_TRANSFER,
                                amount: req.body.amount,
                                sender: account,
                                keypair,
                                requester: keypair,
                                secondKeypair,
                                dappId: req.body.dappId
                            }).then((transactionInTransfer) => {
                                transactionInTransfer.status = 0;
                                modules.transactions.putInQueue(transactionInTransfer);
                                return setImmediate(cb, null, [transactionInTransfer]);
                            }).catch(e => setImmediate(cb, e.toString()));
                        });
                    });
                } else {
                    modules.accounts.setAccountAndGet({ publicKey: keypair.publicKey.toString('hex') }, (err, account) => {
                        if (err) {
                            return setImmediate(cb, err);
                        }

                        if (!account || !account.publicKey) {
                            return setImmediate(cb, 'Account not found');
                        }

                        if (account.secondSignature && !req.body.secondSecret) {
                            return setImmediate(cb, 'Invalid second passphrase');
                        }

                        let secondKeypair = null;

                        if (account.secondSignature) {
                            const secondHash = crypto.createHash('sha256').update(req.body.secondSecret, 'utf8').digest();
                            secondKeypair = library.ed.makeKeypair(secondHash);
                        }

                        library.logic.transaction.create({
                            type: transactionTypes.IN_TRANSFER,
                            amount: req.body.amount,
                            sender: account,
                            keypair,
                            secondKeypair,
                            dappId: req.body.dappId
                        }).then((transactionRefer) => {
                            transactionRefer.status = 0;
                            modules.transactions.putInQueue(transactionRefer);
                            return setImmediate(cb, null, [transactionRefer]);
                        }).catch(e => setImmediate(cb, e.toString()));
                    });
                }
            }, (err, transaction) => {
                if (err) {
                    return setImmediate(cb, err);
                }

                return setImmediate(cb, null, { transactionId: transaction[0].id });
            });
        });
    },


    sendWithdrawal(req, cb) {
        library.schema.validate(req.body, schema.sendWithdrawal, (err) => {
            if (err) {
                return setImmediate(cb, err[0].message);
            }

            const hash = crypto.createHash('sha256').update(req.body.secret, 'utf8').digest();
            const keypair = library.ed.makeKeypair(hash);

            library.balancesSequence.add((cb) => {
                if (req.body.multisigAccountPublicKey && req.body.multisigAccountPublicKey !== keypair.publicKey.toString('hex')) {
                    modules.accounts.getAccount({ publicKey: req.body.multisigAccountPublicKey }, (err, account) => {
                        if (err) {
                            return setImmediate(cb, err);
                        }

                        if (!account || !account.publicKey) {
                            return setImmediate(cb, 'Multisignature account not found');
                        }

                        if (!account.multisignatures || !account.multisignatures) {
                            return setImmediate(cb, 'Account does not have multisignatures enabled');
                        }

                        if (account.multisignatures.indexOf(keypair.publicKey.toString('hex')) < 0) {
                            return setImmediate(cb, 'Account does not belong to multisignature group');
                        }

                        modules.accounts.getAccount({ publicKey: keypair.publicKey }, (err, requester) => {
                            if (err) {
                                return setImmediate(cb, err);
                            }

                            if (!requester || !requester.publicKey) {
                                return setImmediate(cb, 'Requester not found');
                            }

                            if (requester.secondSignature && !req.body.secondSecret) {
                                return setImmediate(cb, 'Missing requester second passphrase');
                            }

                            if (requester.publicKey === account.publicKey) {
                                return setImmediate(cb, 'Invalid requester public key');
                            }

                            let secondKeypair = null;

                            if (requester.secondSignature) {
                                const secondHash = crypto.createHash('sha256').update(req.body.secondSecret, 'utf8').digest();
                                secondKeypair = library.ed.makeKeypair(secondHash);
                            }

                            library.logic.transaction.create({
                                type: transactionTypes.OUT_TRANSFER,
                                amount: req.body.amount,
                                sender: account,
                                recipientId: req.body.recipientId,
                                keypair,
                                secondKeypair,
                                requester: keypair,
                                dappId: req.body.dappId,
                                transactionId: req.body.transactionId
                            }).then((transactionRefer) => {
                                transactionRefer.status = 0;
                                modules.transactions.putInQueue(transactionRefer);
                                return setImmediate(cb, null, [transactionRefer]);
                            }).catch(e => setImmediate(cb, e.toString()));
                        });
                    });
                } else {
                    modules.accounts.setAccountAndGet({ publicKey: keypair.publicKey.toString('hex') }, (err, account) => {
                        if (err) {
                            return setImmediate(cb, err);
                        }

                        if (!account || !account.publicKey) {
                            return setImmediate(cb, 'Account not found');
                        }

                        if (account.secondSignature && !req.body.secondSecret) {
                            return setImmediate(cb, 'Missing second passphrase');
                        }

                        let secondKeypair = null;

                        if (account.secondSignature) {
                            const secondHash = crypto.createHash('sha256').update(req.body.secondSecret, 'utf8').digest();
                            secondKeypair = library.ed.makeKeypair(secondHash);
                        }

                        library.logic.transaction.create({
                            type: transactionTypes.OUT_TRANSFER,
                            amount: req.body.amount,
                            sender: account,
                            recipientId: req.body.recipientId,
                            keypair,
                            secondKeypair,
                            dappId: req.body.dappId,
                            transactionId: req.body.transactionId
                        }).then((transactionRefer) => {
                            transactionRefer.status = 0;
                            modules.transactions.putInQueue(transactionRefer);
                            return setImmediate(cb, null, [transactionRefer]);
                        }).catch(e => setImmediate(cb, e.toString()));
                    });
                }
            }, (err, transaction) => {
                if (err) {
                    return setImmediate(cb, err);
                }

                return setImmediate(cb, null, { transactionId: transaction[0].id });
            });
        });
    }
};

// Shared API
shared.getGenesis = function (req, cb) {
    library.db.query(sql.getGenesis, { id: req.dappid }).then((rows) => {
        if (rows.length === 0) {
            return setImmediate(cb, 'Application genesis block not found');
        }
        const row = rows[0];

        return setImmediate(cb, null, {
            pointId: row.id,
            pointHeight: row.height,
            authorId: row.authorId,
            dappid: req.dappid
        });
    }).catch((err) => {
        library.logger.error(err.stack);
        return setImmediate(cb, 'DApp#getGenesis error');
    });
};

shared.setReady = function (req, cb) {
    __private.dappready[req.dappid] = true;
    return setImmediate(cb, null, {});
};

shared.getCommonBlock = function (req, cb) {
    library.db.query(sql.getCommonBlock, {
        dappid: req.dappid,
        type: transactionTypes.IN_TRANSFER
    }).then(rows => setImmediate(cb, null, rows)).catch((err) => {
        library.logger.error(err.stack);
        return setImmediate(cb, 'DApp#getCommonBlock error');
    });
};

shared.sendWithdrawal = function (req, cb) {
    return __private.sendWithdrawal(req, cb);
};

shared.getWithdrawalLastTransaction = function (req, cb) {
    library.db.query(sql.getWithdrawalLastTransaction, {
        dappid: req.dappid,
        type: transactionTypes.OUT_TRANSFER
    }).then(rows => setImmediate(cb, null, rows[0])).catch((err) => {
        library.logger.error(err.stack);
        return setImmediate(cb, 'DApp#getWithdrawalLastTransaction error');
    });
};

shared.getBalanceTransactions = function (req, cb) {
    library.db.query(sql.getBalanceTransactions({
        lastId: req.body.lastTransactionId
    }), {
        dappid: req.dappid,
        type: transactionTypes.IN_TRANSFER,
        lastId: req.body.lastTransactionId
    }).then(rows => setImmediate(cb, null, rows)).catch((err) => {
        library.logger.error(err.stack);
        return setImmediate(cb, 'DApp#getBalanceTransaction error');
    });
};

// Export
module.exports = DApps;

/** ************************************* END OF FILE ************************************ */
