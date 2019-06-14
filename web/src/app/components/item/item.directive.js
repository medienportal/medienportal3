'use strict';

var ItemDirective = function() {
	return {
		restrict: 'A',
		scope: {
			item: '=',
			topstory: '=',
			forcePreviewSize: '=',
			enforcePageLayout: '@'
		},
		templateUrl: 'app/components/item/item.html',
		controller: ['$scope', '$rootScope', 'DataCache', '$location', function($scope, $rootScope, DataCache, $location) {
			$scope.moment = moment;
			$scope.open = $rootScope.open;
			$scope.baseUrl = $rootScope.baseUrl;
			$scope.current_user = DataCache.current_user;
			$scope.classes = function() {
				var classes = [];
				classes.push($scope.item.modelName.toLowerCase());
				if ($scope.topstory === true) {
					classes.push('topstory');
				}
				return classes.join(' ');
			};

			$scope.getCommentsCount = function() {
				if ($scope.item.modelName === 'Collection') {
					try {
						return $scope.item.files
							.map(file => file.comments.length)
							.reduce((pre, curr) => pre + curr);
					} catch (___error) {
						return 0;
					}
				} else {
					return $scope.item.comments.length;
				}
			};

			$scope.previewSize = function() {
				if ($scope.forcePreviewSize) {
					return $scope.forcePreviewSize;
				}
				if ($scope.topstory) {
					return 'middle';
				}
				return 'small';
			};

			$scope.makeItemProminent = function($ev) {
				$ev.preventDefault();
				if (!$scope.item) {
					return;
				}
				DataCache.makeItemProminent($scope.item);
				$ev.stopPropagation();
			};

			$scope.isNew = function() {
				if (localStorage && localStorage.getItem('lastclose')) {
					var date = new Date(localStorage.getItem('lastclose'));
					if (new Date($scope.item.created_at).getTime() > date.getTime()) {
						return true;
					}
					if (new Date($scope.item.updated_at).getTime() > date.getTime()) {
						return true;
					}
				}
				return false;
			};

			$scope.openItem = function(item, $event, hash) {
				var path = '/' + item.modelName.toLowerCase() + '/' + item.id;
				$location.path(path);
				if (hash) {
					$location.hash(hash);
				}
				$event.stopPropagation();
				$event.preventDefault();
			};

			$scope.openTopic = function(topic, $event) {
				$event.preventDefault();
				$location.path('/search/');
				$location.search('f', 'topic:' + topic);
				$event.stopPropagation();
			};
		}]
	};
};

export default ItemDirective;
