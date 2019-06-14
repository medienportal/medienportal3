/*
 * This middleware handles errors.
 * Error messages are handled via shortCodes. Every Shortcode can be set to a full message for the user on the client.
 *
 */
var config = require('../config');

var getShortCodeForStatus = function(status) {
	switch (status) {
		case 500:
			return 'internalError';
		case 400:
			return 'badRequest';
		case 403:
			return 'forbidden';
		case 404:
			return 'notFound';
		default:
			return 'unknown';
	}
}

var getMessageForShortCode = function(shortCode) {
	switch (shortCode) {
		case 'internalError':
			return 'An Internal Server Error occured. We have been notified about the problem.';
		case 'badRequest':
			return 'Bad request. Server cannot answer.';
		case 'noAccount':
			return 'This site does not exist.';
		case 'forbidden':
			return 'You are not allowed to access this resource.';
		case 'notFound':
			return 'The resource has not been found';
		default:
			return 'An unknown error occured.';
	}
}

module.exports = function errorHandlingMiddleware(err, req, res, next) {
	if (err) {
		if (err instanceof Error) return next(err);
		if (typeof err === 'string') return next(err);
		if (!err.status) return next(err);
		if (!err.shortCode) err.shortCode = getShortCodeForStatus(err.status);
		if (!err.message) err.message = getMessageForShortCode(err.shortCode);
		res.send(err.status, { shortCode: err.shortCode, message: err.message });
	} else {
		next();
	}
}