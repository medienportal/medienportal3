'use strict';

var RealTimeService = function($rootScope, $cookies, DataCache, Module, Activity) {
	var rt = this;

	this._pusher = null;
	this._authEndpoint = window.api_endpoint + '/pusher/auth.json';
	this._channels = {};


	this.init = function() {
		if (!window.Pusher) {
			console.warn('Pusher could not be loaded.');
			return;
		}
		if (!configuration.pusher) {
			return;
		}
		this._pusher = new window.Pusher(configuration.pusher.key, {
			authEndpoint: this._authEndpoint,
			auth: {
				headers: {
					'X-PANDA-AUTH-SESSION-ID': $cookies.get('X-PANDA-AUTH-SESSION-ID')
				}
			}
		});
		this.initActivityEvents();
	};

	this.initModuleEventsForPage = function(page) {
		if (!page || !page.id) {
			throw 'Page is not valid.';
		}
		var pusher = this._pusher;
		if (!pusher) {
			return console.error('pusher not initiated!');
		}
		var channelname = 'private-modules-page-' + page.id;

		if (this._channels[channelname] !== undefined) {
			return;
		}

		var channel = pusher.subscribe(channelname);
		this._channels[channel.name] = channel;
		channel.bind('pusher:subscription_error', function(status) {
			console.error(status);
		});
		channel.bind('client-update', (data) => {
			if (data && data.module && data.module._id) {
				var module = DataCache.modules.filter(function(mod) {
					return mod.id === data.module._id;
				})[0];
				module.update(data.module);
				if (!$rootScope.$$phase) { $rootScope.$apply(); }
			}
		});
	};

	this.initActivityEvents = function() {
		var pusher = this._pusher;
		if (!pusher) {
			throw 'pusher not initiated.';
		}
		var channel = pusher.subscribe('activities');
		channel.bind('pusher:subscription_error', function(status) { console.error(status); });
		channel.bind('create', function(data) {
			if (data && data.activity) {
				DataCache.activities[data.activity._id] = new Activity(data.activity);
				if (!$rootScope.$$phase) { $rootScope.$apply(); }
			}
		});
	};

	this.triggerClientEvent = function(channelname, eventname, payload) {
		var channel = this._channels[channelname];
		if (!channel) {
			return;
		}
		if (!channelname) {
			throw 'not subscribed to channel ' + channelname;
		}
		channel.trigger('client-' + eventname, payload);
	};

	return rt;
};

export default RealTimeService;
