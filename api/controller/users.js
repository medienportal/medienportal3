var async = require('async'),
	streamBuffers = require('stream-buffers'),
	User = require('../model/user'),
	Cache = require('../service/cache'),
	Mailer = require('../service/mailer'),
	File = require('../model/file'),
	AuthenticationCtrl = require('../controller/authentication'),
	temp = require('temp'),
	fs = require('fs'),
	events = require('events'),
	PasswordResetRequest = require('../service/password_reset_request');

// ToDo: Only give the modules needed in order to build
// the given pages to not use unneeded bandwidth
exports.list = function UserList(req, res, next) {
	var cached_result = req.cache.getRoute('/users');
	if (cached_result) {
		return res.send(cached_result);
	}
	User.find({}, function(err, users) {
		if (err) return next(err);
		req.cache.setRoute('/users', { users: users });
		res.send({users: users});
	});
};

exports.getOne = function UserGetOne(req, res, next) {
	var user_id = req.param('user_id');
	if (!user_id) return res.send(400);
	User.findById(user_id, function(err, user) {
		if (err) return next(err);
		if (!user) return res.send(404);
		res.send({user: user});
	});
};

exports.create = function UserUpdate(req, res, next) {
	if (!req.body.user) return res.send(400);
	if (!req.account) return res.send(400, {error: 'Account id is required.'});
	if (!req.body.user.email) return res.send(400, {error: 'Email is required.'});
	if (!req.body.user.first_name) return res.send(400, {error: 'Name is required.'});
	var password = req.body.user.password;
	delete req.body.user.id;  // do net set own id
	delete req.body.user._id;
	delete req.body.user.password;
	req.body.user.account_id = req.account.id;
	// get User from user_id to check if account is right one
	User.create(req.body.user, function(_err, _user) {
		if (_err) {
	        if (_err.name === 'MongoError' && _err.errmsg.match(/duplicate key error/)) {
	            return res.send(400, { error: 'Email is already taken.' });
	        }
	    }
		Mailer.RegisterConfirmNotification({ user: _user }).send();
		if (password) {
			_user.setPassword(password, function(__err, __user) {
				if (__err) next(__err);
				if (!req.current_user) { // log in user
					AuthenticationCtrl.setSession(_user, function(__err, headerToken) {
						// ignore __err
						res.setHeader('X-PANDA-AUTH-SESSION-ID-SET', headerToken);
						res.send(200, { user: __user });
					});
				} else {
					res.send(200, { user: __user });
				}
			});
		} else {
			res.send(200, { user: _user });
			_user.index();
		}
	});
};

exports.update = function UserUpdate(req, res, next) {
	var user_id = req.param('user_id');
	if (!req.body.user) return res.send(400);
	if (!user_id) return res.send(400);
	delete req.body.user.id;  // do net set own id
	delete req.body.user._id;
	delete req.body.user.password;
	// get User from user_id to check if account is right one
	User.findById(user_id, function(err, user) {
		if (err) return next(err);
		if (!user) return res.send(404);
		// check if user to be updated is self.
		if (req.current_user.id.toString() !== user.id.toString()) {
			return res.send(403);
		}
		delete req.body.user.permissions;
		User.findByIdAndUpdate(user.id, { $set: req.body.user }, function(err, _user) {
			if (err) return next(err);
			User.findById(user.id, function(__err, __user) {
				if (__err) return next(__err);
				res.send(200, { user: __user });
				__user.index();
			});
		});
	});
};

exports.updatePermissions = function UserUpdate(req, res, next) {
	var user_id = req.param('user_id');
	if (!req.body.permissions) return res.send(400);
	if (!user_id) return res.send(400);
	// get User from user_id to check if account is right one
	User.findById(user_id, function(err, user) {
		if (err) return next(err);
		if (!user) return res.send(404);
		if (!req.current_user.permissions ||
				!req.current_user.permissions[req.account.id] ||
				req.current_user.permissions[req.account.id].admin !== true) {
			return res.send(403);
		}
		var query = {
			$set: {
			}
		};
		query.$set['permissions.' + req.account.id] = req.body.permissions;
		User.findByIdAndUpdate(user.id, query, function(err, _user) {
			if (err) return next(err);
			User.findById(user.id, function(__err, __user) {
				if (__err) return next(__err);
				res.send(200, { user: __user });
				__user.index();
			});
		});
	});
};

exports.setAvatar = function userAvatar(req, res, next) {
	var user_id = req.param('user_id');
	if (!user_id) {
		return res.send(400, 'No user id');
	}
	// get User from user_id to check if account is right one
	User.findById(user_id, function(err, user) {
		if (err) {
			return next(err);
		}
		if (!user) {
			return res.send(404);
		}
		// check if user to be updated is self.
		// if not, check if user has special rights (admin) to edit foreign users
		if (req.current_user.id.toString() !== user.id.toString()) {
			if (user.account_id.toString() !== req.current_user.account_id.toString()) return res.send(403);
		}

		var saveFile = function(file) {
			console.log('file saved');
			console.log(arguments);
			user.avatar = {
				type: 'file',
				file_id: file.id,
				versions: file.versions
			};
			user.save(function(err, user) {
				if (err) {
					return next(err);
				}
				res.send(200, { user: user });
				user.index();
			});
		};

		if (req.param('base64')) {

			// create stream from base64 String
			var components = req.param('base64').split(';base64,');
			var base64ImageString;
			if (!components.length < 2) {
				base64ImageString = components[0];
			} else {
				base64ImageString = components[1];
			}
			var readableBase64Stream = new streamBuffers.ReadableStreamBuffer({
			    frequency: 10,      // in milliseconds.
			    chunkSize: 2048     // in bytes.
			});
			readableBase64Stream.put(base64ImageString, 'base64');

			var emitter = new events.EventEmitter();
			File.fromStream(readableBase64Stream, {
				filename: 'avatar',
				mimetype: 'image/png',
				private: true,
				user: req.current_user,
				account: req.account,
				emitter: emitter
			});
			console.log('emitter: ', emitter);
			emitter.once('finished', function(err, file) {
				if (err) {
					return next(err);
				}
				saveFile(file);
			});
		} else {
			File.fromRequest(req, { private: true }).once('finished', function(err, file) {
				if (err) {
					return next(err);
				}
				saveFile(file);
			});
		}
	});
}

exports.requestPwReset = function(req, res, next) {
	if (req.current_user) return res.send(403);
	if (!req.body.email) return res.send(400);
	User.findOne({ 'email': req.body.email }, function(err, user) {
		if (err) { return next(err); }
		if (!user) { return res.send(200); }
		PasswordResetRequest.createTokenForId(user._id, function(_err, _token) {
			if (_err) { return next(_err); }
			PasswordResetRequest.sendNotification(user, _token);
			res.send(200);
		});
	});
}

exports.resetPW = function(req, res, next) {
	if (req.current_user) return res.send(403);
	if (!req.body.newpassword) return res.send(400);
	if (req.body.newpassword !== req.body.newpassword_repeat) return res.send(400);
	if (!req.body.token) return res.send(400);
	PasswordResetRequest.getUserForToken(req.body.token, function(_err, _user) {
		if (_err && _err.message === 'Token Does Not Exist') return res.send(400);
		if (_err) return next(_err);
		if (!_user) return res.send(400);
		_user.setPassword(req.body.newpassword, function(__err, __user) {
			if(__err) return next(__err);
			res.send(200);
			PasswordResetRequest.deleteToken(req.body.token);
			req.cache.invalidateRoute('/users/' + _user.id);
		});
	});
}
