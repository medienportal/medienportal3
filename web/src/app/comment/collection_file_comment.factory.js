'use strict';

var CollectionFileCommentFactory = function($rootScope, Upload, $q, $http, $injector, Comment) {

	var CollectionFileComment = function (options) {
		Comment.call(this, options);
		this.file_id = options.file_id;
	};
	CollectionFileComment.prototype = Object.create(Comment.prototype);
	CollectionFileComment.prototype.url = function() {
		return api_endpoint + '/collection/' + this.item_id + '/file/' + this.file_id + '/comment';
	};

	return CollectionFileComment;
};

export default CollectionFileCommentFactory;
