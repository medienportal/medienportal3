'use strict';

class ArticleOverviewController {
	constructor($rootScope, DataCache, ArticleManager, LayoutManager) {
		var user = DataCache.current_user;
		this.user = user;
		this.manager = ArticleManager.setUser(user);

		LayoutManager.hideBanner();

		$rootScope.hideNavigationbar = true;
		$rootScope.$on('$routeChangeStart', () => $rootScope.hideNavigationbar = false);
	}
}

ArticleOverviewController.$inject = ['$rootScope', 'DataCache', 'ArticleManager', 'LayoutManager'];

export default ArticleOverviewController;
