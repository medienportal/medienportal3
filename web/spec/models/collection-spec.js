var assert = chai.assert;

describe('Collection model', function() {
	var Collection;
	beforeEach(module('medienportal.services'));
	beforeEach(module('medienportal.factories'));
	beforeEach(module('angularFileUpload'));
	beforeEach(module('mockedData'));
	beforeEach(inject(function($injector) {
		responses = {
			userLoggedInMock: $injector.get('userLoggedInMock'),
			singleCollectionMock: $injector.get('singleCollectionMock'),
			singleCollectionLikeMock: $injector.get('singleCollectionLikeMock')
		}

		$httpBackend = $injector.get('$httpBackend');
		$httpBackend
			.whenGET(api_endpoint + '/collection/1a2b3c')
			.respond(responses.singleCollectionMock);
		$httpBackend
			.whenPOST(api_endpoint + '/collection/1a2b3c/like')
			.respond(responses.singleCollectionLikeMock);
		$httpBackend
			.whenGET(api_endpoint + '/user/me')
			.respond(responses.userLoggedInMock);
		$httpBackend
			.whenGET(api_endpoint + '/messages')
			.respond([]);
		Collection = $injector.get('Collection');
		DataCache = $injector.get('DataCache');
	}));
	describe('should have right urls', function () {
		it('should have right single url', function () {
			var collection = new Collection({_id: '1234'});
			expect(collection.getUrl()).to.equal(api_endpoint + '/collection/1234');
		});
		it('should have right multiple url', function () {
			var collection = new Collection({_id: '1'});
			expect(collection.getUrl('multiple')).to.equal(api_endpoint + '/collections');
			expect(Collection.url.multiple).to.equal(api_endpoint + '/collections');
		});
	});
	describe('mongo id', function () {
		beforeEach(inject(function($injector) {
			Collection = $injector.get('Collection');
		}))
		it('can get id', function() {
			var collection = new Collection({_id: 123456});
			assert.equal(collection.id, 123456);
		});
		it('can set id', function() {
			var collection = new Collection();
			collection.id = 6789;
			assert.equal(collection._id, 6789);
		});
	});
	describe('have likes', function () {
		var collection;
		beforeEach(function() { collection = new Collection({_id: '1a2b3c'}); });
		it('has likes property', function () {
			expect(collection).to.have.property('likes');
			expect(collection.likes).to.be.a('array');
		});
		it('can has like function', function () {
			expect(collection).to.respondTo('like');
		});
		it('can like', function (done) {
			collection.like().then(function(collection) {
				expect(true).to.equal(true);
				done();
			}, function(data) {
				expect(data).to.equal(true);
				done();
			})
			$httpBackend.flush();
		});
	});
});
