'use strict';

var CookieInfoPanelDirective = function() {
	return {
		restrict: 'AE',
		scope: {
		},
		transclude: true,
		replace: true,
		templateUrl: 'app/components/cookie_info_panel/cookie_info_panel.html',
		controller: ['$rootScope', '$scope', function ($rootScope, $scope) {
			var didReadCookieInfo = window.localStorage.getItem('didReadCookieInfo') === '1';
			$scope.isShown = function() {
				return !didReadCookieInfo;
			};
			$rootScope.hideCookieInfoPanel = function() {
				didReadCookieInfo = true;
				window.localStorage.setItem('didReadCookieInfo', '1');
			};
		}]
	};
};

export default CookieInfoPanelDirective;
