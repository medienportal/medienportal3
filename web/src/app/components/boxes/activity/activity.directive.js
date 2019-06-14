'use strict';

var ActivityDirective = function() {
	return {
		restrict: 'E',
		templateUrl: 'app/components/boxes/activity/activity.html',
		controller: ['$scope', '$http', 'DataCache', function($scope, $http, DataCache) {

			var greetings_category = function() {
				return Object.keys(DataCache.categories)
					.map(function(cat) { return DataCache.categories[cat]; })
					.filter(function(cat) { return cat.config.pageType === 'greetingsPage'; })[0];
			};

			$scope.activities = DataCache.activities;

			$scope.activities_array = function() {
				return Object.keys($scope.activities).map(function(id) {
					return  $scope.activities[id];
				});
			};

			$scope.user_name = function(activity) {
				if (!activity || !activity.trigger) {
					return;
				}
				if (activity.trigger.author_type === 'panda') {
					if (!DataCache.users[activity.trigger.author_id]) {
						return;
					}
					return DataCache.users[activity.trigger.author_id].first_name;
				} else {
					return activity.trigger.author_id;
				}
			};

			$scope.profile_pic = function(activity) {
				if (!activity || !activity.trigger) {
					return;
				}
				if (activity.trigger.author_type === 'panda') {
					if (!DataCache.users[activity.trigger.author_id]) {
						return;
					}
					return DataCache.users[activity.trigger.author_id].getImage('small');
				}
			};

			$scope.page_title = function(activity) {
				var item = DataCache.pages[activity.targets[0].item_id];
				var collection = DataCache.collections[activity.targets[0].item_id];
				if (item) {
					return item.title;
				} else if (collection && activity.targets[0].file_id) {
					return 'ein Bild aus ' + collection.title;
				}
				return 'eine Seite';
			};

			$scope.url = function(activity) {
				switch (activity.type) {
					case 'greeting':
						if (!greetings_category()) {
							return '/#!';
						}
						return $scope.baseUrl + '/#!/category/' + (greetings_category() && greetings_category()._id);
					case 'comment':
					case 'like':
						return (function(activity, DataCache, $scope) {
							var item_id = activity.targets[0].item_id,
								file_id = activity.targets[0].file_id,
								collection = DataCache.collections[item_id];
							if (item_id && file_id) {
								return $scope.baseUrl + '/#!/collection/' + item_id + '/file/' + file_id;
							}
							if (collection) {
								return $scope.baseUrl + '/#!/collection/' + item_id;
							}
							if (item_id) {
								return $scope.baseUrl + '/#!/page/' + item_id;
							}
							return $scope.baseUrl + '/#!/';
						})(activity, DataCache, $scope);
					default:
						return $scope.baseUrl + '/#!/';
				}
			};

			$scope.classes = function(activity) {
				var classes = [];
				classes.push('comment');
				if (activity.type === 'like') {
					classes.push('activity_minor');
				}
				classes.push('activity_type_' + activity.type);
				return classes.join(' ');
			};
		}]
	};
};

export default ActivityDirective;
