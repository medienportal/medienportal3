var config = require('../config'),
	mongoose = require('mongoose'),
	async = require('async'),
	PermissionManager = require('../service/permission_manager');
	File = require('../model/file');


var usage = function(req, res, next) {
	if (!PermissionManager.user(req.current_user).account(req.account).isAdmin()) {
		return res.send(403);
	}

	var matchCurrentAccount = {
		$match: {
			account_id: new mongoose.Types.ObjectId(req.account.id)
		}
	};
	var filesizes = {
		$group: {
			_id: '$account_id',
			total: {
				$sum: '$filesize'
			}
		}
	};
	var durations = {
		$group: {
			_id: { $substr: ['$created_at', 0, 7] },
			total: {
				$sum: '$duration'
			}
		}
	};

	async.parallel({
		filesize: function(callback) {
			File.aggregate([matchCurrentAccount, filesizes], callback);
		},
		durations: function(callback) {
			File.aggregate([matchCurrentAccount, durations], callback);
		}
	}, function(err, results) {
		console.log(results);
		if (err) {
			return next(err);
		}
		var _filesize = results.filesize.length > 0 && results.filesize[0].total,
			_durations = results.durations

		var response = {};
		response.usage = {
			filesize: _filesize || 0,
			durations: _durations || []
		};
		var plan = req.account.active_plan;
		if (plan) {
			response.currentPlan = {
				title: plan.title,
				max_media_conversion: plan.max_media_conversion_time || 25 * 60 * 60, // defaults to 25 min
				max_space_available: plan.max_space || 10 * 1024 * 1024, // defaults to 10 Gb
			}
		}
		res.send(response);
	});
}

exports.usage = usage;
