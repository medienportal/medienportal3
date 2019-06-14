'use strict';

describe('controllers', function(){
	var scope;

	beforeEach(module('medienportal'));
	beforeEach(module('ngMockE2E'));

	beforeEach(inject(function($rootScope) {
		scope = $rootScope.$new();
	}));

	beforeEach(inject(function($httpBackend) {
		$httpBackend.whenGET('https://preview.api.medienportal.org/user/me').respond(function() {
            return [200, {}, {}];
        });
		$httpBackend.whenGET('https://preview.api.medienportal.org/home').respond(function() {
            return [200, {
				collections: [{}],
				pages: [{}],
				users: [{}]
			}, {}];
        });
		$httpBackend.whenGET('https://preview.api.medienportal.org/comments').respond(function() {
            return [200, {
				comments: [{}]
			}, {}];
        });
		$httpBackend.whenGET('https://preview.api.medienportal.org/greetings').respond(function() {
            return [200, {
				comments: [{}]
			}, {}];
        });
		$httpBackend.whenGET(/^app\/(.*)/).passThrough(); // pass through partials
	}));

	it('should have a baseUrl for links', inject(function($controller) {
		$controller('ApplicationCtrl', {
			$scope: scope
		});
		expect(scope.baseUrl).toBeTruthy();
	}));

	it('should have a open() function on rootscope for links', inject(function($controller, $httpBackend) {

		var users = [{"id":1,"name":"bob","email":"bob@bobs.com"}, {"id":2,"name":"bob2","email":"bob2@bobs.com"}]

		$controller('ApplicationCtrl', {
			$scope: scope
		});
		expect(scope.open).toBeTruthy();
	}));
});
