var config = require('../../config'),
	mongoose = require('mongoose'),
	assert = require('assert'),
	Comment = require('../../model/comment'),
	chai = require('chai'),
	expect = chai.expect;

before(function(done) {
	process.env.NODE_ENV = 'test';
	mongoose.connect(config.mongo.db, {}, function() {
		Comment.remove(done);
	});
});
describe('Comment model', function() {
	var page;
	beforeEach(function(done) {
		comment = new Comment({
			content: 'Hallo, bin ein Testkommentar',
			author: { author_type: 'custom', author_id: 'Tester' },
			account_id: '507f1f77bcf86cd799439099',
			item_id: '507f1f77bcf86cd799439019'
		});
		comment.save(done);
	});

	it('should throw an error if it has no content', function(done) {
		Comment.create({
			author: { author_type: 'custom', author_id: 'Tester' },
			account_id: "507f1f77bcf86cd799439011",
			item_id: '507f1f77bcf86cd799439019'
		}, function(_err, _comment) {
			expect(_err).to.exist;
			expect(_comment).not.to.exist;
			done();
		});
	});

	it('should throw an error if it has no account', function(done) {
		Comment.create({
			content: 'Hallo ich bin content',
			author: { author_type: 'custom', author_id: 'Tester' },
			item_id: '507f1f77bcf86cd799439019'
		}, function(_err, _comment) {
			expect(_err).to.exist;
			expect(_comment).not.to.exist;
			done();
		});
	});

});