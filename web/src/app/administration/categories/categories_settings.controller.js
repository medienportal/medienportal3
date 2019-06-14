'use strict';

class CategoriesSettingsController {
	constructor(DataCache, $routeParams) {
		this.DataCache = DataCache;
		this.$routeParams = $routeParams;
	}
	selectedCategory() {
		return this.DataCache.categories[this.$routeParams.categoryId];
	}
}

CategoriesSettingsController.$inject = ['DataCache', '$routeParams'];

export default CategoriesSettingsController;
