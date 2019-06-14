'use strict';

import { hasMongoId } from '../services/class_extensions';

var UserFactory = function($http, $q, $injector) {
	var DEFAULT_USER_AVATAR = null;

	var User = function User(options) {
		if (!options) { options = {}; }
		this._id = options._id || null;
		this.first_name = options.first_name || '';
		this.last_name = options.last_name || '';
		this.name = options.name || null;
		this.klass = options.klass || null;
		this.email = options.email || null;
		this.verified = options.verified || null;
		this.gender = options.gender || null;
		this.services = options.services || null;
		this.created_at = options.created_at || null;
		this.avatar = options.avatar || null;
		this.rightmanagment = options.rightmanagment || { '*': { '*': false } };
		this.permissions = options.permissions || {};
		this.description = options.description || '';
		this.edit_mode = false;
		this.settings = options.settings || {
			item_is_set_ready: false
		};
		this.__defineGetter__('name', function() {
			return this.first_name + ' ' + this.last_name;
		});
		hasMongoId(this);
	};

	User.getUsersWithoutAnyRights = function() {
		var DataCache = $injector.get('DataCache');
		return Object.keys(DataCache.users)
			.map( id => DataCache.users[id] )
			.filter( user => !user.isCoworker() );
	};

	User.getUsersWithAnyRights = function() {
		var DataCache = $injector.get('DataCache');
		return Object.keys(DataCache.users)
			.map( id => DataCache.users[id] )
			.filter( user =>  user.isCoworker() );
	};

	User.prototype.update = function updateUser(data) {
		var user = this;
		Object.keys(data).forEach(function(key) {
			var descriptor = Object.getOwnPropertyDescriptor(user, key);
			if (descriptor && descriptor.writable === true) {
				user[key] = data[key];
			}
		});
		return user;
	};

	User.prototype.reload = function() {
		var user = this;
		var promise = $q.defer();
		if (!user.id) {
			promise.reject(new Error('user does not have user id'));
		}
		$http.get(api_endpoint + '/user/' + user.id)
			.then((response) => {
				user.update(response.data.user);
				promise.resolve(user);
			}, (error) => {
				promise.reject(error);
			});
		return promise.promise;
	}

	User.prototype.getImage = function getUserImage(size) {
		var images;
		if (!this.isLoggedIn()) {
			return null;
		}
		if (!size) {
			size = 'middle';
		}
		if (window.devicePixelRatio > 1) {
			size = size + '@2x';
		}
		if (!this.services && !this.avatar) {
			return DEFAULT_USER_AVATAR;
		}
		if (this.avatar && this.avatar.file_id && this.avatar.versions[`avatar_${size}`]) {
			return this.avatar.versions[`avatar_${size}`].absoluteUrl;
		}
		if (this.avatar && this.avatar[size]) {
			return this.avatar[size];
		}
		if (this.services && this.services.length > 0) {
			images = this.services.map(function(service) {
				if (service.service_name === 'facebook') {
					return '//graph.facebook.com/' + service.identification + '/picture?width=200&height=200';
				}
				if (service.service_name === 'google') {
					return 'https://plus.google.com/s2/photos/profile/' + service.identification + '?sz=400';
				}
			});
		}
		// placeholder if not known
		if (!images) {
			return DEFAULT_USER_AVATAR;
		}
		return images[0];
	};

	User.prototype.uploadImage = function uploadUserImage(file) {
		if (!file) {
			return;
		}
		var user = this;
		var url = api_endpoint + '/user/' + user.id + '/avatar';
		var prom;
		if (typeof file === 'string') {
			file = file.replace(/data:image\/.*;base64,/, '');
			prom = $http({
				method: 'POST',
				url: url,
				data: { 'base64': file }
			});
		} else {
			var data = new FormData();
			data.append('file', file);
			prom = $http({
				method: 'POST',
				url: url,
				data: data,
				headers: { 'Content-Type': undefined },
				transformRequest: angular.identity
			});
		}
		prom.success(function(data) {
			user.update(data.user);
		});
		return prom;
	};

	User.prototype.isLoggedIn = function() {
		return this.id ? true : false;
	};

	User.prototype.can = function(right, categoryId, accountId) {
		if (!accountId) {
			accountId = window.currentAccount.id;
		}
		var permissions = this.permissions[accountId] || {};
		try {
			return permissions.admin === true || permissions[categoryId][right] === true;
		} catch(e) {
			return false;
		}
	};

	User.prototype.isEditingCategory = function() {
		return (
			this.edit_mode && this.isAdmin()
		) === true;
	};

	User.prototype.canCreatePage = function(categoryId, accountId) {
		if (!accountId) {
			accountId = window.currentAccount.id;
		}
		return this.can('create', categoryId, accountId);
	};

	User.prototype.canEditPage = function(page) {
		if (!page) {
			return false;
		}
		var user = this;
		if (user.isAdmin(page.account_id)) {
			return true;
		}
		var author_ids = page.author.filter(function(author) {
			return (author.author_type === 'panda') && (author.author_id === user.id);
		});
		if (author_ids.length > 0) {
			return true;
		}
		var categoryId = page.category_id;
		var accountId = page.account_id;
		if (accountId !== user.account_id) {
			return false;
		}
		return (user.can('edit', categoryId, accountId));
	};

	User.prototype.canDelete = function(page) {
		return this.can('delete', page.category_id, page.account_id);
	};

	User.prototype.canSetControlled = function(page) {
		return this.can('setControlled', page.category_id, page.account_id);
	};

	User.prototype.canSetPublished = function(page) {
		return this.can('setPublished', page.category_id, page.account_id);
	};

	User.prototype.canEditCollection = User.prototype.canEditPage;

	User.prototype.canSetPageOrCollectionStatus = function(page, status) {
		if (status === 'READY') {
			return this.canEditPage(page);
		}
		if (status === 'CONTROLLED') {
			return this.can('*', '*');
		}
		if (status === 'PUBLISHED') {
			return this.can('*', '*');
		}
		return false;
	};

	User.prototype.isCoworker = function(accountId) {
		var permissions;
		if (!accountId) {
			accountId = window.currentAccount.id;
		}
		permissions = this.getPermissions(accountId);
		// To-Do: a for-loop would be mor performant as it would not need to loop all of the permissions
		//        if any permission returns true before, this is even more true as this is a nested loop.
		return Object.keys(permissions).filter(function(section) {
			// if user is admin or has upload rights for account, set as coworker
			if (['admin', 'uploadVideo', 'uploadAudio'].indexOf(section) > -1 && permissions[section] === true) {
				return true;
			}
			// if user has any other right for any category, set true
			return Object.keys(permissions[section]).filter(function(section2) {
					return permissions[section][section2];
				}).length > 0; // has any rights
		}).length > 0;
	};

	User.prototype.getNewMessages = function () {
		var cache = $injector.get('DataCache');
		var self = this;
		return cache.messages.filter(function(message) {
		  return ((message.to_user_id === self.id) && !message.read);
		});
	};

	User.prototype.save = function savePage() {
		var user = this;
		var promise = $q.defer();
		if (!this.id) {
			$http.post(api_endpoint + '/user', { user: this })
				.success(function(data, status, headers) {
					user.update(data.user);
					promise.resolve({ user: user, sessionToken: headers('X-PANDA-AUTH-SESSION-ID-SET') });
				})
				.error(function(data) {
					promise.reject({ error: data.data, status: data.status });
				});
		} else {
			$http.put(api_endpoint + '/user/' + this.id, {user: this})
				.success(function(data) {
					user.update(data.user);
					promise.resolve(user);
				})
				.error(function(data) {
					promise.reject(data);
				});
		}
		return promise.promise;
	};

	User.prototype.savePermissions = function(permissionsObject) {
		var promise = $q.defer();
		$http.put(api_endpoint + '/user/' + this.id + '/permissions', { permissions: permissionsObject })
			.success((data) => {
				this.update(data.user);
				promise.resolve(this);
			})
			.error((data) => {
				promise.reject(data);
			});
	};

	User.prototype.isAuthorOf = function(item) {
		var user = this;
		if (!item.author) {
			return false;
		}
		var authors = item.author.filter(function(author) {
			if (author.author_type === 'panda' && author.author_id === user.id) {
				return true;
			}
		});
		return authors.length > 0;
	};

	User.prototype.isAdmin = function(accountId) {
		return this.getPermissions(accountId).admin === true;
	};

	User.prototype.isVideoUploader = function(accountId) {
		return this.getPermissions(accountId).uploadVideo === true;
	};

	User.prototype.isAudioUploader = function(accountId) {
		return this.getPermissions(accountId).uploadAudio === true;
	};

	User.prototype.getPermissions = function(accountId) {
		if (!accountId) {
			accountId = window.currentAccount.id;
		}
		return this.permissions[accountId] || {};
	};

	return User;
};

export default UserFactory;
