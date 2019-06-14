'use strict';

var assert = chai.assert;
var expect = chai.expect;

var element, scope, responses, page, DataCache, httpBackend;

describe('Directive: Sharebox', function() {
	beforeEach(module('medienportal.directives', 'medienportal.factories', 'medienportal.services'));
	beforeEach(module('angularFileUpload'));
	beforeEach(module('mockedData'));
	beforeEach(module('templates'));
	beforeEach(inject(function($injector, Page) {
		DataCache = $injector.get('DataCache');
		responses = {
			userLoggedInMock: $injector.get('userLoggedInMock'),
			singlePageMock: $injector.get('singlePageMock'),
			singlePageLikeMock: $injector.get('singlePageLikeMock')
		}
		angular.extend(responses, $injector.get('standardSetup')(responses.singlePageMock, $injector.get('singleCollectionMock')));

		var $httpBackend = $injector.get('$httpBackend');
		$httpBackend.whenGET(api_endpoint + '/category/homepage').respond(responses.homepage);
		$httpBackend.whenGET(api_endpoint + '/collections').respond(responses.collections);
		$httpBackend.whenGET(api_endpoint + '/comments').respond(responses.comments);
		$httpBackend.whenGET(api_endpoint + '/users').respond(responses.users);
		$httpBackend.whenGET(api_endpoint + '/categories').respond(responses.categories);
		$httpBackend.whenGET(api_endpoint + '/greetings').respond(responses.greetings);
		$httpBackend.whenGET(api_endpoint + '/tags').respond(responses.tags);
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
			.respond({ messages: [] });
		httpBackend = $httpBackend;
		page = new Page({_id: '1a2b3c', likes: ['abcdef']});
	}));
	describe('template', function() {
		var compile, $scope;
		beforeEach(inject(function($compile, $rootScope) {
			compile = $compile;
			$scope = $rootScope.$new();
		}));
		it('should show different facebook like button', function() {
			inject(function() {
				var template = compile('<div sharebox itemModel="page"></div>')($scope);
				$scope.page = page;
				$scope.$digest();
				var templateHtml = template.html();
				expect(templateHtml).to.contain('<button class="share">');
			});
		});
		it('should show the right amount of likes', function() {
			inject(function() {
				var template = compile('<div sharebox="page"></div>')($scope);
				$scope.page = page;
				$scope.$digest();
				var templateHtml = template.html();
				expect(templateHtml).to.contain('<button class="likes ng-binding">1</button>');
			});
		});
		it('should like an element when clicking on it', function(done) {
			var template = compile('<div sharebox="page"></div>')($scope);
			$scope.page = page;
			$scope.$digest();
			var drScope = angular.element(template).isolateScope();
			expect(drScope).to.have.property('likeItem');
			expect(drScope.likeItem).to.be.a('function');
			drScope.likeItem().then(function() {
				setTimeout(function() {
					$scope.$digest();
					expect(template.html()).to.contain('<button class="likes ng-binding">5</button>');
					done();
				});
			});
			httpBackend.flush();
		});
		it('should show the pictures of the users who liked it', function(done) {
			DataCache.loadUsers().then(function() {
				var template = compile('<div sharebox="page"></div>')($scope);
				$scope.page = page;
				page.like().then(function() {
					setTimeout(function() {
						$scope.$digest();
						var images = [].filter.call(template.children()[1].childNodes, function(node) { return node.nodeName == "IMG"; });
						expect(images[0].src).to.contain('//graph.facebook.com/123/picture?width=100&height=100');
						expect(images[0].title).to.contain('User123 User');
						expect(images[1].src).to.contain('//graph.facebook.com/456/picture?width=100&height=100');
						expect(images[1].title).to.contain('Dagmar Hilde');
						expect(images[2].src).to.contain('//graph.facebook.com/789/picture?width=100&height=100');
						expect(images[2].title).to.contain('Harry Potter');
						expect(images[3].src).to.contain('//graph.facebook.com/abc/picture?width=100&height=100');
						expect(images[3].title).to.contain('Tom Cruise');
						done();
					}, 10);
				});
			});
			httpBackend.flush();
		});
	});
});
