'use strict';

var hasLikesService = function($rootScope, $injector, $q, $http) {
	return function(Model) {
		Model.prototype.didLike = function didLikeModel(user) {
			if (!user) {
				user = $injector.get('DataCache').current_user;
			}
			var userid = user.id;
			if (!userid) {
				if (!localStorage.likes) {
					return false;
				}
				if (localStorage.likes.split(' ').indexOf(this.id) > -1) {
					return true;
				}
			} else {
				return (this.likes.indexOf(userid) > -1);
			}
		};

		Model.prototype.like = function likeModel() {
			var url = this.getUrl() + '/like';
			var promise = $q.defer();
			$http
				.post(url, { ignoreLoadingBar: true })
				.success((data, status) => {
					if (status !== 200) {
						return promise.reject(this);
					}
					this.likes = data[this.modelName.toLowerCase()].likes;
					if (!$injector.get('DataCache').current_user.isLoggedIn()) {
						if (!localStorage.likes) {
							localStorage.likes = '';
						}
						var likes = localStorage.likes.split(' ');
						likes.push(this.id);
						localStorage.likes = likes.join(' ');
					}
					promise.resolve(this);
				}, () => promise.reject(this));
			if (!$rootScope.$$phase) { $rootScope.$apply(); }
			return promise.promise;
		};
	};
};

export default hasLikesService;
