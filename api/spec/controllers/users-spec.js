var config = require('../../config'),
    mongoose = require('mongoose'),
    assert = require('assert'),
	async = require('async'),
    User = require('../../model/user'),
    PasswordResetRequest = require('../../service/password_reset_request'),
    UserCtrl = require('../../controller/users'),
    Cache = require('../../service/cache'),
    client = require('../../service/redis_client'),
    chai = require('chai'),
    expect = chai.expect,
	nonext = function(err) { throw err };

describe('Users Controller', function () {
	var users;
	before(function(done) {
		users = [
				{
					first_name: 'Alexis',
					last_name: 'Rinaldoni',
					name: 'Alexis Rinaldoni',
					email: 'master@desaster.com',
					permissions: {'507f1f77bcf86cd799439011': { admin: false } },
					account_id: '507f1f77bcf86cd799439011'
				},
				{
					first_name: 'Eike',
					last_name: 'Wiewiorra',
					name: 'Eike Wiewiorra',
					email: 'eike.wiewiorra@gmail.com',
					permissions: {'507f1f77bcf86cd799439011': { admin: true } },
					account_id: '507f1f77bcf86cd799439011'
				},
				{
					first_name: 'Eric',
					last_name: 'Ebel',
					name: 'Eric Ebel',
					email: 'info@eric-ebel.de',
					permissions: {'507f1f77bcf86cd799439011': { admin: true } },
					account_id: '507f1f77bcf86cd799439011'
				},
				{
					first_name: 'Tim',
					last_name: 'Jann',
					name: 'Tim Jann',
					email: 'tim.jann@me.com',
					permissions: {'507f1f77bcf86cd799439011': { admin: false } },
					account_id: '507f1f77bcf86cd799439011'
				},
				{
					first_name: 'Christopher',
					last_name: 'Bill',
					name: 'Christopher Bill',
					email: 'christopher.bill@gmail.com',
					permissions: {'507f1f77bcf86cd799439011': { admin: false } },
					account_id: '507f1f77bcf86cd799439011'
				},
				{
					first_name: 'Christiane',
					last_name: 'Hahnsch',
					name: 'Christiane Hahnsch',
					email: 'christiane.hahnsch@example.com',
					permissions: {'507f1f77bcf86cd799439023': { admin: false } },
					account_id: '507f1f77bcf86cd799439023'
				},
				{
					first_name: 'Lisa',
					last_name: 'Basse',
					name: 'Lisa Basse',
					email: 'lisa.basse@malsehen.de',
					permissions: {'507f1f77bcf86cd799439023': { admin: false } },
					account_id: '507f1f77bcf86cd799439023'
				}
			];
		async.map(users, function(item, cb) { User.create(item, cb); }, function(lr, _users) {
			users = _users;
			loggedInUser = new User({
				first_name: 'Alexis',
				last_name: 'Rinaldoni',
				name: 'Alexis Rinaldoni',
				email: 'kuckuck@usersspec.com',
				permissions: { '507f1f77bcf86cd799439011': { admin: true } },
				account_id: '507f1f77bcf86cd799439011'
			});
			loggedInUser.save(done);
		});
	});
	describe('list users', function() {
		var req = {
			account: { id: '507f1f77bcf86cd799439011' },
			body: { user: {
				first_name: 'Neuer erster Name',
				last_name: 'Neuer Nachname',
				name: 'Mein Spitzi',
				permissions: { '507f1f77bcf86cd799439023': { admin: true } },
				account_id: '507f1f77bcf86cd799439023'
			} }
		};
	});
	describe('edit users', function () {
		var req;
		beforeEach(function() {
			req = {
				account: { id: '507f1f77bcf86cd799439011' },
				body: { user: {
					first_name: 'Neuer erster Name',
					last_name: 'Neuer Nachname',
					name: 'Mein Spitzi',
					permissions: { '507f1f77bcf86cd799439023': { admin: true } },
					account_id: '507f1f77bcf86cd799439023'
				} },
				param: function(param_name) { return this._params[param_name]; },
				_params: {}
			}
		});
		it('should be able to edit self if it is not admin', function (done) {
			var user = users[1];
			req.current_user = user;
			req._params['user_id'] = user.id;
			UserCtrl.update(req, { send: function(status, body) {
				expect(status).to.equal(200);
				expect(body).to.have.property('user');
				expect(body.user).to.be.a('object');
				expect(body.user.first_name).to.equal('Neuer erster Name');
				expect(body.user.last_name).to.equal('Neuer Nachname');
				expect(body.user.name).to.equal('Mein Spitzi');
				done();
			} }, nonext);
		});
		it('not admin should not be able to edit its own rights', function (done) {
			var user = users[5];
			req.current_user = user;
			req._params['user_id'] = user.id;
			req.body.user.permissions['507f1f77bcf86cd799439023'] = { admin: true };
			UserCtrl.update(req, { send: function(status, body) {
				expect(status).to.equal(200);
				expect(body.user.permissions).to.exist;
				expect(body.user.permissions['507f1f77bcf86cd799439023']).to.exist;
				expect(body.user.permissions['507f1f77bcf86cd799439023'].admin).to.equal(false);
				done();
			} }, nonext);
		});
		it('admin should not be able to edit its own rights', function (done) {
			var user = users[1];
			req.current_user = user;
			req._params['user_id'] = user.id;
			req.body.user.permissions['507f1f77bcf86cd799439023'] = { admin: false };
			req.body.user.permissions['507f1f77bcf86cd799439011'] = { admin: false };
			UserCtrl.update(req, { send: function(status, body) {
				expect(status).to.equal(200);
				expect(body.user.permissions).to.exist;
				expect(body.user.permissions['507f1f77bcf86cd799439011'].admin).to.equal(true);
				expect(body.user.permissions['507f1f77bcf86cd799439023']).not.to.exist;
				done();
			} }, nonext);
		});
		it('should be able to edit self if it is admin', function (done) {
			var user = loggedInUser;
			req.current_user = user;
			req._params['user_id'] = user.id;
			UserCtrl.update(req, { send: function(status, body) {
				expect(status).to.equal(200);
				expect(body).to.have.property('user');
				expect(body.user).to.be.a('object');
				expect(body.user.first_name).to.equal('Neuer erster Name');
				expect(body.user.last_name).to.equal('Neuer Nachname');
				expect(body.user.name).to.equal('Mein Spitzi');
				done();
			} }, nonext);
		});
		it('should not be able to edit another user if it not is admin', function (done) {
			var user = users[0];
			req.current_user = user;
			req._params['user_id'] = loggedInUser.id;
			UserCtrl.update(req, { send: function(status, body) {
				expect(status).to.equal(403);
				done();
			} }, nonext);
		});
		it('should be able to edit another user from same account if it is admin', function (done) {
			var user = loggedInUser;
			req.current_user = user;
			req._params['user_id'] = user.id;
			UserCtrl.update(req, { send: function(status, body) {
				expect(status).to.equal(200);
				expect(body).to.have.property('user');
				expect(body.user).to.be.a('object');
				expect(body.user.first_name).to.equal('Neuer erster Name');
				expect(body.user.last_name).to.equal('Neuer Nachname');
				expect(body.user.name).to.equal('Mein Spitzi');
				done();
			} }, nonext);
		});
		it('should not be able to edit another user from other account even if it is admin', function (done) {
			var user = loggedInUser;
			req.current_user = user;
			req._params['user_id'] = users[5].id;
			UserCtrl.update(req, { send: function(status, body) {
				expect(status).to.equal(403);
				done();
			} }, nonext);
		});
	});
  describe('update user permissions', function() {
    var req;
    beforeEach(function(done) {
      User.findByIdAndUpdate(loggedInUser.id, {
        $set: {
          permissions: {
            '507f1f77bcf86cd799439011': {
              admin: true
            }
          }
        }
      }, done);
    });
		beforeEach(function() {
			req = {
				account: { id: '507f1f77bcf86cd799439011' },
        current_user: loggedInUser,
				body: {
          permissions: {
            cat08157654: {
              create: true,
              edit: true,
              setControlled: true,
              setPublished: false
            }
          }
        },
				param: function(param_name) { return this.params[param_name]; },
				params: {}
			}
		});
    it('should update user\'s permissions for current account if user is admin', function(done) {
      var user = loggedInUser;
      req.params.user_id = user.id;
      UserCtrl.updatePermissions(req, {
        send: function(status, body) {
          expect(status).to.equal(200);
          User.findById(user.id, function(_err, _user) {
            expect(_err).to.not.exist;
            expect(_user).to.have.property('permissions');
            expect(_user.permissions[req.account.id]).to.deep.equal(req.body.permissions);
            done();
          });
        }
      });
    });
    it('should not update user\'s permissions for current account if user is not admin', function(done) {
      var user = users[4];
      req.params.user_id = user.id;
      req.current_user = user;
      var oldPermissions = user.permissions;
      UserCtrl.updatePermissions(req, {
        send: function(status, body) {
          expect(status).to.equal(403);
          User.findById(user.id, function(_err, _user) {
            expect(_err).to.not.exist;
            expect(_user.permissions).to.deep.equal(oldPermissions);
            done();
          });
        }
      });
    });
    it('should update user\'s permissions for other user for current account if user is admin', function(done) {
      var user = users[5];
      req.params.user_id = user.id;
      UserCtrl.updatePermissions(req, {
        send: function(status, body) {
          expect(status).to.equal(200);
          User.findById(user.id, function(_err, _user) {
            expect(_err).to.not.exist;
            expect(_user).to.have.property('permissions');
            expect(_user.permissions[req.account.id]).to.deep.equal(req.body.permissions);
            done();
          });
        }
      });
    });
    it('should not update user\'s permissions for other user for current account if user is not admin', function(done) {
      var user = users[6];
      req.params.user_id = user.id;
      req.current_user = users[4]; // Billy user, as is not admin
      var oldPermissions = user.permissions;
      UserCtrl.updatePermissions(req, {
        send: function(status, body) {
          expect(status).to.equal(403);
          User.findById(user.id, function(_err, _user) {
            expect(_err).to.not.exist;
            expect(_user.permissions).to.deep.equal(oldPermissions);
            done();
          });
        }
      });
    });
  });
	describe('create user', function() {
		var req;
    var i = 0;
		beforeEach(function() {
      i++;
			req = {
				body: {
					user: {
						first_name: 'Alexis',
						last_name: 'Rinaldoni',
						email: 'test123' + i + '@test456.de'
					}
				},
				account: { id: '507f1f77bcf86cd799439011' }
			}
		});
		it('should create a user if all info is available', function(done) {
			var res = { send: function(status, body) {
				expect(status).to.equal(200);
				expect(body).to.have.property('user');
				expect(body.user).to.have.property('first_name');
				expect(body.user).to.have.property('last_name');
				expect(body.user).to.have.property('email');
				expect(body.user).to.have.property('created_at');
				done();
			} };
			UserCtrl.create(req, res, nonext);
		});
		it('should respond with an error if email is not given', function(done) {
			req.body.user.email = undefined;
			var res = { send: function(status, body) {
				expect(status).to.equal(400);
				expect(body).to.not.have.property('user');
				expect(body).to.have.property('error');
				expect(body.error).to.equal('Email is required.');
				done();
			} };
			UserCtrl.create(req, res, nonext);
		});
		it('should respond with an error if first_name is not given', function(done) {
			req.body.user.first_name = undefined;
			var res = { send: function(status, body) {
				expect(status).to.equal(400);
				expect(body).to.not.have.property('user');
				expect(body).to.have.property('error');
				expect(body.error).to.equal('Name is required.');
				done();
			} };
			UserCtrl.create(req, res, nonext);
		});
		it('should respond with an error if email is already taken', function(done) {
			req.body.user.email = 'master@desaster.com';
			var res = { send: function(status, body) {
				expect(status).to.equal(400);
				expect(body).to.not.have.property('user');
				expect(body).to.have.property('error');
				expect(body.error).to.equal('Email is already taken.');
				done();
			} };
			UserCtrl.create(req, res, nonext);
		});
        it('should respond with an error if email is already taken in another account', function(done) {
            req.account = { id: '507f1f77bcf86cd799439023' };
            req.body.user.email = 'master@desaster.com';
            var res = { send: function(status, body) {
                expect(status).to.equal(400);
                expect(body).to.not.have.property('user');
                expect(body).to.have.property('error');
                expect(body.error).to.equal('Email is already taken.');
                done();
            } };
            UserCtrl.create(req, res, nonext);
        });
		it('should set a password if a password was given', function(done) {
			var password = 'test456';
			req.body.user.password = password;
			var res = {
				send: function(status, body) {
					expect(status).to.equal(200);
					expect(body).to.have.property('user');
					expect(body.user).to.have.property('first_name');
					expect(body.user).to.have.property('last_name');
					expect(body.user).to.have.property('email');
					expect(body.user).to.have.property('password');
					expect(body.user).to.have.property('created_at');
					User.authenticate(req.body.user.email, password, function(_err, _user) {
						expect(_err).not.to.exist;
						expect(_user).to.exist;
						expect(_user).to.have.property('password');
						expect(_user.id).to.equal(_user.id);
						done();
					});
				},
				setHeader: function(key, val) {
					expect(key).to.equal('X-PANDA-AUTH-SESSION-ID-SET');
					expect(val).to.exist;
				}
			};
			UserCtrl.create(req, res, nonext);
		});
	});
	describe('reset password', function() {
		describe('request a password reset', function() {
			var req = {
				account: { id: '507f1f77bcf86cd799439011' },
				cache: Cache.acc('507f1f77bcf86cd799439011'),
				body: {},
				param: function(param_name) { return this._params[param_name]; },
				_params: {}
			};
			it('should return a 400 if no user email is given', function(done) {
				req.current_user = undefined;
				req.body.email = undefined;
				UserCtrl.requestPwReset(req, { send: function(status, body) {
					expect(status).to.equal(400);
					expect(body).to.not.exist;
					done();
				} }, nonext);
			});
			it('should not be able to request a password reset if logged in', function(done) {
				var user = loggedInUser;
				req.current_user = user;
				req.body.email = users[0].email;
				UserCtrl.requestPwReset(req, { send: function(status, body) {
					expect(status).to.equal(403);
					done();
				} }, nonext);
			});
			it('should generate a password_reset_request code', function(done) {
				req.current_user = undefined;
				req.body.email = users[0].email;
				var res = {
					send: function(status, body) {
						expect(status).to.equal(200);
						done();
					}
				}
				UserCtrl.requestPwReset(req, res, nonext);
			});
			it('should return a status 200 if user does not exist', function(done) {
				req.current_user = undefined;
				req.body.email = 'dieseemail@existiert.nicht';
				var res = {
					send: function(status, body) {
						expect(status).to.equal(200);
						done();
					}
				}
				UserCtrl.requestPwReset(req, res, nonext);
			});
		});
		describe('actually reset the password', function() {
			var req, user, i = 0, token;
			beforeEach(function(done) {
				req = {
					account: { id: '507f1f77bcf86cd799439011' },
					body: {
						newpassword: 'mynewpassword123',
						newpassword_repeat: 'mynewpassword123',
					},
					param: function(param_name) { return this._params[param_name]; },
					_params: {}
				};
				req.cache = Cache.acc(req.account.id);
				user = users[i];
				PasswordResetRequest.createTokenForId(user.id, function(_err, _token) {
					if (_err) throw _err;
					token = _token;
					req.body.token = token;
					i++;
					done();
				});
			});
			it('should have the right function', function() {
				expect(UserCtrl).to.have.property('resetPW');
			});
			it('should return a 403 if user is logged in', function(done) {
				req.current_user = users[0];
				UserCtrl.resetPW(req, { send: function(status, body) {
					expect(status).to.equal(403);
					expect(body).to.not.exist;
					done();
				} }, nonext);
			});
			it('should return a 400 if no password is given', function(done) {
				req.body.newpassword = undefined;
				UserCtrl.resetPW(req, { send: function(status, body) {
					expect(status).to.equal(400);
					expect(body).to.not.exist;
					done();
				} }, nonext);
			});
			it('should return a 400 if passwords do not match', function(done) {
				req.body.newpassword = 'test123';
				req.body.newpassword_repeat = 'test456';
				UserCtrl.resetPW(req, { send: function(status, body) {
					expect(status).to.equal(400);
					expect(body).to.not.exist;
					done();
				} }, nonext);
			});
			it('should return a 400 if no token is given', function(done) {
				req.body.token = undefined;
				UserCtrl.resetPW(req, { send: function(status, body) {
					expect(status).to.equal(400);
					expect(body).to.not.exist;
					done();
				} }, nonext);
			});
			it('should return a 400 if the wrong token was given', function(done) {
				req.body.token = 'abcd';
				UserCtrl.resetPW(req, { send: function(status, body) {
					expect(status).to.equal(400);
					expect(body).to.not.exist;
					done();
				} }, nonext);
			});
			it('should return a 200 and change pw if everything is OK', function(done) {
				UserCtrl.resetPW(req, { send: function(status, body) {
					expect(status).to.equal(200);
					expect(body).to.not.exist;
					User.authenticate(user.email, 'mynewpassword123', function(_err, _user) {
						expect(_err).not.to.exist;
						expect(_user).to.exist;
						expect(_user).to.have.property('password');
						expect(_user.id).to.equal(user.id);
						var key = '__pw_request_token_' + token;
						setTimeout(function() {
							client.get(key, function(__err, __id) {
								expect(__err).not.to.exist;
								expect(__id).not.to.exist;
								done();
							});
						}, 500);
					});
				} }, nonext);
			});
		});
	});
});
