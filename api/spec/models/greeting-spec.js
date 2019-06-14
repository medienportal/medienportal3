var config = require('../../config'),
	mongoose = require('mongoose'),
	assert = require('assert'),
	Greeting = require('../../model/greeting'),
	chai = require('chai'),
	expect = chai.expect;

before(function(done) {
	process.env.NODE_ENV = 'test';
	mongoose.connect(config.mongo.db, {}, function() {
		Greeting.remove(done);
	});
});
describe('Greeting model', function() {

	it('should throw an error if it has no content', function(done) {
		Greeting.create({
			author: { author_type: 'custom', author_id: 'Tester' },
			account_id: "507f1f77bcf86cd799439011"
		}, function(_err, _greeting) {
			expect(_err).to.exist;
			expect(_greeting).not.to.exist;
			done();
		});
	});

	it('should throw an error if it has no account', function(done) {
		Greeting.create({
			content: 'Hallo ich bin content',
			author: { author_type: 'custom', author_id: 'Tester' }
		}, function(_err, _greeting) {
			expect(_err).to.exist;
			expect(_greeting).not.to.exist;
			done();
		});
	});

});