let fs = require('fs'),
	path = require('path'),
	archiver = require('archiver'),
	currDate = new Date(),
	ignoredFile = currDate.getFullYear()+'-'+('0' + (currDate.getMonth() + 1)).slice(-2)+'-'+('0' + currDate.getDate()).slice(-2)+'.log';

/**
 * @desc Creates a directory if not exists already
 * @param {String} dir - path to a directory 
 * @param {function} cb - callback function
 * @returns {function} cb
 */
exports.createDir = function (dir, cb) {
	try {
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
			return currentPath;
		}, '');
		return cb(null);
	} catch(err) {
		return cb(err);
	}
};

/**
 * @desc archived log files on every first day of a month
 * @param {String} dir - path to a directory 
 * @param {function} cb - callback function 
 * @returns {function} cb
 */
exports.archiveLogFiles = function(dir, cb) {
    
	let output = fs.createWriteStream(path.join(dir, currDate.getTime() + '.zip'));
	let archive = archiver('zip', {});
	let logPath = __dirname + '/logs';

	output.on('close', function () {
		try {
			if (fs.existsSync(logPath)) {
				fs.readdirSync(logPath).forEach(function (file) {
					let curPath = logPath + '/' + file;
					if (!fs.lstatSync(logPath).isFile()) {
						if(!(file == ignoredFile || file == 'archive.log')) {
							fs.unlinkSync(curPath);
						}
					}
				});
			}
			return cb(null);
		} catch(err) {
			return cb(err);
		}
	});

	output.on('end', function () {});

	archive.on('warning', function (err) {
		if (err.code === 'ENOENT') {
			return cb(err);
		} else {
			return cb(err);
		}
	});

	archive.on('error', function (err) {
		return cb(err);
	});

	archive.pipe(output);

	archive
		.glob('./logs/**/*', {
			ignore: ['./logs/'+ignoredFile, './logs/archive.log']
		})
		.finalize();
};