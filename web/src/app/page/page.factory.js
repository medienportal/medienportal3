'use strict';

import { hasMongoId } from '../services/class_extensions';

var PageFactory = function($rootScope, $http, $q, $injector, $filter, Module, hasComments, hasLikes) {
	
	// constructor
	var Page = function Page(options) {
		if (!options) {
			options = {};
		}
		this._id = options._id || null;
		this.title = options.title || 'Titel';
		this.date = options.date || null;
		this.status = options.status || null;
		this.released_at = options.released_at || null;
		this.updated_at = options.updated_at || new Date();
		this.created_at = options.created_at || new Date();
		this.category_id = options.category_id || null;
		this.subcategory_id = options.subcategory_id || null;
		this.page_type = options.page_type || 'standardPage';
		this.author = options.author || [];
		this.tags = options.tags || [];
		this.topic = options.topic || '';
		this.likes = options.likes || [];
		this.modules = options.modules || [];
		this.comments = options.comments || [];
		this.config = options.config || { excerp: 'Füge hier einen kurzen Vorschautext für die Startseite ein!' };
		this.__viewsCount = options.__viewsCount || 0;
		this.__hasBeenFullyLoaded = false;
		hasMongoId(this);
		var DataCache = $injector.get('DataCache');
		if (DataCache.current_user && DataCache.current_user.canEditPage(this) && !this.isNew() && this.status !== 'PUBLISHED') {
			$injector.get('RealTime').initModuleEventsForPage(this);
		}
	};
	hasComments(Page.prototype);
	hasLikes(Page);

	Page.prototype.modelName = 'Page';
	Page.url = {
		multiple: api_endpoint + '/pages',
		single: api_endpoint + '/page/:id'
	};
	Page.prototype.getUrl = function(type) {
		if (!type) {
			type = 'single';
		}
		return Page.url[type].replace(':id', this.id);
	};

	Page.prototype.save = function savePage() {
		var page = this;
		var promise = $q.defer();
		page.config.excerp = $filter('removeHtml')(page.config.excerp);
		page.title = $filter('removeHtml')(page.title);
		if (this.id) {
			$http.put(api_endpoint + '/page/' + this.id, {page: this})
			.success(function(data) {
				page.update(data.page);
			});
		} else {
			$http.post(api_endpoint + '/page', { page: this })
			.success(function(data) {
				page.update(data.page);
				promise.resolve(page);
			});
		}
		return promise.promise;
	};

	Page.prototype.update = function updatePage(data) {
		var page = this;
		Object.keys(data).forEach(function (key) {
			page[key] = data[key];
		});
		return page;
	};

	Page.prototype.getModules = function getPageModulesFromDataCache() {
		var modules = [];
		var cache = $injector.get('DataCache');
		this.modules.forEach(function(moduleData) {
			var module_object = { position_on_page: moduleData.position_on_page };
			module_object.module = cache.modules.filter(function(m) { return m.id === moduleData.module_id; })[0];
			modules.push(module_object);
		});
		return modules;
	};

	Page.prototype.getCategory = function() {
		var self = this;
		return $injector.get('DataCache').categories[self.category_id];
	};

	Page.prototype.getPreview = function(sizes) {
		if (!sizes) {
			sizes = ['smalldouble', 'small'];
		}
		// make sure sizes is array
		if (typeof sizes === 'string') {
			sizes = [sizes];
		}

		for (let i = 0; i < sizes.length; i++) {
			let url,
			size = sizes[i];
			if (window.devicePixelRatio > 1 && !/@2x$/.test(size)) {
				size = size + '@2x';
			}
			let previewConfig = this.config && this.config.preview;
			if (previewConfig && previewConfig.file_id) {
				url = previewConfig.versions &&
				previewConfig.versions[size] &&
				previewConfig.versions[size].absoluteUrl;
			} else if (previewConfig) {
				url = previewConfig[size];
			}
			if (url) {
				return url;
			}
		}
		return null;
	};

	Page.prototype.getBanner = function() {
		var size = 'banner';
		if (window.devicePixelRatio > 1) {
			size = size + '@2x';
		}
		var bannerConfig = this.config && this.config.banner;
		if (bannerConfig && bannerConfig.file_id) {
			return bannerConfig.versions &&
			bannerConfig.versions[size] &&
			bannerConfig.versions[size].absoluteUrl;
		} else if (bannerConfig) {
			return bannerConfig[size];
		}
		return null;
	};

	Page.prototype.setPreview = function($files, preview_type) {
		if (!$files || $files.length < 1) {
			return;
		}
		var self = this;
		var images_sizes = {
			'preview': ['small', 'small@2x', 'middle', 'middle@2x'],
			'banner': ['banner', 'banner@2x']
		};
		var file = $files[0];
		var reader = new FileReader();

		reader.onload = function(e) {
			var img = document.getElementById('config_' + preview_type + '_picture_dropzone');
			img.src = e.target.result;
			var canvas = document.createElement('canvas');
			var ctx = canvas.getContext('2d');
			ctx.drawImage(img, 0, 0, 400, 300);
			var imageUrl = canvas.toDataURL('image/jpeg');
			var sizes_object = {};
			images_sizes[preview_type].forEach(function(size) { sizes_object[size] = imageUrl; });
			self.config[preview_type] = sizes_object;
			if (!$rootScope.$$phase) { $rootScope.$apply(); }
		};
		reader.readAsDataURL(file);
		this.uploadPreview(file, preview_type);
	};

	Page.prototype.uploadPreview = function uploadPagePreview(file, preview_type) {
		var page = this;
		var url = api_endpoint + '/page/' + page.id + '/' + preview_type;
		var data = new FormData();
		data.append('file', file);
		$http({method: 'POST', url: url, data: data, headers: {'Content-Type': undefined}, transformRequest: angular.identity})
		.success(function(data) {
			page.update(data.page);
		});
	};

	Page.prototype.hasStatus = function(status) {
		if (this.status === 'PUBLISHED') {
			return true;
		}
		if (this.status === 'CONTROLLED') {
			if (status === 'CONTROLLED' || status === 'READY') {
				return true;
			}
		}
		return (this.status === 'READY' && status === 'READY');
	};

	Page.prototype.setStatus = function(status) {
		var statusBefore = this.status;
		var page = this;
		page.status = status;
		var url = api_endpoint + '/page/' + page.id + '/status';
		$http({
			method: 'PUT',
			url: url,
			data: { status: status }
		}).success(function(data, status) {
			if (status === 200) {
				$rootScope.currentPage.update(data.page);
			} else {
				page.status = statusBefore;
				alert(data);
			}
		});

	};

	return Page;
};

export default PageFactory;
