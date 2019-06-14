var Trivia = require('../model/trivia'),
	async = require('async');

exports.list = function(req, res, next) {
	Trivia.find({ account_id: req.account.id }, function(err, trivias) {
		if (err) return next(err);
		res.send(200, { trivias: trivias });
	});
}

exports.create = function(req, res, next) {
	if (!req.body.trivia) return res.send(400, { error: 'Trivia data required.' });
	if (!req.body.trivia.content) return res.send(400, { error: 'Trivia data required.' });
	if (!req.current_user || !PermissionManager.user(req.current_user).account(req.account).isAdmin()) return res.send(403);
	req.body.trivia.account_id = req.account.id;
	Trivia.create(req.body.trivia, function(err, trivia) {
		if (err) return next(err);
		res.send(200, { trivia: trivia });
	});
}

exports.delete = function(req, res, next) {
	if (!req.param('trivia_id')) return res.send(400, { error: 'Please provide trivia id' });
	if (!req.current_user || !PermissionManager.user(req.current_user).account(req.account).isAdmin()) return res.send(403);
	Trivia.findOneRemove({ _id: req.param('trivia_id'), account_id: req.account.id }, function(err, trivia) {
		if (err) return next(err);
		res.send(200, { trivia: trivia });
	});
}

exports.update = function(req, res, next) {
	if (!req.body.trivia || !req.body.trivia.content) return res.send(400, { error: 'Please provide trivia content' });
	if (!req.param('trivia_id')) return res.send(400, { error: 'Please provide trivia id' });
	if (!req.current_user || !PermissionManager.user(req.current_user).account(req.account).isAdmin()) return res.send(403);
	Trivia.update({ _id: req.param('trivia_id') }, { $set: { content: req.body.trivia.content } }, function(err, num, trivia) {
		if (err) return next(err);
		res.send(200);
	});
}
