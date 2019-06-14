'use strict';

class HeaderCtrl {
	constructor($rootScope, $scope, ngDialog, DataCache, MainSearch, LayoutManager, ArticleManager, Page, Collection) {
		this.cache = DataCache;
		this.sm = MainSearch;
		this.$scope = $scope;
		this.$rootScope = $rootScope;
		this.ngDialog = ngDialog;
		this.Page = Page;
		this.Collection = Collection;
		this.ArticleManager = ArticleManager;
		$scope.lm = LayoutManager;
		this.navigationCount = function() {
			return Object.keys(this.cache.categories).length + 1;
		};
		this.navigationStyle = function(){
			if (!this.navigationCount) {
				return;
			}
			return {
				width: ((100/this.navigationCount()) + '%')
			};
		};

		$scope.$on('$routeChangeSuccess', () => {
			this.showMobileMenu = false;
			this.deactivateSearch();
		});
	}
	getHomepageCategories() {
		return Object.keys(this.cache.categories)
			.map(categoryId => this.cache.categories[categoryId])
			.filter(category => !category.parent_category_id)
	}
	onlineCounter() {
		return this.ArticleManager.onlineCounter();
	}
	activateSearch() {
		this.searchIsActive = true;
		setTimeout(function() {
			$('header .search_button.edit_button input')[0].focus();
		}, 150);
		$('header input[type=search]').on('keydown', (e) => {
			if ((e.keyCode === 27) && ($(this).val().length === 0)) {
				this.deactivateSearch();
				this.$scope.$apply();
			}
		});
	}
	deactivateSearch() {
		this.$scope.searchtext = '';
		this.searchIsActive = false;
		this.sm.reset();
	}
	toggleSearch($event) {
		if (this.searchIsActive && $event.target.nodeName !== 'INPUT') {
			this.deactivateSearch();
		} else {
			this.activateSearch();
		}
	}
	isActiveCategory(category) {
		if (this.$rootScope.currentCategory) {
			return (this.$rootScope.currentCategory.id === category.id);
		}
		return false;
	}
	openCollectionFile(file) {
		if (!this.$rootScope.currentCollection || !file) {
			return;
		}
		this.$rootScope.open('/collection/' + this.$rootScope.currentCollection.id + '/file/' + file.id);
	}
	showCreateButton() {
		var user = this.cache.current_user;
		return Object.keys(this.cache.categories).filter(catId => {
			return this.cache.categories[catId].pageType !== 'greetingsPage' && user.can('create', catId);
		}).length > 0;
	}
	openNewPageModal() {
		this.ngDialog.open({
			template: 'app/components/header/newpage.html',
			controller: 'NewPageCtrl as newpage',
			className: 'ngdialog-theme-default'
		});
	}
	openLoginDialog() {
		this.ngDialog.open({
			template: 'app/user/login.html',
			controller: 'UserLoginCtrl as login',
			className: 'ngdialog-theme-default user-login'
		});
	}
	openRegisterDialog() {
		this.ngDialog.open({
			template: 'app/user/register.html',
			controller: 'UserRegisterCtrl as register',
			className: 'ngdialog-theme-default user-register'
		});
	}
	openFeedbackDialog() {
		this.ngDialog.open({
			template: 'app/feedback/feedback.html',
			controller: 'FeedbackCtrl as feedback'
		});
	}
}

HeaderCtrl.$inject = ['$rootScope', '$scope', 'ngDialog', 'DataCache', 'MainSearch', 'LayoutManager', 'ArticleManager', 'Page', 'Collection'];

export default HeaderCtrl;
