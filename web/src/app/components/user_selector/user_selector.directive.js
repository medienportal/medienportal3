'use strict';

var UserSelectorDirective = function() {

	return {
		restrict: 'E',
		scope: {
			chosenUsers: '=',
			userCollection: '=',
			onChangeCollection: '&'
		},
		templateUrl: 'app/components/user_selector/user_selector.html',
		link: function(scope) {
			scope.searchText = '';
			if (!scope.userCollection) {
				scope.userCollection = [];
			}
			if (!scope.chosenUsers) {
				scope.chosenUsers = [];
			}
		},
		controller: ['$scope', '$filter', 'SearchService', function($scope, $filter, SearchService) {
			$scope.searchName = function(text, callback) {
				new SearchService().getUser({
					text: text
				}).then(function(results) {
					callback(results.map(function(res) {
						return res.item();
					}));
				});
			};
			$scope.chose = function(chosen) {
				var user;
				if (chosen.id) {
					user = {
						author_type: 'panda',
						author_id: chosen.id
					};
				} else {
					user = {
						author_type: 'custom',
						author_id: chosen
					};
				}
				var userAlreadySelected = $scope.chosenUsers.filter(function(chosenUser) {
					return (chosenUser.author_type === user.author_type && chosenUser.author_id === user.author_id);
				});
				if (userAlreadySelected.length > 0) {
					return;
				}
				$scope.chosenUsers.push(user);
				$scope.newUserName = '';
				$scope.searchtext = '';
				$scope.onChangeCollection();
			};
			$scope.unchose = function(user) {
				var i = $scope.chosenUsers.indexOf(user);
				$scope.chosenUsers.splice(i,1);
				$scope.onChangeCollection();
			};
		}]
	};
};

export default UserSelectorDirective;
