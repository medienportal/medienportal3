'use strict';

class SubcategoriesListingController {
	constructor($scope, $timeout) {
		this.$scope = $scope;
		this.$timeout = $timeout;
	}
	enableReorderSubcategories() {
		this.$timeout(() => {
			var draggableLiElms = $('.subcategories').find('li[draggable="true"]');
			draggableLiElms.on('dragstart', this.reorderFnDragstart.bind(this.$scope));
			draggableLiElms.on('dragover', this.reorderFnDragover.bind(this.$scope));
			draggableLiElms.on('dragenter', this.reorderFnDragenter.bind(this.$scope));
			draggableLiElms.on('dragleave', this.reorderFnDragover.bind(this.$scope));
			draggableLiElms.on('dragend', this.reorderFnDragleave.bind(this.$scope));
			draggableLiElms.on('drop', this.reorderFnDrop.bind(this.$scope));
		}, 10, false);
	}
	endReorderedSubcategories() {
		var draggableLiElms = $('.reorder-categories-box').parent().find('ul li[draggable="true"]');
		draggableLiElms.off('dragstart', this.reorderFnDragstart);
		draggableLiElms.off('dragover', this.reorderFnDragover);
		draggableLiElms.off('dragenter', this.reorderFnDragenter);
		draggableLiElms.off('dragleave', this.reorderFnDragover);
		draggableLiElms.off('dragend', this.reorderFnDragleave);
		draggableLiElms.off('drop', this.reorderFnDrop);
	}
	reorderFnDragstart($event) {
		var category = this.selectedCategory;
		this.draggingSubcategory = category.navigation.filter(subc => {
			return subc.id === $event.target.id.replace('subcategory_', '');
		})[0];
	}
	reorderFnDragover($event) {
		$event.stopPropagation();
		$event.preventDefault();

		$($event.target)
			.siblings()
			.css({paddingBottom: 0});
		var e = $(`#subcategory_${this.draggingSubcategory.id}`);
		$($event.target)
			.filter('li:not(.ng-hide)')
			.filter(`:not(#subcategory_${this.draggingSubcategory.id})`)
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
	}
	reorderFnDragend($event) {
		$($event.target)
			.siblings()
			.css({paddingBottom: 0});
		$event.preventDefault();
	}
	reorderFnDrop($event) {
		var category = this.selectedCategory;
		if (!this.draggingSubcategory) {
			return console.error('no dragging Subcategory');
		}
		$($event.target).css({paddingBottom: 0});

		var id = $($event.target).attr('id').replace('subcategory_', '');
		var dropCat = category.navigation.filter(subc => subc.id === id)[0];
		var i = 0;
		category.navigation
			.sort((subc1, subc2) => subc1.position - subc2.position)
			.forEach(subc => {
				if (subc !== this.draggingSubcategory) {
					subc.position = i;
					subc.save();
				}
				i+=10;
			});
		this.draggingSubcategory.position = dropCat.position + 5;
		this.draggingSubcategory.save();
		this.draggingSubcategory = null;

		this.subcategories.endReorderedSubcategories();

		this.$apply();

		$event.stopPropagation();
		$event.preventDefault();
		return false;
	}
	createSubcategory(category) {
		category.createSubcategory({ title: 'Unterkategorie' });
	}
	removeSubcategory(subcategory) {
		this.$scope.selectedCategory.removeSubcategory(subcategory.id);
	}
}
SubcategoriesListingController.$inject = ['$scope', '$timeout'];

var subcategoriesListing = function() {
	return {
		restrict: 'E',
		templateUrl: 'app/administration/categories/subcategories_listing.directive.html',
		controller: SubcategoriesListingController,
		controllerAs: 'subcategories',
		scope: {
			items: '=',
			selectedCategory: '='
		},
		link: function(scope, el, attrs) {
			scope.$watch('items', () => {
				scope.subcategories.endReorderedSubcategories();
				scope.subcategories.enableReorderSubcategories();
				console.log('items changed');
			});
		}
	};
};



export default subcategoriesListing;
