'use strict';

class CategoriesSettingsNavigationController {
	constructor($scope, $timeout, $routeParams, DataCache, Category, LayoutManager) {
		this.$scope = $scope;
		this.$timeout = $timeout;
		this.$routeParams = $routeParams;

		this.DataCache = DataCache;
		this.Category = Category;
		this.LayoutManager = LayoutManager;

		this.isReorderModeOn = false;
	}
	isHomepageSelected() {
		return !!this.selectedCategory;
	}
	createCategory(title) {
		var position =
			Math.round(
				Math.max(...Object.keys(this.DataCache.categories)
					.map(catId => this.DataCache.categories[catId].position))
			) + 10;
		var category = new this.Category({
			title: title || 'Neue Kategorie',
			position,
			config: {
				pageType: 'standardPage'
			}
		});
		category.save().then(
			_category => this.DataCache.categories[_category.id] = _category
		);
	}
	deleteSelectedCategory() {
		var category = this.selectedCategory();
		var warning = 'Diese Aktion kann nicht rückgängig gemacht werden! Möchtest du wirklich ' + category.title + ' löschen?';
		if (window.confirm(warning)) {
			this.DataCache.deleteCategory(category).then(() => {
				this.$scope.open('/administration/categories');
			});
		}
	}
	categories() {
		return this.DataCache.categories;
	}
	selectedCategory() {
		return this.DataCache.categories[this.$routeParams.categoryId];
	}
	getBanner() {
		var size = (window.devicePixelRatio > 1) ? 'banner@2x' : 'banner';
		if (this.selectedCategory() && this.selectedCategory().config.banners && this.selectedCategory().config.banners.length) {
			return this.selectedCategory().config.banners[0][size];
		}
		return this.LayoutManager.defaultBannerImage();
	}
	resetSelectedCategory() {
		this.$scope.open('/administration/categories');
	}

	// reordering stuff
	enableReorderCategories() {
		this.$timeout(() => {
			var draggableLiElms = $('.reorder-categories-box').parent().find('ul li[draggable]');
			console.log(draggableLiElms);
			console.log($('.reorder-categories-box').parent().find('ul li[draggable="true"]'));
			draggableLiElms.on('dragstart', this.reorderFnDragstart.bind(this));
			draggableLiElms.on('dragover', this.reorderFnDragover.bind(this));
			draggableLiElms.on('dragenter', this.reorderFnDragenter.bind(this));
			draggableLiElms.on('dragleave', this.reorderFnDragover.bind(this));
			draggableLiElms.on('dragend', this.reorderFnDragleave.bind(this));
			draggableLiElms.on('drop', this.reorderFnDrop.bind(this));
			this.isReorderModeOn = true;
		}, 100, true);
	}
	reorderFnDragstart($event) {
		this.draggingCategory = this.DataCache.categories[$event.target.id.replace('category_', '')];
		console.log('draggingCategory: ', this.draggingCategory);
	}
	reorderFnDragover($event) {
		$event.stopPropagation();
		$event.preventDefault();

		$($event.target)
			.siblings()
			.css({paddingBottom: 0});
		var e = $(`#category_${this.draggingCategory.id}`);
		$($event.target)
			.filter('li:not(.ng-hide)')
			.filter(`:not(#category_${this.draggingCategory.id})`)
			.css({paddingBottom: e.outerHeight() * 1.5});

		$event.originalEvent.dataTransfer.dropEffect = 'move';
		$event.originalEvent.dataTransfer.effectAllowed = 'move';

		return false;
	}
	reorderFnDragenter($event) {
		$event.preventDefault();
	}
	reorderFnDragleave($event) {
		$event.preventDefault();
	};
	reorderFnDragend($event) {
		$($event.target)
			.siblings()
			.css({paddingBottom: 0});
		$event.preventDefault();
	}
	reorderFnDrop($event) {
		if (!this.draggingCategory) {
			throw new Error('no dragging Category');
		}
		$($event.target).css({paddingBottom: 0});

		var id = $($event.target).attr('id').replace('category_', '');
		var dropCat = this.DataCache.categories[id];
		var i = 0;
		Object.keys(this.DataCache.categories)
			.map(catId => this.DataCache.categories[catId])
			.sort((cat1, cat2) => cat1.position - cat2.position)
			.forEach(cat => {
				if (cat !== this.draggingCategory) {
					cat.position = i;
				}
				i+=10;
			});
		this.draggingCategory.position = dropCat.position + 5;
		this.draggingCategory = null;

		this.$timeout(() => {
			this.endReorderedCategories();
			this.enableReorderCategories();
		}, 10, false);
		this.$scope.$apply();

		$event.stopPropagation();
		$event.preventDefault();
		return false;
	}
	saveReorderedCategories() {
		if (!this.isReorderModeOn) {
			return;
		}
		for (let categoryId in this.DataCache.categories) {
			let category = this.DataCache.categories[categoryId];
			category.save();
		}
		this.endReorderedCategories();
	}
	endReorderedCategories() {
		var draggableLiElms = $('.reorder-categories-box').parent().find('ul li[draggable="true"]');
		draggableLiElms.off('dragstart', this.reorderFnDragstart);
		draggableLiElms.off('dragover', this.reorderFnDragover);
		draggableLiElms.off('dragenter', this.reorderFnDragenter);
		draggableLiElms.off('dragleave', this.reorderFnDragover);
		draggableLiElms.off('dragend', this.reorderFnDragleave);
		draggableLiElms.off('drop', this.reorderFnDrop);
		this.isReorderModeOn = false;
	}
}
CategoriesSettingsNavigationController.$inject = ['$scope', '$timeout', '$routeParams', 'DataCache', 'Category', 'LayoutManager'];

var categoriesSettingsNavigation = function() {
	return {
		restrict: 'E',
		templateUrl: 'app/administration/categories/categories_settings_navigation.html',
		controller: CategoriesSettingsNavigationController,
		controllerAs: 'categoriesSettingsNav'
	};
};



export default categoriesSettingsNavigation;
