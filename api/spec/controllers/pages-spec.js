var config = require('../../config'),
    mongoose = require('mongoose'),
    assert = require('assert'),
	async = require('async'),
    Page = require('../../model/page'),
    Activity = require('../../model/activity'),
    Module = require('../../model/module'),
    User = require('../../model/user'),
    Account = require('../../model/account'),
    PageCtrl = require('../../controller/pages'),
    Cache = require('../../service/cache'),
    chai = require('chai'),
    expect = chai.expect,
	nonext = function(err) { throw err; };

describe('Pages Controller', function () {
	var newPage, loggedInUser, account;
	before(function(done) {
		account = new Account({
			name: "Gymnasium Delitzsch",
			title: "delitzsch",
			urls: ["mport.al", "gymnasium-delitzsch"]
		})
		account.save(done);
	});
	beforeEach(function(done) {
		process.env.NODE_ENV = 'test';
	    mongoose.connect(config.mongo.db, {}, function() {
	        Page.remove(done);
	    });
	});
	beforeEach(function(done) {
		Page.create({
			title: 'test Page',
			account_id: '507f1f77bcf86cd799439019',
			category_id: '507f1f77bcf86cd799439015',
			status: 'PUBLISHED'
		}, function(err, page) {
			if (err) throw err;
			newPage = page;
			done();
		});
	});

	describe('liking', function () {
		it('has addLike function', function () {
			expect(PageCtrl).to.have.property('addLike');
			expect(PageCtrl.addLike).to.be.a('function');
		});
		describe('liking', function () {
			var req;
			beforeEach(function() {
				req = {
					param: function(name) { return this.params[name]; },
					params: { page_id: newPage.id },
					connection: { remoteAddress: '127.0.0.1' },
					account: { id: '507f1f77bcf86cd799439019' }
				}
			});
			describe('with a logged in user', function() {

				before(function(done) {
					User.create({
						first_name: 'Alexis',
						last_name: 'Rinaldoni',
						name: 'Alexis Rinaldoni',
						email: 'darth.vador@pagesspec.com',
						permissions: { '507f1f77bcf86cd799439019': { admin: true } },
						account_id: '507f1f77bcf86cd799439019'
					}, function(_err, _user) {
						if (_err) throw _err;
						loggedInUser = _user;
						done();
					});
				});

				it('should add a like', function (done) {
					req.current_user = loggedInUser;
					var res = {
						send: function(status, body) {
							expect(status).to.equal(200);
							expect(body).to.have.property('page');
							expect(body.page.likes.length).to.equal(1);
							expect(body.page.likes[0]).to.equal(loggedInUser.id);
							done();
						}
					};
					PageCtrl.addLike(req, res, done);
				});
				it('should create an activity', function (done) {
					req.current_user = loggedInUser;
					var res = {
						send: function(status, body) {
							expect(status).to.equal(200);
							expect(body).to.have.property('activity');
							expect(body.activity.type).to.equal('like');
							expect(body.activity.trigger.author_type).to.equal('panda');
							expect(body.activity.trigger.author_id.toString()).to.equal(loggedInUser.id.toString());
							expect(body.activity.targets.length).to.equal(1);
							expect(body.activity.targets[0].item_id.toString()).to.equal(body.page.id.toString());
							done();
						}
					};
					PageCtrl.addLike(req, res, done);
				});
				it('should remove a like', function (done) {
					req.current_user = loggedInUser;
					var res = {
						send: function(status, body) {
							expect(status).to.equal(200);
							expect(body).to.have.property('page');
							expect(body.page.likes.length).to.equal(0);
							done();
						}
					};
					PageCtrl.addLike(req, { send: function(status) {
						expect(status).to.equal(200);
						PageCtrl.addLike(req, res, function(_err) { throw _err; });
					} }, function(_err) { throw _err; });
				});
			});
			describe('with an anonymous user', function() {
				var notAdminUser;
				before(function(done) {
					User.create({
						first_name: 'Alexis',
						last_name: 'Rinaldoni',
						name: 'Alexis Rinaldoni',
						email: 'anikyn.skywalker@pagesspec.com',
						permissions: { '507f1f77bcf86cd799439019': { admin: false } },
						account_id: '507f1f77bcf86cd799439019'
					}, function(_err, _user) {
						if (_err) throw _err;
						loggedInUser = _user;
						done();
					});
				});
				it('should add a like', function (done) {
					var res = {
						send: function(status, body) {
							expect(status).to.equal(200);
							expect(body).to.have.property('page');
							expect(body.page.likes.length).to.equal(1);
							expect(body.page.likes[0]).to.equal('custom:127.0.0.1');
							done();
						}
					};
					PageCtrl.addLike(req, res, done);
				});
				it('should remove a like', function (done) {
					req.current_user = notAdminUser;
					var res = {
						send: function(status, body) {
							expect(status).to.equal(200);
							expect(body).to.have.property('page');
							expect(body.page.likes.length).to.equal(0);
							done();
						}
					};
					PageCtrl.addLike(req, { send: function(status) {
						expect(status).to.equal(200);
						PageCtrl.addLike(req, res, function(_err) { throw _err; });
					} }, function(_err) { throw _err; });
				});
			});
		});
	});
	describe('make topstory', function() {
		it('has makeTopstory function', function () {
			expect(PageCtrl).to.have.property('makeTopstory');
			expect(PageCtrl.addLike).to.be.a('function');
		});
		it('should return a 400 error if no page_id is given', function() {
			var req = {
				account: account,
				param: function(name) { return this.params[name]; },
				params: { }
			}
			PageCtrl.makeTopstory(req, { send: function(status, body) {
				expect(status).to.equal(400);
			} }, nonext);
		});
		it('should return a 401 error if user is not logged in', function() {
			var req = {
				account: account,
				param: function(name) { return this.params[name]; },
				params: { }
			}
			PageCtrl.makeTopstory(req, { send: function(status, body) {
				expect(status).to.equal(400);
			} }, nonext);
		});
		it('should return a 403 error if user is not admin is given', function() {
			var req = {
				account: account,
				param: function(name) { return this.params[name]; },
				params: { },
				current_user: new User({ permissions: {} })
			}
			PageCtrl.makeTopstory(req, { send: function(status, body) {
				expect(status).to.equal(400);
			} }, nonext);
		});
		it('should make a story topstory', function() {
			var req = {
				account: account,
				param: function(name) { return this.params[name]; },
				params: { page_id: newPage.id },
				current_user: new User({ permissions: {} })
			};
			req.current_user.permissions[account.id] = { admin: true };
			PageCtrl.makeTopstory(req, { send: function(status, body) {
				expect(status).to.equal(200);
			} }, nonext);
		});
	});
	describe('commenting', function () {
		var req;
		beforeEach(function() {
			req = {
				param: function(name) { return this.params[name]; },
				body: { comment: { content: 'test test test' } },
				account: { id: '4cdfb11e1f3c000000007822' },
				headers: { 'user-agent': 'Panda Test 0.2' },
				params: { page_id: newPage.id },
				connection: { remoteAddress: '127.0.0.1' }
			}
		});
		describe('with a logged in user', function() {

			before(function(done) {
				User.create({
					first_name: 'Alexis',
					last_name: 'Rinaldoni',
					name: 'Alexis Rinaldoni',
					email: 'loggedinusersecret@secretpage.com',
					permissions: { '507f1f77bcf86cd799439019': { admin: true } },
					account_id: '507f1f77bcf86cd799439019'
				}, function(_err, _user) {
					if (_err) throw _err;
					loggedInUser = _user;
					done();
				});
			});
			describe('creation', function() {
				it('should create a comment if all info is given', function (done) {
					req.current_user = loggedInUser;
					var res = {
						send: function(status, body) {
							expect(status).to.equal(200);
							expect(body).to.have.property('page');
							expect(body.page.comments.length).to.equal(1);
							expect(body.page._id.toString()).to.equal(req.param('page_id'));
							expect(body.page.comments[0]).to.exist;
							expect(body).to.have.property('comment');
							expect(body.comment.content).to.equal('test test test');
							expect(body.comment).to.have.property('author');
							expect(body.comment.author.author_type).to.equal('panda');
							expect(body.comment.author.author_id).to.equal(loggedInUser._id.toString());
							done();
						}
					};
					PageCtrl.createComment(req, res, done);
				});
				it('should create an activity when commenting', function (done) {
					req.current_user = loggedInUser;
					var res = {
						send: function(status, body) {
							expect(status).to.equal(200);
							expect(body.activity).to.exist;
							expect(body.activity.type).to.equal('comment');
							expect(body.activity.targets.length).to.equal(1);
							expect(body.activity.targets[0].item_id.toString()).to.equal(body.page._id.toString());
							expect(body.activity.trigger.author_type).to.equal('panda');
							expect(body.activity.trigger.author_id).to.equal(loggedInUser.id);
							expect(body.activity.targets[0].comment_id.toString()).to.equal(body.comment._id.toString());
							done();
						}
					};
					PageCtrl.createComment(req, res, done);
				});
				it('should not create a comment if page is not published.', function(done) {
					req.current_user = loggedInUser;
					var res = {
						send: function(status, body) {
							expect(status).to.equal(403);
							done();
						}
					};
					Page.create({
						title: 'test Page',
						account_id: '507f1f77bcf86cd799439019',
						category_id: '507f1f77bcf86cd799439015'
					}, function(err, page) {
						expect(err).not.to.exist;
						req.params.page_id = page.id;
						PageCtrl.createComment(req, res, done);
					})
				});
				it('should not create a comment if no content', function (done) {
					req.current_user = loggedInUser;
					req.body.comment.content = undefined;
					var res = {
						send: function(status, body) {
							expect(status).to.equal(400);
							expect(body).to.not.exist;
							done();
						}
					};
					PageCtrl.createComment(req, res, done);
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
					PageCtrl.createComment(req, res, done);
				});
			});
			describe('removal', function() {
				var newComment;
				beforeEach(function(done) {
					req.account = { id: newPage.account_id };
					PageCtrl.createComment(req, { send: function(st, bdy) { newComment = bdy.comment; done(); } }, nonext);
				});
				it('should be able to remove a comment if admin', function(done) {
					req.current_user = loggedInUser;
					req.current_user.permissions[req.account.id] = { admin: true };
					req.params['comment_id'] = newComment.id;
					req.params['page_id'] = newPage.id;
					var res = {
						send: function(status, body) {
							expect(status).to.equal(200);
							expect(body).to.have.property('page');
							expect(body.page.comments.length).to.equal(0);
							done();
						}
					}
					PageCtrl.removeComment(req, res, nonext);
				});
				it('should not be able to remove a comment if not admin', function(done) {
					req.current_user = loggedInUser;
					req.current_user.permissions[req.account.id] = { admin: false };
					req.params['comment_id'] = newComment.id;
					req.params['page_id'] = newPage.id;
					var res = {
						send: function(status, body) {
							expect(status).to.equal(403);
							done();
						}
					}
					PageCtrl.removeComment(req, res, nonext);
				});
                it('should remove corresponding activity when removing a comment', function(done) {
                    req.current_user = loggedInUser;
					req.current_user.permissions[req.account.id] = { admin: true };
					req.params['comment_id'] = newComment.id;
					req.params['page_id'] = newPage.id;
					var res = {
						send: function(status, body) {
                            setTimeout(function() {
                                Activity.find({
                                    "type": "comment",
                                    "targets.comment_id": req.params['comment_id']
                                }, function(err, activities) {
                                    expect(status).to.equal(200);
                                    expect(activities.length).to.equal(0);
        							done();
                                });
                            }, 500);
						}
					}
					PageCtrl.removeComment(req, res, nonext);
				});
			});
		});
		describe('with an anonymous user', function() {
			it('should create a comment if all info is given', function (done) {
				var res = {
					send: function(status, body) {
						expect(status).to.equal(200);
						expect(body).to.have.property('page');
						expect(body.page.comments.length).to.equal(1);
						expect(body.page._id.toString()).to.equal(req.param('page_id'));
						expect(body.page.comments[0]).to.exist;
						expect(body).to.have.property('comment');
						expect(body.comment.content).to.equal('test test test');
						expect(body.comment).to.have.property('author');
						expect(body.comment.author.author_type).to.equal('custom');
						expect(body.comment.author.author_id).to.equal('Gast');
						done();
					}
				};
				PageCtrl.createComment(req, res, done);
			});
			it('should create a comment with a custom author name', function (done) {
				req.body.comment.author = { author_id: 'Mein Eigener Name' };
				var res = {
					send: function(status, body) {
						expect(status).to.equal(200);
						expect(body).to.have.property('page');
						expect(body.page.comments.length).to.equal(1);
						expect(body.page._id.toString()).to.equal(req.param('page_id'));
						expect(body.page.comments[0]).to.exist;
						expect(body).to.have.property('comment');
						expect(body.comment.content).to.equal('test test test');
						expect(body.comment).to.have.property('author');
						expect(body.comment.author.author_type).to.equal('custom');
						expect(body.comment.author.author_id).to.equal('Mein Eigener Name');
						done();
					}
				};
				PageCtrl.createComment(req, res, done);
			});
			it('should create an activity when commenting', function (done) {
					req.body.comment.author = { author_id: 'Mein Eigener Name' };
					var res = {
						send: function(status, body) {
							expect(status).to.equal(200);
							expect(body.activity).to.exist;
							expect(body.activity.type).to.equal('comment');
							expect(body.activity.targets.length).to.equal(1);
							expect(body.activity.targets[0].item_id.toString()).to.equal(body.page._id.toString());
							expect(body.activity.trigger.author_type).to.equal('custom');
							expect(body.activity.trigger.author_id).to.equal('Mein Eigener Name');
							expect(body.activity.targets[0].comment_id.toString()).to.equal(body.comment._id.toString());
							done();
						}
					};
					PageCtrl.createComment(req, res, done);
				});
			it('should not create a comment if no content', function (done) {
				req.body.comment.content = undefined;
				var res = {
					send: function(status, body) {
						expect(status).to.equal(400);
						expect(body).to.not.exist;
						done();
					}
				};
				PageCtrl.createComment(req, res, done);
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
				PageCtrl.createComment(req, res, done);
			});
		});
	});
    describe('find a page', function() {
        var req, loggedInUser, i = 0;
		beforeEach(function(done) {
			req = {
				param: function(name) { return this.params[name]; },
				params: { page_id: newPage.id },
				connection: { remoteAddress: '127.0.0.1' },
                account: { id: '507f1f77bcf86cd799439011' },
				cache: Cache.acc('507f1f77bcf86cd799439011'),
				body: {}
			}
			loggedInUser = new User({
				first_name: 'Alexis',
				last_name: 'Rinaldoni',
				name: 'Alexis Rinaldoni',
				email: 'thetesternumberOneMasterOfAll' + i + '@mastermind.com',
				permissions: { '507f1f77bcf86cd799439011': { admin: true } },
				account_id: '507f1f77bcf86cd799439011'
			});
            i++;
			loggedInUser.save(done);
		});
        it('should return a 400 if page id is not supplied', function(done) {
            req.params = {};
            PageCtrl.getOne(req, { send: function(status, body) {
				expect(status).to.equal(400);
				expect(body).not.to.exist;
				done();
			} }, nonext);
        });
        it('should return a 404 if page id does not exist', function(done) {
            req.params = { page_id: '507f1f77bcf86cd799439011' };
            PageCtrl.getOne(req, { send: function(status, body) {
				expect(status).to.equal(404);
				expect(body).not.to.exist;
				done();
			} }, nonext);
        });
        it('should return a 404 if page id is total bullshit', function(done) {
            req.params = { page_id: 'thisIsTotalBullshitForeverShitYeKnow' };
            PageCtrl.getOne(req, { send: function(status, body) {
				expect(status).to.equal(404);
				expect(body).not.to.exist;
				done();
			} }, nonext);
        });
        it('should return the correct page if all is OK', function(done) {
            PageCtrl.getOne(req, {
                send: function(status, body) {
                    expect(status).to.equal(200);
                    expect(body).to.exist;
                    expect(body).to.have.property('page');
                    expect(body.page.title).to.equal(newPage.title);
                    done();
                }
            }, nonext);
        });
    });
	describe('create a page', function() {
		var req, loggedInUser;
        var i = 0;
		beforeEach(function(done) {
            i++;
			req = {
				param: function(name) { return this.params[name]; },
				params: { page_id: newPage.id },
				connection: { remoteAddress: '127.0.0.1' },
				body: {}
			}
			loggedInUser = new User({
				first_name: 'Alexis',
				last_name: 'Rinaldoni',
				name: 'Alexis Rinaldoni',
				email: 'thetesternumber' + i + '@me.com',
				permissions: { '507f1f77bcf86cd799439011': { admin: true } },
				account_id: '507f1f77bcf86cd799439011'
			});
			loggedInUser.save(done);
		});
		it('returns a 401 if user is not logged in', function(done) {
			PageCtrl.create(req, { send: function(status, body) {
				expect(status).to.equal(401);
				expect(body).not.to.exist;
				done();
			} }, nonext);
		});
		it('returns a 400 if no collection is given', function(done) {
			req.current_user = loggedInUser;
			PageCtrl.create(req, { send: function(status, body) {
				expect(status).to.equal(400);
				expect(body).not.to.exist;
				done();
			} }, nonext);
		});
		it('returns a 403 if user hast not \'create\' right', function(done) {
			req.current_user = new User({
				permissions: {
					'507f1f77bcf86cd799439011': {
						admin: false,
						'cat1z4723ui': {
							delete: true
						}
					}
				}
			});
			req.body.page = { title: 'My New Page', category_id: 'cat1z4723ui', status: 'RELEASED' };
			req.account = { _id: '507f1f77bcf86cd799439011' };
			PageCtrl.create(req, { send: function(status, body) {
				expect(status).to.equal(403);
				expect(body).not.to.exist;
				done();
			} }, nonext);
		});
		it('should not be able to set the pages status on creation', function(done) {
			req.current_user = new User({
				permissions: {
					'507f1f77bcf86cd799439011': {
						admin: false,
						'cat1z4723ui': {
							create: true
						}
					}
				}
			});
			req.body.page = { title: 'My New Page', category_id: 'cat1z4723ui', status: 'RELEASED' };
			req.account = { _id: '507f1f77bcf86cd799439011', id: '507f1f77bcf86cd799439011' };
			PageCtrl.create(req, { send: function(status, body) {
				expect(status).to.equal(200);
				expect(body.page).to.exist;
				expect(body.page.title).to.equal('My New Page');
				expect(body.page.status).to.not.exist;
				done();
			} }, nonext);
		});
		it('should create a page if everything is OK and user is admin', function(done) {
			req.current_user = loggedInUser;
			req.body.page = { title: 'My New Page', category_id: 'cat1z4723ui' };
			req.account = { _id: '507f1f77bcf86cd799439011', id: '507f1f77bcf86cd799439011' }
			PageCtrl.create(req, { send: function(status, body) {
				expect(status).to.equal(200);
				expect(body.page).to.exist;
				expect(body.page.title).to.equal('My New Page');
				done();
			} }, nonext);
		});
		it('should create a page if everything is OK and user is admin', function(done) {
			req.current_user = new User({
				permissions: {
					'507f1f77bcf86cd799439011': {
						admin: false,
						'cat1z4723ui': {
							create: true
						}
					}
				}
			});
			req.body.page = { title: 'My New Page', category_id: 'cat1z4723ui' };
			req.account = { _id: '507f1f77bcf86cd799439011', id: '507f1f77bcf86cd799439011' }
			PageCtrl.create(req, { send: function(status, body) {
				expect(status).to.equal(200);
				expect(body.page).to.exist;
				expect(body.page.title).to.equal('My New Page');
				done();
			} }, nonext);
		});
	});
	describe('edit a page', function() {
		var req, loggedInUser, pageToEdit;
		beforeEach(function(done) {
			loggedInUser = new User({
				first_name: 'Alexis',
				last_name: 'Rinaldoni',
				name: 'Alexis Rinaldoni',
				email: 'arinaldoni@me.com',
				permissions: { '507f1f77bcf86cd799439011': { admin: true } },
				account_id: '507f1f77bcf86cd799439011'
			});
			pageToEdit = new Page({
				title: 'A Page To Edit',
				account_id: '507f1f77bcf86cd799439011',
				category_id: '107f1f77bcf86cd799439012',
				tags: ['ganze', 'arbeit', 'weltraum']
			});
			loggedInUser.save(function() { pageToEdit.save(function() {
				req = {
					param: function(name) { return this.params[name]; },
					params: { page_id: pageToEdit.id },
					connection: { remoteAddress: '127.0.0.1' },
					account: { _id: '507f1f77bcf86cd799439011', id: '507f1f77bcf86cd799439011' },
					body: { page: { title: 'My New Page title' } }
				}
				done();
			}); });
		});
		it('returns a 401 if user is not logged in', function(done) {
			PageCtrl.update(req, { send: function(status, body) {
				expect(status).to.equal(401);
				expect(body).not.to.exist;
				done();
			} }, nonext);
		});
		it('returns a 400 if no page is given', function(done) {
			req.current_user = loggedInUser;
			req.params.page_id = undefined;
			PageCtrl.update(req, { send: function(status, body) {
				expect(status).to.equal(400);
				expect(body).not.to.exist;
				done();
			} }, nonext);
		});
		it('returns a 400 if no page content is given', function(done) {
			req.current_user = loggedInUser;
			req.body.page = undefined;
			PageCtrl.update(req, { send: function(status, body) {
				expect(status).to.equal(400);
				expect(body).not.to.exist;
				done();
			} }, nonext);
		});
		it('returns a 403 if user has not \'edit\' and is not author of the page right', function(done) {
			req.current_user = new User({
				permissions: {
					'507f1f77bcf86cd799439011': {
						admin: false,
						'107f1f77bcf86cd799439012': { delete: true }
					}
				}
			});
			PageCtrl.update(req, { send: function(status, body) {
				expect(status).to.equal(403);
				expect(body).not.to.exist;
				done();
			} }, nonext);
		});
		it('updates the page if user has no \'edit\' but is author of the page', function(done) {
			req.current_user = new User({
				permissions: {
					'507f1f77bcf86cd799439011': {
						admin: false,
						'107f1f77bcf86cd799439012': { delete: true }
					}
				}
			});
			req.current_user = loggedInUser;
			pageToEdit.author = [{ author_type: 'panda', author_id: loggedInUser.id }];
			pageToEdit.save(function() {
				PageCtrl.update(req, { send: function(status, body) {
					expect(status).to.equal(200);
					expect(body.page).to.exist;
					expect(body.page.title).to.equal('My New Page title');
					done();
				} }, nonext);
			})
		});
		it('should not be able to set the pages status on save', function(done) {
			req.current_user = new User({
				permissions: {
					'507f1f77bcf86cd799439011': {
						admin: false,
						'107f1f77bcf86cd799439012': { edit: true }
					}
				}
			});
			req.current_user = loggedInUser;
			req.body.page.status = 'PUBLISHED';
			PageCtrl.update(req, { send: function(status, body) {
				expect(status).to.equal(200);
				expect(body.page).to.exist;
				expect(body.page.title).to.equal('My New Page title');
				expect(body.page.status).to.not.exist;
				done();
			} }, nonext);
		});
		it('should not be able to update a page if user has edit rights, but site is already published', function(done) {
			req.current_user = new User({
				permissions: {
					'507f1f77bcf86cd799439011': {
						admin: false,
						'107f1f77bcf86cd799439012': { edit: true }
					}
				}
			});
			pageToEdit.status = 'PUBLISHED';
			pageToEdit.save(function() {
				PageCtrl.update(req, { send: function(status, body) {
					expect(status).to.equal(403);
					expect(body && body.page).not.to.exist;
					done();
				} }, nonext);
			});
		});
		it('should not be able to update a page if user has edit rights, but site is already controlled', function(done) {
			req.current_user = new User({
				permissions: {
					'507f1f77bcf86cd799439011': {
						admin: false,
						'107f1f77bcf86cd799439012': { edit: true }
					}
				}
			});
			pageToEdit.status = 'CONTROLLED';
			pageToEdit.save(function() {
				PageCtrl.update(req, { send: function(status, body) {
					expect(status).to.equal(403);
					expect(body && body.page).not.to.exist;
					done();
				} }, nonext);
			});
		});
		it('should update a page if everything is OK', function(done) {
			req.current_user = new User({
				permissions: {
					'507f1f77bcf86cd799439011': {
						admin: false,
						'107f1f77bcf86cd799439012': { edit: true }
					}
				}
			});
			req.current_user = loggedInUser;
			PageCtrl.update(req, { send: function(status, body) {
				expect(status).to.equal(200);
				expect(body.page).to.exist;
				expect(body.page.title).to.equal('My New Page title');
				done();
			} }, nonext);
		});
	});
	describe('update a module', function() {
		var req, loggedInUser, pageToChangeModules, modules, moduleToEdit;
        beforeEach(function(done) {
            modules = [
                new Module({
                    content: 'Eine Überschrift!',
                    type: 'subhead'
                }),
                new Module({
                    content: 'Ein bla bla text',
                    type: 'text'
                }),
                new Module({
                    content: 'Ich seh nur mit dem Herzen gut',
                    type: 'quote'
                })
            ];
            async.each(modules, function(module, cb) { module.save(cb) }, function(err) {
                moduleToEdit = modules[1];
                done(err);
            });
        });
		beforeEach(function(done) {
			loggedInUser = new User({
				first_name: 'Alexis',
				last_name: 'Rinaldoni',
				name: 'Alexis Rinaldoni',
				email: 'arinaldoni@me.com',
				permissions: { '507f1f77bcf86cd799439011': { admin: true } },
				account_id: '507f1f77bcf86cd799439011'
			});
			pageToChangeModules = new Page({
				title: 'A Page To Edit',
				account_id: '507f1f77bcf86cd799439011',
				category_id: '107f1f77bcf86cd799439012',
				tags: ['ganze', 'arbeit', 'weltraum'],
                modules: []
			});
            modules.forEach(function(mod, i) {
                pageToChangeModules.modules.push({
                    module_id: mod.id,
                    position_on_page: i
                });
            });
			loggedInUser.save(function() { pageToChangeModules.save(function() {
				req = {
					param: function(name) { return this.params[name]; },
					params: {
                        page_id: pageToChangeModules.id,
                        module_id: moduleToEdit.id
                    },
					connection: { remoteAddress: '127.0.0.1' },
					account: { _id: '507f1f77bcf86cd799439011', id: '507f1f77bcf86cd799439011' },
					body: { module: { content: 'My New Text' } }
				}
				done();
			}); });
		});
		it('returns a 401 if user is not logged in', function(done) {
			PageCtrl.updateModule(req, { send: function(status, body) {
				expect(status).to.equal(401);
				expect(body).not.to.exist;
				done();
			} }, nonext);
		});
		it('returns a 400 if no page is given', function(done) {
			req.current_user = loggedInUser;
			req.params.page_id = undefined;
			PageCtrl.updateModule(req, { send: function(status, body) {
				expect(status).to.equal(400);
				expect(body).not.to.exist;
				done();
			} }, nonext);
		});
		it('returns a 400 if no module id is given', function(done) {
			req.current_user = loggedInUser;
			req.params.module_id = undefined;
			PageCtrl.updateModule(req, { send: function(status, body) {
				expect(status).to.equal(400);
				expect(body).not.to.exist;
				done();
			} }, nonext);
		});
		it('returns a 400 if no module content is given', function(done) {
			req.current_user = loggedInUser;
			req.body.module = undefined;
			PageCtrl.updateModule(req, { send: function(status, body) {
				expect(status).to.equal(400);
				expect(body).not.to.exist;
				done();
			} }, nonext);
		});
		it('returns a 403 if user has not \'edit\' and is not author of the page right', function(done) {
			req.current_user = new User({
				permissions: {
					'507f1f77bcf86cd799439011': {
						admin: false,
						'107f1f77bcf86cd799439012': { delete: true }
					}
				}
			});
			PageCtrl.updateModule(req, { send: function(status, body) {
				expect(status).to.equal(403);
				expect(body).not.to.exist;
				done();
			} }, nonext);
		});
		it('updates the page if user has no \'edit\' but is author of the page', function(done) {
			req.current_user = new User({
				permissions: {
					'507f1f77bcf86cd799439011': {
						admin: false,
						'107f1f77bcf86cd799439012': { delete: true }
					}
				}
			});
			req.current_user = loggedInUser;
			pageToChangeModules.author = [{ author_type: 'panda', author_id: loggedInUser.id }];
			pageToChangeModules.save(function() {
				PageCtrl.updateModule(req, { send: function(status, body) {
					expect(status).to.equal(200);
					expect(body.module).to.exist;
					expect(body.module.content).to.equal('My New Text');
					done();
				} }, nonext);
			})
		});
		it('should not be able to update a page if user has edit rights, but site is already published and user is not admin', function(done) {
			req.current_user = new User({
				permissions: {
					'507f1f77bcf86cd799439011': {
						admin: false,
						'107f1f77bcf86cd799439012': { edit: true }
					}
				}
			});
			pageToChangeModules.status = 'PUBLISHED';
			pageToChangeModules.save(function() {
				PageCtrl.updateModule(req, { send: function(status, body) {
					expect(status).to.equal(403);
					expect(body && body.module).not.to.exist;
					done();
				} }, nonext);
			});
		});
        it('should be able to update a page if user is admin, but site is already published', function(done) {
			req.current_user = new User({
				permissions: {
					'507f1f77bcf86cd799439011': {
						admin: true
					}
				}
			});
			pageToChangeModules.status = 'PUBLISHED';
			pageToChangeModules.save(function() {
                req.body.module.title = 'My New Title';
                PageCtrl.updateModule(req, { send: function(status, body) {
    				expect(status).to.equal(200);
    				expect(body.module).to.exist;
    				expect(body.module.title).to.equal('My New Title');
    				done();
    			} }, nonext);
			});
		});
		it('should not be able to update a page if user has edit rights, but site is already controlled', function(done) {
			req.current_user = new User({
				permissions: {
					'507f1f77bcf86cd799439011': {
						admin: false,
						'107f1f77bcf86cd799439012': { edit: true }
					}
				}
			});
			pageToChangeModules.status = 'CONTROLLED';
			pageToChangeModules.save(function() {
				PageCtrl.updateModule(req, { send: function(status, body) {
					expect(status).to.equal(403);
					expect(body && body.module).not.to.exist;
					done();
				} }, nonext);
			});
		});
		it('should update a page if use has edit rights', function(done) {
			req.current_user = new User({
				permissions: {
					'507f1f77bcf86cd799439011': {
						admin: false,
						'107f1f77bcf86cd799439012': { edit: true }
					}
				}
			});
			req.current_user = loggedInUser;
			PageCtrl.updateModule(req, { send: function(status, body) {
				expect(status).to.equal(200);
				expect(body.module).to.exist;
				expect(body.module.content).to.equal('My New Text');
				done();
			} }, nonext);
		});
	});
	describe('list pages', function() {
		var req, loggedInUser, editorialUser;
        var i = 0;
		beforeEach(function(done) {
            i++;
			req = {
				param: function(name) { return this.params[name]; },
				params: { page_id: newPage.id },
				connection: { remoteAddress: '127.0.0.1' },
				body: {}
			}
			loggedInUser = new User({
				first_name: 'Alexis',
				last_name: 'Rinaldoni',
				name: 'Alexis Rinaldoni',
				email: 'mytestnumberis' + i + '@me.com',
				permissions: { '507f1f77bcf86cd799439011': { admin: true } },
				account_id: '507f1f77bcf86cd799439011'
			});
			editorialUser = new User({
				first_name: 'Karla',
				last_name: 'Kolumna',
				email: 'karla' + i + '@kolumna.de',
				permissions: { '507f1f77bcf86cd799439011': { admin: false } },
				account_id: '507f1f77bcf86cd799439011'
			});
			async.each([loggedInUser, editorialUser], function(user, cb) { user.save(cb) }, done);
		});
		beforeEach(function(done) {
			var pages = [
				{
					title: 'My Page ACC1 1',
					account_id: '507f1f77bcf86cd799439011',
					category_id: '107f1f77bcf86cd799439011',
					tags: ['medienportal', 'schule', 'langweilig'],
					status: 'PUBLISHED'
				},
				{
					title: 'My Page ACC1 2',
					account_id: '507f1f77bcf86cd799439011',
					category_id: '107f1f77bcf86cd799439011',
					tags: ['medienportal', 'schule', 'langweilig', 'groß'],
					status: 'PUBLISHED'
				},
				{
					title: 'My Page ACC1 3',
					account_id: '507f1f77bcf86cd799439011',
					category_id: '107f1f77bcf86cd799439012',
					tags: ['penis', 'sex', 'lustig', 'haha'],
					status: 'PUBLISHED'
				},
				{
					title: 'My Page ACC1 4',
					account_id: '507f1f77bcf86cd799439011',
					category_id: '107f1f77bcf86cd799439013',
					tags: ['schule', 'video', 'lehrer'],
					status: 'PUBLISHED'
				},
				{
					title: 'My Page ACC1 5',
					account_id: '507f1f77bcf86cd799439011',
					category_id: '107f1f77bcf86cd799439011',
					tags: ['eichhörnchen', 'schulgarten'],
					status: 'PUBLISHED'
				},
				{
					title: 'My Page ACC1 6',
					account_id: '507f1f77bcf86cd799439011',
					category_id: '107f1f77bcf86cd799439011',
					tags: ['eichhörnchen', 'schulgarten'],
					status: 'CONTROLLED'
				},
				{
					title: 'My Page ACC1 7',
					account_id: '507f1f77bcf86cd799439011',
					category_id: '107f1f77bcf86cd799439011',
					tags: ['eichhörnchen', 'schulgarten', 'wundergarten'],
					status: 'CONTROLLED',
					author: [{author_type: 'panda', author_id: editorialUser.id}]
				},
				{
					title: 'My Page ACC1 8',
					account_id: '507f1f77bcf86cd799439011',
					category_id: '107f1f77bcf86cd799439012',
					tags: ['eichhörnchen', 'schulgarten'],
					status: 'CONTROLLED'
				},
				{
					title: 'My Page ACC1 9',
					account_id: '507f1f77bcf86cd799439011',
					category_id: '107f1f77bcf86cd799439011',
					tags: ['eichhörnchen', 'schulgarten'],
					status: '',
					author: [{author_type: 'panda', author_id: editorialUser.id}, {author_type: 'custom', author_id: 'Karla Kolumna'}]
				},
				{
					title: 'My Page ACC2 1',
					account_id: '507f1f77bcf86cd799439012',
					category_id: '107f1f77bcf86cd799439011',
					tags: ['blumengarten', 'schule'],
					status: 'PUBLISHED'
				},
				{
					title: 'My Page ACC2 2',
					account_id: '507f1f77bcf86cd799439012',
					category_id: '107f1f77bcf86cd799439011',
					tags: ['fotographie', 'kleinkunst', 'ganz', 'groß'],
					status: 'PUBLISHED'
				},
				{
					title: 'My Page ACC2 3',
					account_id: '507f1f77bcf86cd799439012',
					category_id: '107f1f77bcf86cd799439012',
					tags: ['fotografie', 'kleinkunst'],
					status: 'PUBLISHED'
				},
				{
					title: 'My Page ACC2 4',
					account_id: '507f1f77bcf86cd799439012',
					category_id: '107f1f77bcf86cd799439012',
					tags: ['ganze', 'arbeit', 'weltraum'],
					status: 'PUBLISHED'
				}
			];
			async.map(pages, function(item, cb) { Page.create(item, cb); }, done);
		})
		it('returns a 400 if no account id is given for page listing', function(done) {
			PageCtrl.list(req, nores, function(err) {
				expect(err).to.exist;
				expect(err).to.be.an('object');
				expect(err).to.have.property('status');
				expect(err.status).to.equal(400);
				expect(err).to.have.property('shortCode');
				expect(err.shortCode).to.equal('noAccount');
				done();
			});
		});
		it('returns a 400 if no account id is given for tag listing', function(done) {
			PageCtrl.tagList(req, nores, function(err) {
				expect(err).to.exist;
				expect(err).to.be.an('object');
				expect(err).to.have.property('status');
				expect(err.status).to.equal(400);
				expect(err).to.have.property('shortCode');
				expect(err.shortCode).to.equal('noAccount');
				done();
			});
		});
		describe('user is not logged in', function() {
			it('lists only the pages that belong to the right account', function(done) {
				req.account = { _id: '507f1f77bcf86cd799439011', id: '507f1f77bcf86cd799439011' };
				PageCtrl.list(req, { send: function(status, body) {
					expect(status).to.equal(200);
					expect(body.modules).to.exist;
					expect(body.pages).to.exist;
					expect(body.pages.length).to.equal(5);
					body.pages.forEach(function(page) {
						expect(page.account_id.toString()).to.equal("507f1f77bcf86cd799439011");
						expect(page.status).to.equal('PUBLISHED');
					});
					done();
				} }, nonext);
			});
			it('lists only the pages that belong to the right category', function(done) {
				req.account = { _id: '507f1f77bcf86cd799439011', id: '507f1f77bcf86cd799439011' };
				req.params = { category_id: "107f1f77bcf86cd799439011" };
				PageCtrl.list(req, { send: function(status, body) {
					expect(status).to.equal(200);
					expect(body.modules).to.exist;
					expect(body.pages).to.exist;
					expect(body.pages.length).to.equal(3);
					body.pages.forEach(function(page) {
						expect(page.account_id.toString()).to.equal("507f1f77bcf86cd799439011");
						expect(page.category_id.toString()).to.equal("107f1f77bcf86cd799439011");
						expect(page.status).to.equal('PUBLISHED');
					});
					done();
				} }, nonext);
			});
			it('lists the correct tags of an account\'s pages', function(done) {
				req.account = { _id: '507f1f77bcf86cd799439011', id: '507f1f77bcf86cd799439011' };
				PageCtrl.tagList(req, { send: function(status, body) {
					expect(status).to.equal(200);
					expect(body.tags).to.exist;
					expect(body.tags.length).to.equal(12);
					done();
				} }, nonext);
			});
		});
		describe('user is logged in and admin', function() {
			beforeEach(function() {
				req.current_user = loggedInUser;
			});
			it('lists only the pages that belong to the right account', function(done) {
				req.account = { _id: '507f1f77bcf86cd799439011', id: '507f1f77bcf86cd799439011' };
				PageCtrl.list(req, { send: function(status, body) {
					expect(status).to.equal(200);
					expect(body.modules).to.exist;
					expect(body.pages).to.exist;
					expect(body.pages.length).to.equal(8);
					body.pages.forEach(function(page) {
						expect(page.account_id.toString()).to.equal("507f1f77bcf86cd799439011");
					});
					done();
				} }, nonext);
			});
			it('lists only the pages that belong to the right category', function(done) {
				req.account = { _id: '507f1f77bcf86cd799439011', id: '507f1f77bcf86cd799439011' };
				req.params = { category_id: "107f1f77bcf86cd799439011" };
				PageCtrl.list(req, { send: function(status, body) {
					expect(status).to.equal(200);
					expect(body.modules).to.exist;
					expect(body.pages).to.exist;
					expect(body.pages.length).to.equal(5);
					body.pages.forEach(function(page) {
						expect(page.account_id.toString()).to.equal("507f1f77bcf86cd799439011");
						expect(page.category_id.toString()).to.equal("107f1f77bcf86cd799439011");
					});
					done();
				} }, nonext);
			});
			it('lists the correct tags of an account\'s pages', function(done) {
				req.account = { _id: '507f1f77bcf86cd799439011', id: '507f1f77bcf86cd799439011' };
				PageCtrl.tagList(req, { send: function(status, body) {
					expect(status).to.equal(200);
					expect(body.tags).to.exist;
					expect(body.tags.length).to.equal(13);
					done();
				} }, nonext);
			});
		});
		describe('user is logged in and not admin, author of one unready and one controlled page', function() {
			beforeEach(function() {
				req.current_user = editorialUser;
				req.account = { _id: "507f1f77bcf86cd799439011" };
			});
			it('lists only the pages that belong to the right account', function(done) {
				PageCtrl.list(req, { send: function(status, body) {
					expect(status).to.equal(200);
					expect(body.modules).to.exist;
					expect(body.pages).to.exist;
					expect(body.pages.length).to.equal(7);
					body.pages.forEach(function(page) {
						expect(page.account_id.toString()).to.equal("507f1f77bcf86cd799439011");
					});
					done();
				} }, nonext);
			});
			it('lists only the pages that belong to the right category', function(done) {
				req.params = { category_id: "107f1f77bcf86cd799439011" };
				PageCtrl.list(req, { send: function(status, body) {
					expect(status).to.equal(200);
					expect(body.modules).to.exist;
					expect(body.pages).to.exist;
					expect(body.pages.length).to.equal(5);
					body.pages.forEach(function(page) {
						expect(page.account_id.toString()).to.equal("507f1f77bcf86cd799439011");
						expect(page.category_id.toString()).to.equal("107f1f77bcf86cd799439011");
					});
					done();
				} }, nonext);
			});
			it('lists the correct tags of an account\'s pages', function(done) {
				PageCtrl.tagList(req, { send: function(status, body) {
					expect(status).to.equal(200);
					expect(body.tags).to.exist;
					expect(body.tags.length).to.equal(13);
					done();
				} }, nonext);
			});
		});
	});
	describe('change page status', function() {
		var req = {
			param: function(key) { return this.params[key]; }
		};
		beforeEach(function () {
			req.account = { id: newPage.account_id, _id: newPage.account_id };
			req.params = { page_id: newPage.id };
			req.body = {};
		});
		it('user cannot change the page status if no status is given', function(done) {
			req.body.status = null;
			PageCtrl.setPageStatus(req, {
				send: function(status, body) {
					expect(status).to.equal(400);
					expect(body).to.not.exist;
					done();
				}
			}, nonext);
		});
		it('user cannot change the page status if he is not logged in', function(done) {
			req.body.status = 'PUBLISHED';
			PageCtrl.setPageStatus(req, {
				send: function(status, body) {
					expect(status).to.equal(401);
					expect(body).to.not.exist;
					done();
				}
			}, nonext);
		});
		it('user can change the page status to "READY" if he is logged in', function(done) {
			req.current_user = new User({permissions: {} });
			req.current_user.permissions[req.account.id] = { admin: false };
			req.body.status = 'READY';
			PageCtrl.setPageStatus(req, {
				send: function(status, body) {
					expect(status).to.equal(200);
					expect(body).to.have.property('page');
					expect(body.page).to.have.property('status');
					expect(body.page.status).to.equal('READY');
					done();
				}
			}, nonext);
		});
		it('user cannot change the page status to "CONTROLLED" if he is not admin', function(done) {
			req.body.status = 'CONTROLLED';
			req.current_user = new User({ permissions: {} });
			req.current_user.permissions[req.account.id] = { admin: false };
			PageCtrl.setPageStatus(req, {
				send: function(status, body) {
					expect(status).to.equal(403);
					expect(body).to.not.exist;
					done();
				}
			}, nonext);
		});
		it('user cannot change the page status to "PUBLISHED" if he is not admin', function(done) {
			req.body.status = 'PUBLISHED';
			req.current_user = new User({ permissions: {} });
			req.current_user.permissions[req.account.id] = { admin: false };
			PageCtrl.setPageStatus(req, {
				send: function(status, body) {
					expect(status).to.equal(403);
					expect(body).to.not.exist;
					done();
				}
			}, nonext);
		});
		it('user can change the page status to "PUBLISHED" if he is admin', function(done) {
			req.body.status = 'PUBLISHED';
			req.current_user = new User({ permissions: {} });
			req.current_user.permissions[req.account.id] = { admin: true };
			PageCtrl.setPageStatus(req, {
				send: function(status, body) {
					expect(status).to.equal(200);
					expect(body).to.have.property('page');
					expect(body.page).to.have.property('status');
					expect(body.page.status).to.equal('PUBLISHED');
					done();
				}
			}, nonext);
		});
	});
});
