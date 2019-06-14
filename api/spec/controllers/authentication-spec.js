var config = require('../../config'),
	mongoose = require('mongoose'),
	assert = require('assert'),
	Account = require('../../model/account'),
	User = require('../../model/user'),
	Account = require('../../model/account');
	AuthenticationCtrl = require('../../controller/authentication'),
	chai = require('chai'),
	expect = chai.expect,
	nores = { send: function() { console.log(arguments); throw 'should not have been called!'; } },
	nonext = function() { console.log(arguments); throw 'should not have been called!'; };

describe('Authentication Controller', function () {
	var newAccount1,
		newAccount2,
		req;
	beforeEach(function(done) {
		if (process.env.NODE_ENV != 'test') throw "not in test environment!";
		req = {
			headers: {},
			param: function(p) {
				return this._params[p];
			},
			_params: {},
			url: ''
		};
		mongoose.connect(config.mongo.db, {}, function() {
			User.remove(function(err) {
				if (err) throw err;
				Account.remove(done);
			})
		});
	});
	beforeEach(function(done) {
		newAccount1 = new Account({
			title: 'account1',
			name: 'First Account',
			urls: ['http://account1.com', 'http://dasmedienportal.de']
		});
		newAccount2 = new Account({
			title: 'account2',
			name: 'Second Account',
			urls: ['http://account2.com', 'http://mport.al']
		});
		newAccount1.save(function(err, c1) {
			if (err) return done(err);
			newAccount2.save(done);
		});
	});
	describe('Account detection', function() {
		it('should get right account for right official subdomain as origin', function(done) {
			req.headers.origin = 'http://account1.medienportal.de';
			AuthenticationCtrl.current_account_middleware(req, nores, function() {
				expect(req).to.have.property('account');
				expect(req.account.id).to.equal(newAccount1.id);
				done();
			});
		})
		it('should get right account for right custom domain as origin', function(done) {
			req.headers.origin = 'http://mport.al';
			AuthenticationCtrl.current_account_middleware(req, nores, function() {
				expect(req).to.have.property('account');
				expect(req.account.id).to.equal(newAccount2.id);
				done();
			});
		});
		it('should get right account for right official subdomain as referer', function(done) {
			req.headers.referer = 'http://account1.medienportal.de/';
			AuthenticationCtrl.current_account_middleware(req, nores, function() {
				expect(req).to.have.property('account');
				expect(req.account.id).to.equal(newAccount1.id);
				done();
			});
		});
		it('should get right account for right official subdomain as referer with path', function(done) {
			req.headers.referer = 'http://account1.medienportal.de/meineseite/a1b2c3';
			AuthenticationCtrl.current_account_middleware(req, nores, function() {
				expect(req).to.have.property('account');
				expect(req.account.id).to.equal(newAccount1.id);
				done();
			});
		});
		it('should get right account for right custom domain as referer', function(done) {
			req.headers.referer = 'http://mport.al/';
			AuthenticationCtrl.current_account_middleware(req, nores, function() {
				expect(req).to.have.property('account');
				expect(req.account.id).to.equal(newAccount2.id);
				done();
			});
		});
		it('should get the right account when given with ?account_id', function(done) {
			req._params = { 'account_title': 'account1' };
			AuthenticationCtrl.current_account_middleware(req, nores, function() {
				expect(req).to.have.property('account');
				expect(req.account._id.toString()).to.equal(newAccount1._id.toString());
				done();
			});
		});
		it('should return a 404 if no account with id is found', function(done) {
			var res = {
				send: function(status) {
					expect(status).to.equal(404);
					done();
				}
			}
			AuthenticationCtrl.current_account_middleware(req, res, nonext);
		});
		it('should return a 404 if no origin and no ?account_id is given', function(done) {
			var res = {
				send: function(status) {
					expect(status).to.equal(404);
					done();
				}
			}
			AuthenticationCtrl.current_account_middleware(req, res, nonext);
		});
		it('should not return a 404 if the request path is the configuration file', function(done) {
			req.url = '/configuration.js'
			req.headers.origin = "http://blablablagibtsnicht";
			AuthenticationCtrl.current_account_middleware(req, nores, function() {
				expect(req.account).not.to.exist;
				done();
			});
		});
	});
	describe('Login with Social Media', function() {
		describe('Via Facebook', function() {
			describe('should login if the user already exists', function() {
				it('recognizes via the user\'s email address', function(done) {
					var userData = {
						uid: "987965431215",
						email: "alexis@rinaldoni.net",
						name: "Alexis Rinaldoni",
						first_name: "Alexis",
						last_name: "Rinaldoni",
						picture: "http://my.facebook.picture.jpg",
						gender: "male",
						locale: "de"
					};
					AuthenticationCtrl.loginUserWithUserData(userData, 'facebook', 'account123456', function(_err, _user) {
						expect(_err).to.not.exist;
						expect(_user).to.exist;
						expect(_user.email).to.equal('alexis@rinaldoni.net');
						expect(_user.first_name).to.equal('Alexis');
						expect(_user.last_name).to.equal('Rinaldoni');
						expect(_user.services[0].service_name).to.equal('facebook');
						expect(_user.services[0].identification).to.equal('987965431215');
						expect(_user.account_id).to.equal('account123456');
						done();
					});
				});
				it('does add the user\'s facebook id if recognized via email', function(done) {
					User.create({
						first_name: "Alexis",
						last_name: "Rinaldoni",
						email: "alexis@rinaldoni.net",
						account_id: "account123456"
					}, function(err, _user) {
						expect(err).not.to.exist;
						if (err) return done();
						var userData = {
							uid: "987965431215",
							email: "alexis@rinaldoni.net",
							name: "Alexis Rinaldoni",
							given_name: "Alexis",
							family_name: "Rinaldoni",
							picture: "http://my.google.picture.jpg",
							gender: "male",
							locale: "de"
						};
						AuthenticationCtrl.loginUserWithUserData(userData, 'facebook', 'account123456', function(_err, __user) {
							expect(_err).to.not.exist;
							expect(_user._id.toString()).to.equal(__user._id.toString());
							done();
						});
					});
				});
				it('recognizes via the user\'s facebook id', function(done) {
					User.create({
						first_name: 'Alexis',
						last_name: 'Rinaldoni',
						email: 'alexis@rinaldoni.net',
						account_id: 'account123456',
						services: [
							{
								service_name: 'facebook',
								identification: '987965431215'
							}
						]
					}, function(_err, _user) {
						expect(_err).to.not.exist;
						var userData = {
							uid: "987965431215",
							email: "alexis@rinaldoni.net",
							name: "Alexis Rinaldoni",
							given_name: "Alexis",
							family_name: "Rinaldoni",
							picture: "http://my.facebook.picture.jpg",
							gender: "male",
							locale: "de"
						};
						AuthenticationCtrl.loginUserWithUserData(userData, 'facebook', 'account123456', function(__err, __user) {
							expect(__err).to.not.exist;
							expect(_user._id.toString()).to.equal(__user._id.toString());
							done();
						});
					});
				});
			});
			it('should add the user if the user is not registered', function(done) {
				var userData = {
					uid: "987965431215",
					email: "alexis@rinaldoni.net",
					name: "Alexis Rinaldoni",
					given_name: "Alexis",
					family_name: "Rinaldoni",
					picture: "http://my.google.picture.jpg",
					gender: "male",
					locale: "de"
				};
				AuthenticationCtrl.loginUserWithUserData(userData, 'facebook', 'account123456', function(_err, __user) {
					expect(_err).to.not.exist;
					User.find({}, function(_err, _users) {
						expect(_users.length).to.equal(1);
						done();
					});
				});
			});
		});
		describe('Via Google', function() {
			describe('should login if the user already exists', function() {
				it('recognizes via the user\'s email address', function(done) {
					var userData = {
						uid: "1234567654312",
						email: "alexis.rinaldoni@gmail.com",
						name: "Alexis Rinaldoni",
						first_name: "Alexis",
						last_name: "Rinaldoni",
						picture: "http://my.google.picture.jpg",
						gender: "male",
						locale: "de"
					};
					AuthenticationCtrl.loginUserWithUserData(userData, 'google', 'account123456', function(_err, _user) {
						expect(_err).to.not.exist;
						expect(_user).to.exist;
						expect(_user.email).to.equal('alexis.rinaldoni@gmail.com');
						expect(_user.first_name).to.equal('Alexis');
						expect(_user.last_name).to.equal('Rinaldoni');
						expect(_user.services[0].service_name).to.equal('google');
						expect(_user.services[0].identification).to.equal('1234567654312');
						expect(_user.account_id).to.equal('account123456');
						done();
					});
				});
				it('does add the user\'s google id if recognized via email', function(done) {
					User.create({
						first_name: "Alexis",
						last_name: "Rinaldoni",
						email: "alexis.rinaldoni@gmail.com",
						account_id: "account123456"
					}, function(err, _user) {
						expect(err).not.to.exist;
						if (err) return done();
						var userData = {
							id: "1234567654312",
							email: "alexis.rinaldoni@gmail.com",
							name: "Alexis Rinaldoni",
							given_name: "Alexis",
							family_name: "Rinaldoni",
							picture: "http://my.google.picture.jpg",
							gender: "male",
							locale: "de"
						};
						AuthenticationCtrl.loginUserWithUserData(userData, 'google', 'account123456', function(_err, __user) {
							expect(_err).to.not.exist;
							expect(_user._id.toString()).to.equal(__user._id.toString());
							done();
						});
					});
				});
				it('recognizes via the user\'s google id', function(done) {
					User.create({
						first_name: 'Alexis',
						last_name: 'Rinaldoni',
						email: 'alexis.rinaldoni@gmail.com',
						account_id: 'account123456',
						services: [
							{
								service_name: 'google',
								identification: '1234567654312'
							}
						]
					}, function(_err, _user) {
						expect(_err).to.not.exist;
						var userData = {
							id: "1234567654312",
							email: "alexis.rinaldoni@gmail.com",
							name: "Alexis Rinaldoni",
							given_name: "Alexis",
							family_name: "Rinaldoni",
							picture: "http://my.google.picture.jpg",
							gender: "male",
							locale: "de"
						};
						AuthenticationCtrl.loginUserWithUserData(userData, 'google', 'account123456', function(__err, __user) {
							expect(__err).to.not.exist;
							expect(_user._id.toString()).to.equal(__user._id.toString());
							done();
						});
					});
				});
			});
			it('should add the user if the user is not registered', function(done) {
				var userData = {
					id: "1234567654312",
					email: "alexis.rinaldoni@gmail.com",
					name: "Alexis Rinaldoni",
					given_name: "Alexis",
					family_name: "Rinaldoni",
					picture: "http://my.google.picture.jpg",
					gender: "male",
					locale: "de"
				};
				AuthenticationCtrl.loginUserWithUserData(userData, 'google', 'account123456', function(_err, __user) {
					expect(_err).to.not.exist;
					User.find({}, function(_err, _users) {
						expect(_users.length).to.equal(1);
						done();
					});
				});
			});
		});
	});
});
