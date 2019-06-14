var assert = chai.assert;
var expect = chai.expect;

describe('Page model', function() {
	var $httpBackend, Page, DataCache, Comment, responses;
	beforeEach(module('medienportal.services'));
	beforeEach(module('medienportal.factories'));
	beforeEach(module('angularFileUpload'));
	beforeEach(module('mockedData'));
	beforeEach(inject(function($injector) {
		responses = {
			userLoggedInMock: $injector.get('userLoggedInMock'),
			singlePageMock: $injector.get('singlePageMock'),
			singlePageLikeMock: $injector.get('singlePageLikeMock')
		}

		$httpBackend = $injector.get('$httpBackend');
		$httpBackend
			.whenGET(api_endpoint + '/page/1a2b3c')
			.respond(responses.singlePageMock);
		$httpBackend
			.whenPOST(api_endpoint + '/page/1a2b3c/like')
			.respond(responses.singlePageLikeMock);
		$httpBackend
			.whenGET(api_endpoint + '/user/me')
			.respond(responses.userLoggedInMock);
		$httpBackend
			.whenGET(api_endpoint + '/messages')
			.respond([]);
		Page = $injector.get('Page');
		DataCache = $injector.get('DataCache');
		Comment = $injector.get('Comment');
	}));
	describe('should have right urls', function () {
		it('should have right single url', function () {
			var page = new Page({_id: '1234'});
			expect(page.getUrl()).to.equal(api_endpoint + '/page/1234');
		});
		it('should have right multiple url', function () {
			var page = new Page({_id: '1'});
			expect(page.getUrl('multiple')).to.equal(api_endpoint + '/pages');
			expect(Page.url.multiple).to.equal(api_endpoint + '/pages');
		});
	});
	describe('id setter/getter', function() {
		it('can get id', function() {
			var page = new Page({_id: 123456});
			expect(page._id).to.equal(123456);
		});
		it('can set id', function() {
			var page = new Page();
			page.id = 6789;
			expect(page._id).to.equal(6789);
		});
	});
	describe('comments', function() {
		it('has a comment option', function() {
			var page = new Page();
			expect(page).to.have.property('comments');
			expect(page.comments).to.be.a('array');
		});
		it('outputs comment Objects', function() {
			var page = new Page({ comments: ['1', '2', '3'] });
			expect(page).to.respondTo('getComments');
			DataCache.comments = {
				'1': new Comment({_id: '1'}),
				'2': new Comment({_id: '2'}),
				'3': new Comment({_id: '3'}),
				'4': new Comment({_id: '4'}),
				'5': new Comment({_id: '5'})
			}
			var page_comments = page.getComments();
			expect(page_comments.length).to.equal(3);
			page_comments.forEach(function(comment) {
				expect(comment).to.be.a('object');
				expect(comment).to.have.property('_id');
				expect(page.comments).to.include(comment._id);
			});
		});
	});
	describe('have likes', function () {
		var page;
		beforeEach(function() { page = new Page({_id: '1a2b3c'}); });
		it('has likes property', function () {
			expect(page).to.have.property('likes');
			expect(page.likes).to.be.a('array');
		});
		it('can has like function', function () {
			expect(page).to.respondTo('like');
		});
		it('can like', function (done) {
			page.like().then(function(page) {
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
