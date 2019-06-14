var Realtime = require('../service/realtime'),
	Page = require('../model/page'),
	PermissionManager = require('../service/permission_manager');

var realtime = {
	authentication: function(req, res, next) {
		var socketId = req.body.socket_id,
			channel = req.body.channel_name;
		if (channel.match(/^private-modules-page-(.*)$/)) {
			realtime.authenticateModuleForPage(req, res, next);
		}
	},

	authenticateModuleForPage: function(req, res, next) {
		var socketId = req.body.socket_id,
			channel = req.body.channel_name,
			pageId = channel.replace('private-modules-page-', '');
			user = req.current_user;

		if (!user) return res.send(403);

		Page.find({
			_id: pageId
		}, function(err, page) {
			if (err) return next(err);
			if (!page) return res.send(404);
			if (page &&
					(PermissionManager.user(user).account(req.account).isAdmin() ||
						user.isAuthorOf(page) ||
						PermissionManager.user(user).can('edit', page))) {
				return res.send(Realtime._pusher.auth(socketId, channel));
			}
			return res.send(403);
		});
	}
}

module.exports = realtime;