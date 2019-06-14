'use strict';

var SearchResultsDirective = function() {
	return {
		restrict: 'EA',
		templateUrl: 'app/search/searchresults.html',
		controller: ['$scope', '$location', 'MainSearch', function($scope, $location, MainSearch) {
			$scope.sm = MainSearch;
			$scope.moment = moment;

			$scope.active = function() {
				return $scope.searchtext && !$location.$$path.match('^/search');
			};

		}]
	};
};

export default SearchResultsDirective;
