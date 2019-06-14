'use strict';

import { hasMongoId } from '../services/class_extensions';

var CollectionFactory = function($rootScope, $http, $q, $injector, $filter, CollectionFile, Module, hasLikes) {

	// constructor
	var Collection = function Collection(options = {}) {
		var collection = this;
		this._id = options._id || null;
		this.title = options.title || 'Titel';
		this.date = options.date || null;
		this.released_at = options.released_at || null;
		this.updated_at = options.updated_at || new Date();
		this.created_at = options.created_at || new Date();
		this.status = options.status || null;
		this.category_id = options.category_id || null;
		this.subcategory_id = options.subcategory_id || null;
		this.page_type = options.page_type || 'standardPage';
		this.tags = options.tags || [];
		this.topic = options.topic || '';
		this.author = options.author || [];
		this.pages = options.pages || [];
		try {
			this.files = options.files.map(function(f) {
				var collectionfile = new CollectionFile(f);
				collectionfile._collection = collection;
				return collectionfile;
			});
		} catch(e) {
			this.files = [];
		}
		this.likes = options.likes || [];
		this.config = options.config || {};
		this.__hasBeenFullyLoaded = false;
		hasMongoId(this);
		return this;
	};
	hasLikes(Collection);

	Collection.SORTING_OPTIONS = [
		{ key: 'CREATION_INC', label: 'Datum aufsteigend' },
		{ key: 'CREATION_DESC', label: 'Datum absteigend' },
		{ key: 'FILENAME_INC', label: 'Dateiname aufsteigend' },
		{ key: 'FILENAME_DESC', label: 'Dateiname absteigend' }
	];

	Collection.prototype.modelName = 'Collection';
	Collection.url = {
		multiple: api_endpoint + '/collections',
		single: api_endpoint + '/collection/:id'
	};
	Collection.prototype.getUrl = function(type) {
		if (!type) {
			type = 'single';
		}
		return Collection.url[type].replace(':id', this.id);
	};

	Collection.prototype.save = function savePage() {
		var collection = this;
		var promise = $q.defer();
		if (this.id) {
			var collectionObj = {};
			angular.extend(collectionObj, this);
			delete collectionObj.files;
			$http.put(api_endpoint + '/collection/' + this.id, {collection: this})
			.success(function(data) {
				collection.update(data.collection);
			});
		} else {
			$http.post(api_endpoint + '/collection', { collection: this })
			.success(function(data) {
				collection.update(data);
				promise.resolve(collection);
			});
		}
		return promise.promise;
	};

	Collection.prototype.sorting = function() {
		switch (this.config.sorting_option) {
			case 'CREATION_INC':
				return ['meta.original_date', false];
			case 'CREATION_DESC':
				return ['meta.original_date', true];
			case 'FILENAME_INC':
				return ['getOriginalFilename()', false];
			case 'FILENAME_DESC':
				return ['getOriginalFilename()', true];
			default:
				return ['getOriginalFilename()', false];
		}
	};

	Collection.prototype.update = function updateCollection(data) {
		var collection = this;
		Object.keys(data).forEach(function (key) {
			if (key === 'files') {
				try {
					collection.files = data.files.map(function(f) {
						var collectionfile = new CollectionFile(f);
						collectionfile._collection = collection;
						return collectionfile;
					});
				} catch(e) {
					collection[key] = data[key];
				}
			} else {
				collection[key] = data[key];
			}
		});
		return collection;
	};

	Collection.prototype.getCategory = function() {
		var self = this;
		return $injector.get('DataCache').categories[self.category_id];
	};

	Collection.prototype.getPreview = function(sizes) {
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

	Collection.prototype.getBanner = function() {
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

	Collection.prototype.setPreview = function($files, preview_type) {
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
			if (!$rootScope.$$phase) {
				$rootScope.$apply();
			}
		};
		reader.readAsDataURL(file);
		this.uploadPreview(file, preview_type);
	};

	Collection.prototype.uploadPreview = function uploadPagePreview(file, preview_type) {
		var collection = this;
		var url = api_endpoint + '/collection/' + collection.id + '/' + preview_type;
		var data = new FormData();
		data.append('file', file);
		$http({method: 'POST', url: url, data: data, headers: {'Content-Type': undefined}, transformRequest: angular.identity})
		.success(function(data) {
			collection.update(data.collection);
		});
	};

	Collection.prototype.uploadFiles = function uploadCollectionFile($files) {
		var collection = this;
		$files.forEach(function(file) {
			collection.uploadFile(file);
		});
	};

	Collection.prototype.uploadFile = function(file) {
		var collection = this,
			deferred = $q.defer(),
			url = api_endpoint + '/collection/' + collection.id + '/file',
			data = new FormData();
		data.append('file', file);
		$http({
			method: 'POST',
			url: url,
			data: data,
			headers: { 'Content-Type': undefined },
			transformRequest: angular.identity,
			timeout: 300000 // set timeout to 5 minutes
		}).success(function(data) {
			var collectionfile = new CollectionFile(data.file);
			collectionfile._collection = collection;
			collection.files.push(collectionfile);
			deferred.resolve({ file: data.file, collection: data.collection });
		});
		return deferred.promise;
	};

	Collection.prototype.getFile = function collectionGetFile(fileObj, size) {
		if (!size) {
			size = Object.keys(fileObj)[0];
		}
		if (window.devicePixelRatio > 1) {
			size = size + '@2x';
		}
		if (fileObj.file && fileObj.file.file_id && fileObj.file.versions[size]) {
			return fileObj.file.versions[size].absoluteUrl;
		}
		// if old version's standard is not available, use big
		if (!fileObj.files[size] && /^standard/.test('standard@2x')) {
			size = window.devicePixelRatio > 1 ? 'big@2x' : 'big';
		}
		return fileObj.files[size];
	};

	Collection.prototype.orderedFiles = function() {
		var sort = this.sorting();
		return $filter('orderBy')(this.files, sort[0], sort[1]);
	};
	Collection.prototype.indexOfFile = function(file) {
		return this.orderedFiles().indexOf(file);
	};

	// returns the previous collectionfile in current collection.
	// if there is no more file, return false
	Collection.prototype.previousFile = function(file) {
		if (!file) {
			return false;
		}
		var i = this.indexOfFile(file);
		if (i <= 0) {
			return false;
		}
		return this.orderedFiles()[i - 1];
	};
	Collection.prototype.hasPreviousFile = function(file) {
		return (this.previousFile(file) !== false);
	};

	// returns the next collectionfile in current collection.
	// if there is no more file, return false
	Collection.prototype.nextFile = function(file) {
		if (!file) {
			return false;
		}
		var i = this.indexOfFile(file);
		if ((i + 1) >= this.orderedFiles().length) {
			return false;
		}
		return this.orderedFiles()[i + 1];
	};
	Collection.prototype.hasNextFile = function(file) {
		return (this.nextFile(file) !== false);
	};

	Collection.prototype.hasStatus = function(status) {
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

	Collection.prototype.setStatus = function(status) {
		var statusBefore = this.status;
		var collection = this;
		collection.status = status;
		var url = api_endpoint + '/collection/' + collection.id + '/status';
		$http({
			method: 'PUT',
			url: url,
			data: { status: status }
		}).success(function(data, status) {
			if (status === 200) {
				$rootScope.currentCollection.update(data.collection);
			} else {
				collection.status = statusBefore;
				alert(data);
			}
		});

	};

	return Collection;
};

export default CollectionFactory;
