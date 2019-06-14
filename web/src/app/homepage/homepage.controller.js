'use strict';

class HomepageCtrl {
	constructor($filter, $scope, $http, DataCache, Page, LayoutManager) {
		this.cache = DataCache;
		this.pagesAndCollections = function() {
			var homepageFilter = function(item) {
				var category = DataCache.categories[item.category_id];
				var hideOnHomepage = (item.config && (category && category.config.hide_from_homepage === true));
				var isTopStory = (item.id === DataCache.topstoryId);
				var isPublished = (item.status === 'PUBLISHED');
				return isPublished && !hideOnHomepage && !isTopStory;
			};
			var pages =
				Object.keys(DataCache.pages)
					.map(function(pid) { return DataCache.pages[pid]; }).filter(homepageFilter);
			var collections =
				Object.keys(DataCache.collections)
					.map(function(pid) { return DataCache.collections[pid]; }).filter(homepageFilter);
			return $filter('orderBy')(pages.concat(collections), 'created_at', true);
		};
		this.topstory = function() {
			var id = DataCache.topstoryId;
			return (DataCache.pages[id] || DataCache.collections[id] || null);
		};
		this.comments = DataCache.comments;
		this.moment = moment;
		this.greetings = function() {
			return Object.keys(DataCache.greetings).map(function(greetingid) {
				return DataCache.greetings[greetingid];
			});
		};
		this.greetingsPage = function() {
			var greetingsPages = Object.keys(this.cache.categories).filter(function(cat) {
				var category = this.cache.categories[cat];
				return category.config.pageType === 'greetingsPage';
			});
			if (greetingsPages.length > 0) {
				return greetingsPages[0];
			}
			return false;
		};

		$scope.$watch(() => { return Object.keys(this.comments).length; }, () => {
			this.latestComments = Object.keys(this.comments).map(function(commentId) { return DataCache.comments[commentId]; });
		}, true);

		this.sendFeedback = function(message) {
			$http.post(api_endpoint + '/feedback', { message: message });
			$scope.feedback.message = '';
		};

		LayoutManager.setBannerImage(DataCache.account.getBanner());
	}
}

HomepageCtrl.$inject = ['$filter', '$scope', '$http', 'DataCache', 'Page', 'LayoutManager'];

export default HomepageCtrl;
