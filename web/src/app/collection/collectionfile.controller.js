'use strict';

class CollectionFileCtrl {
	constructor($rootScope, $scope, $routeParams, DataCache, Comment, CollectionFileComment, LayoutManager) {
		this.cache = DataCache;
		this.newComment = { content: '', author: { author_id: '' } };
		$rootScope.fullsize = true;
		this.Comment = Comment;
		this.CollectionFileComment = CollectionFileComment;
		this.$rootScope = $rootScope;

		LayoutManager.hideBanner();

		this.collection_id = $routeParams.id;
		this.file_id = $routeParams.file_id;
		DataCache.loadCollection(this.collection_id).then((collection) => {
			this.currentCollection = collection;
			$rootScope.currentCollection = collection;
			this.currentCollectionFile = collection.files.filter(file => (file._id === this.file_id))[0];
			$rootScope.currentCollectionFile = this.currentCollectionFile;
		});

		var navigateFilesWithKeyboard = (e) => {
			if (e.target.nodeName === 'TEXTAREA' || e.target.nodeName === 'INPUT' || e.target.isContentEditable || e.metaKey) {
				return;
			}
			if ((e.keyCode === 37) || (e.which === 37)) {
				this.openPreviousFile();
			} else if ((e.keyCode === 39) || (e.which === 39)) {
				this.openNextFile();
			} else if (String.fromCharCode(e.keyCode || e.which) === 'L') {
				this.currentCollectionFile.like();
				if (!$scope.$$phase) { $scope.$apply(); }
			}
		};
		document.addEventListener('keydown', navigateFilesWithKeyboard, false);
		$scope.$on('$destroy', function() { document.removeEventListener('keydown', navigateFilesWithKeyboard, false); });
	}
	getComments() {
		if (!this.currentCollectionFile) {
			return [];
		}
		var comments = [];
		this.currentCollectionFile.comments.forEach((commentId) => {
			var comment = this.cache.comments[commentId];
			comments.push(comment);
		});
		return comments;
	}
	openNextFile() {
		if (!this.currentCollection) {
			return;
		}
		var nextFile = this.currentCollection.nextFile(this.currentCollectionFile);
		if (!nextFile) {
			return;
		}
		this.openFile(nextFile);
	}
	openPreviousFile() {
		if (!this.currentCollection) {
			return;
		}
		var previousFile = this.currentCollection.previousFile(this.currentCollectionFile);
		if (!previousFile) { return null; }
		this.openFile(previousFile);
	}
	addComment() {
		var comment = new this.CollectionFileComment({content: this.newComment.content, item_id: this.collection_id, file_id: this.file_id});
		if (!this.cache.current_user.isLoggedIn() && this.newComment.author.author_id) {
			comment.author.author_id = this.newComment.author.author_id;
		}
		comment.save().then((comment) => {
			this.cache.comments[comment.id] = comment;
			this.currentCollectionFile.comments.push(comment.id);
			this.newComment = {};
		});
	}
	currentCollectionFileIndex() {
		if (!this.currentCollection) { return null; }
		return this.currentCollection.indexOfFile(this.currentCollectionFile);
	}
	openFile(file) {
		if (!this.$rootScope.currentCollection || !file) { return; }
		this.$rootScope.open('/collection/' + this.$rootScope.currentCollection.id + '/file/' + file.id);
	}
	isEditing() {
		if (!this.currentCollection) { return false; }
		if (!this.cache.current_user.isLoggedIn() || !this.cache.current_user.edit_mode) { return false; }
		return this.cache.current_user.can('edit', this.currentCollection.category_id);
	}
	showDescriptionBox() {
		if (this.currentCollectionFile && this.currentCollectionFile.title || this.isEditing()) {
			return true;
		} else {
			return false;
		}
	}
}

CollectionFileCtrl.$inject = ['$rootScope', '$scope', '$routeParams', 'DataCache', 'Comment', 'CollectionFileComment', 'LayoutManager'];

export default CollectionFileCtrl;
