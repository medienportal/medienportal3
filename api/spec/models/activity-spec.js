var config = require('../../config'),
	mongoose = require('mongoose'),
	assert = require('assert'),
	async = require('async'),
	Account = require('../../model/account'),
	Activity = require('../../model/activity'),
	Greeting = require('../../model/greeting'),
	Comment = require('../../model/comment'),
	chai = require('chai'),
	expect = chai.expect;

before(function(done) {
	process.env.NODE_ENV = 'test';
	mongoose.connect(config.mongo.db, {}, function() {
		Activity.remove(done);
	});
});
describe('Activity model', function() {
	var account;
	before(function(done) {
		account = new Account({
			title: "activity_spec_test_account"
		});
		account.save(done);
	});

	it('should create a correct Activity from a Greeting', function(done) {
		var greeting;
		async.waterfall([
			function(cb) {
				greeting = new Greeting({
					content: 'Hallo liebe schöne Welt!',
					author: {
						author_type: 'custom',
						author_id: 'Jesus'
					},
					account_id: account.id
				})
				greeting.save(cb);
			},
			function(greeting, num, cb) {
				Activity.fromGreeting(greeting, cb);
			},
			function(_activity, cb) {
				expect(_activity.type).to.equal('greeting');
				expect(_activity.targets.length).to.equal(1);
				expect(_activity.targets[0]).to.have.property('greeting_id');
				expect(_activity.targets[0].greeting_id.toString()).to.equal(greeting.id.toString());
				expect(_activity.content).to.equal(greeting.content);
				expect(_activity).to.have.property('trigger');
				expect(_activity.trigger.author_type).to.equal(greeting.author.author_type);
				expect(_activity.trigger.author_id).to.equal(greeting.author.author_id);
				done();
			}
		]);
	});

	it('should create a correct Activity from a Comment', function(done) {
		var comment;
		async.waterfall([
			function(cb) {
				comment = new Comment({
					content: 'Hallo liebe schöne Welt!',
					author: {
						author_type: 'custom',
						author_id: 'Darth Vador'
					},
					account_id: account.id,
					item_id: '507c7f79bcf86cd7994f6c0e',
					file_id: '507c7f79bcf86cd7994f6c1b'
				});
				comment.save(cb);
			},
			function(comment, num, cb) {
				Activity.fromComment(comment, cb);
			},
			function(_activity, cb) {
				expect(_activity.type).to.equal('comment');
				expect(_activity.targets.length).to.equal(1);
				expect(_activity.targets[0]).to.have.property('comment_id');
				expect(_activity.targets[0].comment_id.toString()).to.equal(comment.id.toString());
				expect(_activity.targets[0].item_id).to.equal(comment.item_id);
				expect(_activity.targets[0].file_id).to.equal(comment.file_id);
				expect(_activity.content).to.equal(comment.content);
				expect(_activity).to.have.property('trigger');
				expect(_activity.trigger.author_type).to.equal(comment.author.author_type);
				expect(_activity.trigger.author_id).to.equal(comment.author.author_id);
				done();
			}
		]);
	});
});
