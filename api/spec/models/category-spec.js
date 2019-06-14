var config = require('../../config'),
	mongoose = require('mongoose'),
	assert = require('assert'),
	Category = require('../../model/category'),
	chai = require('chai'),
	expect = chai.expect;

before(function(done) {
	process.env.NODE_ENV = 'test';
	mongoose.connect(config.mongo.db, {}, function() {
		Category.remove(done);
	});
});
describe('Category model', function() {
	var category;
	beforeEach(function(done) {
		category = new Category({
			title: "My New interesting Category",
			account_id: "507f1f77bcf86cd799439011"
		});
		category.save(done);
	});

	it('should throw an error if it has no account', function(done) {
		Category.create({
			title: "My Category without any account"
		}, function(_err, _category) {
			expect(_err).to.exist;
			expect(_category).not.to.exist;
			done();
		});
	});

});