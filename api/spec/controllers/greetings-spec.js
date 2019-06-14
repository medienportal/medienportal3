var Page = require('../../model/page'),
	User = require('../../model/user'),
	Greeting = require('../../model/greeting'),
	Activity = require('../../model/activity'),
	GreetingsCtrl = require('../../controller/greetings'),
	Cache = require('../../service/cache'),
	async = require('async');

	describe('list greetings', function() {
		var req, loggedInUser, page, page2;
		before(function(done) {
			req = {
				param: function(name) { return this.params[name]; },
				params: { },
				connection: { remoteAddress: '127.0.0.1' },
				body: {}
			}
			loggedInUser = new User({
				first_name: 'Alexis',
				last_name: 'Rinaldoni',
				name: 'Alexis Rinaldoni',
				email: 'luke.skywalker@greetingsspec.com',
				permissions: {
					'507f1f77bcf86cd799439011': {
						admin: true
					}
				},
				account_id: '507f1f77bcf86cd799439011'
			});
			loggedInUser.save(done);
		});
		before(function(done) {
			var greetings = [
				{
					content: 'Hallo, bin ein Testkommentar',
					author: { author_type: 'custom', author_id: 'Tester' },
					account_id: '507f1f77bcf86cd799439013'
				},
				{
					content: 'Hallo, bin ein zweiter Testkommentar',
					author: { author_type: 'custom', author_id: 'Tester' },
					account_id: '507f1f77bcf86cd799439013'
				},
				{
					content: 'Hallo, bin der letzte Testkommentar',
					author: { author_type: 'custom', author_id: 'Tester' },
					account_id: '507f1f77bcf86cd799439013'
				},
				{
					content: 'Hallo, bin ein Testkommentar',
					author: { author_type: 'custom', author_id: 'Tester' },
					account_id: '507f1f77bcf86cd799439011'
				},
				{
					content: 'Hallo, bin ein Testkommentar',
					author: { author_type: 'custom', author_id: 'Tester' },
					account_id: '507f1f77bcf86cd799439011'
				}
			];
			async.map(greetings, function(item, cb) { Greeting.create(item, cb); }, done);
		})
		it('returns a 400 if no account id is given for greetings listing', function(done) {
			req.account = undefined;
			GreetingsCtrl.list(req, { send: function(status, body) {
				expect(status).to.equal(400);
				expect(body).not.to.exist;
				done();
			} }, nonext);
		});
		it('should only return greetings of a given account', function(done) {
			req.account = { id: '507f1f77bcf86cd799439013', _id: '507f1f77bcf86cd799439013' }
			req.cache = Cache.acc(req.account.id);
			GreetingsCtrl.list(req, { send: function(status, body) {
				expect(status).to.equal(200);
				expect(body).to.exist;
				expect(body).to.have.property('greetings');
				expect(body.greetings).to.be.a('Array');
				expect(body.greetings.length).to.equal(3);
				body.greetings.forEach(function(greeting) {
					expect(greeting.account_id.toString()).to.equal('507f1f77bcf86cd799439013');
				});
				done();
			} }, nonext);
		})
	});
	describe('create greetings', function() {
		var req;
		beforeEach(function() {
			req = {
				param: function(name) { return this.params[name]; },
				body: { greeting: { content: 'test test test' } },
				account: { id: '4cdfb11e1f3c000000007822' },
				headers: { 'user-agent': 'Panda Test 0.2' },
				params: { },
				connection: { remoteAddress: '127.0.0.1' }
			}
		});
		describe('with a logged in user', function() {

			before(function(done) {
				User.create({
					first_name: 'Alexis',
					last_name: 'Rinaldoni',
					name: 'Alexis Rinaldoni',
					email: 'iamyourfather@greetingsspec.com',
					permissions: {
						'a1b2c3': {
							admin: true
						}
					},
					account_id: 'a1b2c3'
				}, function(_err, _user) {
					if (_err) throw _err;
					loggedInUser = _user;
					done();
				});
			});
			describe('creation', function() {
				it('should create a greeting if all info is given', function (done) {
					req.current_user = loggedInUser;
					var res = {
						send: function(status, body) {
							expect(status).to.equal(200);
							expect(body).to.have.property('greeting');
							expect(body.greeting.content).to.equal('test test test');
							expect(body.greeting).to.have.property('author');
							expect(body.greeting.author.author_type).to.equal('panda');
							expect(body.greeting.author.author_id).to.equal(loggedInUser._id.toString());
							done();
						}
					};
					GreetingsCtrl.create(req, res, done);
				});
				it('should create an Activity when a greeting is created', function (done) {
					req.current_user = loggedInUser;
					var res = {
						send: function(status, body) {
							expect(status).to.equal(200);
							expect(body.activity).to.exist;
							expect(body.activity.type).to.equal('greeting');
							expect(body.activity.targets.length).to.equal(1);
							expect(body.activity.targets[0].greeting_id.toString()).to.equal(body.greeting._id.toString());
							done();
						}
					};
					GreetingsCtrl.create(req, res, done);
				});
				it('should not create a greeting if no content', function (done) {
					req.current_user = loggedInUser;
					req.body.greeting.content = undefined;
					var res = {
						send: function(status, body) {
							expect(status).to.equal(400);
							expect(body).to.not.exist;
							done();
						}
					};
					GreetingsCtrl.create(req, res, done);
				});
				it('should not create no account is given', function (done) {
					req.current_user = loggedInUser;
					req.account = undefined;
					var res = {
						send: function(status, body) {
							expect(status).to.equal(400);
							expect(body).to.not.exist;
							done();
						}
					};
					GreetingsCtrl.create(req, res, done);
				});
			});
			describe('removal', function() {
				var newGreeting;
				beforeEach(function(done) {
					req.account = { id: '4cdfb11e1f3c000000007822' };
					GreetingsCtrl.create(req, { send: function(st, bdy) { newGreeting = bdy.greeting; done(); } }, nonext);
				});
				it('should be able to remove a greeting if admin', function(done) {
					req.current_user = loggedInUser;
					req.current_user.permissions['4cdfb11e1f3c000000007822'] = { admin: true };
					req.params['greeting_id'] = newGreeting.id;
					var res = {
						send: function(status, body) {
							expect(status).to.equal(200);
							Greeting.findById(newGreeting.id, function(err, greeting) {
								expect(err).not.to.exist;
								expect(greeting).not.to.exist;
								done();
							});
						}
					}
					GreetingsCtrl.remove(req, res, nonext);
				});
				it('should not be able to remove a greeting if not admin', function(done) {
					req.current_user = loggedInUser;
					req.current_user.permissions['4cdfb11e1f3c000000007822'] = { admin: false };
					req.params['greeting_id'] = newGreeting.id;
					var res = {
						send: function(status, body) {
							expect(status).to.equal(403);
							Greeting.findById(newGreeting.id, function(err, greeting) {
								expect(err).not.to.exist;
								expect(greeting).to.exist;
								expect(greeting.id.toString()).to.equal(newGreeting.id.toString());
								done();
							});
						}
					}
					GreetingsCtrl.remove(req, res, nonext);
				});
			});
		});
		describe('with an anonymous user', function() {
			it('should create a greeting if all info is given', function (done) {
				var res = {
					send: function(status, body) {
						expect(status).to.equal(200);
						expect(body).to.have.property('greeting');
						expect(body.greeting.content).to.equal('test test test');
						expect(body.greeting).to.have.property('author');
						expect(body.greeting.author.author_type).to.equal('custom');
						expect(body.greeting.author.author_id).to.equal('Gast');
						done();
					}
				};
				GreetingsCtrl.create(req, res, done);
			});
			it('should create a greeting with a custom author name', function (done) {
				req.body.greeting.author = { author_id: 'Mein Eigener Name' };
				var res = {
					send: function(status, body) {
						expect(status).to.equal(200);
						expect(body).to.have.property('greeting');
						expect(body.greeting.content).to.equal('test test test');
						expect(body.greeting).to.have.property('author');
						expect(body.greeting.author.author_type).to.equal('custom');
						expect(body.greeting.author.author_id).to.equal('Mein Eigener Name');
						done();
					}
				};
				GreetingsCtrl.create(req, res, done);
			});
			it('should not create a greeting if no content', function (done) {
				req.body.greeting.content = undefined;
				var res = {
					send: function(status, body) {
						expect(status).to.equal(400);
						expect(body).to.not.exist;
						done();
					}
				};
				GreetingsCtrl.create(req, res, done);
			});
			it('should not create no account is given', function (done) {
				req.account = undefined;
				var res = {
					send: function(status, body) {
						expect(status).to.equal(400);
						expect(body).to.not.exist;
						done();
					}
				};
				GreetingsCtrl.create(req, res, done);
			});
		});
	});
