'use strict';

// requiring modules and initializing required variables.
var fs = require('fs'),
    path = require('path'),
    archiver = require('archiver'),
    currDate = new Date(),
    year = currDate.getFullYear(),
    month = currDate.toLocaleString("en-us", { month: "long" }),
    dir = path.join(__dirname + '/archive/' + year + '/' + month),
    ignoredFile = currDate.getFullYear()+'-'+('0' + (currDate.getMonth() + 1)).slice(-2)+'-'+('0' + currDate.getDate()).slice(-2)+'.log';

//Function to create directories recursively if doesn't exists.
exports.createDir = function (dir) {
    const splitPath = dir.split('/');
    splitPath.reduce(function (dirPath, subPath) {
        let currentPath;
        if (subPath != '.') {
            currentPath = dirPath + '/' + subPath;
            if (!fs.existsSync(currentPath)) {
                fs.mkdirSync(currentPath);
            }
        } else {
            currentPath = subPath;
        }
        return currentPath
    }, '');
};
exports.createDir(dir);

exports.archiveLogFiles = function() {
    
    // create a file to stream archive data to.
    var output = fs.createWriteStream(path.join(dir, 'logs.zip'));
    var archive = archiver('zip', {});
    var logPath = __dirname + '/logs';

    // listen for all archive data to be written.
    // 'close' event is fired only when a file descriptor is involved.
    // deleting files from @logs directory when all files written to the archived directory.
    output.on('close', function () {
        if (fs.existsSync(logPath)) {
            fs.readdirSync(logPath).forEach(function (file, index) {
                var curPath = logPath + "/" + file;
                if (!fs.lstatSync(logPath).isFile()) {
                    // delete file
                    if(!(file == ignoredFile)) {
                        fs.unlinkSync(curPath);
                    }
                }
            });
        }
    });

    // This event is fired when the data source is drained no matter what was the data source.
    // It is not part of this library but rather from the NodeJS Stream API.
    // @see: https://nodejs.org/api/stream.html#stream_event_end
    output.on('end', function () {
        console.log('Data has been drained');
    });

    // good practice to catch warnings (ie stat failures and other non-blocking errors)
    archive.on('warning', function (err) {
        if (err.code === 'ENOENT') {
            console.log(err);
        } else {
            // throw error
            console.log(err);
            throw err;
        }
    });

    // good practice to catch this error explicitly
    archive.on('error', function (err) {
        logger.error(err);
        throw err;
    });

    // pipe archive data to the file
    archive.pipe(output);

    // append files from a glob pattern
    archive
        .glob("./logs/**/*", {
            ignore: ['./logs/'+ignoredFile]
        })
        .finalize();
};

exports.archiveLogFiles();