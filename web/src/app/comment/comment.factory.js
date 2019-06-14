'use strict';

import { hasMongoId } from '../services/class_extensions.js';

var CommentFactory = function($rootScope, Upload, $q, $http, $injector, User) {

	var Comment = function Comment(options = {}) {
		this._id = options._id || null;
		this.content = options.content || null;
		this.author = options.author || {};
		this.created_at = options.created_at || new Date();
		this.user_agent = options.user_agent || null;
		this.item_id = options.item_id || options.page_id;
		this.file_id = options.file_id || null;
		this.reported = options.reported || false;
		this.secured = options.secured || false;
		hasMongoId(this);
	};

	Comment.prototype.url = function() {
		if (!this.item_id) {
			throw 'This comment must be set to a page!';
		}
		return api_endpoint + '/page/' + this.item_id + '/comment';
	};

	Comment.prototype.path = function() {
		if (!this.file_id) {
			return '/page/' + this.item_id;
		} else {
			return '/collection/' + this.item_id + '/file/' + this.file_id;
		}
	};

	Comment.prototype.object_name = 'comment';

	Comment.prototype.save = function saveComment(page_id) {
		if (page_id) {
			this.page_id = page_id;
		}
		var comment = this,
			promise = $q.defer(),
			url;
		var data = {};
		data[this.object_name] = this;
		if (this.id) {
			url = this.url() + '/' + this.id;
			$http.put(url, data)
			.success(function(data) {
				comment.update(data[comment.object_name]);
				promise.resolve(comment);
			});
		} else {
			url = this.url();
			$http.post(url, data)
				.success(function(data) {
					comment.update(data[comment.object_name]);
					promise.resolve(comment);
				});
		}
		return promise.promise;
	};

	Comment.prototype.delete = function deleteComment(page_id) {
		if (page_id) {
			this.page_id = page_id;
		}
		if (!this.id) {
			throw 'No id for this comment. Comment cannot be deleted.';
		}
		var url = null;
		var data = {};
		data[this.object_name] = this;
		url = this.url() + '/' + this.id;
		return $http.delete(url, data)
			.success((data) => {
				if (!data.page) {
					throw 'no page data available to updates comments from';
				}
				$injector.get('DataCache').pages[data.page._id].update(data.page);
			});
	};

	Comment.prototype.getUser = function() {
		if (this.__user) {
			return this.__user;
		} else {
			if (this.author.author_type === 'panda') {
				let user_id = this.author.author_id;
				this.__user = new User();
				$injector.get('DataCache').getUser(user_id).then(user => {
					this.__user = user;
				});
			} else {
				this.__user = new User({
					first_name: this.author.author_id,
					last_name: ''
				});
			}
			return this.__user;
		}
	};

	Comment.prototype.update = function updateComment(data) {
		var comment = this;
		Object.keys(this).forEach(function (key) {
			comment[key] = data[key];
		});
	};

	Comment.prototype.report = function() {
		return $http.post(api_endpoint + '/comment/' + this.id + '/report').then((response) => {
			if (response.status === 200) {
				this.reported = true;
			}
		});
	};

	return Comment;
};

export default CommentFactory;
