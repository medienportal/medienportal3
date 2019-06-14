'use strict';

var ShareboxDirective = function(DataCache, ezfb) {
	return {
		restrict: 'A',
		scope: {
			item: '=sharebox'
		},
		templateUrl: 'app/components/sharebox/sharebox.html',
		controller: ['$scope', function ($scope) {
			$scope.likeItem = function() {
				if (!$scope.item || !$scope.item.like) {
					return;
				}
				return $scope.item.like().then(() => {
						if (!$scope.$$phase) { $scope.$apply(); }
					});
			};
			$scope.didLikeItem = function() {
				if (!$scope.item) {
					return false;
				}
				if (!$scope.item.didLike) {
					return false;
				}
				return $scope.item.didLike();
			};
			$scope.likingUsers = function() {
				if (!$scope.item) {
					return [];
				}
				if (!$scope.item.likes) {
					return [];
				}
				return $scope.item.likes
					.filter(function(like) {
						return !like.match(/^custom:/);
					}).map(function(userid) {
						return DataCache.users[userid];
					});

			};
			$scope.likeOnFacebook = function() {
				ezfb.ui({
					method: 'share',
					href: document.location.href
				});
			};
		}]
	};
};

export default ShareboxDirective;
