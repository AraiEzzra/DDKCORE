const utils = require('./utils');
const path = require('path');

let library = {};


exports.attachScope = function (scope) {
    library = scope;
};

/**
 * @desc archive log files every first day of a month
 */
exports.archiveLogFiles = {

    on: '0 0 1 * *',
    job() {
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        if (today.getMonth() !== yesterday.getMonth()) {
            library.logger.archive('start executing archiving files');
            const createZip = require('./create-zip');
            const year = today.getFullYear();
            const month = today.toLocaleString('en-us', { month: 'long' });
            const dir = path.join(`${__dirname}/archive/${year}/${month}`);
            createZip.createDir(dir, (err) => {
                if (!err) {
                    createZip.archiveLogFiles(dir, (err) => {
                        if (!err) {
                            library.logger.archive('files are archived');
                        } else {
                            library.logger.archive(`archive error : ${err}`);
                        }
                    });
                } else {
                    library.logger.archive(`directory creation error : ${err}`);
                }
            });
        }
    },
    spawn: false
};
/** ************************************* END OF FILE ************************************ */
