'use strict';

class AdministrationCtrl {
	constructor($rootScope, $scope, $location, DataCache, LayoutManager) {
		if (!DataCache.current_user.isAdmin()) {
			$rootScope.open('/');
		}
		this.cache = DataCache;
		this.moment = moment;
		this.lm = LayoutManager;
		this.$location = $location;
		LayoutManager.hideBanner();

		this.administrationSection = 'overview';

		$scope.getAdministrationSection = function() {
			var matches = $location.path().match(/^\/administration\/?([A-Za-z]*)/);
			if (matches && matches.length > 1 && matches[1].length > 0) {
				return matches[1];
			} else {
				return 'overview';
			}
		};

		$scope.usage = {
			init() {
				this.data = {};
				this.error = null;
				this.loading = true;

				DataCache.account.getUsage()
					.then(usage => {
						this.data = usage;
						this.loading = false;
					}).catch(error => {
						this.data = {};
						this.loading = false;
						this.error = error;
					});
			},
			getSecondsForCurrentMonth() {
				var currentMonth = `${new Date().getFullYear()}-${('0' + (new Date().getMonth() +1)).slice(-2)}`;
				var results = this.data.usage.durations.filter(durationObject => durationObject._id === currentMonth);
				if (results.length > 0) {
					return results[0].total;
				} else {
					return 0;
				}
			}
		};
		$scope.usage.init();
	}
}
AdministrationCtrl.$inject = ['$rootScope', '$scope', '$location', 'DataCache', 'LayoutManager'];

export default AdministrationCtrl;
