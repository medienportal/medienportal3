'use strict';

class Event {
	constructor(options) {
		this.start = options.start ? moment(options.start) : null;
		this.end = options.end ? moment(options.end) : null;
		this.summary = options.summary;
		this.description = options.description;
		this.status = options.status;
		this.type = options.type;
	}
}

var EventsDirective = function() {
	return {
		restrict: 'E',
		scope: {
			eventsUri: '=',
			eventsLimit: '='
		},
		templateUrl: 'app/components/boxes/events/events.html',
		controller: ['$scope', '$http', function($scope, $http) {
			$scope.init = function() {
				$scope.events = [];
				$scope.error = null;
				$scope.loading = true;

				$http
					.get(api_endpoint + '/events')
					.then(response => {
						if (response.status !== 200) {
							$scope.error = response.data;
							$scope.loading = false;
							return;
						}
						$scope.loading = false;
						$scope.events = response.data.events.map(eventData => new Event(eventData));
					});
			};
			$scope.init();
		}]
	};
};

export default EventsDirective;
