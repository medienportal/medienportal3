'use strict';

var LayoutManagerService = function($rootScope, $location, $route, DataCache) {

	var DEFAULT_BANNER_IMAGE = '/assets/images/banner/standard_banner@2x.png';

	return {
		classes: function() {
			var _classes = [],
				currentRouteHasNoLayout = function(currentRoute) {
					if (currentRoute &&
						currentRoute.$$route &&
						(
							currentRoute.$$route.originalPath.match(/^\/administration/) ||
							currentRoute.$$route.originalPath.match(/^\/article_overview/) ||
							currentRoute.$$route.originalPath.match(/^\/profile/) ||
							currentRoute.$$route.originalPath.match(/^\/user\/password/)
						)
						) {
						return true;
					} else {
						return false;
					}
				};
			if (currentRouteHasNoLayout($route.current)) {
				_classes.push('nolayout');
			}
			if (DataCache.current_user.isLoggedIn()) {
				_classes.push('loggedIn');
			}
			if (DataCache.current_user.edit_mode) {
				_classes.push('editMode');
			}
			return _classes;
		},

		showNavbar: function() {
			return (this.classes().indexOf('nolayout') === -1);
		},
		defaultBannerImage: function() {
			return DEFAULT_BANNER_IMAGE;
		},
		bannerStyle: '',
		bannerUrl: DEFAULT_BANNER_IMAGE,
		bannerIsHidden: false,
		hasBanner: function() {
			return !(this.bannerIsHidden || this.currentRouteHidesBanner());
		},
		currentRouteHidesBanner() {
			var currentRoute = $route.current;
			if (currentRoute &&
				currentRoute.$$route &&
				(
					currentRoute.$$route.originalPath.match(/^\/404/)
				)
				) {
				return true;
			} else {
				return false;
			}
		},
		hideBanner: function() {
			this.bannerIsHidden = true;
		},
		showBanner: function() {
			this.bannerIsHidden = false;
		},
		setBannerImage: function(url) {
			this.showBanner();
			if (!url) {
				this.url = this.defaultBannerImage();
				return;
			}
			this.bannerUrl = url;
			if (!$rootScope.$$phase) { $rootScope.$apply(); }
		},
		getBannerStyle: function() {
			if (this.bannerIsHidden) {
				return null;
			}
			return {
				'background-image': 'url(' + this.getBannerSrc() + ')'
			};
		},
		getBannerSrc: function() {
			if (this.bannerIsHidden) {
				return null;
			}
			return this.bannerUrl;
		}
	};
};

export default LayoutManagerService;
