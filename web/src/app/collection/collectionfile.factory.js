'use strict';

import { hasMongoId } from '../services/class_extensions';


var CollectionFileFactory = function(hasLikes, $http, $q) {

	var CollectionFile = function CollectionFile(options = {}) {
		this._id = options._id || null;
		this.file_type = options.page_type;
		this.files = options.files || {};
		this.file = options.file || {};
		this.likes = options.likes || [];
		this.title = options.title || '';
		this.description = options.description || '';
		this.comments = options.comments || [];
		this.meta = options.meta || {};
		this._collection = options._collection || null;
		hasMongoId(this);
	};
	hasLikes(CollectionFile);

	CollectionFile.url = {
		single: api_endpoint + '/collection/:id'
	};
	CollectionFile.prototype.getUrl = function() {
		return api_endpoint + '/collection/' + this._collection.id + '/file/' + this.id;
	};

	CollectionFile.prototype.getFile = function collectionfileGetFile(size) {
		if (!size) {
			size = 'small';
		}
		if (window.devicePixelRatio > 1) {
			size = size + '@2x';
		}
		if (this.file && this.file.file_id) {
			return this.file.versions[size].absoluteUrl;
		}
		// return deprecated format
		return this.files[size];
	};

	CollectionFile.prototype.getOriginalFilename = function collectionfileGetOriginalFilename() {
		return (this.meta && this.meta.original_filename) || this.original_filename || this.file.original_filename || '';
	};

	CollectionFile.prototype.toJSON = function() {
		var self = this;
		var newObj = {};
		Object.keys(self).forEach(function(key) {
			if (key !== '_collection') {
				newObj[key] = self[key];
			}
		});
		return JSON.stringify(newObj);
	};

	CollectionFile.prototype.delete = function() {
		var promise = $q.defer();
		var self = this;
		$http.delete(this.getUrl()).then(function(response) {
			if (response.status === 200) {
				promise.resolve(self);
			} else {
				promise.reject(response.status);
			}
		});
	};

	CollectionFile.prototype.modelName = 'CollectionFile';

	CollectionFile.prototype.save = function() {
		var promise = $q.defer();
		var self = this;
		if (!this._id) {
			return promise.reject('Collectionfile does not exist.');
		}
		$http.put(this.getUrl(), { file: self }).then(function(response) {
			if (response.status === 200) {
				var collection = self._collection;
				promise.resolve(collection);
			} else {
				promise.reject(response.status);
			}
		});
	};

	return CollectionFile;
};

export default CollectionFileFactory;
