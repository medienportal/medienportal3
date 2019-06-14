'use strict';

import { hasMongoId } from '../../services/class_extensions';

var ModuleFactory = function($rootScope, Upload, $q, $http, $injector) {
  // constructor
	var Module = function Module(options = {}) {
		this._id = options._id || null;
		this.title = options.title || 'Titel';
		this.content = options.content || 'Lorem ipsum';
		this.files = (options.files || []).map(function(file) {
			if (file.files && file.files.mp4 && file.files.mp4.mime_type === 'video/m4v') {
				file.files.mp4.mime_type = 'video/mp4';
				return file;
			} else if (file.files && file.files.mp4 && file.files.mp4.mime_type === 'video/mov') {
				file.files.mp4.mime_type = 'video/mp4';
				return file;
			} else {
				return file;
			}
		});
		this.type = options.type;
		this.state = options.state;
		this._page = options.page;
		hasMongoId(this);
	};

	Module.prototype.save = function saveModule(pageOrPageId) {
		if (typeof pageOrPageId === 'string') {
			this._page = $injector.get('DataCache').pages[pageOrPageId];
		} else if (pageOrPageId) {
			this._page = pageOrPageId;
		}
		if (!this._page || !this._page.id) {
			throw 'This module must be set to a page or category!';
		}
		var module = this,
			promise = $q.defer(),
			url,
			successFn = function(data, status) {
				if (status === 200) {
					module.update(data);
					promise.resolve(module);
				} else {
					promise.reject(data && data.error ? data.error : data);
				}
			};
		if (this.id) {
			url = `${api_endpoint}/${(this._page.modelName || 'Page').toLowerCase()}/${this._page.id}/module/${this.id}`;
			$http.put(url, {module: this}).success(successFn);
		} else {
			$http.post(`${api_endpoint}/${(this._page.modelName || 'Page').toLowerCase()}/${this._page.id}/module`, { module: this })
				.success(successFn);
		}
		return promise.promise;
	};

	Module.prototype.update = function updateModule(data) {
		var module = this;
		Object.keys(data).forEach(function(key) {
			module[key] = data[key];
		});
	};

	Module.prototype.delete = function deleteModule(page) {
		if (page) {
			this._page = page;
		}
		if (!this.id) {
			throw 'this module has no ID!';
		}
		if (!this._page) {
			throw 'please specify a page!';
		}
		return $http.delete(`${api_endpoint}/${(this._page.modelName || 'Page').toLowerCase()}/${this._page.id}/module/${this.id}`);
	};

	Module.prototype.setFile = function($files, page) {
		var page_id = (page && page.id) || this._page_id;
		var promise = $q.defer();
		if (!$files) {
			promise.reject();
			return promise.promise;
		}
		var can = function() {
			var DataCache = $injector.get('DataCache');
			return DataCache.current_user.edit_mode && DataCache.current_user.canEditPage(page);
		};
		if (!can()) {
			return promise.reject();
		}
		var module = this;
		var file = $files[0];
		if (!file) {
			promise.reject();
			return promise.promise;
		}
		var reader = new FileReader();

		var formData = new FormData();
		formData.append('file', file);

		var send = function() {
			if (module.id) {
				var url = url = `${api_endpoint}/${(page.modelName || 'Page').toLowerCase()}/${page.id}/module/${module.id}`;
				$http({
					method: 'PUT',
					url: url,
					data: formData,
					headers: {'Content-Type': undefined},
					transformRequest: angular.identity,
					timeout: 25 * 60 * 1000
				}).success(function(data) {
					module.update(data);
					promise.resolve(module);
				});
			} else {
				throw 'no id given';
			}
		};

		reader.onload = function(e) {
			$rootScope.$apply(function() {
				module.files = [e.target.result];
			});
			send();
		};

		if (file && file.type.match(/^(image)\/.*$/)) {
			reader.readAsDataURL(file);
		} else {
			send();
		}

		return promise.promise;
	};

	return Module;
};

export default ModuleFactory;
