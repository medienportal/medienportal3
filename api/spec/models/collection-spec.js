var config = require('../../config'),
	mongoose = require('mongoose'),
	assert = require('assert'),
	Collection = require('../../model/collection'),
	chai = require('chai'),
	expect = chai.expect;

before(function(done) {
	process.env.NODE_ENV = 'test';
	mongoose.connect(config.mongo.db, {}, function() {
		Collection.remove(done);
	});
});
describe('Collection model', function() {
	var collection;
	beforeEach(function(done) {
		collection = new Collection({
			title: "My New interesting Collection",
			account_id: "507f1f77bcf86cd799439011",
			category_id: "cat123456"
		});
		collection.save(done);
	});

	it('should throw an error if it has no category', function(done) {
		Collection.create({
			title: "My Collection without any category",
			account_id: "507f1f77bcf86cd799439011"
		}, function(_err, _collection) {
			expect(_err).to.exist;
			expect(_collection).not.to.exist;
			done();
		});
	});

	it('should throw an error if it has no account', function(done) {
		Collection.create({
			title: "My Collection without any category",
			category_id: "ashdfj"
		}, function(_err, _collection) {
			expect(_err).to.exist;
			expect(_collection).not.to.exist;
			done();
		});
	});

});