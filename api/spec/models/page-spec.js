var config = require('../../config'),
	mongoose = require('mongoose'),
	assert = require('assert'),
	Page = require('../../model/page'),
	chai = require('chai'),
	expect = chai.expect;

before(function(done) {
	process.env.NODE_ENV = 'test';
	mongoose.connect(config.mongo.db, {}, function() {
		Page.remove(done);
	});
});
describe('Page model', function() {
	var page;
	beforeEach(function(done) {
		page = new Page({
			title: "My New interesting Collection",
			account_id: "507f1f77bcf86cd799439011",
			category_id: "cat123456"
		});
		page.save(done);
	});

	it('should throw an error if it has no category', function(done) {
		Page.create({
			title: "My Collection without any category",
			account_id: "507f1f77bcf86cd799439011"
		}, function(_err, _page) {
			expect(_err).to.exist;
			expect(_page).not.to.exist;
			done();
		});
	});

	it('should throw an error if it has no account', function(done) {
		Page.create({
			title: "My Collection without any account",
			category_id: '507f1f77bcf86cd799439015'
		}, function(_err, _page) {
			expect(_err).to.exist;
			expect(_page).not.to.exist;
			done();
		});
	});

});