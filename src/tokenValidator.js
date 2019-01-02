

let jwt = require('jsonwebtoken');

/**
 * @desc verify token validation
 * @implements {jwt.verify}
 * @param {Object} req 
 * @param {Object} res 
 * @param {function} next
 * @param {string} jwtSecret
 * @return {function} next
 */
module.exports = function (req, res, next, jwtSecret) {
	let token = req.body.token || req.query.token || req.headers['x-access-token'];
	if (token) {
		jwt.verify(token, jwtSecret, function (err, decoded) {
			if (err) {
				return res.send({
					error: true,
					message: err
				});
			}
			req.decoded = decoded;
			next();
		});
	} else {
		return res.status(204).send({
			error: true,
			message: 'No Token Provided'
		});
	}
};

/*************************************** END OF FILE *************************************/
