'use strict';

import { hasMongoId } from '../services/class_extensions.js';

var CategoryFactory = function($http, $q, $rootScope, $timeout, $injector, Collection, Page, Module) {

	class Subcategory {
		constructor(options = {}, category = null) {
			this._id = options._id || null;
			this.title = options.title || null;
			this.position = options.position || null;
			this.category = category || null;
			hasMongoId(this);
		}
		save() {
			var promise = $q.defer();
			var object = angular.copy(this);
			delete object.category;
			if (this.id) {
				$http.put(api_endpoint + '/category/' + this.category.id + '/subcategory/' + this.id, {subcategory: object})
					.success((data) => {
						this.update(data.subcategory);
						promise.resolve(this);
					});
			} else {
				$http.post(api_endpoint + '/category/' + this.category.id + '/subcategory/', {subcategory: object})
					.success(data => {
						this.update(data.subcategory);
						promise.resolve(this);
					});
			}
			return promise.promise;
		}
		update(data = {}) {
			Object.keys(data).forEach(key => this[key] = data[key]);
		}
	}

	var Category = function Category(options = {}) {
		this._id = options._id || null;
		this.title = options.title || 'Titel';
		this.navigation = (options.navigation || []).map(navData => new Subcategory(navData, this)) || [];
		this.position = options.position || 0;
		this.parent_category_id = options.parent_category_id || null;
		this.config = options.config || {};
		this.__hasLoadedPagesAndCollections = false;
		this.modules = options.modules || [];
		hasMongoId(this);
	};
	Category.prototype.modelName = 'Category';

	Category.prototype.createSubcategory = function(options = {}) {
		options.position = options.position || (function(category) {
			return Math.max(...category.navigation.map(sub => sub.position || 0)) + 10;
		})(this);
		var subcategory = new Subcategory(options, this);
		subcategory.save().then(sub => this.navigation.push(sub));
	};

	Category.prototype.removeSubcategory = function(subcategoryId) {
		$http.delete(api_endpoint + '/category/' + this.id + '/subcategory/' + subcategoryId)
			.then(() => {
				this.navigation = this.navigation.filter(subc => subc.id !== subcategoryId);
			});
	};

	Category.prototype.loadPagesAndCollectionsAndModules = function() {
		var deferred = $q.defer(),
			cache = $injector.get('DataCache');
		if (this.__hasLoadedPagesAndCollections) {
			$timeout(function() { deferred.resolve(); });
			return deferred.promise;
		}
		$http.get(api_endpoint + '/category/' + this.id)
		.success((data) => {
			var category = cache.categories[data.category._id];
			if (category) {
				category.update(data.category);
			}
			data.pages.forEach(function(pageData) {
				var page = new Page(pageData);
				cache.pages[page.id] = page;
			});
			data.collections.forEach(function(collectionData) {
				var collection = new Collection(collectionData);
				cache.collections[collection.id] = collection;
			});
			data.modules.forEach(function(moduleData) {
				cache.modules.push(new Module(moduleData));
			});
			this.__hasLoadedPagesAndCollections = true;
			deferred.resolve();
		});
		return deferred.promise;
	};

	Category.prototype.update = function updateCategory(data) {
		var category = this;
		Object.keys(this).forEach(function (key) {
			category[key] = data[key];
			if (key === 'navigation') {
				category[key] = data[key].map(subOpts => new Subcategory(subOpts));
			}
		});
	};

	Category.prototype.save = function saveCategory() {
		var category = angular.copy(this);
		delete category.navigation;
		for (var property in category) {
			if (property.startsWith('__')) {
				delete category[property];
			}
		}
		var promise = $q.defer();
		if (this.id) {
			$http.put(api_endpoint + '/category/' + this.id, {category: category})
			.success(function(data) {
				category.update(data.category);
			});
		} else {
			$http.post(api_endpoint + '/category', { category: category })
			.success(function(data) {
				category.update(data.category);
				promise.resolve(category);
			});
		}
		return promise.promise;
	};

	Category.prototype.getBanner = function() {
		var size = 'banner';
		if (window.devicePixelRatio > 1) {
			size = size + '@2x';
		}
		var bannerConfig = this.config && this.config.banners;
		if (bannerConfig && bannerConfig.file_id) {
			return bannerConfig.versions &&
			bannerConfig.versions[size] &&
			bannerConfig.versions[size].absoluteUrl;
		} else if (bannerConfig) {
			var banner;
			if (Array.isArray(bannerConfig)) {
				banner = bannerConfig[0];
			} else {
				banner = bannerConfig;
			}
			return banner[size];
		}
		return null;
	};

	Category.prototype.setBanner = function($files) {
	  	if (!$files || $files.length < 1) {
	  		return;
	  	}
	  	var self = this;
	  	var images_sizes = ['small', 'small@2x', 'middle', 'middle@2x'];
	  	var file = $files[0];
	  	var reader = new FileReader();

	  	reader.onload = function(e) {
	  	  var img = document.getElementById('config_banner_picture_dropzone');
	  	  img.src = e.target.result;
	  	  var canvas = document.createElement('canvas');
	  	  var ctx = canvas.getContext('2d');
	  	  ctx.drawImage(img, 0, 0, 400, 88);
	  	  var imageUrl = canvas.toDataURL('image/jpeg');
	  	  var sizes_object = {};
	  	  images_sizes.forEach(function(size) { sizes_object[size] = imageUrl; });
	  	  self.config.banner = sizes_object;
	  	  if (!$rootScope.$$phase) { $rootScope.$apply(); }
	  	};
	  	reader.readAsDataURL(file);
	  	this.uploadBanner(file);
    };

	Category.prototype.uploadBanner = function uploadCategoryBanner(file) {
		var category = this;
		var url = api_endpoint + '/category/' + category.id + '/banner';
		var data = new FormData();
		data.append('file', file);
		$http({method: 'POST', url: url, data: data, headers: {'Content-Type': undefined}, transformRequest: angular.identity})
			.success(function(data) {
				category.update(data.category);
			});
	};

	Category.prototype.getModules = function getPageModulesFromDataCache() {
		var modules = [];
		var cache = $injector.get('DataCache');
		this.modules.forEach(function(moduleData) {
			var module_object = { position_on_page: moduleData.position_on_page };
			module_object.module = cache.modules.filter(function(m) { return m.id === moduleData.module_id; })[0];
			modules.push(module_object);
		});
		return modules;
	};

	return Category;
};

export default CategoryFactory;
