'use strict';

import AccountFactory from './administration/account.factory';
import ApplicationCtrl from './application/application.controller';
import HomepageCtrl from './homepage/homepage.controller';
import UserbarCtrl from './components/userbar/userbar.controller';
import UserLoginCtrl from './user/login.controller';
import UserRegisterCtrl from './user/register.controller';
import HeaderCtrl from './components/header/header.controller';
import NewPageCtrl from './components/header/newpage.controller';
import FooterCtrl from './components/footer/footer.controller';
import DataCache from './services/datacache';
import LayoutManagerService from './services/layout_manager';
import ThemeManagerService from './services/theme_manager';
import SocialManagerService from './services/social_manager';
import ScraperManagerService from './services/scraper_manager.service';
import SearchService from './search/search.service';
import SearchPageCtrl from './search/searchpage.controller';
import SearchResultsDirective from './search/searchresults.directive';
import RealTimeService from './services/real_time';
import ArticleService from './user/article_manager';
import CategoryFactory from './category/category.factory';
import CategoryCtrl from './category/category.controller';
import ModuleFactory from './components/module/module.factory';
import ModuleDirective from './components/module/module.directive';
import AutoResizeVideo from './components/module/auto_resize_video.directive';
import PandaReplaceEmojisDirective from './comment/panda_replace_emojis.directive';
import { DragModuleDirective, DropModuleDirective } from './components/module/drag_drop_module.directive';
import PageFactory from './page/page.factory';
import PageCtrl from './page/page.controller';
import CollectionFactory from './collection/collection.factory';
import CollectionFileFactory from './collection/collectionfile.factory';
import CollectionCtrl from './collection/collection.controller';
import CollectionFileCtrl from './collection/collectionfile.controller';
import UserSelectorDirective from './components/user_selector/user_selector.directive';
import UserFactory from './user/user.factory';
import ProfileCtrl from './user/profile.controller';
import CommentFactory from './comment/comment.factory';
import CollectionFileCommentFactory from './comment/collection_file_comment.factory';
import GreetingFactory from './greeting/greeting.factory';
import GreetingsCtrl from './greeting/greeting.controller';
import AdministrationCtrl from './administration/administration.controller';
import SettingsCtrl from './administration/settings.controller';
import CategoriesSettingsCtrl from './administration/categories/categories_settings.controller';
import categoriesSettingsNavigation from './administration/categories/categories_settings_navigation.directive';
import subcategoriesListing from './administration/categories/subcategories_listing.directive';
import PasswordRecoveryCtrl from './user/password_recovery.controller';
import ArticleOverviewController from './article_overview/article_overview.controller';
import ErrorPageCtrl from './error_pages/error.controller.js';
import FeedbackCtrl from './feedback/feedback.controller';
import ActivityFactory from './components/boxes/activity/activity.factory';
import ActivityDirective from './components/boxes/activity/activity.directive';
import TriviaDirective from './components/boxes/trivia/trivia.directive';
import TriviaFactory from './components/boxes/trivia/trivia.factory';
import VplanDirective from './components/boxes/vplan/vplan.directive';
import EventsDirective from './components/boxes/events/events.directive';
import UserListDirective from './components/boxes/user_list/user_list.directive';
import ShareboxDirective from './components/sharebox/sharebox.directive';
import hasLikesService from './services/has_likes';
import hasCommentsService from './services/has_comments';
import ItemDirective from './components/item/item.directive';
import BnLazySrc from './services/bn_lazy_source.directive';
import pandaGreetingPositioningDirective from './greeting/greeting_positioning.directive';
import PandaScrollfixDirective from './services/panda_scrollfix.directive';
import ContentTransformerService from './services/content_transformer.service';
import { RemoveHtmlFilter, OrderObjectsByFilter, UaDetectorFilter } from './services/filters';
import RemoveStylesContenteditableDirective from './components/module/remove_styles.directive';
import CookieInfoPanelDirective from './components/cookie_info_panel/cookie_info_panel.directive';

// include contenteditable through app, as wiredep seems to have problem with bower component
import ContenteditableDirective from './services/angular-contenteditable.directive.js';
angular.module('contenteditable', []).directive('contenteditable', ContenteditableDirective);

angular
	.module('medienportal', [
		'ezfb',
		'googleplus',
		'angulartics',
		'angulartics.google.analytics',
		'ngFileUpload',
		'angular-loading-bar',
		'ngTagsInput',
		'Mac',
		'ngAnimate',
		'ngRoute',
		'ngCookies',
		'ngSanitize',
		'ngTouch',
		'angular-inview',
		'contenteditable',
		'ngDialog',
		'toaster'
	])
	.factory('Account', AccountFactory)
	.controller('HomepageCtrl', HomepageCtrl)
	.controller('ApplicationCtrl', ApplicationCtrl)
	.controller('HeaderCtrl', HeaderCtrl)
	.controller('NewPageCtrl', NewPageCtrl)
	.controller('FooterCtrl', FooterCtrl)
	.controller('UserbarCtrl', UserbarCtrl)
	.controller('UserLoginCtrl', UserLoginCtrl)
	.controller('UserRegisterCtrl', UserRegisterCtrl)
	.service('DataCache', DataCache)
	.service('SearchService', SearchService)
	.service('MainSearch', (SearchService) => new SearchService())
	.directive('searchResults', SearchResultsDirective)
	.controller('SearchPageCtrl', SearchPageCtrl)
	.service('RealTime', RealTimeService)
	.service('ArticleManager', ArticleService)
	.service('LayoutManager', LayoutManagerService)
	.service('ThemeManager', ThemeManagerService)
	.service('SocialManager', SocialManagerService)
	.service('ScraperManager', ScraperManagerService)
	.service('hasLikes', hasLikesService)
	.service('hasComments', hasCommentsService)
	.factory('Category', CategoryFactory)
	.controller('CategoryCtrl', CategoryCtrl)
	.factory('Module', ModuleFactory)
	.directive('module', ModuleDirective)
	.directive('dragModule', DragModuleDirective)
	.directive('dropModule', DropModuleDirective)
	.directive('autoResizeVideo', AutoResizeVideo)
	.directive('pandaReplaceEmojis', PandaReplaceEmojisDirective)
	.factory('Page', PageFactory)
	.controller('PageCtrl', PageCtrl)
	.factory('Collection', CollectionFactory)
	.factory('CollectionFile', CollectionFileFactory)
	.controller('CollectionCtrl', CollectionCtrl)
	.controller('CollectionFileCtrl', CollectionFileCtrl)
	.directive('userSelector', UserSelectorDirective)
	.factory('User', UserFactory)
	.controller('ProfileCtrl', ProfileCtrl)
	.factory('Comment', CommentFactory)
	.factory('CollectionFileComment', CollectionFileCommentFactory)
	.controller('GreetingsCtrl', GreetingsCtrl)
	.factory('Greeting', GreetingFactory)
	.controller('ArticleOverviewCtrl', ArticleOverviewController)
	.controller('AdministrationCtrl', AdministrationCtrl)
	.controller('SettingsCtrl', SettingsCtrl)
	.controller('CategoriesSettingsCtrl', CategoriesSettingsCtrl)
	.directive('categoriesSettingsNavigation', categoriesSettingsNavigation)
	.directive('subcategoriesListing', subcategoriesListing)
	.controller('PasswordRecoveryCtrl', PasswordRecoveryCtrl)
	.controller('ErrorPageCtrl', ErrorPageCtrl)
	.controller('FeedbackCtrl', FeedbackCtrl)
	.factory('Activity', ActivityFactory)
	.directive('activityBox', ActivityDirective)
	.factory('Trivia', TriviaFactory)
	.directive('triviaBox', TriviaDirective)
	.directive('boxUserList', UserListDirective)
	.directive('eventsBox', EventsDirective)
	.directive('vPlan', VplanDirective)
	.directive('item', ItemDirective)
	.directive('sharebox', ShareboxDirective)
	.directive('bnLazySrc', BnLazySrc)
	.directive('contenteditable', RemoveStylesContenteditableDirective)
	.directive('pandaScrollfix', PandaScrollfixDirective)
	.directive('pandaGreetingPositioning', pandaGreetingPositioningDirective)
	.service('ContentTransformer', ContentTransformerService)
	.filter('removeHtml', RemoveHtmlFilter)
	.filter('orderObjectsBy', OrderObjectsByFilter)
	.filter('uaDetector', UaDetectorFilter)
	.directive('cookieInfoPanel', CookieInfoPanelDirective)
	.config(function($httpProvider,
					$sceDelegateProvider,
					$routeProvider,
					$cookiesProvider,
					$locationProvider,
					ezfbProvider,
					GooglePlusProvider,
					$analyticsProvider,
					$provide) {
	window.moment.locale('de');

	$httpProvider.defaults.useXDomain = true;
	$sceDelegateProvider.resourceUrlWhitelist([
		'data:**',
		'http://mport.al/**',
		'http*://d1wvxt7nfpuoql.cloudfront.net/**',   // medienportal production
		'http*://d31gjszttcxytd.cloudfront.net/**',  // medienportal staging
		'http*://d1dvvsd95n8302.cloudfront.net/**', // medienportal files
		'http*://w.soundcloud.com/**',
		'http*://www.facebook.com/**',
		'http*://e.issuu.com/**',
		'self']);
	delete $httpProvider.defaults.headers.common['X-Requested-With'];

	$cookiesProvider.defaults.domain = window.configuration.app.cookie_domain;
	$cookiesProvider.defaults.expires = moment().add(2, 'weeks').toDate();
	$httpProvider.defaults.headers.common['X-PANDA-ACCOUNT-ID'] = window.account._id;

	$httpProvider.interceptors.push(['$q', '$injector', '$rootScope', 'toaster', function($q, $injector, $rootScope, toaster) {
		return {
			'responseError': function(response) {
				var cache = $injector.get('DataCache');
				if (response.status === 401) {
					cache.logout();
				}
				if (response.status === 500 || response.status === 400) {
					var error = new Error('Error from Server: ' + JSON.stringify(response));
					toaster.pop('error', 'Fehler!', error);
				}
				if (response.status === 404) {
					$rootScope.open('/404');
				}
				return response;
			}
		};
	}]);

	$provide.decorator('$exceptionHandler', ['$delegate', '$window', function($delegate, $window) {
		return function (exception, cause) {
			if ($window.trackJs) {
				$window.trackJs.track(exception);
			}
			$delegate(exception, cause);
		};
	}]);

	var loginResolves = {
		user: ['DataCache', function(DataCache) {
			return DataCache.getFirstLoginAttempt();
		}]
	};

	// Application routes.
	$locationProvider.html5Mode(configuration.app.html5mode).hashPrefix(configuration.app.hashprefix);
	$routeProvider
		.when('/', {
			controller  : 'HomepageCtrl as homepage',
			templateUrl : 'app/homepage/homepage.html'
		})
		.when('/page/:id', {
			controller  : 'PageCtrl as page',
			templateUrl : 'app/page/page.html'
		})
		.when('/category/:id/:subcategory_id?', {
			controller  : 'CategoryCtrl as category',
			templateUrl : 'app/category/category.html'
		})
		.when('/collection/:id', {
			controller  : 'CollectionCtrl as collection',
			templateUrl : 'app/collection/collection.html'
		})
		.when('/collection/:id/file/:file_id', {
			controller  : 'CollectionFileCtrl as collectionfile',
			templateUrl : 'app/collection/collectionfile.html'
		})
		.when('/search/:searchtext?', {
			controller: 'SearchPageCtrl as search',
			templateUrl : 'app/search/searchpage.html'
		})
		.when('/profile', {
			controller  : 'ProfileCtrl as profile',
			templateUrl : 'app/user/profile.html'
		})
		.when('/profile/:id', {
			controller  : 'ProfileCtrl as profile',
			templateUrl : 'app/user/profile.html'
		})
		.when('/login', {
			controller  : 'UserLoginCtrl as login',
			templateUrl : 'app/user/login.html'
		})
		.when('/register', {
			controller  : 'UserRegisterCtrl as register',
			templateUrl : 'app/user/register.html'
		})
		.when('/user/password/recover/:token', {
			controller  : 'PasswordRecoveryCtrl as pwRecovery',
			templateUrl : 'app/user/pw_recovery.html'
		})
		.when('/administration', {
			controller  : 'AdministrationCtrl as administration',
			templateUrl : 'app/administration/administration.html',
			resolve: loginResolves
		})
		.when('/administration/users', {
			controller  : 'SettingsCtrl as settings',
			templateUrl : 'app/administration/users.html',
			resolve: loginResolves
		})
		.when('/administration/categories', {
			controller  : 'CategoriesSettingsCtrl as settings',
			templateUrl : 'app/administration/categories/categories.html',
			resolve: loginResolves
		})
		.when('/administration/categories/:categoryId', {
			controller  : 'CategoriesSettingsCtrl as settings',
			templateUrl : 'app/administration/categories/categories.html',
			resolve: loginResolves
		})
		.when('/administration/trivia', {
			controller  : 'SettingsCtrl as settings',
			templateUrl : 'app/administration/trivia.html',
			resolve: loginResolves
		})
		.when('/administration/account', {
			controller  : 'SettingsCtrl as settings',
			templateUrl : 'app/administration/account.html',
			resolve: loginResolves
		})
		.when('/administration/themes', {
			controller  : 'SettingsCtrl as settings',
			templateUrl : 'app/administration/themes.html',
			resolve: loginResolves
		})
		.when('/article_overview', {
			controller: 'ArticleOverviewCtrl as overviews',
			templateUrl : 'app/article_overview/article_overview.html'
		})
		.when('/faq', {
			templateUrl : 'app/faq/faq.html'
		})
		.when('/privacy', {
			templateUrl : 'app/privacy/privacy.html'
		})
		.when('/impress', {
			templateUrl : 'app/impress/impress.html'
		})
		.when('/404', {
			templateUrl: 'app/error_pages/404.html',
			controller: 'ErrorPageCtrl as error'
		})
		.otherwise({
			redirectTo: '/404'
		});

	ezfbProvider.setInitParams({
		appId: configuration.facebook.appId
	});
	GooglePlusProvider.init({
		clientId: configuration.google.clientId,
		scopes: [
			'https://www.googleapis.com/auth/plus.login',
			'https://www.googleapis.com/auth/userinfo.profile',
			'https://www.googleapis.com/auth/userinfo.email'
		].join(' ')
	});
})

  // Application runtime configuration and events.
  .run(function(
  	$rootScope,
  	$location,
  	$window,
	$cookies,
	$http,
  	DataCache,
  	RealTime
  ) {
  	// baseUrl to be used for links
  	$rootScope.baseUrl = '//' + $window.location.host;

	var sessionId = $cookies.get('X-PANDA-AUTH-SESSION-ID');
	if (sessionId) {
		$http.defaults.headers.common['X-PANDA-AUTH-SESSION-ID'] = sessionId;
	}

	$rootScope.open = function(location) {
		$location.path(location);
		if (!$rootScope.$$phase) {
			$rootScope.$apply();
		}
	};

	// Show loading message on route change start.
	$rootScope.$on('$routeChangeStart', function (event, next, current) {
		$rootScope.currentCategory = null;
		$rootScope.currentCollection = null;
		DataCache.currentPage = null;
		$rootScope.currentPage = null;
		$rootScope.currentCollectionFile = null;
		$rootScope.fullsize = false;
		$rootScope.showLoader = true;

		if (current) {
			if (window.sessionStorage) {
				var historyEntries;
				try {
					historyEntries = JSON.parse(window.sessionStorage.getItem('lastPagePositionHistory'));
				} catch(e) {
					historyEntries = [];
				}
				if (!historyEntries) {
					historyEntries = [];
				}
				var lastPagePosition = {
					path: window.location.pathname,
					posx: window.scrollX,
					posy: window.scrollY
				};
				historyEntries.push(lastPagePosition);
				historyEntries = historyEntries.slice(-2);
				window.sessionStorage.setItem('lastPagePositionHistory', JSON.stringify(historyEntries));
			}
		}
	});

	// Hide loading message on route change success.
	$rootScope.$on('$routeChangeSuccess', function (e, current) {
		if (!current.$$route.originalPath.match(/^\/search/)) {
			$location.search('f', null);
		}
		$rootScope.showLoader = false;
		if (DataCache.current_user.edit_mode) {
			if (!current.$$route.controller.match(/(page|collection)$/)) {
				DataCache.current_user.edit_mode = false;
			}
		}

		if (sessionStorage && sessionStorage.getItem('lastPagePositionHistory')) {
			var historyEntries;
			try {
				historyEntries = JSON.parse(sessionStorage.getItem('lastPagePositionHistory'));
			} catch(__error) {
				return;
			}
			var lastPagePosition = historyEntries.slice(-2)[0];
			if (lastPagePosition && lastPagePosition.path === window.location.pathname) {
				setTimeout(function() {
					window.scrollTo(lastPagePosition.posx, lastPagePosition.posy);
				}, 500);
			}
		}

		if (window.Intercom) {
			window.Intercom('update');
		}
	});

	RealTime.init();

	$rootScope.appReady = false;
	DataCache.loadContent();

	window.onbeforeunload = function(e) {
		localStorage.setItem('lastclose', new Date());
		if (DataCache.current_user.isCoworker()) {
			if (DataCache.pendingRequests.length > 0) {
				e.returnValue = 'Es sind noch nicht alle Anfragen beendet. Es könnten Veränderungen verloren gehen. Trotzdem beenden?';
			}
		}
	};
});

window.currentAccount = window.account;
window.currentAccount.id = window.account._id;
