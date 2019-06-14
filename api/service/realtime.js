var config = require('../config'),
	Pusher = require('pusher');

var realtime = {
	_pusher: new Pusher({
		appId: config.pusher.app_id,
		key: config.pusher.app_key,
		secret: config.pusher.app_secret
	}),

	triggerEvent: function(channelname, eventname, payload, callback) {
		if (!realtime._pusher) return callback(new Error('Pusher not instantiated.'));
        if (!callback) callback = function() {};
		realtime._pusher.trigger(channelname, eventname, payload, callback);
	}
}

module.exports = realtime;
