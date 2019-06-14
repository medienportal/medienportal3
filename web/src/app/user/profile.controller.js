'use strict';

class ProfileCtrl {
	constructor($scope, $routeParams, DataCache, ArticleManager, LayoutManager) {
		var $watcher;

		this.cache = DataCache;
		this.moment = window.moment;
		this.settings = {};
		this.ArticleManager = ArticleManager;
		LayoutManager.hideBanner();

		this.mem = {}; // memoize

		if ($routeParams.id) {
			$watcher = $scope.$watch(() => { return DataCache.users; }, () => {
				var user = DataCache.users[$routeParams.id];
				if (user) {
					this.user = user;
					this.setUser(user);
					$watcher();
				}
			}, true);
		} else {
			$watcher = $scope.$watch(() => { return DataCache.current_user; }, () => {
				var user = DataCache.current_user.isLoggedIn() && DataCache.current_user;
				if (user) {
					this.user = DataCache.current_user;
					this.setUser(DataCache.current_user);
					$watcher();
				}
			}, true);
		}
	}
	setUser(user, value) {
		var newuser = {
			name: [user.first_name, user.last_name].join(' '),
			klass: {
				first: user.klass && user.klass.split('/')[0],
				second: user.klass && ((user.klass.split('/').length > 1) && user.klass.split('/')[1])
			},
			vita: user.vita,
			email: user.email,
			password: user.password
		};

		if (value) {
			this.newuser[value] = newuser[value];
		} else {
			this.newuser = newuser;
		}
	}
	possibleActions(category) {
		var name = category.title;
		if (this.mem[category.id]) {
			return this.mem[category.id];
		}
		this.mem[category.id] = [
			{
				name: 'create',
				description: name + ' erstellen'
			},
			{
				name: 'edit',
				description: 'fremde ' + name + ' bearbeiten'
			},
			{
				name: 'delete',
				description: name + ' löschen'
			}
		];
		return this.mem[category.id];
	}
	setFocus(value) {
		var query = '[ng-model="profile.newuser.' + value +'"]';
		this.settings[value] = true;
		setTimeout(function() {
			$(query).focus();
		});
	}
	cancel(value) {
		this.settings[value] = false;
		this.setUser(this.user, value);
		$(window).focus();
	}
	save(value) {
		this.settings[value] = false;
		if (value === 'name') {
			var name = ProfileCtrl.getName(this.newuser.name);
			this.user.first_name = name.first_name;
			this.user.last_name = name.last_name;
		} else if (value === 'klass') {
			var first = this.newuser.klass.first;
			var second = this.newuser.klass.second;
			if (second) {
				this.user.klass = first + '/' + second;
			} else {
				this.user.klass = first;
			}
		}
		this.user.save();
		$(window).focus();
	}
	canEditUserRights(user) {
		if (!user || user.id === this.cache.current_user.id) {
			return false;
		}
		return this.cache.current_user.can('*', '*');
	}
	canEdit() {
		return true;
	}
	publishedArticles() {
		if (!this.user) { return []; }
		return this.ArticleManager.setUser(this.user).itemsWithStatus('PUBLISHED');
	}
	removeClass() {
		this.newuser.klass = {
			first: '',
			second: ''
		};
		this.save('klass');
	}
}
ProfileCtrl.getName = function(name) {
	var comps = name.split(' ');
	if (comps.length < 2) {
		return {
			first_name: comps[0],
			last_name: ''
		};
	}
	return {
		last_name: comps.pop(),
		first_name: comps.join(' ')
	};
};
ProfileCtrl.$inject = ['$scope', '$routeParams', 'DataCache', 'ArticleManager', 'LayoutManager'];

export default ProfileCtrl;
