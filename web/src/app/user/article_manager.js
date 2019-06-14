'use strict';

var ArticleService = function(DataCache) {
	return {

		_user: null,

		_isAuthorOfPage: function(user, page) {
			return (page.author.filter((author) => { return author.author_type === 'panda' && author.author_id === user.id; }).length > 0);
		},

		_getAllItems: function() {
			return Object.keys(DataCache.pages).map(function(pageid) {
				return DataCache.pages[pageid];
			}).concat(
				Object.keys(DataCache.collections).map(function(collectionid) {
					return DataCache.collections[collectionid];
				})
			);
		},

		setUser: function(_user) {
			this._user = _user;
			return this;
		},

		user: function() {
			return this._user || DataCache.current_user;
		},

		itemsWithStatus: function(status) {
			var manager = this,
				user = this.user(),
				items = this._getAllItems();
			return items.filter(function(item) {
				return (item && manager._isAuthorOfPage(user, item) && item.status) === status;
			});
		},

		itemsWithoutStatus: function() {
			var manager = this,
				user = this.user(),
				items = this._getAllItems();
			return items.filter(function(item) {
				return (item && manager._isAuthorOfPage(user, item) && !item.status) === true;
			});
		},

		editableItemsWithStatus: function(status) {
			var user = this.user(),
				items = this._getAllItems();
			return items.filter(function(item) {
				return (item && user.canSetPageOrCollectionStatus(item, status) && item.status) === status;
			});
		},

		editableItemsWithoutStatus: function() {
			var user = this.user(),
				items = this._getAllItems();
			if (!user.isLoggedIn()) {
				return [];
			}
			return items.filter(function(item) {
				return (item && user.canSetPageOrCollectionStatus(item, 'READY') && !item.status) === true;
			});
		},

		onlineCounter: function() {
			// admin should see status 'READY' and status 'CONTROLLED' pages' length
			if (this.user().can('*', '*')) {
				return (this.itemsWithStatus('READY').length + this.itemsWithStatus('CONTROLLED').length);
			}
			// everybody else should see his own pages' length
			return this.itemsWithoutStatus().length;
		}
	};
};

export default ArticleService;
