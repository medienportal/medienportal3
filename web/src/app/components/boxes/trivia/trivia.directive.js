'use strict';

var TriviaDirective = function() {
	var triviasLoaded = false;
	return {
		restrict: 'E',
		templateUrl: 'app/components/boxes/trivia/trivia.html',
		controller: ['$scope', '$http', 'DataCache', '$timeout', function($scope, $http, DataCache, $timeout) {
			$scope.isActiveTriviaIndex = 0;
			$scope.trivias = DataCache.trivias;
			$timeout(function() {
				if (triviasLoaded) {
					$scope.setTriviaIndex();
				} else {
					DataCache.loadTrivias().then($scope.setTriviaIndex);
				}
			}, 700);

			$scope.setTriviaIndex = function() {
				var i = Math.floor(Math.random() * DataCache.trivias.length);
				$scope.isActiveTriviaIndex = i;
				return i;
			};

			$scope.activeTrivia = function() {
				return DataCache.trivias[this.isActiveTriviaIndex];
			};
		}]
	};
};

export default TriviaDirective;
