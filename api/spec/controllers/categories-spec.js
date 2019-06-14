var config = require('../../config'),
	mongoose = require('mongoose'),
	assert = require('assert'),
	async = require('async'),
	Category = require('../../model/category'),
	CategoryCtrl = require('../../controller/categories'),
	Account = require('../../model/account'),
	Page = require('../../model/page'),
	Collection = require('../../model/collection'),
	User = require('../../model/user'),
	Cache = require('../../service/cache'),
	chai = require('chai'),
	expect = chai.expect,
	nonext = function(err) { throw 'This function should not have been called!' };

describe('Categories Controller', function() {
	var categories;
	before(function (done) {
		Account.create({
			title: 'test_account',
			_id: '507f1f77bcf86cd799439011'
		}, done);
	});
	before(function(done) {
		process.env.NODE_ENV = 'test';
		mongoose.connect(config.mongo.db, {}, function() {
			async.series([
				function(cb) { Account.remove(cb) },
				function(cb) { Category.remove(cb) }
			], done);
		});
	});
	before(function(done) {
		categoryData = [
			{
				title: 'Super Articles',
				account_id: '507f1f77bcf86cd799439011'
			},
			{
				title: 'Mega Articles',
				account_id: '507f1f77bcf86cd799439011'
			},
			{
				title: 'Photos',
				account_id: '507f1f77bcf86cd799439011'
			},
			{
				title: 'Art Galleries',
				account_id: '507f1f77bcf86cd799439011'
			},
			{
				title: 'Greetings',
				account_id: '507f1f77bcf86cd799439011'
			},
			{
				title: 'Super Duper Category',
				account_id: '507f1f77bcf86cd799439012'
			},
			{
				title: 'Yuhuu',
				account_id: '507f1f77bcf86cd799439012'
			}
		];
		async.map(categoryData, function(item, cb) { Category.create(item, cb); }, function (err, _categories) {
			categories = _categories;
			done();
		});
	});

	describe('list categories', function() {
		var req;
		beforeEach(function() {
			req = {
				param: function(name) { return this.params[name]; },
				params: { },
				connection: { remoteAddress: '127.0.0.1' },
				body: {}
			}
		});
		it('returns a 400 if no account id is given for category listing', function(done) {
			CategoryCtrl.list(req, { send: function(status, body) {
				expect(status).to.equal(400);
				expect(body).not.to.exist;
				done();
			} }, nonext);
		});
		it('lists only the categories that belong to the right account', function(done) {
			req.account = { id: '507f1f77bcf86cd799439011' };
			req.cache = Cache.acc('507f1f77bcf86cd799439011');
			CategoryCtrl.list(req, { send: function(status, body) {
				expect(status).to.equal(200);
				expect(body).to.have.property('categories');
				expect(body.categories.length).to.equal(5);
				body.categories.forEach(function(page) {
					expect(page.account_id.toString()).to.equal("507f1f77bcf86cd799439011");
				});
				done();
			} }, nonext);
		});
	});

	describe('list category collections', function() {
		var myCategory, req, admin_user;
		before(function(done) {
			admin_user = new User({name: 'testuser, is admin', permissions: { '507f1f77bcf86cd799439019': { admin: true } }, account_id: '507f1f77bcf86cd799439019'}),
			myCategory = categories[1];
			req = {
				current_user: admin_user,
				account: { id: '507f1f77bcf86cd799439011' },
				body: {},
				param: function(name) { return this.params[name]; },
				params: { 'category_id': myCategory.id },
				cache: Cache.acc('507f1f77bcf86cd799439011')
			};
			var collections = [
				{
					title: 'My Collection',
					account_id: '507f1f77bcf86cd799439011',
					category_id: myCategory.id,
					tags: ['medienportal', 'schule', 'langweilig']
				},
				{
					title: 'My Collection ACC1 2',
					account_id: '507f1f77bcf86cd799439011',
					category_id: myCategory.id,
					tags: ['medienportal', 'schule', 'langweilig', 'groß']
				},
				{
					title: 'My Collection ACC1 3',
					account_id: '507f1f77bcf86cd799439011',
					category_id: '107f1f77bcf86cd799439012',
					tags: ['penis', 'sex', 'lustig', 'haha']
				},
				{
					title: 'My Collection ACC1 4',
					account_id: '507f1f77bcf86cd799439011',
					category_id: '107f1f77bcf86cd799439013',
					tags: ['schule', 'video', 'lehrer']
				},
				{
					title: 'My Collection ACC1 5',
					account_id: '507f1f77bcf86cd799439011',
					category_id: myCategory.id,
					tags: ['eichhörnchen', 'schulgarten']
				},
				{
					title: 'My Collection ACC2 1',
					account_id: '507f1f77bcf86cd799439012',
					category_id: '107a4f89adb82ab184398371',
					tags: ['blumengarten', 'schule']
				},
				{
					title: 'My Collection ACC2 2',
					account_id: '507f1f77bcf86cd799439012',
					category_id: '107a4f89adb82ab184398371',
					tags: ['fotographie', 'kleinkunst', 'ganz', 'groß']
				}
			];
			async.map(collections, function(item, cb) { Collection.create(item, cb); }, done);
		});
		it('should return a category and its pages', function(done) {
			CategoryCtrl.getCategoryWithPagesAndCollectionsAndModules(req, { send: function(status, body) {
				expect(status).to.equal(200);
				expect(body).to.have.property('category');
				expect(body.category._id.toString()).to.equal(myCategory._id.toString());
				expect(body).to.have.property('collections');
				expect(body.collections).to.be.a('Array');
				expect(body.collections.length).to.equal(3);
				done();
			} }, nonext)
		});
	});

	describe('list category pages', function() {
		var myCategory, req, admin_user;
		before(function(done) {
			admin_user = new User({name: 'testuser, is admin', permissions: { '507f1f77bcf86cd799439019': { admin: true } }, account_id: '507f1f77bcf86cd799439019'}),
			myCategory = categories[0];
			req = {
				current_user: admin_user,
				account: { id: '507f1f77bcf86cd799439011' },
				body: {},
				param: function(name) { return this.params[name]; },
				params: { 'category_id': myCategory.id }
			};
			req.cache = Cache.acc(req.account.id);
			var pages = [
				{
					title: 'My Page ACC1 1',
					account_id: '507f1f77bcf86cd799439011',
					category_id: myCategory.id,
					tags: ['medienportal', 'schule', 'langweilig']
				},
				{
					title: 'My Page ACC1 2',
					account_id: '507f1f77bcf86cd799439011',
					category_id: myCategory.id,
					tags: ['medienportal', 'schule', 'langweilig', 'groß']
				},
				{
					title: 'My Page ACC1 3',
					account_id: '507f1f77bcf86cd799439011',
					category_id: '107f1f77bcf86cd799439012',
					tags: ['penis', 'sex', 'lustig', 'haha']
				},
				{
					title: 'My Page ACC1 4',
					account_id: '507f1f77bcf86cd799439011',
					category_id: '107f1f77bcf86cd799439013',
					tags: ['schule', 'video', 'lehrer']
				},
				{
					title: 'My Page ACC1 5',
					account_id: '507f1f77bcf86cd799439011',
					category_id: myCategory.id,
					tags: ['eichhörnchen', 'schulgarten']
				},
				{
					title: 'My Page ACC2 1',
					account_id: '507f1f77bcf86cd799439012',
					category_id: '107a4f89adb82ab184398371',
					tags: ['blumengarten', 'schule']
				},
				{
					title: 'My Page ACC2 2',
					account_id: '507f1f77bcf86cd799439012',
					category_id: '107a4f89adb82ab184398371',
					tags: ['fotographie', 'kleinkunst', 'ganz', 'groß']
				}
			];
			async.map(pages, function(item, cb) { Page.create(item, cb); }, done);
		});
		it('should return a category and its pages', function(done) {
			CategoryCtrl.getCategoryWithPagesAndCollectionsAndModules(req, { send: function(status, body) {
				expect(status).to.equal(200);
				expect(body).to.have.property('category');
				expect(body.category._id.toString()).to.equal(myCategory._id.toString());
				expect(body).to.have.property('pages');
				expect(body.pages).to.be.a('Array');
				expect(body.pages.length).to.equal(3);
				done();
			} }, nonext)
		});
	});

	// TODO: Test rights on category creation
	describe('add category', function() {
		var not_admin_user = new User({name: 'testuser, not admin', permissions: { '507f1f77bcf86cd799439019': { admin: false } }, account_id: '507f1f77bcf86cd799439019' }),
			admin_user = new User({name: 'testuser, is admin', permissions: { '507f1f77bcf86cd799439011': { admin: true } }, account_id: '507f1f77bcf86cd799439011'}),
			admin_user_foreign_account = new User({name: 'testuser, is admin', permissions: { '507f1f77bcf86cd799439013': { admin: true } }, account_id: '507f1f77bcf86cd799439013'});
		it('should return a 400 if no account is given', function(done) {
			var req = {
				body: {
					category: {
						title: 'Meine Kategorie'
					}
				}
			};
			CategoryCtrl.create(req, { send: function(status, body) {
				expect(status).to.equal(400);
				expect(body).to.not.exist;
				done();
			} }, nonext);
		});
		it('should return a 401 if user is not logged in', function(done) {
			var req = {
				account: { id: '507f1f77bcf86cd799439011' },
				body: {
					category: {
						title: 'Meine Kategorie'
					}
				}
			};
			CategoryCtrl.create(req, { send: function(status, body) {
				expect(status).to.equal(401);
				expect(body).to.not.exist;
				done();
			} }, nonext)
		});
		it('should return a 403 if user is not admin', function(done) {
			var req = {
				current_user: not_admin_user,
				account: { id: '507f1f77bcf86cd799439011' },
				body: {
					category: {
						title: 'Meine Kategorie'
					}
				}
			};
			CategoryCtrl.create(req, { send: function(status, body) {
				expect(status).to.equal(403);
				expect(body).to.not.exist;
				done();
			} }, nonext)
		});
		it('should add a category if all info is given and user is admin', function(done) {
			var req = {
				account: { id: '507f1f77bcf86cd799439011' },
				current_user: admin_user,
				body: {
					category: {
						title: 'Meine Kategorie'
					}
				}
			};
			CategoryCtrl.create(req, { send: function(status, body) {
				expect(status).to.equal(200);
				expect(body).to.have.property('category');
				expect(body.category).to.have.property('title');
				expect(body.category.title).to.equal('Meine Kategorie');
				expect(body.category).to.have.property('created_at');
				done();
			} }, nonext)
		});
	});

	describe('remove category', function() {
		var not_admin_user = new User({name: 'testuser, not admin', permissions: { '507f1f77bcf86cd799439019': { admin: false } }, account_id: '507f1f77bcf86cd799439019' }),
			admin_user = new User({name: 'testuser, is admin', permissions: { '507f1f77bcf86cd799439011': { admin: true } }, account_id: '507f1f77bcf86cd799439011'}),
			admin_user_foreign_account = new User({name: 'testuser, is admin', permissions: { '507f1f77bcf86cd799439013': { admin: true } }, account_id: '507f1f77bcf86cd799439013'}),
			req,
			categoryToBeRemoved;
		beforeEach(function() {
			req = {
				current_user: admin_user,
				account: { id: '507f1f77bcf86cd799439011' },
				body: {},
				param: function(name) { return this.params[name]; },
				params: { 'category_id': categoryToBeRemoved.id }
			};
		})
		before(function(done) {
			categoryToBeRemoved = new Category({
				title: 'Super Articles',
				account_id: '507f1f77bcf86cd799439011'
			});
			categoryToBeRemoved.save(done);
		});
		it('should return a 400 if no category_id is given', function(done) {
			req.params.category_id = null;
			CategoryCtrl.remove(req, { send: function(status, body) {
				expect(status).to.equal(400);
				expect(body).to.not.exist;
				done();
			} }, nonext);
		});
		it('should return a 403 if user is not logged in', function(done) {
			req.current_user = undefined;
			CategoryCtrl.remove(req, { send: function(status, body) {
				expect(status).to.equal(403);
				expect(body).to.not.exist;
				done();
			} }, nonext)
		});
		it('should return a 403 if user is not admin of account', function(done) {
			req.current_user = not_admin_user;
			CategoryCtrl.remove(req, { send: function(status, body) {
				expect(status).to.equal(403);
				expect(body).to.not.exist;
				done();
			} }, nonext)
		});
		it('should remove the category if all info is given and user is admin', function(done) {
			CategoryCtrl.remove(req, { send: function(status, body) {
				expect(status).to.equal(200);
				Category.findById(categoryToBeRemoved.id, function(err, cat) {
					expect(err).not.to.exist;
					expect(cat).not.to.exist;
					done();
				});
			} }, nonext)
		});
	});

	describe('edit category', function() {
		var category,
			not_admin_user = new User({name: 'testuser, not admin', permissions: { '507f1f77bcf86cd799439019': { admin: false } }, account_id: '507f1f77bcf86cd799439019'}),
			admin_user = new User({name: 'testuser, is admin', permissions: { '507f1f77bcf86cd799439019': { admin: true } }, account_id: '507f1f77bcf86cd799439019'});
			admin_user_foreign_account = new User({name: 'testuser, is admin', permissions: { '507f1f77bcf86cd799439013': { admin: true } }, account_id: '507f1f77bcf86cd799439013'});
		before(function(done) {
			category = new Category({
				title: 'Meine Kategorie',
				config: {},
				navigation: [{title: "2014"}, {title: "2013"}],
				account_id: '507f1f77bcf86cd799439019'
			});
			category.save(done);
		});
		it('should return a 400 if no account is given', function(done) {
			var changed_category = { title: 'Meine neue Kategorie' }
			var req = {
				body: {
					category: changed_category
				},
				param: function(name) { return this.params[name]; },
				params: { 'category_id': category.id }
			};
			CategoryCtrl.update(req, { send: function(status, body) {
				expect(status).to.equal(400);
				expect(body).to.not.exist;
				done();
			} }, nonext)
		});
		it('should return a 401 if user is not logged in', function(done) {
			var req = {
				account: { id: '507f1f77bcf86cd799439019' },
				body: {
					category: {
						title: 'Meine Kategorie'
					}
				},
				param: function(name) { return this.params[name]; },
				params: { 'category_id': category.id }
			};
			CategoryCtrl.update(req, { send: function(status, body) {
				expect(status).to.equal(401);
				expect(body).to.not.exist;
				done();
			} }, nonext)
		});
		it('should return a 403 if user is not admin', function(done) {
			var req = {
				current_user: not_admin_user,
				account: { id: '507f1f77bcf86cd799439019' },
				body: {
					category: {
						title: 'Meine Kategorie'
					}
				},
				param: function(name) { return this.params[name]; },
				params: { 'category_id': category.id }
			};
			CategoryCtrl.update(req, { send: function(status, body) {
				expect(status).to.equal(403);
				expect(body).to.not.exist;
				done();
			} }, nonext)
		});
		it('should return a 404 if user is admin, but category is not found', function(done) {
			var req = {
				current_user: admin_user,
				account: { id: '507f1f77bcf86cd799439019' },
				body: {
					category: {
						title: 'Meine editierte Kategorie'
					}
				},
				param: function(name) { return this.params[name]; },
				params: { 'category_id': '507f1f77bcf86cd795555555' }
			};
			CategoryCtrl.update(req, { send: function(status, body) {
				expect(status).to.equal(404);
				expect(body).to.not.exist;
				done();
			} }, nonext)
		});
		it('should return a 403 if user is admin, but from another account', function(done) {
			var req = {
				current_user: admin_user_foreign_account,
				account: { id: '507f1f77bcf86cd799439011' },
				body: {
					category: {
						title: 'Meine editierte Kategorie'
					}
				},
				param: function(name) { return this.params[name]; },
				params: { 'category_id': categories[categories.length-1].id }
			};
			CategoryCtrl.update(req, { send: function(status, body) {
				expect(status).to.equal(403);
				expect(body).to.not.exist;
				done();
			} }, nonext)
		});
		it('should edit a category if all info is given and user is admin', function(done) {
			var req = {
				current_user: admin_user,
				account: { id: '507f1f77bcf86cd799439019' },
				body: {
					category: {
						title: 'Meine editierte Kategorie'
					}
				},
				param: function(name) { return this.params[name]; },
				params: { 'category_id': categories[0].id }
			};
			CategoryCtrl.update(req, { send: function(status, body) {
				expect(status).to.equal(200);
				expect(body).to.have.property('category');
				expect(body.category).to.have.property('title');
				expect(body.category.title).to.equal('Meine editierte Kategorie');
				expect(body.category).to.have.property('created_at');
				done();
			} }, nonext)
		});
	});

	it('subcategory', function() {
		var category,
			req;
			not_admin_user = new User({name: 'testuser, not admin', permissions: { '507f1f77bcf86cd799439007': { admin: false } }, account_id: '507f1f77bcf86cd799439019' }),
			admin_user = new User({name: 'testuser, is admin', permissions: { '507f1f77bcf86cd799439007': { admin: true } }, account_id: '507f1f77bcf86cd799439011'}),
			admin_user_foreign_account = new User({name: 'testuser, is admin', permissions: { '507f1f77bcf86cd799439013': { admin: true } }, account_id: '507f1f77bcf86cd799439013'});
		beforeEach(function(done) {
			category = new Category({
				title: 'Meine Neue Kategorie',
				account_id: '507f1f77bcf86cd799439007'
			});
			category.save(done);
		});
		beforeEach(function() {
			req = {
				params: {
					category_id: category.id
				},
				param: function(key) { return this.params[key]; },
				body: {},
				account: {
					id: '507f1f77bcf86cd799439007',
					_id: '507f1f77bcf86cd799439007'
				}
			}
		});

		// TODO: Test rights on category creation
		describe('add subcategory', function() {
			it('should return a 400 if no category is given', function(done) {
				req.params.category_id = undefined;
				CategoryCtrl.addSubcategory(req, { send: function(status, body) {
					expect(status).to.equal(400);
					expect(body).to.not.exist;
					done();
				} }, nonext);
			});
			it('should return a 400 if no subcategory body is given', function(done) {
				req.current_user = admin_user;
				CategoryCtrl.addSubcategory(req, { send: function(status, body) {
					expect(status).to.equal(400);
					expect(body).to.not.exist;
					done();
				} }, nonext);
			});
			it('should return a 401 if user is not logged in', function(done) {
				CategoryCtrl.addSubcategory(req, { send: function(status, body) {
					expect(status).to.equal(401);
					expect(body).to.not.exist;
					done();
				} }, nonext)
			});
			it('should return a 403 if user is not admin', function(done) {
				req.current_user = not_admin_user;
				CategoryCtrl.addSubcategory(req, { send: function(status, body) {
					expect(status).to.equal(403);
					expect(body).to.not.exist;
					done();
				} }, nonext)
			});
			it('should return a 403 if user is admin of other account', function(done) {
				req.current_user = admin_user_foreign_account;
				CategoryCtrl.addSubcategory(req, { send: function(status, body) {
					expect(status).to.equal(403);
					expect(body).to.not.exist;
					done();
				} }, nonext)
			});
			it('should add a subcategory if all info is given and user is admin', function(done) {
				req.body = {
					subcategory: {
						title: 'this is my subcategory',
						position: 0
					}
				};
				req.current_user = admin_user;
				CategoryCtrl.addSubcategory(req, { send: function(status, body) {
					expect(status).to.equal(200);
					expect(body).to.have.property('category');
					expect(body.category).to.have.property('title');
					expect(body.category.title).to.equal('Meine Neue Kategorie');
					expect(body.category).to.have.property('navigation');
					expect(body.category.navigation.length).to.equal(1);
					var subcategory = body.category.navigation[0];
					expect(subcategory).to.have.property('title');
					expect(subcategory.title).to.equal('this is my subcategory');
					expect(body).to.have.property('subcategory');
					expect(body.subcategory.title).to.equal('this is my subcategory');
					expect(body.subcategory).to.have.property('_id');
					done();
				} }, nonext)
			});
		});

		describe('remove subcategory', function() {
			var not_admin_user = new User({name: 'testuser, not admin', permissions: { '507f1f77bcf86cd799439007': { admin: false } }, account_id: '507f1f77bcf86cd799439007' }),
				admin_user = new User({name: 'testuser, is admin', permissions: { '507f1f77bcf86cd799439007': { admin: true } }, account_id: '507f1f77bcf86cd799439007'}),
				admin_user_foreign_account = new User({name: 'testuser, is admin', permissions: { '507f1f77bcf86cd799439013': { admin: true } }, account_id: '507f1f77bcf86cd799439013'}),
				req,
				categoryToBeRemoved;
			before(function(done) {
				categoryToBeRemoved = new Category({
					title: 'Super Articles',
					account_id: '507f1f77bcf86cd799439007'
				});
				categoryToBeRemoved.save(function(err) {
					if (err) { done(err); }
					Category.findByIdAndUpdate(categoryToBeRemoved.id, {
						$push: {
							navigation: {
								title: 'My first Sub',
								position: 1
							}
						}
					}, function(_err, _cat) {
						if (_err) { return done(_err); }
						Category.findById(_cat.id, function(__err, __cat) {
							if (__err) { return done(__err); }
							categoryToBeRemoved = __cat;
							done();
						});
					});
				});
			});
			beforeEach(function() {
				req = {
					current_user: admin_user,
					account: { id: '507f1f77bcf86cd799439007' },
					body: {},
					param: function(name) { return this.params[name]; },
					params: {
						'category_id': categoryToBeRemoved.id,
						'subcategory_id': categoryToBeRemoved.navigation[0].id
					}
				};
			});
			it('should return a 400 if no category_id is given', function(done) {
				req.params.category_id = null;
				CategoryCtrl.removeSubcategory(req, { send: function(status, body) {
					expect(status).to.equal(400);
					expect(body).to.not.exist;
					done();
				} }, nonext);
			});
			it('should return a 400 if no subcategory_id is given', function(done) {
				req.params.subcategory_id = null;
				CategoryCtrl.removeSubcategory(req, { send: function(status, body) {
					expect(status).to.equal(400);
					expect(body).to.not.exist;
					done();
				} }, nonext);
			});
			it('should return a 403 if user is not logged in', function(done) {
				req.current_user = undefined;
				CategoryCtrl.removeSubcategory(req, { send: function(status, body) {
					expect(status).to.equal(403);
					expect(body).to.not.exist;
					done();
				} }, nonext)
			});
			it('should return a 403 if user is not admin of account', function(done) {
				req.current_user = not_admin_user;
				CategoryCtrl.removeSubcategory(req, { send: function(status, body) {
					expect(status).to.equal(403);
					expect(body).to.not.exist;
					done();
				} }, nonext)
			});
			it('should return a 404 if category_id is not correct', function(done) {
				req.params.category_id = 'abcdefjsadfkl';
				CategoryCtrl.removeSubcategory(req, { send: function(status, body) {
					expect(status).to.equal(404);
					expect(body).to.not.exist;
					done();
				} }, nonext)
			});
			it('should return a 404 if subcategory_id is not correct', function(done) {
				req.params.subcategory_id = 'abcdefjsadfkl';
				CategoryCtrl.removeSubcategory(req, { send: function(status, body) {
					expect(status).to.equal(404);
					expect(body).to.not.exist;
					done();
				} }, nonext)
			});
			it('should delete the category if all info is given and user is admin', function(done) {
				var subcategories = categoryToBeRemoved.navigation;
				CategoryCtrl.removeSubcategory(req, { send: function(status, body) {
					expect(status).to.equal(200);
					Category.findById(categoryToBeRemoved.id, function(err, cat) {
						expect(cat.navigation.length).to.equal(subcategories.length - 1);
						done();
					});
				} }, nonext)
			});
		});

		describe('edit subcategory', function() {
			var category,
				req,
				not_admin_user = new User({name: 'testuser, not admin', permissions: { '507f1f77bcf86cd799439019': { admin: false } }, account_id: '507f1f77bcf86cd799439019'}),
				admin_user = new User({name: 'testuser, is admin', permissions: { '507f1f77bcf86cd799439019': { admin: true } }, account_id: '507f1f77bcf86cd799439019'});
				admin_user_foreign_account = new User({name: 'testuser, is admin', permissions: { '507f1f77bcf86cd799439013': { admin: true } }, account_id: '507f1f77bcf86cd799439013'});
			before(function(done) {
				categoryToBeEdited = new Category({
					title: 'Kategorie zu bearbeiten',
					config: {},
					navigation: [],
					account_id: '507f1f77bcf86cd799439019'
				});
				categoryToBeEdited.save(function(err, _category) {
					async.series([
						function(finished) {
							Category.findByIdAndUpdate(categoryToBeEdited.id, {
								$push: {
									navigation: { title: '2013', position: 3 }
								}
							}, finished);
						}, function(finished) {
							Category.findByIdAndUpdate(categoryToBeEdited.id, {
								$push: {
									navigation: { title: '2014', position: 2 }
								}
							}, finished);
						}, function(finished) {
							Category.findByIdAndUpdate(categoryToBeEdited.id, {
								$push: {
									navigation: { title: '2013', position: 1 }
								}
							}, finished);
						}, function(finished) {
							Category.findById(categoryToBeEdited.id, finished);
						}
					], function(_err, results) {
						categoryToBeEdited = results[results.length - 1];
						done(_err);
					});
				});
			});
			beforeEach(function() {
				req = {
					current_user: admin_user,
					account: { id: '507f1f77bcf86cd799439019' },
					body: {
						subcategory: {
							title: 'Ein neuer Titel',
							position: 99
						}
					},
					param: function(name) { return this.params[name]; },
					params: {
						'category_id': categoryToBeEdited.id,
						'subcategory_id': categoryToBeEdited.navigation[0].id
					}
				};
			});
			it('should return a 400 if no category_id is given', function(done) {
				req.params.category_id = null;
				CategoryCtrl.editSubcategory(req, { send: function(status, body) {
					expect(status).to.equal(400);
					expect(body).to.not.exist;
					done();
				} }, nonext);
			});
			it('should return a 400 if no subcategory_id is given', function(done) {
				req.params.subcategory_id = null;
				CategoryCtrl.editSubcategory(req, { send: function(status, body) {
					expect(status).to.equal(400);
					expect(body).to.not.exist;
					done();
				} }, nonext);
			});
			it('should return a 400 if no category object is passed', function(done) {
				req.body.subcategory = null;
				CategoryCtrl.editSubcategory(req, { send: function(status, body) {
					expect(status).to.equal(400);
					expect(body).to.not.exist;
					done();
				} }, nonext);
			});
			it('should return a 403 if user is not logged in', function(done) {
				req.current_user = undefined;
				CategoryCtrl.editSubcategory(req, { send: function(status, body) {
					expect(status).to.equal(403);
					expect(body).to.not.exist;
					done();
				} }, nonext)
			});
			it('should return a 403 if user is not admin of account', function(done) {
				req.current_user = not_admin_user;
				CategoryCtrl.editSubcategory(req, { send: function(status, body) {
					expect(status).to.equal(403);
					expect(body).to.not.exist;
					done();
				} }, nonext)
			});
			it('should return a 404 if category_id is not correct', function(done) {
				req.params.category_id = 'abcdefjsadfkl';
				CategoryCtrl.editSubcategory(req, { send: function(status, body) {
					expect(status).to.equal(404);
					expect(body).to.not.exist;
					done();
				} }, nonext)
			});
			it('should return a 404 if subcategory_id is not correct', function(done) {
				req.params.subcategory_id = 'abcdefjsadfkl';
				CategoryCtrl.editSubcategory(req, { send: function(status, body) {
					expect(status).to.equal(404);
					expect(body).to.not.exist;
					done();
				} }, nonext)
			});
			it('should edit the subcategory if all info is given and user is admin', function(done) {
				var subcategory = categoryToBeEdited.navigation[0];
				CategoryCtrl.editSubcategory(req, { send: function(status, body) {
					expect(status).to.equal(200);
					expect(body).to.have.property('category');
					expect(body.category.navigation[0]._id.toString()).to.equal(subcategory.id);
					expect(body.category.navigation[0].position).to.equal(99);
					expect(body.category.navigation[0].title).to.equal('Ein neuer Titel');
					expect(body).to.have.property('subcategory');
					expect(body.subcategory._id.toString()).to.equal(subcategory.id);
					expect(body.subcategory.position).to.equal(99);
					expect(body.subcategory.title).to.equal('Ein neuer Titel');
					done();
				} }, nonext)
			});
		});

	});
});
