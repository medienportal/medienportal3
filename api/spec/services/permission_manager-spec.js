var config = require('../../config'),
	PermissionManager = require('../../service/permission_manager'),
	Account = require('../../model/account'),
	User = require('../../model/user'),
	Page = require('../../model/page'),
	Collection = require('../../model/collection'),
	Category = require('../../model/category'),
	async = require('async'),
	chai = require('chai'),
	expect = chai.expect;

describe('Permission Manager service', function() {
	describe('creating a rights manager instance', function() {
		var account1, account2, user;
		beforeEach(function(done) {
			Account.find({}, function(_err, _accounts) {
				account1 = _accounts[0];
				account2 = _accounts[0];
				user = new User({
					first_name: 'Dalail',
					last_name: 'Lama',
					email: 'dalailama@anexiert.co.cn',
					permissions: {},
					account_id: account1.id
				});
				user.permissions[account1.id] = {
					'admin': true
				}
				done();
			});
		});
		it('should be able to create an instance with user', function() {
			var pm = new PermissionManager(user);
			expect(pm._user).to.equal(user);
		});
		it('should be able to create an instance with user and account', function() {
			var pm = new PermissionManager(user, account1);
			expect(pm._user).to.equal(user);
			expect(pm._account_id).to.equal(account1.id);
		});
		it('should be able to create an instance by shorthand with user', function() {
			var pm = PermissionManager.user(user).account(account1);
			expect(pm._user).to.equal(user);
			expect(pm._account_id).to.equal(account1.id);
		});
	});
	describe('dealing with permissions', function() {
		var account1, account2, categories, user, user2;
		var page1, collection1, page2, collection2;
		before(function(done) {
			async.series([
				function(cb) {
					Account.find({}, function(_err, _accounts) {
						account1 = _accounts[0];
						account2 = _accounts[1];
						cb();
					});
				},
				function(cb) {
					categories = {
						acc1_pages: new Category({
							title: 'Meine Artikel',
							account_id: account1.id
						}),
						acc1_collections: new Category({
							title: 'Meine Alben',
							account_id: account1.id
						}),
						acc2_pages: new Category({
							title: 'Deine Artikel',
							account_id: account2.id
						}),
						acc2_collections: new Category({
							title: 'Deine Alben',
							account_id: account2.id
						})
					};
					var categoriesArray = Object.keys(categories).map(function(k) { return categories[k]; });
					async.map(categoriesArray, function(cat, callback) { cat.save(callback) }, cb);
				},
				function(cb) {
					page1 = new Page({
						account_id: account1.id,
						category_id: categories.acc1_pages.id,
						title: 'This is a page'
					})
					page1.save(cb);
				},
				function(cb) {
					page2 = new Page({
						account_id: account2.id,
						category_id: categories.acc2_pages.id,
						title: 'This is a second page'
					})
					page2.save(cb);
				},
				function(cb) {
					collection1 = new Collection({
						account_id: account1.id,
						category_id: categories.acc1_collections.id,
						title: 'This is a collection'
					})
					collection1.save(cb);
				},
				function(cb) {
					collection2 = new Collection({
						account_id: account2.id,
						category_id: categories.acc1_collections.id,
						title: 'This is a second collection'
					})
					collection2.save(cb);
				},
				function(cb) {
					user1 = new User({
						first_name: 'Dalai',
						last_name: 'Lama',
						email: 'dalailama@anexiert.co.cn',
						permissions: {},
						account_id: account1.id
					});
					user1.permissions[account1.id] = {
						'admin': true
					};
					user1.save(cb);
				},
				function(cb) {
					user2 = new User({
						first_name: 'Dalai',
						last_name: 'Lama',
						email: 'dalailama_thesecond@anexiert.co.cn',
						permissions: {},
						account_id: account2.id
					});
					user2.permissions[account2.id] = {
						'admin': true
					};
					user2.save(cb);
				}
			], function(_err) {
				if (_err) console.log(_err);
				done();
			});
		});
		describe('recognize admin', function() {
			it('admin should be true for user1 and account1', function() {
				var pm = PermissionManager.user(user1).account(account1);
				expect(pm.isAdmin()).to.equal(true);
			});
			it('admin should be true for user2 and account2', function() {
				var pm = PermissionManager.user(user2).account(account2);
				expect(pm.isAdmin()).to.equal(true);
			});
			it('admin should be false for user1 and account2', function() {
				var pm = PermissionManager.user(user1).account(account2);
				expect(pm.isAdmin()).to.equal(false);
			});
			it('admin should be false for user2 and account1', function() {
				var pm = PermissionManager.user(user2).account(account1);
				expect(pm.isAdmin()).to.equal(false);
			});
		});
		describe('recognize editing permissions', function() {
			describe('for admin', function() {
				it('admin should be able to create an article for category of account1', function() {
					var pm = PermissionManager.user(user1).account(account1);
					expect(pm.isAdmin()).to.equal(true);
					expect(pm.can('create', categories.acc1_pages.id)).to.equal(true);
					expect(pm.can('create', categories.acc1_collections.id)).to.equal(true);
				});
				it('admin of other account should not be able to create an article for category of account1', function() {
					var pm = PermissionManager.user(user2).account(account1);
					expect(pm.isAdmin()).to.equal(false);
					expect(pm.can('create', categories.acc1_pages.id)).to.equal(false);
					expect(pm.canCreate(categories.acc1_collections.id)).to.equal(false);
				});
				it('admin should be able to edit an article for category of account1', function() {
					var pm = PermissionManager.user(user1).account(account1);
					expect(pm.isAdmin()).to.equal(true);
					expect(pm.canEdit(page1)).to.equal(true);
					expect(pm.can('edit', page1)).to.equal(true);
				});
				it('admin of other account should not be able to edit an article for category of account1', function() {
					var pm = PermissionManager.user(user2).account(account1);
					expect(pm.isAdmin()).to.equal(false);
					expect(pm.canEdit(page1)).to.equal(false);
					expect(pm.can('edit', page1)).to.equal(false);
				});
				it('admin should be able to delete an article for category of account1', function() {
					var pm = PermissionManager.user(user1).account(account1);
					expect(pm.isAdmin()).to.equal(true);
					expect(pm.canDelete(page1)).to.equal(true);
					expect(pm.can('delete', page1)).to.equal(true);
				});
				it('admin of other account should not be able to delete an article for category of account1', function() {
					var pm = PermissionManager.user(user2).account(account1);
					expect(pm.isAdmin()).to.equal(false);
					expect(pm.canDelete(page1)).to.equal(false);
					expect(pm.can('delete', page1)).to.equal(false);
				});
				it('admin should be able to controll an article for category of account1', function() {
					var pm = PermissionManager.user(user1).account(account1);
					expect(pm.isAdmin()).to.equal(true);
					expect(pm.canSetControlled(page1)).to.equal(true);
					expect(pm.can('setControlled', page1)).to.equal(true);
				});
				it('admin of other account should not be able to setControlled an article for category of account1', function() {
					var pm = PermissionManager.user(user2).account(account1);
					expect(pm.isAdmin()).to.equal(false);
					expect(pm.canSetControlled(page1)).to.equal(false);
					expect(pm.can('setControlled', page1)).to.equal(false);
				});
				it('admin should be able to Publish an article for category of account1', function() {
					var pm = PermissionManager.user(user1).account(account1);
					expect(pm.isAdmin()).to.equal(true);
					expect(pm.canSetPublished(page1)).to.equal(true);
					expect(pm.can('setPublished', page1)).to.equal(true);
				});
				it('admin of other account should not be able to setPublished an article for category of account1', function() {
					var pm = PermissionManager.user(user2).account(account1);
					expect(pm.isAdmin()).to.equal(false);
					expect(pm.canSetPublished(page1)).to.equal(false);
					expect(pm.can('setPublished', page1)).to.equal(false);
				});
			});
			describe('for non-admin', function() {
				before(function() {
					user1.permissions[account1.id].admin = false;
				});
				it('admin should be able to create an article for category of account1', function() {
					user1.permissions[account1.id][categories.acc1_pages.id.toString()] = {
						create: true
					};
					var pm = PermissionManager.user(user1).account(account1);
					expect(pm.isAdmin()).to.equal(false);
					expect(pm.can('create', categories.acc1_pages.id)).to.equal(true);
				});
				it('admin of other account should not be able to create an article for category of account1', function() {
					user1.permissions[account1.id][categories.acc1_pages.id.toString()] = {
						create: false
					};
					var pm = PermissionManager.user(user1).account(account1);
					expect(pm.isAdmin()).to.equal(false);
					expect(pm.can('create', categories.acc1_pages.id)).to.equal(false);
				});
				it('admin should be able to edit an article for category of account1', function() {
					user1.permissions[account1.id][categories.acc1_pages.id.toString()] = {
						edit: true
					};
					var pm = PermissionManager.user(user1).account(account1);
					expect(pm.isAdmin()).to.equal(false);
					expect(pm.can('edit', page1)).to.equal(true);
					expect(pm.canEdit(page1)).to.equal(true);
				});
				it('admin of other account should not be able to edit an article for category of account1', function() {
					user1.permissions[account1.id][categories.acc1_pages.id.toString()] = {
						edit: false
					};
					var pm = PermissionManager.user(user1).account(account1);
					expect(pm.isAdmin()).to.equal(false);
					expect(pm.can('edit', page1)).to.equal(false);
					expect(pm.canEdit(page1)).to.equal(false);
				});
				it('admin should be able to delete an article for category of account1', function() {
					user1.permissions[account1.id][categories.acc1_pages.id.toString()] = {
						delete: true
					};
					var pm = PermissionManager.user(user1).account(account1);
					expect(pm.isAdmin()).to.equal(false);
					expect(pm.can('delete', page1)).to.equal(true);
					expect(pm.canDelete(page1)).to.equal(true);
				});
				it('admin of other account should not be able to delete an article for category of account1', function() {
					user1.permissions[account1.id][categories.acc1_pages.id.toString()] = {
						delete: false
					};
					var pm = PermissionManager.user(user1).account(account1);
					expect(pm.isAdmin()).to.equal(false);
					expect(pm.can('delete', page1)).to.equal(false);
					expect(pm.canDelete(page1)).to.equal(false);
				});
				it('admin should be able to controll an article for category of account1', function() {
					user1.permissions[account1.id][categories.acc1_pages.id.toString()] = {
						setControlled: true
					};
					var pm = PermissionManager.user(user1).account(account1);
					expect(pm.isAdmin()).to.equal(false);
					expect(pm.can('setControlled', page1)).to.equal(true);
					expect(pm.canSetControlled(page1)).to.equal(true);
				});
				it('admin of other account should not be able to SetControlled an article for category of account1', function() {
					user1.permissions[account1.id][categories.acc1_pages.id.toString()] = {
						setControlled: false
					};
					var pm = PermissionManager.user(user1).account(account1);
					expect(pm.isAdmin()).to.equal(false);
					expect(pm.can('setControlled', page1)).to.equal(false);
					expect(pm.canSetControlled(page1)).to.equal(false);
				});
				it('admin should be able to publish an article for category of account1', function() {
					user1.permissions[account1.id][categories.acc1_pages.id.toString()] = {
						setPublished: true
					};
					var pm = PermissionManager.user(user1).account(account1);
					expect(pm.isAdmin()).to.equal(false);
					expect(pm.can('setPublished', page1)).to.equal(true);
					expect(pm.canSetPublished(page1)).to.equal(true);
				});
				it('admin of other account should not be able to publish an article for category of account1', function() {
					user1.permissions[account1.id][categories.acc1_pages.id.toString()] = {
						setPublished: false
					};
					var pm = PermissionManager.user(user1).account(account1);
					expect(pm.isAdmin()).to.equal(false);
					expect(pm.can('setPublished', page1)).to.equal(false);
					expect(pm.canSetPublished(page1)).to.equal(false);
				});
			});
		})
	});
});