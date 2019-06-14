var Page = require('../../model/page'),
	User = require('../../model/user'),
	Comment = require('../../model/comment'),
	CommentsCtrl = require('../../controller/comments'),
	Cache = require('../../service/cache'),
	async = require('async');

describe('list comments', function() {
		var req, loggedInUser, notAdminUser, page, page2, comments;
		beforeEach(function(done) {
			Comment.remove(done);
		});
		before(function(done) {
			loggedInUser = new User({
				first_name: 'Alexis',
				last_name: 'Rinaldoni',
				email: 'logged@commentspec.com',
				permissions: {
					'507f1f77bcf86cd799439013': {
						admin: true
					}
				},
				account_id: '507f1f77bcf86cd799439013'
			});
			notAdminUser = new User({
				first_name: 'Alexis',
				last_name: 'Rinaldoni',
				email: 'notadmin@commentspec.com',
				permissions: {
					'507f1f77bcf86cd799439013': {
						admin: false
					}
				},
				account_id: '507f1f77bcf86cd799439013'
			});
			page = new Page({
				title: 'My Page ACC1 1',
				account_id: '507f1f77bcf86cd799439011',
				category_id: '107f1f77bcf86cd799439011',
				tags: ['medienportal', 'schule', 'langweilig']
			});
			page2 = new Page({
				title: 'My Page in another context',
				account_id: '507f1f77bcf86cd799439013',
				category_id: '107f1f77bcf86cd799439012',
				tags: ['medienportal', 'schule']
			});
			req = {
				param: function(name) { return this.params[name]; },
				params: { },
				connection: { remoteAddress: '127.0.0.1' },
				body: {},
				current_user: loggedInUser
			};
			async.forEach(
				[loggedInUser, page, page2],
				function(item,callback){ item.save(callback); },
				function(err){
					if (err) throw err;
					done();
				}
			);
		});
		beforeEach(function(done) {
			comments = [
				{
					content: 'Hallo, bin ein Testkommentar',
					author: { author_type: 'custom', author_id: 'Tester' },
					account_id: '507f1f77bcf86cd799439013',
					item_id: page.id
				},
				{
					content: 'Hallo, bin ein zweiter Testkommentar',
					author: { author_type: 'custom', author_id: 'Tester' },
					account_id: '507f1f77bcf86cd799439013',
					item_id: page.id
				},
				{
					content: 'Hallo, bin der letzte Testkommentar',
					author: { author_type: 'custom', author_id: 'Tester' },
					account_id: '507f1f77bcf86cd799439013',
					item_id: page.id
				},
				{
					content: 'Hallo, bin ein Testkommentar',
					author: { author_type: 'custom', author_id: 'Tester' },
					account_id: '507f1f77bcf86cd799439011',
					item_id: page.id
				},
				{
					content: 'Hallo, bin ein Testkommentar',
					author: { author_type: 'custom', author_id: 'Tester' },
					account_id: '507f1f77bcf86cd799439011',
					item_id: page.id
				}
			];
			comments = comments.map(function(c) { return new Comment(c); });
			async.map(comments, function(item, cb) { item.save(cb); }, done);
		})
		it('returns a 400 if no account id is given for comments listing', function(done) {
			req.account = undefined;
			CommentsCtrl.list(req, { send: function(status, body) {
				expect(status).to.equal(400);
				expect(body).not.to.exist;
				done();
			} }, nonext);
		});
		it('should only return comments of a given category', function(done) {
			req.account = { id: '507f1f77bcf86cd799439013', _id: '507f1f77bcf86cd799439013' }
			req.cache = Cache.acc(req.account.id);
			CommentsCtrl.list(req, { send: function(status, body) {
				expect(status).to.equal(200);
				expect(body).to.exist;
				expect(body).to.have.property('comments');
				expect(body.comments).to.be.a('Array');
				expect(body.comments.length).to.equal(3);
				body.comments.forEach(function(comment) {
					expect(comment.account_id.toString()).to.equal('507f1f77bcf86cd799439013');
				});
				done();
			} }, nonext);
		});
		describe('reporting', function() {
			it('should return a status 200 if all data is OK', function(done) {
				var comment = comments[0];
				req.params.comment_id = comment._id;
				CommentsCtrl.report(req, { send: function(status, body) {
					expect(status).to.equal(200);
					done();
				} }, nonext);
			});
			it('should return a status 400 if comment_id is missing', function(done) {
				req.params.comment_id = undefined;
				CommentsCtrl.report(req, { send: function(status, body) {
					expect(status).to.equal(400);
					expect(body).to.have.property('error');
					done();
				} }, nonext);
			});
			it('should return a status 404 if comment does not exist', function(done) {
				req.params.comment_id = '507f1f77bcf86cd799439000';
				CommentsCtrl.report(req, { send: function(status, body) {
					expect(status).to.equal(404);
					expect(body).to.have.property('error');
					done();
				} }, nonext);
			});
		});
		describe('unreporting', function() {
			it('should return a status 200 if all data is OK', function(done) {
				var comment = comments[0];
				req.params.comment_id = comment._id;
				CommentsCtrl.unreport(req, { send: function(status, body) {
					expect(status).to.equal(200);
					done();
				} }, nonext);
			});
			it('should return a status 400 if comment_id is missing', function(done) {
				req.params.comment_id = undefined;
				CommentsCtrl.unreport(req, { send: function(status, body) {
					expect(status).to.equal(400);
					expect(body).to.have.property('error');
					done();
				} }, nonext);
			});
			it('should return a status 404 if comment does not exist', function(done) {
				req.params.comment_id = '507f1f77bcf86cd799439000';
				CommentsCtrl.unreport(req, { send: function(status, body) {
					expect(status).to.equal(404);
					expect(body).to.have.property('error');
					done();
				} }, nonext);
			});
			it('should return a status 403 if user is not admin', function(done) {
				var comment = comments[0];
				req.params.comment_id = comment._id;
				req.current_user = notAdminUser;
				CommentsCtrl.unreport(req, { send: function(status, body) {
					expect(status).to.equal(403);
					expect(body).to.have.property('error');
					done();
				} }, nonext);
			});
		});
	});
