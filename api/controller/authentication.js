var config = require('../config'),
	async = require('async'),
	graph = require('fbgraph'),
	googleapis = require('googleapis'),
	OAuth2 = googleapis.auth.OAuth2,
	crypto = require('crypto'),
	client = require('../service/redis_client'),
	Mailer = require('../service/mailer'),
	User = require('../model/user'),
	Account = require('../model/account'),
	Cache = require('../service/cache');

var setSession = function(user, cb) {
	var headerToken = 'usersession_' + user.id + new Date().getTime();
	client.set(headerToken, user.id, function(err) {
		client.expire(headerToken, (60 * 60 * 24 * 14));
		if (err) return cb(err);
		cb(null, headerToken);
	});
};
exports.setSession = setSession;

exports.get_self = function getSelfUser(req, res, next) {
	if (req.current_user) {
		res.send(200, { user: req.current_user });
	} else {
		res.send(200);
	}
}

var getAvatarObjectFromGoogleUrl = function(googleUrl) {
	var get = function(size) {
		return googleUrl.replace(/sz=[\d]*/, 'sz=' + size);
	};
	return {
		'small': get(50),
		'small@2x': get(100),
		'middle': get(100),
		'middle@2x': get(200),
		'big': get(500),
		'big@2x': get(1000)
	};
};

var loginUserWithUserData = function(userdata, service_name, account_id, callback) {
	var email = userdata.email;
	if (!email) return callback(new Error('Please give an email.'));
	var query = User.find({account_id: account_id}).where('services').elemMatch(function(elem) {
		elem.where('service_name', service_name);
		elem.where('identification', userdata.uid);
	});
	User.findOne(query, function(err, user) {
		if (err) return callback(err);
		if (user) return callback(null, user);
		// if user is not found by his identification, try to find him by his email
		User.findOne({email: email}, function(err, user) {
			if (err) return callback(err);
			if (user) {
				user.services.push({ service_name: service_name, identification: userdata.uid});
				user.save(function(err) {
					if (err) return callback(err);
					callback(null, user);
				});
			} else {
				// if user is not found, create one
				User.create({
					name: userdata.name,
					first_name: userdata.first_name,
					last_name: userdata.last_name,
					email: userdata.email,
					verified: userdata.verified,
					gender: userdata.gender,
					avatar: userdata.avatar,
					services: [{
						service_name: service_name,
						identification: userdata.uid
					}],
					account_id: account_id
				}, function(err, user) {
					if (err) return callback(err);
					callback(null, user);
					Mailer.RegisterConfirmNotification({ user: user }).send();
				});
			}
		})
	});
}
exports.loginUserWithUserData = loginUserWithUserData;

exports.via_fb = function loginViaFB(req, res, next) {
	if (!req.body.authResponse) return res.send(400);
	graph.setAccessToken(req.body.authResponse.accessToken);
	graph.get('me', function(err, fbuser) {
		var userdata = fbuser;
		userdata.uid = fbuser.id;
		loginUserWithUserData(fbuser, 'facebook', req.account._id, function(err, user) {
			if (err) return next(err);
			setSession(user, function(err, sessionid) {
				if (err) return res.send(user);
				res.setHeader('X-PANDA-AUTH-SESSION-ID-SET', sessionid);
				res.send(200, user);
			});
		})
	});
}

exports.via_google = function loginViaGoogle(req, res, next) {
	if (!req.body.authResponse) return res.send(400);
	var oauth2client =
		new OAuth2(config.google.clientId, config.google.clientSecret, '');
	oauth2client.credentials = {
		access_token: req.body.authResponse.access_token
	}
	var _user;
	async.waterfall([
		function(cb) {
			googleapis.discover('plus', 'v1').execute(cb);
		},
		function(client, cb) {
			client.plus.people
				.get({userId: 'me'})
				.withAuthClient(oauth2client)
				.execute(cb);
		},
		function(response, httpres, cb) {
			var userdata = response;
			userdata.uid = response.id;
			userdata.email = response.emails[0] && response.emails[0].value;
			userdata.first_name = response.name && response.name['givenName'];
			userdata.last_name = response.name && response.name['familyName'];
			userdata.name = response.displayName;
			userdata.avatar = response.image && response.image.url && getAvatarObjectFromGoogleUrl(response.image.url);
			loginUserWithUserData(userdata, 'google', req.account._id, cb);
		},
		function(user, cb) {
			_user = user;
			setSession(user, cb);
		}
	], function(err, sessionid) {
		if (err) return res.send(500, err);
		res.setHeader('X-PANDA-AUTH-SESSION-ID-SET', sessionid);
		res.send(_user);
	});
}

exports.via_email = function loginViaEmail(req, res, next) {
	if (!req.body.email) return res.send(400);
	if (!req.body.password) return res.send(400);
	var user,
		wronginputError = {statusCode: 400, msg: 'Wrong username or password'};
	async.waterfall([
		function(cb) {
			User.authenticate(req.body.email, req.body.password, cb);
		},
		function(_user, cb) {
			if (!_user) return cb(wronginputError);
			user = _user;
			setSession(user, cb);
		}
	], function(err, headerToken) {
		if (err) return next(wronginputError);
		res.setHeader('X-PANDA-AUTH-SESSION-ID-SET', headerToken);
		res.send(user);
	});
}

exports.current_user_middleware = function currentUserMIddleware(req, res, next) {
	var auth_token = req.header('X-PANDA-AUTH-SESSION-ID') || req.cookies['X-PANDA-AUTH-SESSION-ID'];
	if (auth_token) {
		client.get(auth_token, function(err, user_id) {
			if (err) return next(err);
			if (user_id) {
				User.findById(user_id, function(err, user) {
					if (user) {
						req.current_user = user;
					}
					next();
				})
			} else { next(); }
		});
	} else { next(); }
}

exports.current_account_middleware = function currentAccountMiddleware(req, res, next) {
    if (req.url.match(/^\api\/info/)) return next();
    if (req.url.match(/^\/api\/login\/email/)) return next();
    if (req.url.match(/^\/api\/user\/me/)) return next();
	function get_referer_url(ref) {
		if (!ref) return null;
		var matches = ref.match(/^https?:\/\/[^\s\/]*/i);
		if (!matches) return null;
		return matches[0];
	}

	function isForwarded() {
		if (req.headers['x-forwarded-for'] && req.headers['x-forwarded-proto'] && req.headers['x-nginx-proxy']) {
			console.log('got url through proxy.');
			return req.headers['x-forwarded-proto'] + '://' + req.headers.host;
		};
		return false;
	}

	var isConfigurationPath = req.url.match(/^\/configuration\.js/),
		host = req.headers.host,
		origin_url = req.headers.origin,
		referer_url = req.headers.referer && req.headers.referer.slice(0, -1),
		url = (isForwarded() ? isForwarded() : (origin_url || get_referer_url(referer_url))),
		regexp = new RegExp('^https?:\/\/(.*)\.' + config.app_url.replace('.', '\.') + '$', 'i'),
		matches = (url && url.match(regexp)),
		query;

	if (req.header && req.header('X-PANDA-ACCOUNT-ID')) {
		query = { _id: req.header('X-PANDA-ACCOUNT-ID') }
	} else if (req.param('account_title')) {
		query = { title: req.param('account_title') };
	} else if (matches && matches.length > 1) {
		query = { title: matches[1] };
	} else if (url) {
		query = { urls: url };
	}
	if (!query && !isConfigurationPath) return res.send(404);
	// var cache_key = 'query:/configuration:' + JSON.stringify(query),
	// 	cached = Cache.get(cache_key);
	// if (cached) {
	// 	req.account = cached;
	// 	return next();
	// }
	Account.findOne(query, function(err, account) {
		if (err) return next(err);
		if (!account && !isConfigurationPath) {
			return res.send(404);
		} else if (query) {
			req.account = account;
			// Cache.set(cache_key, account);
		}
		next();
	});
}

exports.current_cache_middleware = function(req, res, next) {
	if (req.account) {
		req.cache = Cache.acc(req.account.id);
	}
	next();
}
