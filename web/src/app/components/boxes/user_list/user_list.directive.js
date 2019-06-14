'use strict';

class UserListDirectiveController {
	constructor($scope, $q, DataCache, User) {
		this.$scope = $scope;
		this.$q = $q;
		this.cache = DataCache;
		this.User = User;

		if ($scope.users) {
			$scope.pandaUsers = $scope.users;
		}
		// $scope.$watch('userObjs', (userObjs) => {
		// 	console.log('watched', arguments);
		// 	this.loadUsers(userObjs)
		// });
		$scope.$watch('userObjs', () => this.loadUsers($scope.userObjs), false);
	}
	loadUsers(userObjs) {
		if (this.$scope.userObjs) {
			let pandaUserObjs = this.$scope.userObjs.filter(uobj => uobj.author_type === 'panda');
			let customUsers = this.$scope.userObjs.filter(uobj => uobj.author_type === 'custom').map(uobj => new this.User({first_name: uobj['author_id']}));
			this.$q.all(pandaUserObjs.map(userObj => this.cache.getUser(userObj.author_id)))
				.then(users => this.$scope.pandaUsers = users.concat(customUsers));
		}
	}
}
UserListDirectiveController.$inject = ['$scope', '$q', 'DataCache', 'User'];

var UserListDirective = function() {
	return {
		restrict: 'E',
		scope: {
			users: '=',
			userObjs: '='
		},
		templateUrl: 'app/components/boxes/user_list/user_list.html',
		controller: UserListDirectiveController
	};
};

export default UserListDirective;
