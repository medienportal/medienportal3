'use strict';

import { hasMongoId } from '../services/class_extensions';

var AccountFactory = function($rootScope, $http) {

	class Account {
		constructor(data = {}) {
			this._id = data._id;
			this.title = data.title;
			this.name = data.name;
			this.config = data.config || {};

			hasMongoId(this);
		}
		setBanner($files) {
		  	if (!$files || $files.length < 1) {
		  		return;
		  	}
		  	var images_sizes = ['small', 'small@2x', 'middle', 'middle@2x'];
		  	var file = $files[0];
		  	var reader = new FileReader();

		  	reader.onload = (e) => {
		  	  var img = document.getElementById('config_banner_picture_dropzone');
		  	  img.src = e.target.result;
		  	  var canvas = document.createElement('canvas');
		  	  var ctx = canvas.getContext('2d');
		  	  ctx.drawImage(img, 0, 0, 400, 88);
		  	  var imageUrl = canvas.toDataURL('image/jpeg');
		  	  var sizes_object = {};
		  	  images_sizes.forEach(function(size) { sizes_object[size] = imageUrl; });
		  	  this.config.banner = sizes_object;
		  	  if (!$rootScope.$$phase) { $rootScope.$apply(); }
		  	};
		  	reader.readAsDataURL(file);
		  	this.uploadBanner(file);
	    }
		uploadBanner(file) {
			var url = api_endpoint + '/account/banner';
			var data = new FormData();
			data.append('file', file);
			$http({method: 'POST', url: url, data: data, headers: {'Content-Type': undefined}, transformRequest: angular.identity})
				.success(data => this.update(data));
		}
		update(data) {
			Object.keys(this)
				.forEach((key) => {
					if (data[key] !== undefined) {
						this[key] = data[key];
					}
				});
		}
		getBanner() {
			var size = (window.devicePixelRatio > 1) ? 'banner@2x' : 'banner';
			if (this.config.banner && this.config.banner && this.config.banner.versions) {
				return this.config.banner.versions[size] && this.config.banner.versions[size].absoluteUrl;
			}
			if (this.config.banners && this.config.banners.length > 0) {
				return this.config.banners[0][size];
			}
		}
		setConfig(key, val) {
			var url = api_endpoint + '/account/config';
			var data = {
				config: {
					[key]: val
				}
			};
			$http.patch(url, data).success(_data => this.update(_data.account));
		}
		getConfig(key) {
			return this.config[key];
		}
		getUsage() {
			return $http.get(`${api_endpoint}/usage`)
				.then(response => {
					if (response.status === 200) {
						return response.data;
					} else {
						throw response.data.error || response.data;
					}
				});
		}
	}
	return Account;
};

export default AccountFactory;
