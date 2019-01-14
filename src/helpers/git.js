/*
 * Helper module for parsing git commit information
 *
 * @class git.js
 */

const childProcess = require('child_process');

/**
 * Return hash of last git commit if available
 * @memberof module:helpers
 * @function
 * @return {String} Hash of last git commit
 * @throws {Error} Throws error if cannot get last git commit
 */
function getLastCommit() {
    const spawn = childProcess.spawnSync('git', ['rev-parse', 'HEAD']);
    const err = spawn.stderr.toString().trim();

    if (err) {
        throw new Error(err);
    } else {
        return spawn.stdout.toString().trim();
    }
}

module.exports = {
    getLastCommit
};

/** ************************************* END OF FILE ************************************ */
