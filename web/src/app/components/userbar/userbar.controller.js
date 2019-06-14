'use strict';

class UserbarCtrl {
	constructor($rootScope, DataCache, Page, Collection) {
		this.cache = DataCache;
		this.loginuser = {};
		this.$rootScope = $rootScope;
		this.enabledEmailLogin = false;
		this.Page = Page;
		this.Collection = Collection;
	}
	breadcrumbClassForStatus(status) {
		var pageOrCollection = this.$rootScope.currentPage || this.$rootScope.currentCollection;
		if (!pageOrCollection) {
			return {};
		}
		if (pageOrCollection.hasStatus(status)) {
			return { checked: true };
		}
		if (this.cache.current_user.canSetPageOrCollectionStatus(pageOrCollection, status)) {
			return { is_allowed: true };
		}
		return {};
	}
	setStatus(status) {
		var pageOrCollection = this.$rootScope.currentPage || this.$rootScope.currentCollection;
		if (!pageOrCollection || pageOrCollection.status === status) {
			return;
		}
		pageOrCollection.setStatus(status);
	}
	isShowStatusBreadcrumb() {
		var pageOrCollection = this.$rootScope.currentPage || this.$rootScope.currentCollection;
		if (pageOrCollection && !this.$rootScope.currentCollectionFile && this.cache.current_user.canEditPage(pageOrCollection)) {
			return true;
		}
		return false;
	}
	isShowUserbar() {
		var user = this.cache.current_user;
		var page = this.$rootScope.currentCollection || this.$rootScope.currentPage || this.$rootScope.currentCategory;
		if (!!page) {
			return (user.canEditPage(page) || user.can('setControlled', page) || user.can('setPublished', page));
		} else {
			return false;
		}
	}
	showEditButton() {
		var user = this.cache.current_user;
		if (user.can('*', '*')) {
			return true;
		}
		var currentCategory = this.$rootScope.currentCategory;
		if (currentCategory && (currentCategory.config.pageType === 'greetingsPage')) {
			return false;
		}
		var item = this.$rootScope.currentPage || this.$rootScope.currentCollection;
		if (item) {
			return this.cache.current_user.canEditPage(item);
		}
		return false;
	}
}
UserbarCtrl.$inject = ['$rootScope', 'DataCache', 'Page', 'Collection'];

export default UserbarCtrl;
