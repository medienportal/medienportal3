var config = require('../config'),
	client = require('../service/redis_client'),
	Mailer = require('../service/mailer'),
	Account = require('../model/account'),
	User = require('../model/user');

var guid = (function() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
               .toString(16)
               .substring(1);
  }
  return function() {
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
           s4() + '-' + s4() + s4() + s4();
  };
})();

// JS Class
var PasswordResetRequest = function PasswordResetRequest(options) {
};

PasswordResetRequest.createTokenForId = function(id, callback) {
	if (!id) return callback(new Error('no id given'));
	var token = guid();
	var key = '__pw_request_token_' + token;
	client.set(key, id, function(err) {
		if (err) return callback(err);
		client.expire(key, (60 * 60 * 24), function(err) {
			if (err) return callback(err);
			callback(null, token);
		});
	});
};

PasswordResetRequest.getUserForToken = function(token, callback) {
	var key = '__pw_request_token_' + token;
	client.get(key, function(err, id) {
		if (err) return callback(err);
		if (!id) return callback(new Error('Token Does Not Exist'));
		User.findById(id, callback);
	});
};

PasswordResetRequest.deleteToken = function(token, callback) {
	var key = '__pw_request_token_' + token;
	client.del(key, callback);
};

PasswordResetRequest.sendNotification = function(user, token, callback) {
	if (!callback) {
		callback = function(err) { if (err) { console.error(err); } }
	}
	Account.findById(user.account_id, function(err, account) {
		if (err) {
			return callback(err);
		}
		if (!account) {
			return callback(new Error('User has no corresponding mp account.'));
		}
		var link = account.getCompleteUrl() + '/user/password/recover/' + token;
		Mailer.PasswordRequestNotification({ user: user, link: link }).send(callback);
	});
};

module.exports = PasswordResetRequest;
