var config = require('../../config'),
	Cache = require('../../service/cache'),
	chai = require('chai'),
	expect = chai.expect;

describe('Cache service', function() {
	describe('setting and getting cache values', function() {
		beforeEach(function() {
			Cache.purge();
		});
		it('should get account-specific cache for acc', function() {
			expect(Cache).to.have.property('_content');
			expect(Cache).to.have.property('acc');
			var cache = Cache.acc('abcdef');
			expect(cache).to.be.an('object');
			expect(Cache._content).to.have.property('abcdef');
		});
		it('should set a cache key', function() {
			Cache.set('key', 'value');
			expect(Cache._content).to.have.property('key');
			expect(Cache._content.key).to.equal('value');
		});
		it('should set a cache key for an account', function() {
			var acc = 'abcdef';
			Cache.acc(acc).set('key', 'value');
			expect(Cache._content).to.have.property(acc);
			expect(Cache._content[acc]._content).to.have.property('key');
			expect(Cache._content[acc]._content.key).to.equal('value');
			expect(Cache.acc(acc).get('key')).to.equal('value');
		});
		it('should set a cache key and delete it after ttl', function(done) {
			Cache.set('key', 'value', 0.1);
			expect(Cache._content).to.have.property('key');
			expect(Cache._timeouts.key).to.exist;
			expect(Cache._content.key).to.equal('value');
			setTimeout(function() {
				expect(Cache._content.key).to.be.null;
				done();
			}, 150);
		});
		it('should reset a ttl timeout when resetting a key', function(done) {
			Cache.set('key', 'value', 0.1);
			setTimeout(function() {
				Cache.set('key', 'value2');
				setTimeout(function() {
					expect(Cache._content).to.have.property('key');
					expect(Cache._timeouts.key).to.exist;
					expect(Cache._content.key).to.equal('value');
				}, 2500);
				done();
			}, 150);
		});
		it('should set a proper cache key using a route', function() {
			var acc = 'abcdef';
			Cache.acc(acc).setRoute('/page', { page: { a: 'a', b: 'b' }});
			var cached = Cache.acc(acc).getRoute('/page');
			Cache.acc(acc).set('a', 'b');
			expect(cached).to.exist;
			expect(Cache._content.abcdef._content['route:/page']).to.deep.equal({ page: { a: 'a', b: 'b' } });
			expect(cached).to.deep.equal({ page: { a: 'a', b: 'b' } });
		});
	});
	describe('invalidating cache key', function() {
		beforeEach(function() {
			Cache.purge();
		});
		it('should delete a cache key using Cache.invalidate', function() {
			var cache = Cache.acc('abc')
			cache.set('lets', 'try');
			cache.invalidate('lets');
			expect(cache._content['lets']).to.be.null;
		});
		it('should delete a cache key using Cache.invalidateRoute', function() {
			var cache = Cache.acc('acc1');
			cache.setRoute('/page/abcdefakjdsf', { myPage: 'a' });
			cache.invalidateRoute('/page/abcdefakjdsf');
			expect(Cache._content['acc1']._content['route:/page/abcdefakjdsf']).to.be.null;
		});
	});
	describe('middleware components', function() {
		var req, res, next;
		beforeEach(function() {
			Cache.purge();
			req = {
				params: {},
				param: function(param) { return this.params[param]; },
				cache: Cache.acc('myCachedAccount'),
				account: { id: 'myCachedAccount', _id: 'myCachedAccount' }
			},
			res = { send: function() { throw 'res.send is not defined'; } },
			next = function() { throw 'next is not defined'; };
		});
		it('should invalidate a path with invalidateRouteMW', function() {
			var cache = Cache.acc('myCachedAccount');
			Cache._content['myCachedAccount']._content['route:/page/987'] = { myPageId: '987' };
			req.params.page_id = '987';
			next = function() {
				expect(Cache._content['myCachedAccount']._content['route:/page/987']).to.be.null;
				expect(cache.getRoute('/page/987')).to.be.null;
			}
			Cache.invalidateRouteMW('/page/:page_id')(req, res, next);
		});
		it('should invalidate a path having multiple params with invalidateRouteMW', function() {
			var cache = Cache.acc('myCachedAccount');
			Cache._content['route:/page/987/comment/145'] = { myPageId: '987' };
			req.params.page_id = '987';
			req.params.comment_id = '145';
			next = function() {
				expect(Cache._content['myCachedAccount']._content['route:/page/987/comment/145']).to.be.null;
				expect(cache.getRoute('/page/987/comment/145')).to.be.null;
			}
			Cache.invalidateRouteMW('/page/:page_id/comment/:comment_id')(req, res, next);
		});
	});
});
