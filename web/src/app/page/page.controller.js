'use strict';

class PageCtrl {
	constructor($rootScope, $scope, $routeParams, $q, ezfb, $sce, DataCache, Module, User, Comment, LayoutManager, $location) {
		this.cache = DataCache;
		this.User = User;
		this.Comment = Comment;
		this.Module = Module;
		this.$q = $q;
		this.ezfb = ezfb;
		this.$scope = $scope;
		this.$rootScope = $rootScope;
		this.moment = moment;
		this.currentPageModules = [];
		this.currentPageComments = [];
		this.currentPageAuthors = [];
		this._random_page = null;
		this.topicTimeout = null;
		this.isLoading = true;
		this.newModule = DataCache.moduleTypes[0];
		this.newComment = {content: '', author: {author_id: ''}};
		this.current_url = document.location.href;
		var navigatePageWithKeyboard = (e) => {
			if (e.target.nodeName === 'TEXTAREA' || e.target.nodeName === 'INPUT' || e.target.isContentEditable || e.metaKey) { return; }
			if (String.fromCharCode(e.keyCode || e.which) === 'L') {
				this.currentPage.like();
				if (!$scope.$$phase) { $scope.$apply(); }
			}
		};
		document.addEventListener('keydown', navigatePageWithKeyboard, false);
		$scope.$on('$destroy', function () {
			document.removeEventListener('keydown', navigatePageWithKeyboard, false);
		});
		var page_id = $routeParams.id;
		// get current page and its users and modules
		DataCache.loadPage(page_id).then((page) => {
			this.currentPage = page;
			this.cache.currentPage = page;
			$rootScope.currentPage = page;
			$rootScope.currentCategory = this.cache.categories[page.category_id];
			var bannerImage = page.getBanner();
			LayoutManager.setBannerImage(bannerImage);
			$scope.$watch(() => {
				return (this.currentPage && this.currentPage.modules);
			}, () => {
				this.currentPageModules = this.currentPage.getModules();
			}, true);
			$scope.$watch(() => {
				return (this.currentPage && this.currentPage.comments);
			}, () => {
				this.currentPageComments = this.currentPage.getComments();
			}, true);
			this.isLoading = false;
			if ($location.hash() === 'comments') {
				setTimeout(() => $('#comments').get(0).scrollIntoView(), 3500);
				$location.hash('');
			}
		});
	}
	deleteCurrentPage() {
		if (confirm('Falls du die Seite \'' + this.currentPage.title + '\' wirklich löschen willst, klicke auf OK.\nAnsonsten, klicke auf Abbrechen.')) {
			this.cache.deletePage(this.currentPage)
				.then(() => {
					this.$rootScope.open('/category/' + this.currentPage.category_id);
				});
		}
	}
	addModule(newModule) {
		if (typeof newModule !== 'object') {
			newModule = JSON.parse(newModule);
		}
		newModule.page = this.currentPage;
		var module = new this.Module(newModule);
		return module.save()
			.then(() => {
				this.cache.modules.push(module);
				this.currentPage.modules.push({
					module_id: module.id,
					position_on_page: this.currentPage.modules.length + 1
				});
				this.currentPage.save();
			}, window.alert);
	}
	deleteModule(module_object) {
		module_object.module.delete(this.currentPage).then(() => {
			var module_obj = this.currentPage.modules.filter(mod_obj => (mod_obj.module_id === module_object.module.id))[0];
			var index = this.currentPage.modules.indexOf(module_obj);
			this.currentPage.modules.splice(index, 1);
			this.currentPage.save();
		});
	}
	deletePageComment(comment) {
		comment.delete().then((response) => {
			if (response.status === 200) {
				this.currentPage.comments = response.data.page.comments;
			}
		});
	}
	addComment() {
		var comment = new this.Comment({content: this.newComment.content, item_id: this.currentPage.id});
		if (!this.cache.current_user.isLoggedIn() && this.newComment.author.author_id) {
			comment.author.author_id = this.newComment.author.author_id;
		}
		comment.save()
			.then((comment) => {
				this.cache.comments[comment.id] = comment;
				this.currentPage.comments.push(comment.id);
				this.newComment = {};
			});
	}
	share_facebook() {
		this.ezfb.ui({
			method: 'feed',
			name: this.currentPage.title,
			link: document.location.href,
			caption: this.currentPage.config.excerp,
			description: this.currentPage.config.excerp,
			image: 'http://mport.al/fotos/133/thumbs/TNvorschau_chamonway.jpg'
		});
	}
	isEditing() {
		var user = this.cache.current_user;
		if (!user.isLoggedIn() || !user.edit_mode) { return false; }
		return (user.canEditPage(this.currentPage));
	}
	getRandomPage() {
		if (!this.currentPage) { return {}; }
		if (!this.cache.pages) { return {}; }
		var all_pages =
			Object.keys(this.cache.pages)
			.filter(id => this.cache.pages[id].status === 'PUBLISHED');
		if (all_pages.length < 2) { return {}; }
		if (this._random_page) {
			return this._random_page;
		}
		var index = Math.floor(Math.random() * all_pages.length) + 1;
		var pageid = all_pages[index];
		if (pageid === this.currentPage.id) {
			return this.getRandomPage();
		}
		this._random_page = this.cache.pages[pageid];
		return this._random_page;
	}
	findTags($query) {
		var deferred = this.$q.defer();
		var tags = this.cache.available_tags.filter(tag => tag.match(new RegExp($query, 'i')));
		deferred.resolve(tags);
		return deferred.promise;
	}
	addTag($tag) {
		this.currentPage.tags.push($tag);
		this.cache.available_tags.push($tag);
		this.currentPage.save();
	}
	setTopic(page) {
		// set clear timeout to avoid half a topic being added (blur() is fired when clicking on a selection)
		if (this.topicTimeout) {
			clearTimeout(this.topicTimeout);
		}
		this.topicTimeout = setTimeout(() => {
			page.save();
			if (this.cache.available_topics.indexOf(page.topic) < 0) {
				this.cache.available_topics.push(page.topic);
			}
		}, 1500);
	}
	editPageDate($event) {
		var page = this.currentPage;
		if (!page) { return; }
		var momentDate = moment($event.target.value, 'L');
		if (momentDate.isValid()) {
			var date = momentDate.toDate();
			page.created_at = date.toISOString();
			page.save();
		} else {
			alert('Datum ist nicht gültig.');
		}
	}
	dropModule(moduleId, toIndex) {
		if (!moduleId) { return; }
		var module_object = this.currentPage.modules.filter(modo => modo.module_id === moduleId)[0];
		if (toIndex === module_object.position_on_page) {
			return false;
		}
		// move up a module
		if (toIndex > module_object.position_on_page) {
			this.currentPage.modules.forEach(function (modo) {
				if (modo !== module_object) {
					if (modo.position_on_page <= toIndex &&
						modo.position_on_page > module_object.position_on_page) {
						modo.position_on_page--;
					}
				}
			});
		}
		// move down a module
		if (toIndex < module_object.position_on_page) {
			this.currentPage.modules.forEach(function (modo) {
				if (modo !== module_object) {
					if (modo.position_on_page >= toIndex &&
						modo.position_on_page < module_object.position_on_page) {
						modo.position_on_page++;
					}
				}
			});
		}
		module_object.position_on_page = toIndex;
		this.currentPage.save();
		if (!this.$scope.$$phase) { this.$scope.$apply(); }
	}
}

PageCtrl.$inject = [
	'$rootScope',
	'$scope',
	'$routeParams',
	'$q',
	'ezfb',
	'$sce',
	'DataCache',
	'Module',
	'User',
	'Comment',
	'LayoutManager',
	'$location'
];

export default PageCtrl;
