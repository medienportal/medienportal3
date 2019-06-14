var async = require('async')
, Message = require('../model/message');

exports.list = function MessageList(req, res, next) {
	if (!req.current_user) return res.send(401);
	Message.find(
		{ $or: [{to_user_id: req.current_user.id}, {from_user_id: req.current_user.id}] },
		function(err, messages) {
			if (err) return next(err);
			res.send({messages: messages});
	});
}

exports.create = function MessageCreate(req, res, next) {
	if (!req.body.message) return req.send(400);
	if (!req.current_user) return req.send(401);
	delete req.body.message.id;  // do net set own id
	delete req.body.message._id;
	req.body.message.from_user_id = req.current_user.id;
	Message.create(req.body.message, function(err, message) {
		if (err) return next(err);
		res.send(200, message);
	});
}

exports.read = function MessageRead(req, res, next) {
	if (!req.param('message_id')) return req.send(400);
	if (!req.current_user) return req.send(401);
	Message.findOneAndUpdate({_id: req.param('message_id'), to_user_id: req.current_user.id}, { read: (new Date()) }, function(err, message) {
		if (err) return next(err);
		if (!message) res.send(404);
		res.send(200, message);
	});
}