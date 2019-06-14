var async = require('async'),
	Account = require('../model/account'),
	PermissionManager = require('./permission_manager');

exports.makeTopstoryFunction = function(Model) {
    var model_name = Model.modelName.toLowerCase();
	var param_name = model_name + '_id';
	return function makeModelTopstory(req, res, next) {
		if (!req.param(param_name)) return res.send(400);
		if (!req.current_user) return res.send(401);
		if (!PermissionManager.user(req.current_user).account(req.account).isAdmin()) return res.send(403);
		Account.update({ _id: req.account.id }, { $set: { 'config.private.topstory': model_name + ':' + req.param(param_name) } }, function(err, acc) {
			if (err) return next(err);
			res.send(200);
		});
	}
}
