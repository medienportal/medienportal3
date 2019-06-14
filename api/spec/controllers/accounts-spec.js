/* jshint -W024 */
/* jshint expr:true */

var config = require('../../config'),
	assert = require('assert'),
	mongoose = require('mongoose'),
	Account = require('../../model/account'),
	Page = require('../../model/page'),
	Collection = require('../../model/collection'),
	Category = require('../../model/category'),
	User = require('../../model/user'),
	Activity = require('../../model/activity'),
	AccountsCtrl = require('../../controller/accounts'),
	Cache = require('../../service/cache'),
	async = require('async'),
	chai = require('chai'),
	expect = chai.expect,
	nonext = function(err) {
		throw err;
	};

beforeEach(function() {
	Cache.purge();
});

if (process.env.NODE_ENV !== 'test') throw 'No test environment!';

describe('Accounts Controller', function () {
	'use strict';

	var newAccount, newAccount2, req = {};
	before(function(done) {
		Account.create({
			name: 'Test Account',
			title: 'testaccount',
			config: {
				public: {
					testkey: "testvalue",
					otherkey: "otherval",
					hashtest: {
						keyHash1: "one",
						keyHash2: "two"
					}
				}
			}
		}, function(err, _account) {
			if (err) throw err;
			newAccount = _account;
			req.cache = Cache.acc(newAccount.id);
			done();
		});
	});
    before(function(done) {
        Account.create({
            name: 'Test Account numero due',
            title: 'testaccount_due',
            config: {
                public: {
                    testkey: "testvalue",
                    otherkey: "otherval",
                    hashtest: {
                        keyHash1: "one",
                        keyHash2: "two"
                    }
                }
            }
        }, function(err, _account) {
            if (err) throw err;
            newAccount2 = _account;
            done();
        });
    });
	beforeEach(function() {
		req.account = newAccount;
	});
	describe('javascript configuration file', function() {
		var headers_have_been_set;
		beforeEach(function() {
			headers_have_been_set = false;
		});
		it('should return a redirect if no account is found', function(done) {
			req.account = null;
			var res = {
				send: function(status, body) {
					expect(status).to.equal(200);
					expect(body).to.contain('window.location.href=');
					expect(headers_have_been_set).to.equal(true);
					done();
				},
				setHeader: function(key, val) {
					headers_have_been_set = true;
					expect(key).to.equal('Content-Type');
					expect(val).to.equal('text/javascript');
				}
			};
			AccountsCtrl.getPublicConfigurationJavascript(req, res, nonext);
		});
		it('should return config javascript', function(done) {
			var res = {
				send: function(status, body) {
					expect(status).to.equal(200);
					expect(headers_have_been_set).to.equal(true);
					var configuration;
					eval(body); // jshint ignore:line
					expect(configuration.testkey).to.equal("testvalue");
					expect(configuration.otherkey).to.equal("otherval");
					expect(configuration.hashtest.keyHash1).to.equal("one");
					expect(configuration.hashtest.keyHash2).to.equal("two");
					done();
				},
				setHeader: function(key, val) {
					headers_have_been_set = true;
					expect(key).to.equal('Content-Type');
					expect(val).to.equal('text/javascript');
				}
			};
			AccountsCtrl.getPublicConfigurationJavascript(req, res, nonext);
		});
	});
	describe('account information', function() {
        var i = 0;
		beforeEach(function(done) {
            i++;
			req.current_user = new User({
				first_name: 'Alexis',
				last_name: 'Rinaldoni',
				email: 'abcd123' + i + '@ajsdkfa.de',
				verified: true,
				gender: 'male',
				permissions: {},
				account_id: newAccount.id
			});
			req.current_user.permissions[newAccount.id] = { admin: true };
			req.current_user.save(done);
		});
		it('should return the account information if user is admin', function(done) {
			var res = {
				send: function(status, body) {
					expect(status).to.equal(200);
					expect(body).to.have.property('account');
					expect(body.account).to.have.property('_id');
					expect(body.account).to.have.property('name');
					expect(body.account).to.have.property('title');
					expect(body.account).to.have.property('config');
					expect(body.account.config).to.not.have.property('private');
					expect(body.account).to.not.have.property('active_plan');
					expect(body.account).to.not.have.property('billing_name');
					expect(body.account).to.not.have.property('billing_name2');
					expect(body.account).to.not.have.property('billing_address');
					expect(body.account).to.not.have.property('billing_address2');
					expect(body.account).to.not.have.property('billing_zip');
					expect(body.account).to.not.have.property('billing_city');
					expect(body.account).to.not.have.property('billing_country');
					done();
				}
			};
			AccountsCtrl.getCurrent(req, res, nonext);
		});
	});
	describe('homepage', function() {
		before(function(done) {
			User.remove(done);
		});
		before(function(done) {
			var pages, collections, categories, users, activities;
			var myUsers = {};
			var getPages = function() {
				return [
					{
						title: 'My Page ACC1 1',
						account_id: newAccount.id,
						category_id: '107f1f77bcf86cd799439011',
						tags: ['medienportal', 'schule', 'langweilig'],
						topic: 'Interview',
						status: 'PUBLISHED',
						author: [
							{
								author_type: 'panda',
								author_id: myUsers.alexis._id
							}
						]
					},
					{
						title: 'My Page ACC1 2',
						account_id: newAccount.id,
						category_id: '107f1f77bcf86cd799439011',
						tags: ['medienportal', 'schule', 'langweilig', 'groß'],
						topic: 'Interview',
						status: 'PUBLISHED',
						author: [
							{
								author_type: 'panda',
								author_id: myUsers.alexis._id
							}
						]
					},
					{
						title: 'My Page ACC1 3',
						account_id: newAccount.id,
						category_id: '107f1f77bcf86cd799439012',
						tags: ['penis', 'sex', 'lustig', 'haha'],
						topic: 'Interview',
						status: 'PUBLISHED',
						author: [
							{
								author_type: 'panda',
								author_id: myUsers.alexis._id
							}
						]
					},
					{
						title: 'My Page ACC1 4',
						account_id: newAccount.id,
						category_id: '107f1f77bcf86cd799439013',
						tags: ['schule', 'video', 'lehrer'],
						topic: 'Aus dem Strebergarten',
						status: 'PUBLISHED',
						author: [
							{
								author_type: 'panda',
								author_id: myUsers.alexis._id
							}
						]
					},
					{
						title: 'My Page ACC1 5',
						account_id: newAccount.id,
						category_id: '107f1f77bcf86cd799439011',
						tags: ['eichhörnchen', 'schulgarten'],
						topic: 'Aus dem Strebergarten',
						status: 'PUBLISHED',
						author: [
							{
								author_type: 'panda',
								author_id: myUsers.alexis._id
							}
						]
					},
					{
						title: 'My Page ACC1 6',
						account_id: newAccount.id,
						category_id: '107f1f77bcf86cd799439011',
						tags: ['eichhörnchen', 'schulgarten'],
						topic: 'Multikulti',
						status: 'PUBLISHED',
						author: [
							{
								author_type: 'panda',
								author_id: myUsers.alexis._id
							}
						]
					},
					{
						title: 'My Page ACC1 7',
						account_id: newAccount.id,
						category_id: '107f1f77bcf86cd799439011',
						tags: ['eichhörnchen', 'schulgarten'],
						topic: 'Multikulti',
						status: 'PUBLISHED',
						author: [
							{
								author_type: 'panda',
								author_id: myUsers.alexis._id
							}
						]
					},
					{
						title: 'My Page ACC1 8',
						account_id: newAccount.id,
						category_id: '107f1f77bcf86cd799439011',
						tags: ['eichhörnchen', 'schulgarten'],
						topic: 'Multikulti',
						status: 'PUBLISHED',
						author: [
							{
								author_type: 'panda',
								author_id: myUsers.alexis._id
							}
						]
					},
					{
						title: 'My Page ACC1 9',
						account_id: newAccount.id,
						category_id: '107f1f77bcf86cd799439011',
						tags: ['eichhörnchen', 'schulgarten'],
						status: 'PUBLISHED',
						author: [
							{
								author_type: 'panda',
								author_id: myUsers.alexis._id
							}
						]
					},
					{
						title: 'My Page ACC1 10',
						account_id: newAccount.id,
						category_id: '107f1f77bcf86cd799439011',
						tags: ['eichhörnchen', 'schulgarten'],
						status: 'PUBLISHED',
						author: [
							{
								author_type: 'panda',
								author_id: myUsers.alexis._id
							}
						]
					},
					{
						title: 'My Page ACC1 11',
						account_id: newAccount.id,
						category_id: '107f1f77bcf86cd799439011',
						tags: ['eichhörnchen', 'schulgarten'],
						status: 'PUBLISHED',
						author: [
							{
								author_type: 'panda',
								author_id: myUsers.alexis._id
							}
						]
					},
					{
						title: 'My Page ACC1 12',
						account_id: newAccount.id,
						category_id: '107f1f77bcf86cd799439011',
						tags: ['eichhörnchen', 'schulgarten'],
						status: 'PUBLISHED',
						author: [
							{
								author_type: 'panda',
								author_id: myUsers.alexis._id
							}
						]
					},
					{
						title: 'My Page ACC1 13',
						account_id: newAccount.id,
						category_id: '107f1f77bcf86cd799439011',
						tags: ['eichhörnchen', 'schulgarten'],
						status: 'PUBLISHED',
						author: [
							{
								author_type: 'panda',
								author_id: myUsers.alexis._id
							}
						]
					},
					{
						title: 'My Page ACC1 14',
						account_id: newAccount.id,
						category_id: '107f1f77bcf86cd799439011',
						tags: ['eichhörnchen', 'schulgarten'],
						status: 'PUBLISHED',
						author: [
							{
								author_type: 'panda',
								author_id: myUsers.alexis._id
							}
						]
					},
					{
						title: 'My Page ACC1 15',
						account_id: newAccount.id,
						category_id: '107f1f77bcf86cd799439011',
						tags: ['eichhörnchen', 'schulgarten'],
						status: 'PUBLISHED',
						author: [
							{
								author_type: 'panda',
								author_id: myUsers.alexis._id
							}
						]
					},
					{
						title: 'My Page ACC1 16',
						account_id: newAccount.id,
						category_id: '107f1f77bcf86cd799439011',
						tags: ['eichhörnchen', 'schulgarten'],
						status: 'PUBLISHED',
						author: [
							{
								author_type: 'panda',
								author_id: myUsers.alexis._id
							}
						]
					},
					{
						title: 'My Page ACC1 17',
						account_id: newAccount.id,
						category_id: '107f1f77bcf86cd799439011',
						tags: ['eichhörnchen', 'schulgarten'],
						status: 'PUBLISHED',
						author: [
							{
								author_type: 'panda',
								author_id: myUsers.alexis._id
							}
						]
					},
					{
						title: 'My Page ACC1 18',
						account_id: newAccount.id,
						category_id: '107f1f77bcf86cd799439011',
						tags: ['eichhörnchen', 'schulgarten'],
						status: 'PUBLISHED',
						author: [
							{
								author_type: 'panda',
								author_id: myUsers.alexis._id
							}
						]
					},
					{
						title: 'My Page ACC1 19',
						account_id: newAccount.id,
						category_id: '107f1f77bcf86cd799439011',
						tags: ['eichhörnchen', 'schulgarten'],
						status: 'CONTROLLED',
						author: [
							{
								author_type: 'panda',
								author_id: myUsers.alexis._id
							}
						]
					},
					{
						title: 'My Page ACC1 20',
						account_id: newAccount.id,
						category_id: '107f1f77bcf86cd799439011',
						tags: ['eichhörnchen', 'schulgarten'],
						status: 'CONTROLLED',
						author: [
							{
								author_type: 'panda',
								author_id: myUsers.alexis._id
							}
						]
					},
					{
						title: 'My Page ACC1 21',
						account_id: newAccount.id,
						category_id: '107f1f77bcf86cd799439011',
						tags: ['eichhörnchen', 'schulgarten'],
						status: 'READY',
						author: [
							{
								author_type: 'panda',
								author_id: myUsers.christopher._id
							},
							{
								author_type: 'panda',
								author_id: myUsers.alexis._id
							}
						]
					},
					{
						title: 'My Page ACC1 22',
						account_id: newAccount.id,
						category_id: '107f1f77bcf86cd799439011',
						tags: ['eichhörnchen', 'schulgarten'],
						status: '',
						author: [
							{
								author_type: 'panda',
								author_id: myUsers.alexis._id
							}
						]
					},
					{
						title: 'My Page ACC2 1',
						account_id: newAccount2.id,
						category_id: '107f1f77bcf86cd799439011',
						tags: ['blumengarten', 'schule'],
						status: 'PUBLISHED',
						author: [
							{
								author_type: 'panda',
								author_id: myUsers.alexis._id
							}
						]
					},
					{
						title: 'My Page ACC2 2',
						account_id: newAccount2.id,
						category_id: '107f1f77bcf86cd799439011',
						tags: ['fotographie', 'kleinkunst', 'ganz', 'groß'],
						status: 'PUBLISHED',
						author: [
							{
								author_type: 'panda',
								author_id: myUsers.alexis._id
							}
						],
						topic: 'Geheimnisse'
					},
					{
						title: 'My Page ACC2 3',
						account_id: newAccount2.id,
						category_id: '107f1f77bcf86cd799439012',
						tags: ['fotografie', 'kleinkunst'],
						status: 'PUBLISHED',
						author: [
							{
								author_type: 'panda',
								author_id: myUsers.alexis._id
							}
						],
						topic: 'Geheimnisse'
					},
					{
						title: 'My Page ACC2 4',
						account_id: newAccount2.id,
						category_id: '107f1f77bcf86cd799439012',
						tags: ['ganze', 'arbeit', 'weltraum'],
						status: 'PUBLISHED',
						author: [
							{
								author_type: 'panda',
								author_id: myUsers.alexis._id
							}
						],
						topic: 'Gesichter'
					}
				];
			};
			var getCollections = function() {
				return [
					{
						title: 'test Collection',
						category_id: 'cat123456',
						author: [
							{
								author_type: 'panda',
								author_id: myUsers.alexis._id
							}
						],
						account_id: newAccount.id
					},
					{
						title: 'mega collection',
						category_id: 'cat123456',
						author: [
							{
								author_type: 'panda',
								author_id: myUsers.alexis._id
							}
						],
						account_id: newAccount.id
					},
					{
						title: 'super duper collection',
						category_id: 'cat123456',
						author: [
							{
								author_type: 'panda',
								author_id: myUsers.alexis._id
							}
						],
						account_id: newAccount.id
					},
					{
						title: 'haaa ha collection',
						category_id: 'cat123456',
						author: [
							{
								author_type: 'panda',
								author_id: myUsers.alexis._id
							},
							{
								author_type: 'panda',
								author_id: myUsers.tim._id
							}
						],
						account_id: newAccount.id
					},
					{
						title: 'blub bla bla bli collection',
						category_id: 'cat123456',
						author: [
							{
								author_type: 'panda',
								author_id: myUsers.eike._id
							},
							{
								author_type: 'panda',
								author_id: myUsers.christopher._id
							}
						],
						account_id: newAccount.id
					},
					{
						title: 'kummer collection',
						category_id: 'cat123456',
						author: [
							{
								author_type: 'panda',
								author_id: myUsers.alexis._id
							}
						],
						account_id: newAccount.id
					},
					{
						title: 'emo collection',
						category_id: 'cat123456',
						author: [
							{
								author_type: 'panda',
								author_id: myUsers.alexis._id
							}
						],
						account_id: newAccount2.id
					},
				];
			};
			var getCategories = function() {
				return [
					{
						title: 'Super Articles',
						account_id: newAccount.id
					},
					{
						title: 'Mega Articles',
						account_id: newAccount.id
					},
					{
						title: 'Photos',
						account_id: newAccount.id
					},
					{
						title: 'Art Galleries',
						account_id: newAccount.id,
						config: {
							hide_from_homepage: true
						}
					},
					{
						title: 'Greetings',
						account_id: newAccount.id
					},
					{
						title: 'Super Duper Category',
						account_id: newAccount2.id
					},
					{
						title: 'Yuhuu',
						account_id: newAccount2.id
					}
				];
			};
			var getUsers = function() {
				var usersArr = [
					{
						first_name: 'Alexis',
						last_name: 'Rinaldoni',
						name: 'Alexis Rinaldoni',
						email: 'alexis.rinaldoni@gmail.com',
						account_id: newAccount.id,
						__permission_for_own_account: { admin: false },
					},
					{
						first_name: 'Eike',
						last_name: 'Wiewiorra',
						name: 'Eike Wiewiorra',
						email: 'eike.wiewiorra@gmail.com',
						account_id: newAccount.id,
						__permission_for_own_account: { admin: true },
					},
					{
						first_name: 'Eric',
						last_name: 'Ebel',
						name: 'Eric Ebel',
						email: 'info@eric-ebel.de',
						account_id: newAccount.id,
						__permission_for_own_account: { admin: true },
					},
					{
						first_name: 'Tim',
						last_name: 'Jann',
						name: 'Tim Jann',
						email: 'tim.jann@me.com',
						account_id: newAccount.id,
						__permission_for_own_account: { admin: false },
					},
					{
						first_name: 'Christopher',
						last_name: 'Bill',
						name: 'Christopher Bill',
						email: 'christopher.bill@gmail.com',
						account_id: newAccount.id,
						__permission_for_own_account: { admin: false },
					},
					{
						first_name: 'Christiane',
						last_name: 'Hahnsch',
						name: 'Christiane Hahnsch',
						email: 'christiane.hahnsch@stura-leipzig.com',
						account_id: '507f1f77bcf86cd799439023',
						__permission_for_own_account: { admin: false },
					}
				];
				return usersArr.map(function(u) {
					u.permissions = {};
					u.permissions[u.account_id] = u.__permission_for_own_account;
					delete u.__permission_for_own_account;
					return u;
				})
			};
			var getActivities = function() {
				return [
					{
						account_id: newAccount.id,
						trigger: { author_type: 'custom', author_id: 'Goethe' },
						target: { greeting_id: '107f1f77bcf86cd888888881' },
						type: 'greeting',
						content: 'Bla bla'
					}
				];
			};
			async.series({
				users: function(callback) {
					async.map(getUsers(), function(item, cb) { User.create(item, cb); }, function(_err, _users) {
						if (_users.length) {
							_users.forEach(function(user) {
								myUsers[user.first_name.toLowerCase()] = user;
							});
						}
						callback(_err, _users);
					});
				},
				pages: function(callback) {
					async.map(getPages(), function(item, cb) { Page.create(item, cb); }, callback);
				},
				collections: function(callback) {
					async.map(getCollections(), function(item, cb) { Collection.create(item, cb); }, callback);
				},
				categories: function(callback) {
					async.map(getCategories(), function(item, cb) { Category.create(item, cb); }, callback);
				},
				activities: function(callback) {
					async.map(getActivities(), function(item, cb) { Activity.create(item, cb); }, callback);
				},
				topstory_page: function(callback) {
					Page.findOne({title: 'My Page ACC1 18'}, function(err, topstory_page) {
                        if (err) return done(err);
                        var query = { $set: { 'config.private.topstory': ('page:' + topstory_page._id) } };
                        newAccount.config.private = { topstory: ('page:' + topstory_page.id) };
                        Account.update({_id: newAccount._id}, query, callback);
                    });
				},
				topstory_collection: function(callback) {
					Collection.findOne({title: 'emo collection'}, function(err, topstory_collection) {
                        if (err) return done(err);
                        var query = { $set: { 'config.private.topstory': ('collection:' + topstory_collection._id) } };
                        newAccount2.config.private = { topstory: ('collection:' + topstory_collection._id) };
                        Account.update({_id: newAccount2._id}, query, callback);
                    });
				}
			}, function(err, results) {
				if (err) { throw err; }
				users = results.users;
				pages = results.pages;
				collections = results.collections;
				categories = results.categories;
				activities = results.activities;
				done();
			});
		});
		it('should return result 400 if no account is given', function(done) {
			req.account = undefined;
			var resFn = function(status, body) {
				expect(status).to.equal(400);
				expect(body).to.not.exist;
				done();
			};
			AccountsCtrl.homepage(req, { send: resFn }, nonext);
		});
		describe('lists in start request: ', function() {
			it('a topstory page', function(done) {
				var resFn = function(status, body) {
					expect(status).to.equal(200);
					expect(body).to.have.property('topstory');
					expect(body.topstory).to.have.property('page');
					expect(body.topstory.page).to.have.property('_id');
					Page.findOne({title: 'My Page ACC1 18'}, function(err, topstory) {
						if (err) throw err;
						expect(body.topstory.page._id.toString()).to.equal(topstory.id.toString());
						done();
					});
				};
				AccountsCtrl.homepage(req, { send: resFn }, nonext);
			});
            it('a topstory collection', function(done) {
                var req = {
                    account: newAccount2,
                    cache: Cache.acc(newAccount2)
                };
                var resFn = function(status, body) {
                    expect(status).to.equal(200);
                    expect(body).to.have.property('topstory');
                    expect(body.topstory).to.have.property('collection');
                    expect(body.topstory.collection).to.have.property('_id');
                    Collection.findOne({title: 'emo collection'}, function(err, topstory) {
                        if (err) throw err;
                        expect(body.topstory.collection._id.toString()).to.equal(topstory.id.toString());
                        done();
                    });
                };
                AccountsCtrl.homepage(req, { send: resFn }, nonext);
            });
			it('last 15 pages', function(done) {
				var resFn = function(status, body) {
					expect(status).to.equal(200);
					expect(body).to.have.property('pages');
					expect(body.pages).to.be.a('Array');
					expect(body.pages.length).to.equal(15);
					body.pages.forEach(function(page) {
						expect(page.account_id.toString()).to.equal(newAccount.id.toString());
					});
					done();
				};
				AccountsCtrl.homepage(req, { send: resFn }, nonext);
			});
			it('2 random pages', function(done) {
				var resFn = function(status, body) {
					expect(status).to.equal(200);
					expect(body).to.have.property('randomPages');
					expect(body.randomPages).to.be.a('Array');
					expect(body.randomPages.length).to.equal(2);
					body.pages.forEach(function(page) {
						expect(page.account_id.toString()).to.equal(newAccount.id.toString());
					});
					done();
				};
				AccountsCtrl.homepage(req, { send: resFn }, nonext);
			});
			it('last 5 collections', function(done) {
				var resFn = function(status, body) {
					expect(status).to.equal(200);
					expect(body).to.have.property('collections');
					expect(body.collections).to.be.a('Array');
					expect(body.collections.length).to.equal(5);
					body.collections.forEach(function(collection) {
						expect(collection.account_id.toString()).to.equal(newAccount.id.toString());
					});
					done();
				};
				AccountsCtrl.homepage(req, { send: resFn }, nonext);
			});
			it('all categories', function(done) {
				var resFn = function(status, body) {
					expect(status).to.equal(200);
					expect(body).to.have.property('categories');
					expect(body.categories).to.be.a('Array');
					expect(body.categories.length).to.equal(5);
					body.categories.forEach(function(category) {
						expect(category.account_id.toString()).to.equal(newAccount.id.toString());
					});
					done();
				};
				AccountsCtrl.homepage(req, { send: resFn }, nonext);
			});
			it('all topics', function(done) {
				var resFn = function(status, body) {
					expect(status).to.equal(200);
					expect(body).to.have.property('topics');
					expect(body.topics).to.be.a('Array');
					expect(body.topics.length).to.equal(3);
					expect(body.topics).to.have.members(
						['Interview', 'Aus dem Strebergarten', 'Multikulti']
					);
					done();
				};
				AccountsCtrl.homepage(req, { send: resFn }, nonext);
			});
			it('all tags', function(done) {
				var resFn = function(status, body) {
					expect(status).to.equal(200);
					expect(body).to.have.property('tags');
					expect(body.tags).to.be.a('Array');
					expect(body.tags.length).to.equal(12);
					expect(body.tags).to.have.members(
						['medienportal', 'schule', 'langweilig', 'groß', 'penis', 'sex', 'lustig', 'haha', 'video', 'lehrer', 'eichhörnchen', 'schulgarten']
					);
					done();
				};
				AccountsCtrl.homepage(req, { send: resFn }, nonext);
			});
			it('all users of same account', function(done) {
				var resFn = function(status, body) {
					expect(status).to.equal(200);
					expect(body).to.have.property('users');
					expect(body.users).to.be.a('Array');
					expect(body.users.length).to.equal(5);
					body.users.forEach(function(user) {
						expect(user.account_id.toString()).to.equal(newAccount.id.toString());
					});
					done();
				};
				AccountsCtrl.homepage(req, { send: resFn }, nonext);
			});
			it('last activities', function(done) {
				var resFn = function(status, body) {
					expect(status).to.equal(200);
					expect(body).to.have.property('activities');
					expect(body.activities).to.be.a('Array');
					expect(body.activities.length).to.equal(1);
					body.activities.forEach(function(activity) {
						expect(activity.account_id.toString()).to.equal(newAccount.id.toString());
					});
					done();
				};
				AccountsCtrl.homepage(req, { send: resFn }, nonext);
			});
		});
		describe('lists in start request for specific user: ', function() {
			var req;
			var users = [];
			beforeEach(function(done) {
				Cache.purge();
				User.findOne({first_name: 'Alexis'}, function(_err, _alexis) {
					req = {
						account: newAccount,
						cache: Cache.acc(newAccount.id),
						current_user: _alexis,
						params: {
							user_id: _alexis._id.toString()
						},
						param: function(key) { return this.params[key]; }
					};
					done();
				});
			});
			it('should return a 404 if no user given', function(done) {
				req.params.user_id = undefined;
				AccountsCtrl.getHomeForUser(req, {
					send: function(status, body) {
						expect(status).to.equal(404);
						expect(body).to.not.exist;
						done();
					}
				}, nonext);
			});
			it('should return a 403 if current user does not equal user_id', function(done) {
				User.findOne({ first_name: 'Christopher' }, function(_err, _billy) {
					if (_err) { throw _err; }
					req.params.user_id = _billy;
					AccountsCtrl.getHomeForUser(req, {
						send: function(status, body) {
							expect(status).to.equal(403);
							expect(body).to.not.exist;
							done();
						}
					}, nonext);
				});
			});
			it('should return all of the users\' own pages and collections of same account', function(done) {
				AccountsCtrl.getHomeForUser(req, {
					send: function(status, body) {
						expect(status).to.equal(200);
						expect(body).to.have.property('pages');
						expect(body.pages.length).to.equal(4);
						body.pages.forEach(function(page) {
							expect(req.current_user.isAuthorOf(page)).to.equal(true);
							expect(page.status).not.to.equal('PUBLISHED');
						});
						done();
					}
				}, nonext);
			});
			it('should return all \'ready\' and \'controlled\' articles if user is admin', function(done) {
				User.findOne({ first_name: 'Eike' }, function(_err, _eike) {
					req.params.user_id = _eike._id.toString();
					req.current_user = _eike;
					AccountsCtrl.getHomeForUser(req, {
						send: function(status, body) {
							expect(status).to.equal(200);
							expect(body).to.have.property('pages');
							expect(body.pages.length).to.equal(4);
							done();
						}
					}, nonext);
				});
			});
		});
	});
	describe('set an account configuration', function() {
		var adminUser,
			req,
			i = 0;
		beforeEach(function(done) {
			req = {
				account: newAccount,
				cache: Cache.acc(newAccount.id),
				params: {},
				body: {
					config: {
						theData: 'theValue'
					}
				},
				param: function(key) { return this.params[key]; }
			};
			req.current_user = new User({
				first_name: 'Alexis',
				last_name: 'Rinaldoni',
				email: 'abcd123AccountAdmin' + i + '@ajsdkfa.de',
				verified: true,
				gender: 'male',
				permissions: {},
				account_id: newAccount.id
			});
			req.current_user.permissions[newAccount.id] = { admin: true };
			req.current_user.save(done);
			i++;
		});
		it('should return a 403 if user is not logged in', function(done) {
			req.current_user = null;
			var res = {
				send: function(status, body) {
					expect(status).to.equal(403);
					expect(body).not.to.exist;
					done();
				}
			};
			AccountsCtrl.setConfig(req, res, nonext);
		});
		it('should return a 403 if user is not admin', function(done) {
			req.current_user.permissions[newAccount.id] = {};
			var res = {
				send: function(status, body) {
					expect(status).to.equal(403);
					expect(body).not.to.exist;
					done();
				}
			};
			AccountsCtrl.setConfig(req, res, nonext);
		});
		it('should return a 400 if no config was given', function(done) {
			req.body.config = null;
			var res = {
				send: function(status, body) {
					expect(status).to.equal(400);
					expect(body).not.to.exist;
					done();
				}
			};
			AccountsCtrl.setConfig(req, res, nonext);
		});
		it('should update the config if all is OK. Only update selected data.', function(done) {
			var res = {
				send: function(status, body) {
					expect(status).to.equal(200);
					expect(body).to.have.property('account');
					expect(body.account).to.have.property('config');
					expect(body.account.config.theData).to.equal('theValue');
					expect(body.account.config.testkey).to.equal('testvalue');
					done();
				}
			};
			AccountsCtrl.setConfig(req, res, nonext);
		});
	})
});
