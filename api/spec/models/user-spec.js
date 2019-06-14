var config = require('../../config'),
    mongoose = require('mongoose'),
    assert = require('assert'),
    User = require('../../model/user'),
    Page = require('../../model/page'),
	Account = require('../../model/account'),
    chai = require('chai'),
    expect = chai.expect;

process.env.NODE_ENV = 'test';

describe('User model', function() {
	var user, account;
    before(function(done) {
		account = new Account({
			title: 'account01',
			name: 'Account zum Testen'
		});
		account.save(done);
	});
	before(function(done) {
        user = new User({
            email: 'heisenberg@bettercallsaul.com',
            name: 'Alexis Rinaldoni',
            first_name: 'Alexis',
            last_name: 'Rinaldoni',
			account_id: account._id
        });
		user.save(done);
    });

	describe('properties', function() {
		it('should have a account_id property', function() {
			expect(user).to.have.property('name');
			expect(user).to.have.property('email');
			expect(user).to.have.property('account_id');
			expect(user).to.have.property('first_name');
		});
		it('should have a permissions property, with {} default', function() {
			expect(user).to.have.property('permissions');
			expect(user.permissions).to.be.a('object');
			expect(user.permissions).to.deep.equal({});
		});
		describe('email', function() {
			it('should retrieve the user by mail', function(done) {
				User.findOne({email: 'heisenberg@bettercallsaul.com'}, function(err, _user) {
					expect(err).to.not.exist;
					expect(_user).to.have.property('email');
					expect(_user.email).to.equal('heisenberg@bettercallsaul.com');
					done();
				});
			});

            it('should not save if email is not unique', function(done) {
                User.create({email: 'heisenberg@bettercallsaul.com', account_id: account._id}, function(_err, _user) {
                    expect(_err).to.exist;
                    expect(_user).to.not.exist;
                    done();
                });
            });

			it('should not save if no email is given', function(done) {
				User.create({account_id: account._id}, function(err, _user) {
					expect(err).to.exist;
					expect(_user).not.to.exist;
					done();
				});
			});

			it('email "test" should not be valid', function(done) {
				User.create({email: 'test', account_id: account._id}, function(err, _user) {
					expect(err).to.exist;
					expect(_user).not.to.exist;
					done();
				});
			});

			it('email "test@test" should not be valid', function(done) {
				User.create({email: 'test@test', account_id: account._id}, function(err, _user) {
					expect(err).to.exist;
					expect(_user).not.to.exist;
					done();
				});
			});

			it('email "test@test.de" should be valid', function(done) {
				User.create({email: 'test@test.de', account_id: account._id}, function(err, _user) {
					expect(err).not.to.exist;
					expect(_user).to.exist;
					done();
				});
			});

			it('email "alexis.test+7@test.de" should be valid', function(done) {
				User.create({email: 'alexis.test+7@test.de', account_id: account._id}, function(err, _user) {
					expect(err).not.to.exist;
					expect(_user).to.exist;
					done();
				});
			});
		});
		describe('account', function() {
			it('should not be possible to be created without account_id', function(done) {
				User.create({
					email: 'myNewEmail@mail.com',
					name: 'Indiana Jones',
					first_name: 'Indiana',
					last_name: 'Jones',
				}, function(err, _user) {
					expect(err).to.exist;
					expect(_user).not.to.exist;
					done();
				});
			});
		});
	});

	describe('administration properties', function() {
		var account, user;
		beforeEach(function(done) {
			Account.findOne({ title: 'account01' }, function(_err, _acc) {
				account = _acc;
				user = new User({
					administration: '',
					account_id: account.id
				});
				done();
			});
		});
		describe('isAccountAdmin function', function() {
			it('should return true for an account for which user is administrator', function() {
				user.administration = 'admin';
				expect(user.isAccountAdmin(account)).to.equal(true);
			});
			it('should return true for an account for which user is administrator', function() {
				var account = new Account({ _id: 'abc678def087', title: 'test' });
				expect(user.isAccountAdmin(account)).to.equal(false);
			});
			it('should return true if user is unsdrei-staff', function() {
				user.administration = 'unsdrei';
				expect(user.isAccountAdmin(account)).to.equal(true);
			});
		});
		describe('isUnsdreiStaff function', function() {
			it('should return true for user is unsdrei', function() {
				user.administration = 'unsdrei';
				expect(user.isUnsdreiStaff()).to.equal(true);
			});
			it('should return false for user is administrator', function() {
				user.administration = 'admin';
				expect(user.isUnsdreiStaff()).to.equal(false);
			});
		});
	});

	describe('isAuthorOf-method', function() {
		var user, user2, page;
        var i = 0;
		beforeEach(function(done) {
			page = new Page({
				title: 'Hallo Medienportal',
				category_id: '7h1d192uj8912',
				account_id: account.id
			});
			user = new User({
				email: 'myNewEmail' + i + '@mail.com',
				name: 'Indiana Jones',
				first_name: 'Indiana',
				last_name: 'Jones',
				account_id: '1283uhjdld'
			});
			user2 = new User({
				email: 'myVeryNewEmail' + i + '@mail.com',
				name: 'Curt Kobain',
				first_name: 'Curt',
				last_name: 'Kobain',
				account_id: '1283uhjdld'
			});
			user.save(function() { user2.save(function() { page.save(done); }); });
		});
		it('has isAuthorOf-method', function() {
			expect(user).to.have.property('isAuthorOf');
			expect(user.isAuthorOf).to.be.a('function');
		});
		it('should return false if page has no authors', function() {
			expect(user.isAuthorOf(page)).to.equal(false);
		});
		it('should return false if page has no author property', function() {
			page.author = undefined;
			expect(user.isAuthorOf(page)).to.equal(false);
		});
		it('should return false if page has a custom author of same name', function() {
			page.author.push({ author_type: 'custom', author_id: 'Indiana Jones' });
			expect(user.isAuthorOf(page)).to.equal(false);
		});
		it('should return false if page has another registerd author', function() {
			page.author.push({ author_type: 'panda', author_id: user2.id });
			expect(user.isAuthorOf(page)).to.equal(false);
		});
		it('should return true if page has user as only author', function() {
			page.author.push({ author_type: 'panda', author_id: user.id });
			expect(user.isAuthorOf(page)).to.equal(true);
		});
		it('should return true if page has user as only author', function() {
			page.author.push({ author_type: 'panda', author_id: user.id });
			expect(user.isAuthorOf(page)).to.equal(true);
		});
		it('should return true if page has user as author', function() {
			page.author.push({ author_type: 'panda', author_id: user2.id });
			page.author.push({ author_type: 'custom', author_id: 'John Lennon' });
			page.author.push({ author_type: 'custom', author_id: 'Snoop Dogg' });
			page.author.push({ author_type: 'custom', author_id: 'Madonna' });
			page.author.push({ author_type: 'panda', author_id: user.id });
			page.author.push({ author_type: 'custom', author_id: 'Jesus' });
			expect(user.isAuthorOf(page)).to.equal(true);
		});
	});

	describe('password managment', function() {
		it('has a setPassword method', function() {
			expect(user).to.have.property('setPassword');
			expect(user.isAuthorOf).to.be.a('function');
		});
		it('has a authenticate method', function() {
			expect(User).to.have.property('authenticate');
			expect(User.authenticate).to.be.a('function');
		});
		it('can be authenticated by its right password', function(done) {
			user.setPassword('test456', function(err, _user) {
				if (err) return done(err);
				User.authenticate('heisenberg@bettercallsaul.com', 'test456', function(err, _user) {
					expect(err).to.not.exist;
					expect(_user).to.exist;
					expect(_user.id).to.equal(user.id);
					done();
				});
			});
		});
		it('cannot be authenticated by its wrong password', function(done) {
			user.setPassword('test456', function(err, _user) {
				if (err) return done(err);
				User.authenticate('heisenberg@bettercallsaul.com', 'test123', function(err, _user) {
					expect(err).to.not.exist;
					expect(_user).not.to.exist;
					done();
				});
			});
		});
		it('cannot be authenticated by its wrong email', function(done) {
			user.setPassword('test456', function(err, _user) {
				if (err) return done(err);
				User.authenticate('arinaldoni.bla@me.com', 'test456', function(err, _user) {
					expect(err).to.exist;
					expect(err.message).to.equal('user password not known');
					expect(_user).not.to.exist;
					done();
				});
			});
		});
	});
});
