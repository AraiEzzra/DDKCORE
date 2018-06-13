/*
* Helper module for parsing git commit information
*
* @class git.js
*/

let childProcess = require('child_process');

/**
 * Return hash of last git commit if available
 * @memberof module:helpers
 * @function
 * @return {String} Hash of last git commit
 * @throws {Error} Throws error if cannot get last git commit
 */
function getLastCommit () {
	let spawn = childProcess.spawnSync('git', ['rev-parse', 'HEAD']);
	let err = spawn.stderr.toString().trim();

	if (err) {
		throw new Error(err);
	} else {
		return spawn.stdout.toString().trim();
	}
}

module.exports = {
	getLastCommit: getLastCommit
};

/*************************************** END OF FILE *************************************/
