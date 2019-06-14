'use strict';

var hasCommentsService = function($injector) {
	return function(proto) {
		proto.getComments = function() {
			var comments = [];
			var cache = $injector.get('DataCache');
			this.comments.forEach(function(commentId) {
				var comment = cache.comments[commentId];
				comments.push(comment);
			});
			return comments;
		};
	};
};

export default hasCommentsService;
