'use strict';

class SettingsCtrl {
	constructor($scope, $route, $routeParams, $location, $timeout, DataCache, Category, User, Trivia, SearchService, LayoutManager, ThemeManager) {
		if (!DataCache.current_user.can('*', '*')) {
			$scope.open('/');
		}

		this.cache = DataCache;
		this.moment = window.moment;
		this.account = DataCache.account;

		this.Category = Category;
		this.User = User;
		this.$route = $route;
		this.$location = $location;
		this.Trivia = Trivia;
		this.ThemeManager = ThemeManager;
		this.SearchService = SearchService;
		this.userSearcher = new SearchService();

		this.selectedUser = '';

		LayoutManager.hideBanner();

		$scope.getAdministrationSection = function() {
			var matches = $location.path().match(/^\/administration\/?([A-Za-z]*)/);
			if (matches && matches.length > 1 && matches[1].length > 0) {
				return matches[1];
			} else {
				return 'overview';
			}
		};

		var self = this;


		this.vplanSettings = {
			uri: DataCache.account.getConfig('MP3VplanUri') || '',
			enabled: DataCache.account.getConfig('MP3VplanEnabled') || true,
			save: function() {
				if (this.uri !== undefined && this.enabled !== undefined) {
					DataCache.account.setConfig('MP3VplanUri', this.uri);
					DataCache.account.setConfig('MP3VplanEnabled', this.enabled);
				}
			}
		};
		$scope.$watch((() => this.vplanSettings.uri), (uri) => this.vplanSettings.enabled = !!uri);

		this.calendarSettings = {
			uri: DataCache.account.getConfig('MP3CalendarUri') || '',
			limit: DataCache.account.getConfig('MP3CalendarLimitEvents') || '',
			save: function() {
				if (this.uri) {
					DataCache.account.setConfig('MP3CalendarUri', this.uri);
					DataCache.account.setConfig('MP3CalendarLimitEvents', this.limit);
				}
			}
		};

		this.didyouknowSettings = {
			enabled: DataCache.account.getConfig('MP3DidYouKnowEnabled') || false,
			save: function() {
				if (this.enabled !== undefined) {
					DataCache.account.setConfig('MP3DidYouKnowEnabled', this.enabled);
				}
			}
		};
	}
	add_trivia(triviadata) {
		var trivia = new this.Trivia(triviadata);
		trivia.save().then(() => {
			this.cache.trivias.push(trivia);
			this.trivia = {};
		});
	}
	searchUserByName(searchService) {
		return function(text, callback) {
			searchService.getUser({
				text: text
			}).then(function(results) {
				callback(results.map(res => res.item()));
			});
		};
	}
	selectSearchedUser(_user) {
		var user = this.cache.users[_user.id];
		this.selectedUser = user;
		this.newPermissions = user.getPermissions();
	}
	coworkers() {
		return this.User.getUsersWithAnyRights();
	}
	all_users_without_coworkers() {
		return this.User.getUsersWithoutAnyRights();
	}
	selectRight(rights) {
		if (!this.newPermissions[rights.category]) {
			this.newPermissions[rights.category] = {};
		}
		this.newPermissions[rights.category][rights.right] = true;
		this.saveUserRights(this.selectedUser, this.newPermissions);
	}
	saveUserRights(user, permissions) {
		if (!user.permissions) {
			user.permissions = {};
		}
		user.savePermissions(permissions);
	}
	getCategoryTitle(categoryId) {
		var category = this.cache.categories[categoryId];
		if (category) {
			return category.title;
		}
	}
	possibleCategoryRights() {
		return {
			'create': 'erstellen',
			'edit': 'bearbeiten',
			'delete': 'löschen',
			'setControlled': 'als kontrolliert markieren',
			'setPublished': 'veröffentlichen'
		};
	}
	possibleGlobalRights() {
		return {
			'admin': 'ist Administrator.',
			'uploadVideo': 'kann Video-Dateien hochladen.',
			'uploadAudio': 'kann Audio-Dateien hochladen.'
		};
	}
	selectTheme(theme) {
		this.ThemeManager.setTheme(theme);
	}
}
SettingsCtrl.$inject = ['$scope', '$route', '$routeParams', '$location', '$timeout', 'DataCache', 'Category', 'User', 'Trivia', 'SearchService', 'LayoutManager', 'ThemeManager'];

export default SettingsCtrl;
