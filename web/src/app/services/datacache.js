'use strict';

var DataCache = function($http, $cookies, $q, ezfb, $timeout, Account, Page, Module, Comment, Category, Collection, User, Greeting, Activity, Trivia, toaster) {

	var cache = this;
	window.cache = this;
	var logged_out_user = new User();

	this.pendingRequests = $http.pendingRequests;

	this.reset = function() {
		cache.pages = {};
		cache.randomPages = {};
		cache.modules = [];
		cache.comments = {};
		cache.greetings = {};
		cache.categories = {};
		cache.collections = {};
		cache.users = {};
		cache.topstoryId = null;
		cache.available_tags = [];
		cache.available_topics = [];
		cache.activities = {};
		cache.trivias = [];
		cache.account = new Account(window.account);
	};
	this.reset();
	cache.current_user = logged_out_user;

	var setIntercomUser = function(user) {
		if (window.Intercom) {
			window.Intercom('boot', {
				app_id: 'd6yc6ucp',
				name: user.name,
				user_id: user.id,
				email: user.email,
				created_at: parseInt(new Date(user.created_at).getTime() / 1000, 10)
			});
		}
	};

	var firstLoginAttempt = $q.defer();
	$http.get(api_endpoint + '/user/me')
		.success(function(userData) {
			firstLoginAttempt.resolve();
			if (userData.user) {
				cache.current_user = new User(userData.user);
				setIntercomUser(cache.current_user);
				cache.loadUserSpecific();
			}
		});

	this.getFirstLoginAttempt = function() {
		return firstLoginAttempt.promise;
	};

	this.loadContent = function() {
		this.loadInitialContent();
		this.loadComments();
		this.loadGreetings();
	};

	this.loadInitialContent = function() {
		var deferred = $q.defer();
		$http.get(api_endpoint + '/home')
			.success(function(data) {
				cache.available_tags = data.tags || [];
				cache.available_topics = data.topics || [];
				data.pages.forEach(function(pageData) {
					var page = new Page(pageData);
					cache.pages[page.id] = page;
				});
				data.randomPages.forEach(function(pageData) {
					var page = new Page(pageData);
					cache.randomPages[page.id] = page;
				});
				(function() {
					if (data.topstory && data.topstory.page) {
						cache.pages[data.topstory.page._id] = new Page(data.topstory.page);
						cache.topstoryId = data.topstory.page._id;
					} else if(data.topstory && data.topstory.collection) {
						cache.collections[data.topstory.collection._id] = new Collection(data.topstory.collection);
						cache.topstoryId = data.topstory.collection._id;
					}
				})();
				data.collections.forEach(function(collectionData) {
					var collection = new Collection(collectionData);
					cache.collections[collection.id] = collection;
				});
				data.categories.forEach(function(categoryData) {
					var category = new Category(categoryData);
					cache.categories[category.id] = category;
				});
				data.users.forEach(function(userData) {
					var user = new User(userData);
					cache.users[user.id] = user;
				});
				data.activities.forEach(function(activityData) {
					var activity = new Activity(activityData);
					cache.activities[activity.id] = activity;
				});
				deferred.resolve();
			});
		return deferred.promise;
	};

	this.makeItemProminent = function(item) {
		var url = api_endpoint + '/' + item.modelName.toLowerCase() + '/' + item.id + '/topstory';
		$http.put(url).then(function(data) {
			if (data.status === 200) {
				cache.topstoryId = item.id;
			}
		});
	};

	this.loadPages = function() {
		var deferred = $q.defer();
		$http.get(api_endpoint + '/pages')
			.success(function(data) {
				data.comments.forEach(function(commentData) {
					var comment = new Comment(commentData);
					cache.comments[comment.id] = comment;
				});
				data.pages.forEach(function(pageData) {
					cache.pages.push(new Page(pageData));
				});
				deferred.resolve();
			});
		return deferred.promise;
	};

	this.loadTags = function() {
		var deferred = $q.defer();
		$http.get(api_endpoint + '/tags')
			.success(function(data) {
				cache.available_tags = data.tags;
				deferred.resolve();
			});
		return deferred.promise;
	};

	this.loadComments = function() {
		var deferred = $q.defer();
		$http.get(api_endpoint + '/comments')
			.success(function(data) {
				data.comments.forEach(function(commentData) {
					var comment = new Comment(commentData);
					cache.comments[comment.id] = comment;
				});
				deferred.resolve();
			});
		return deferred.promise;
	};

	this.loadGreetings = function() {
		var deferred = $q.defer();
		$http.get(api_endpoint + '/greetings')
		  .success(function(data) {
			data.greetings.forEach(function(greetingsData) {
			  var greeting = new Greeting(greetingsData);
			  cache.greetings[greeting.id] = greeting;
			});
			deferred.resolve();
		  });
		return deferred.promise;
	};

	this.loadPage = function(page_id) {
		var deferred = $q.defer();
		var page = cache.pages[page_id];
		if (page && page.__hasBeenFullyLoaded) {
			$timeout(function() { deferred.resolve(page); });
			return deferred.promise;
		}
		$http.get(api_endpoint + '/page/' + page_id)
		  .then(function(response) {
		  	var data = response.data;
			data.modules.forEach(function(moduleData) {
			  cache.modules.push(new Module(moduleData));
			});
			data.comments.forEach(function(commentData) {
			  var comment = new Comment(commentData);
			  cache.comments[comment.id] = comment;
			});
			var newPage = new Page(data.page);
			cache.pages[newPage.id] = newPage;
			newPage.__hasBeenFullyLoaded = true;
			deferred.resolve(newPage);
		  }, function(data) {
		  	deferred.reject(data);
		  });
		return deferred.promise;
	};

	this.loadCollection = function(collection_id) {
		var deferred = $q.defer();
		var collection = cache.collections[collection_id];
		if (collection && collection.__hasBeenFullyLoaded) {
			$timeout(function() { deferred.resolve(collection); });
			return deferred.promise;
		}
		$http.get(api_endpoint + '/collection/' + collection_id)
		  .then(function(response) {
		  	var data = response.data;
			data.comments.forEach(function(commentData) {
			  var comment = new Comment(commentData);
			  cache.comments[comment.id] = comment;
			});
			var collection = new Collection(data.collection);
			cache.collections[collection.id] = collection;
			collection.__hasBeenFullyLoaded = true;
			deferred.resolve(collection);
		  }, function(data) {
		  	deferred.reject(data);
		  });
		return deferred.promise;
	};

	this.loadUsers = function() {
		var deferred = $q.defer();
		$http.get(api_endpoint + '/users')
			.success(function(data) {
				data.users.forEach(function(userData) {
					var user = new User(userData);
					cache.users[user.id] = user;
				});
				deferred.resolve();
			});
		return deferred.promise;
	};

	this.loadCategories = function() {
		var deferred = $q.defer();
		$http.get(api_endpoint + '/categories')
			.success(function(data) {
				data.categories.forEach(function(categoryData) {
					var category = new Category(categoryData);
					cache.categories[category.id] = category;
				});
				deferred.resolve();
			});
		return deferred.promise;
	};

	this.loadCollections = function() {
	var deferred = $q.defer();
	$http.get(api_endpoint + '/collections')
		.success(function(data) {
			data.collections.forEach(function(collectionData) {
				var collection = new Collection(collectionData);
				cache.collections[collection.id] = collection;
			});
			deferred.resolve();
		});
	return deferred.promise;
	};

	this.loadTrivias = function() {
		return $http.get(api_endpoint + '/trivias').then(function(response) {
			cache.trivias = response.data.trivias.map(function(data) { return new Trivia(data); });
		});
	};

	this.deletePage = function(page) {
		var deferred = $q.defer();
		$http.delete(api_endpoint + '/page/' + page.id)
			.success(function() {
				delete cache.pages[page.id];
				deferred.resolve();
			});
		return deferred.promise;
	};

	this.deleteCollection = function(collection) {
		var deferred = $q.defer();
		$http.delete(api_endpoint + '/collection/' + collection.id)
			.success(function() {
				delete cache.collections[collection.id];
				deferred.resolve();
			});
		return deferred.promise;
	};

	this.deleteCategory = function(category) {
		var deferred = $q.defer();
		$http.delete(api_endpoint + '/category/' + category.id)
			.success(function() {
				delete cache.categories[category.id];
				deferred.resolve();
			});
		return deferred.promise;
	};

	this.getUser = function(id) {
		var deferred = $q.defer();
		var user = this.users[id];
		if (user) {
			deferred.resolve(user);
		} else {
			var u = new User();
			u.id = id;
			return u.reload();
		}
		return deferred.promise;
	};

	this.getUserViaFacebook = function(response) {
		return $http.post(api_endpoint + '/login/fb', response);
	};

	this.getUserViaGoogle = function(response) {
		return $http.post(api_endpoint + '/login/google', { authResponse: {
			access_token: response && response.access_token
		} });
	};

	this.loginUserViaFacebook = function(response) {
		return cache.getUserViaFacebook(response)
			.success(function(userData, status, headers) {
				cache.loginUser(new User(userData), headers('X-PANDA-AUTH-SESSION-ID-SET'));
			})
			.error(function() {
				cache.logout();
			});
	};

	this.loginUserViaGoogle = function(response) {
		return cache.getUserViaGoogle(response)
			.success(function(userData, status, headers) {
				cache.loginUser(new User(userData), headers('X-PANDA-AUTH-SESSION-ID-SET'));
			})
			.error(function() {
				cache.logout();
			});
	};

	this.loginUserViaEmail = function(email, password) {
		return $http.post(api_endpoint + '/login/email', {email: email, password: password})
			.success(function(userData, status, headers) {
				cache.loginUser(new User(userData), headers('X-PANDA-AUTH-SESSION-ID-SET'));
			})
			.error(function() {
				cache.logout();
			});
	};

	this.loginUser = function(user, sessionId) {
		$http.defaults.headers.common['X-PANDA-AUTH-SESSION-ID'] = sessionId;
		$cookies.put('X-PANDA-AUTH-SESSION-ID', sessionId);
		cache.current_user = user;
		cache.loadUserSpecific();
		cache.loadInitialContent();
		if (window.trackJs) {
			window.trackJs.configure({
				customer: user.id,
			});
		}
		setIntercomUser(cache.current_user);
	};

	this.loadUserSpecific = function() {
		var cache = this;
		var userId = cache.current_user && cache.current_user.id;
		if (userId) {
			$http.get(api_endpoint + '/home/' + userId)
				.then(function(response) {
					if (response.status === 200) {
						response.data.pages.forEach(function(pageData) {
							var page = new Page(pageData);
							cache.pages[page.id] = page;
						});
						// only when collections have a status
						response.data.collections.forEach(function(collectionData) {
							var collection = new Collection(collectionData);
							cache.collections[collection.id] = collection;
						});
					}
				});
		}
	};

	this.logout = function() {
		cache.current_user = logged_out_user;
		delete $http.defaults.headers.common['X-PANDA-AUTH-SESSION-ID'];
		$cookies.remove('X-PANDA-AUTH-SESSION-ID');
		if (window.trackJs) {
			window.trackJs.configure({
				customer: ''
			});
		}
		this.reset();
		this.loadContent();

		toaster.pop('success', 'Erfolgreich abgemeldet', 'Du wurdest erfolgreich vom Medienportal abgemeldet.');
	};

	this.moduleTypes = [
		{
		  type: 'text',
		  content: 'Gib hier den Text ein!',
		  title: '',
		  name: 'Text',
		  _description: 'Füge einen Textabschnitt ein',
		  _image: '../../assets/images/icons/text.png'
		},
		{
		  type: 'image',
		  content: 'Sag etwas zum Foto (z.B. Fotograf)!',
		  title: '',
		  name: 'Bild',
		  _description: 'Füge ein großes Bild als Eye-Catcher hinzu.',
		  _image: '../../assets/images/icons/image.png'
		},
		{
		  type: 'quote',
		  content: 'Gib hier den Text für das Zitat ein!',
		  title: '',
		  name: 'Zitat',
		  _description: 'Hebe interessante Zitate hervor.',
		  _image: '../../assets/images/icons/quote.png'
		},
		{
		  type: 'subhead',
		  content: 'Gib hier den Text für die Überschrift ein!',
		  title: '',
		  name: 'Überschrift',
		  _description: 'Überschriften helfen dir, deinen Beitrag zu strukturieren.',
		  _image: '../../assets/images/icons/heading.png'
		},
		{
		  type: 'interview',
		  title: 'Gib hier den Text für die Frage ein!',
		  content: 'Gib hier den Text für die Antwort ein!',
		  name: 'Frage + Antwort',
		  _description: 'Eine Kombination aus Frage und Antwort.',
		  _image: '../../assets/images/icons/interview.png'
		},
		{
		  type: 'vidlyvideo',
		  title: '',
		  content: 'Sag etwas zum Video (z.B. Autoren)!',
		  name: 'Video',
		  _description: 'Fessele die Zuschauer mit einem Video!',
		  _image: '../../assets/images/icons/video.png'
		},
		{
		  type: 'audio',
		  title: '',
		  content: 'Sag etwas zum Audiobeitrag (z.B. Autoren)!',
		  name: 'Audio',
		  _description: 'Fessele die Zuschauer mit einem Audiobeitrag!',
		  _image: '../../assets/images/icons/sound.png'
		},
		{
		  type: 'soundcloudaudio',
		  title: '',
		  content: '',
		  name: 'Audio (Soundcloud)',
		  _description: 'Füge eine Tondatei (z.B. Hörspiel oder Musik) hinzu.',
		  _image: '../../assets/images/icons/sound.png'
		},
		{
		  type: 'issuu',
		  title: '',
		  content: '',
		  files: [],
		  name: 'Zeitungsausgabe (Issuu)',
		  _description: 'Präsentiere PDFs und Printmedien ansprechend.',
		  _image: '../../assets/images/icons/isuu.png'
		},
		{
		  type: 'link',
		  title: '',
		  content: '',
		  files: [],
		  name: 'Verlinkung',
		  _description: 'Verlinke passende Inhalte und weiterführende Artikel.',
		  _image: '../../assets/images/icons/link.png'
		}
	];

	this.isModuleTypeAvailable = function(type) {
	  return this.moduleTypes.filter(t => t.type === type).length > 0;
	};

};

export default DataCache;
