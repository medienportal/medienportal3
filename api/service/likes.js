var async = require('async'),
    Realtime = require('../service/realtime'),
	Activity = require('../model/activity');

exports.addLikeFunction = function(Model) {
	var param_name = Model.modelName.toLowerCase() + '_id';
	return function likeModel(req, res, next) {
		if (!req.param(param_name)) return res.send(400);
		var userid, user;
		if (req.current_user) {
			userid = req.current_user.id;
			user = {
				author_type: 'panda',
				author_id: req.current_user.id
			};
		} else {
			userid = 'custom:' + req.connection.remoteAddress;
		}
		async.waterfall([
			function(cb) {
				Model.findById(req.param(param_name), cb);
			},
			function(model, cb) {
				if (!model) return cb(new Error(Model.modelName + ' not found!'));
				if (Model.modelName === 'Page' && model.status !== 'PUBLISHED') return cb(new Error(Model.modelName + ' must be published to get like.'));
				if (model.likes.indexOf(userid) > -1) {
					Model.findByIdAndUpdate(req.param(param_name), { $pull: { likes: userid } }, cb);
				} else {
					Model.findByIdAndUpdate(req.param(param_name), { $push: { likes: userid } }, cb);
				}
			},
            function(model) {
                var cb = arguments[arguments.length - 1];
                Model.findById(req.param(param_name), cb);
            }], function(err, model) {
        		var activity;
        		if (err) return next(err);
        		result = {};
        		result[Model.modelName.toLowerCase()] = model;
        		if (user && req.account) {
        			activity = new Activity({
        				account_id: req.account.id,
        				trigger: user,
        				targets: [{ item_id: req.param(param_name), file_id: req.param('file_id') }],
        				type: 'like'
        			});
        			activity.save(function(err, _activity) {
                        if (!err && _activity) Realtime.triggerEvent('activities', 'create', { activity: _activity }, function() {});
                    });
					result.activity = activity;
				}
				res.send(200, result);
			});
	}
}
