'use strict';

class CollectionCtrl {
	constructor($routeParams, $rootScope, $scope, DataCache, Collection, LayoutManager) {
		this.moment = moment;
		this.cache = DataCache;
		this.isLoading = true;
		this.toBeUploaded = [];
		this.uploading = [];
		this.topicTimeout = null;
		this.SORTING_OPTIONS = Collection.SORTING_OPTIONS;
		this.$rootScope = $rootScope;

		var navigateCollectionWithKeyboard = function(e) {
			if (e.target.nodeName === 'TEXTAREA' || e.target.nodeName === 'INPUT' || e.target.isContentEditable || e.metaKey) {
				return;
			}
			if (String.fromCharCode(e.keyCode || e.which) === 'L') {
				this.currentCollection.like();
				if (!$scope.$$phase) { $scope.$apply(); }
			}
		};
		document.addEventListener('keydown', navigateCollectionWithKeyboard, false);
		$scope.$on('$destroy', function() { document.removeEventListener('keydown', navigateCollectionWithKeyboard, false); });

		var collection_id = $routeParams.id;
		DataCache.loadCollection(collection_id).then((collection) => {
			this.currentCollection = collection;
			$rootScope.currentCollection = collection;
			$rootScope.currentCategory = DataCache.categories[collection.category_id];
			var bannerImage = this.currentCollection.getBanner();
			LayoutManager.setBannerImage(bannerImage);
			this.isLoading = false;
		});
	}
	setTopic(collection) {
		// set clear timeout to avoid half a topic being added (blur() is fired when clicking on a selection)
		if (this.topicTimeout) {
			clearTimeout(this.topicTimeout);
		}
		this.topicTimeout = setTimeout(() => {
			collection.save();
			if (this.cache.available_topics.indexOf(collection.topic) < 0) {
				this.cache.available_topics.push(collection.topic);
			}
		}, 1500);
	}
	editCollectionDate($event) {
		var collection = this.currentCollection;
		if (!collection) { return null; }
		var momentDate = this.moment($event.target.value, 'L');
		if (momentDate.isValid()) {
			var date = momentDate.toDate();
			collection.created_at = date.toISOString();
			collection.save();
		} else {
			alert('Datum ist nicht gültig.');
		}
	}
	isEditing() {
		if (!this.currentCollection) {
			return false;
		}
		if (!this.cache.current_user.isLoggedIn() || !this.cache.current_user.edit_mode) {
			return false;
		}
		return this.cache.current_user.canEditPage(this.currentCollection);
	}
	deleteCurrentCollection() {
		if (confirm('Falls du Album \'' + this.currentCollection.title + '\' wirklich löschen willst, klicke auf OK.\nAnsonsten, klicke auf Abbrechen.')) {
			this.cache.deleteCollection(this.currentCollection)
				.then(() => {
					this.$rootScope.open('/category/' + this.currentCollection.category_id);
				});
		}
	}
	startUploading() {
		while ((this.uploading.length < window.MAX_SIMULTANIOUS_UPLOAD_REQUESTS) && (this.toBeUploaded.length > 0)) {
			var file = this.toBeUploaded.pop();
			this.uploading.push(file);
			this.currentCollection.uploadFile(file).then(() => {
				this.uploading.splice(this.uploading.indexOf(file), 1);
				this.startUploading();
			});
		}
	}
	addFiles($files) {
		$files.forEach(file => this.toBeUploaded.push(file));
		this.startUploading();
	}
}

export default CollectionCtrl;
