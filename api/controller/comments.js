var async = require('async'),
	Comment = require('../model/comment'),
	Cache = require('../service/cache'),
	PermissionManager = require('../service/permission_manager');

exports.list = function CommentList(req, res, next) {
	if (!req.account) return res.send(400);
	var cached_result = req.cache.getRoute('/comments');
	if (cached_result) {
		return res.send(cached_result);
	}
	Comment.find({account_id: req.account.id}, function(err, comments) {
		if (err) return next(err);
		req.cache.setRoute('/comments', { comments: comments });
		res.send(200, { comments: comments });
	});
}

exports.report = function CommentReport(req, res, next) {
	if (!req.param('comment_id')) return res.send(400, { error: 'Comment id is missing.' });
	Comment.findByIdAndUpdate(req.param('comment_id'), { $set: { reported: true } }, function(err, num) {
		if (err) return next(err);
		if (num < 1) return res.send(404, { error: 'Comment does not exist.' });
		res.send(200);
	});
}

exports.unreport = function CommentReport(req, res, next) {
	if (!req.param('comment_id')) return res.send(400, { error: 'Comment id is missing.' });
	if (!req.current_user || !PermissionManager.user(req.current_user).account(req.account).isAdmin()) {
		return res.send(403, { error: 'You are not allowed to unreport comments.' });
	}
	Comment.findByIdAndUpdate(req.param('comment_id'), { $set: { reported: true } }, function(err, num) {
		if (err) return next(err);
		if (num < 1) return res.send(404, { error: 'Comment does not exist.' });
		res.send(200);
	});
}

exports.secure = function CommentSecure(req, res, next) {

}