var config = require('../../config'),
	mongoose = require('mongoose'),
	assert = require('assert'),
	Account = require('../../model/account'),
	chai = require('chai'),
	expect = chai.expect;

before(function(done) {
	process.env.NODE_ENV = 'test';
	mongoose.connect(config.mongo.db, {}, function() {
		Account.remove(done);
	});
});
// TODO: ensure account title exists just once
describe('Account model', function() {
	var account, i = 0;
	beforeEach(function(done) {
		i++;
		account = new Account({
			name: "Gymnasium Delitzsch",
			title: "delitzsch" + i,
			urls: ["mport.al", "gymnasium-delitzsch"]
		});
		account.save(done);
	});

	it('should have all necessary data', function() {
		expect(account).to.have.property('_id');
		expect(account).to.have.property('name');
		expect(account).to.have.property('title');
		expect(account).to.have.property('urls');
		expect(account.urls).to.be.a('Array');
	});
	it('should not allow empty title', function(done) {
		Account.create({
			name: "Gymnasium Schkeuditz",
			title: null
		}, function(err, account) {
			expect(err).to.exist;
			expect(account).not.to.exist;
			done();
		});
	});
	it('should enforce single occurance', function(done) {
		Account.create({
			title: "myawesomemedienportal"
		}, function(err, account) {
			expect(err).not.to.exist;
			expect(account).to.exist;
			Account.create({
				title: "myawesomemedienportal"
			}, function(err, account2) {
				expect(err).to.exist;
				expect(account2).not.to.exist;
				done();
			});
		});
	})
	describe('it should only allow ascii in the title', function() {
		it('should not allow # character', function(done) {
			Account.create({name: "", title: "#"}, function(err) {
				expect(err).to.exist;
				done();
			});
		});
		it('should not allow ß character', function(done) {
			Account.create({name: "", title: "dsfßsaa"}, function(err) {
				expect(err).to.exist;
				done();
			});
		});
		it('should not allow ä character', function(done) {
			Account.create({name: "", title: "asädad"}, function(err) {
				expect(err).to.exist;
				done();
			});
		});
		it('should not allow / character', function(done) {
			Account.create({name: "", title: "asdf/adsf"}, function(err) {
				expect(err).to.exist;
				done();
			});
		});
		it('should not allow . character', function(done) {
			Account.create({name: "", title: "asdjfs.fsfa"}, function(err) {
				expect(err).to.exist;
				done();
			});
		});
	});
	describe('get the correct project\'s main url.', function() {
		it('should get the right subdomain url when having no secondary urls', function(done) {
			var acc = new Account({
				name: "Mein Testaccount",
				title: "dasistmeintestaccount",
				urls: []
			});
			acc.save(function() {
				expect(acc).to.have.property('getCompleteUrl');
				expect(acc.getCompleteUrl()).to.equal('https://dasistmeintestaccount.medienportal.de');
				done();
			});
		});
		it('should get the right url when having secondary urls', function(done) {
			var acc = new Account({
				name: "Mein Testaccount",
				title: "dasistmeintestaccount",
				urls: ['http://mport.al']
			});
			acc.save(function() {
				expect(acc).to.have.property('getCompleteUrl');
				expect(acc.getCompleteUrl()).to.equal('http://mport.al');
				done();
			});
		});
		it('should get the first url when having multiple secondary urls', function(done) {
			var acc = new Account({
				name: "Mein Testaccount",
				title: "dasistmeintestaccount",
				urls: ['https://neueurl.de', 'http://fuckit.de']
			});
			acc.save(function() {
				expect(acc).to.have.property('getCompleteUrl');
				expect(acc.getCompleteUrl()).to.equal('https://neueurl.de');
				done();
			});
		});
	});
});