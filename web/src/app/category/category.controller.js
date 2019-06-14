'use strict';

class CategoryCtrl {
	constructor($rootScope, $scope, $routeParams, DataCache, LayoutManager, Module) {
		this.moment = moment;
		this.cache = DataCache;
		this.$scope = $scope;
		this.$routeParams = $routeParams;
		this.onePager = null;
		this.currentCategory = null;
		this.Module = Module;

		this.currentCategoryModules = [];

		var getCurrentCategory = () => {
			this.currentCategory = DataCache.categories[$routeParams.id];
			if (!this.currentCategory) {
				return;
			}
			$rootScope.currentCategory = this.currentCategory;
			$rootScope.currentCategorySubcategoryId = $routeParams.subcategory_id;
			this.currentCategory.loadPagesAndCollectionsAndModules().then(() => {
				var bannerImage = this.getBanner();
				LayoutManager.setBannerImage(bannerImage);

				$scope.$watch(() => {
					return (this.currentCategory && this.currentCategory.modules);
				}, () => {
					this.currentCategoryModules = this.currentCategory.getModules();
				}, true);
			});
		};
		$scope.$watch(function() { return Object.keys(DataCache.categories).length; }, function() {
			getCurrentCategory();
		}, true);
	}
	pages_or_collections(subcategory_id) {
		var type;
		if (!subcategory_id) {
			subcategory_id = this.$routeParams.subcategory_id;
		}
		if (!this.currentCategory) {
			return [];
		}
		if (this.currentCategory.config.pageType === 'collectionPage') {
			type = 'collections';
			this.onePager = true;
		} else {
			type = 'pages';
			this.onePager = false;
		}
		return Object.keys(this.cache[type])
			.map(id => this.cache[type][id])
			.filter(page_or_collection => (page_or_collection.status === 'PUBLISHED'))
			.filter((page_or_collection) => {
				if (subcategory_id) {
					return page_or_collection.category_id === this.$routeParams.id && page_or_collection.subcategory_id === subcategory_id;
				} else {
					return page_or_collection.category_id === this.$routeParams.id;
				}
			});
	}
	latestComments() {
		return Object.keys(this.cache.comments)
			.map(commentId => this.cache.comments[commentId])
			.filter((comment) => {
				var isPageComment = this.cache.pages[comment.item_id] && (this.cache.pages[comment.item_id].category_id === this.$routeParams.id);
				var isCollectionComment = this.cache.collections[comment.item_id] && (this.cache.collections[comment.item_id].category_id === this.$routeParams.id);
				return (isPageComment || isCollectionComment);
			});
	}
	scrollToSubcategory(subcategory) {
		var e = angular.element(document.getElementById(subcategory));
		if (e.length < 1) {
			return null;
		}
		window.scrollTo(window.scrollX, e.offset().top - 30);
	}
	isEditing() {
		var user = this.cache.current_user;
		if (!user.isLoggedIn() || !user.edit_mode) { return false; }
		return (user.canEditPage(this.currentCategory));
	}
	getBanner() {
		if (!this.currentCategory) {
			return null;
		}
		var categoryBanner = this.currentCategory.getBanner();
		if (categoryBanner) {
			return categoryBanner;
		}
		if (this.pages_or_collections && this.pages_or_collections().length) {
			try {
				return this.pages_or_collections()[0].getBanner();
			} catch (e) {
				return null;
			}
		}
		return null;
	}
	addModule(newModule) {
		if (typeof newModule !== 'object') {
			newModule = JSON.parse(newModule);
		}
		newModule.page = this.currentCategory;
		var module = new this.Module(newModule);
		return module.save()
			.then(() => {
				this.cache.modules.push(module);
				this.currentCategory.modules.push({
					module_id: module.id,
					position_on_page: this.currentCategory.modules.length + 1
				});
				this.currentCategory.save();
			}, window.alert);
	}
	deleteModule(module_object) {
		module_object.module.delete(this.currentCategory).then(() => {
			var module_obj = this.currentCategory.modules.filter(mod_obj => (mod_obj.module_id === module_object.module.id))[0];
			var index = this.currentCategory.modules.indexOf(module_obj);
			this.currentCategory.modules.splice(index, 1);
			this.currentCategory.save();
		});
	}
	dropModule(moduleId, toIndex) {
		if (!moduleId) { return; }
		var module_object = this.currentCategory.modules.filter(modo => modo.module_id === moduleId)[0];
		if (toIndex === module_object.position_on_page) {
			return false;
		}
		// move up a module
		if (toIndex > module_object.position_on_page) {
			this.currentCategory.modules.forEach(function (modo) {
				if (modo !== module_object) {
					if (modo.position_on_page <= toIndex &&
						modo.position_on_page > module_object.position_on_page) {
						modo.position_on_page--;
					}
				}
			});
		}
		// move down a module
		if (toIndex < module_object.position_on_page) {
			this.currentCategory.modules.forEach(function (modo) {
				if (modo !== module_object) {
					if (modo.position_on_page >= toIndex &&
						modo.position_on_page < module_object.position_on_page) {
						modo.position_on_page++;
					}
				}
			});
		}
		module_object.position_on_page = toIndex;
		this.currentCategory.save();
		if (!this.$scope.$$phase) { this.$scope.$apply(); }
	}
}

CategoryCtrl.$inject = ['$rootScope', '$scope', '$routeParams', 'DataCache', 'LayoutManager', 'Module'];

export default CategoryCtrl;
