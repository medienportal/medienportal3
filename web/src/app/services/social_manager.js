'use strict';

var SocialManagerService = function($rootScope, $location, $route, $window) {

	var $rs = $rootScope;

	var getAbsoluteUrl = function(url) {
		var img = new Image();
		img.src = url;
		return img.src;
	};

	return {
		title: function() {
			if ($rs.currentPage) {
				return $rs.currentPage.title;
			}
			if ($rs.currentCollection) {
				return $rs.currentCollection.title;
			}
			if ($rs.currentCategory) {
				return $rs.currentCategory.title;
			}
			return this.site_title();
		},

		description: function() {
			if ($rs.currentPage) {
				return $rs.currentPage.config.excerp;
			}
			return this.site_description();
		},

		type: function() {
			if ($rs.currentPage) {
				return 'article';
			}
			return 'website';
		},

		image: function() {
			if ($rs.currentPage) {
				return getAbsoluteUrl($rs.currentPage.getPreview('middle'));
			}
			if ($rs.currentCollection) {
				return getAbsoluteUrl($rs.currentCollection.getPreview('middle'));
			}
			return this.site_image(); // return banner here
		},

		url: function() {
			return $window.location.href;
		},

		twitter_handle: function() {
			return '';
		},

		site_title: function() {
			return window.account.name;
		},

		site_description: function() {
			return window.account.name;
		},

		site_image: function() {
			var lgo = document.querySelector('.logo');
			var image;
			try {
				image = window.getComputedStyle(lgo)['background-image'].replace('url(', '').replace(')', '');
			} catch(e) {
				image = 'https://medienportal.org/images/icon.png';
			}
			return getAbsoluteUrl(image);
		}

	};
};

export default SocialManagerService;
