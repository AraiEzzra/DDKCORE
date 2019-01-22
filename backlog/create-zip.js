let fs = require('fs'),
    path = require('path'),
    archiver = require('archiver'),
    currDate = new Date(),
    utils = require('./utils'),
    ignoredFile = utils.getIgnoredFile(currDate);

/**
 * @desc Creates a directory if not exists already
 * @param {String} dir - path to a directory
 * @param {function} cb - callback function
 * @returns {function} cb
 */
exports.createDir = function (dir, cb) {
    try {
        const splitPath = dir.split('/');
        splitPath.reduce((dirPath, subPath) => {
            let currentPath;
            if (subPath != '.') {
                currentPath = `${dirPath}/${subPath}`;
                if (!fs.existsSync(currentPath)) {
                    fs.mkdirSync(currentPath);
                }
            } else {
                currentPath = subPath;
            }
            return currentPath;
        }, '');
        return cb(null);
    } catch (err) {
        return cb(err);
    }
};

/**
 * @desc archived log files on every first day of a month
 * @param {String} dir - path to a directory
 * @param {function} cb - callback function
 * @returns {function} cb
 */
exports.archiveLogFiles = function (dir, cb) {
    const output = fs.createWriteStream(path.join(dir, `${currDate.getTime()}.zip`));
    const archive = archiver('zip', {});
    const logPath = `${__dirname}/logs`;

    output.on('close', () => {
        try {
            if (fs.existsSync(logPath)) {
                fs.readdirSync(logPath).forEach((file) => {
                    const curPath = `${logPath}/${file}`;
                    if (!fs.lstatSync(logPath).isFile()) {
                        if (!(file === ignoredFile || file === 'archive.log')) {
                            fs.unlinkSync(curPath);
                        }
                    }
                });
            }
            return cb(null);
        } catch (err) {
            return cb(err);
        }
    });

    output.on('end', () => {
    });

    const onWarning = archive.on;
    onWarning('warning', (err) => {
        if (err.code === 'ENOENT') {
            return cb(err);
        }
        return cb(err);
    });

    archive.on('error', err => cb(err));

    archive.pipe(output);

    archive
        .glob('./logs/**/*', {
            ignore: [`./logs/${ignoredFile}`, './logs/archive.log']
        })
        .finalize();
};

/** ************************************* END OF FILE ************************************ */
