'use strict';

var GreetingFactory = function($rootScope, $q, $http, $injector, Comment) {

	var Greeting = function (options) {
		Comment.call(this, options);
		this.page_url = true;
	};
	Greeting.prototype = Object.create(Comment.prototype);
	Greeting.prototype.url = function() {
		return api_endpoint + '/greeting';
	};
	Greeting.prototype.object_name = 'greeting';

	window.Greeting = Greeting;

	return Greeting;
};

export default GreetingFactory;
