'use strict';

class FooterCtrl {
	constructor($scope) {
		$scope.currentYear = moment().year();
	}
}
FooterCtrl.$inject = ['$scope'];

export default FooterCtrl;
