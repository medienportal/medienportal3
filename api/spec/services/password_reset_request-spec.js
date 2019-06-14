var config = require('../../config'),
	mongoose = require('mongoose'),
	assert = require('assert'),
	PasswordResetRequest = require('../../service/password_reset_request'),
	User = require('../../model/user'),
	Account = require('../../model/account'),
	async = require('async'),
	chai = require('chai'),
	expect = chai.expect,
	client = require('../../service/redis_client');

describe('Password Reset Request service', function() {
	var user, account;
	before(function(done) {
		account = new Account({
			name: 'Password Request Account',
			title: 'password_request_account_spec_acc',
			config: {}
		});

		user = new User({
			first_name: 'Alexis',
			last_name: 'Rinaldoni',
			name: 'Alexis Rinaldoni',
			email: 'master@pwrequest.spec',
			rightmanagment: { '*': { '*': false } },
			account_id: account.id
		});

		async.series([
			function(cb) { account.save(cb); },
			function(cb) { user.save(cb) }
		], done);
	});
	describe('manage user keys', function() {
		it('should have a getUserForToken function', function() {
			expect(PasswordResetRequest).to.have.property('getUserForToken');
			expect(PasswordResetRequest).to.have.property('createTokenForId');
			expect(PasswordResetRequest).to.have.property('sendNotification');
			expect(PasswordResetRequest).to.have.property('deleteToken');
		});
		it('should create a key for an id', function(done) {
			var id = user.id;
			PasswordResetRequest.createTokenForId(id, function(err, token) {
				expect(err).not.to.exist;
				expect(token).to.exist;
				PasswordResetRequest.getUserForToken(token, function(_err, _user) {
					expect(_err).not.to.exist;
					expect(_user).to.exist;
					expect(_user._id.toString()).to.equal(id.toString());
					done();
				});
			});
		});
		it('should retrieve a key for an id', function(done) {
			var id = user.id;
			var token = 'p82mc4z58923n4m895oudno3485n38o452fu28o34p';
			var key = '__pw_request_token_' + token;
			client.set(key, id, function(err) {
				expect(err).not.to.exist;
				client.expire(key, (60 * 60 * 24), function(_err) {
					expect(_err).not.to.exist;
					PasswordResetRequest.getUserForToken(token, function(__err, __user) {
						expect(__err).not.to.exist;
						expect(__user._id.toString()).to.equal(id.toString());
						done();
					});
				});
			});
		});
		it('should be able to delete a token', function(done) {
			var id = 'blablabla';
			PasswordResetRequest.createTokenForId(id, function(err, token) {
				expect(err).not.to.exist;
				expect(token).to.exist;
				PasswordResetRequest.deleteToken(token, function(_err) {
					expect(_err).not.to.exist;
					var key = '__pw_request_token_' + token;
					client.get(key, function(__err, __id) {
						expect(__err).not.to.exist;
						expect(__id).not.to.exist;
						done();
					});
				});
			});
		});
		describe('sending token mail', function() {
			var token = 'abc-def-ghi-jkl',
				mail_response;
			before(function(done) {
				PasswordResetRequest.sendNotification(user, token, function(_err, _email) {
					if (_err) throw _err;
					mail_response = _email;
					done();
				});
			});
			it('should send the email to the right recipient', function() {
				var to = mail_response.envelope.to;
				expect(to.length).to.equal(1);
				expect(to[0]).to.equal('master@pwrequest.spec');
			});
		});
	});
});
