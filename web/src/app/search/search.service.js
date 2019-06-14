'use strict';

var SearchService = function($http, $q, Page, Collection, User) {

	var SearchResult = function(data) {
		this.type = data._type;
		this.score = data._score;
		this.source = data._source;
		this.id = data._id;
		this._id = data._id;
		this.item = () => {
			var item;
			if (this.type === 'collection') {
				item = new Collection({_id: data._id}).update(data._source);
				item.config = {
					preview: this.source.thumbnails
				};
				return item;
			} else if (this.type === 'page') {
				item = new Page({_id: data._id}).update(data._source);
				item.config = {
					preview: this.source.thumbnails,
					excerp: this.source.excerp
				};
				return item;
			} else if (this.type === 'user') {
				return new User({_id: data._id}).update(data._source);
			}
		};
	};

	SearchResult.get = function() {
		return this.source;
	};

	var SearchManager = function SearchManager() {
		this.took = 0;
		this.results = [];
		this.active = false;
		this._searchtext = null;
		this._options = {};
	};
	SearchManager.SearchResult = SearchResult;

	SearchManager.prototype.get = function(params) {
		var self = this,
			searchtext = (params && params.text) || '',
			options = (params && params.options) || {},
			promise = $q.defer();
		var url = (function() {
			self._options = options;
			self._searchtext = searchtext;
			if (searchtext) {
				return api_endpoint + '/search?q=' + searchtext;
			} else {
				if (options.fields) {
					var fieldsp = Object.keys(options.fields).map(function(key) {
						return key + ':' + options.fields[key];
					}).join(';');
					return api_endpoint + '/search?q=' + searchtext + '&fields=' + fieldsp;
				} else {
					return null;
				}
			}
			if (!options.only) {
				url += ('&only=' + options.only);
			}
		})();
		if (!url) {
			self.active = false;
			return;
		}
		$http.get(url).then(
			function(response) {
				if (response.status === 200) {
					self.active = true;
					self.took = response.data.took;
					self.results = response.data.hits.map(function(hit) { return new SearchResult(hit); });
					promise.resolve(self.results);
				} else {
					self.active = false;
					self.took = 0;
					self.results = [];
					promise.reject(response.data.error || response.statusText);
				}
			},
			function(response) {
				self.took = 0;
				self.results = [];
				promise.reject(response.data.error || response.statusText);
			}
		);
		return promise.promise;
	};
	SearchManager.prototype.getItem = SearchManager.prototype.get;

	SearchManager.prototype.getUser = function(params) {
		var self = this,
			searchtext = (params && params.text) || '',
			options = (params && params.options) || {},
			promise = $q.defer();
		var url = (function() {
			self._options = options;
			self._searchtext = searchtext;
			if (searchtext) {
				return api_endpoint + '/search/user?q=' + searchtext;
			} else {
				if (options.fields) {
					var fieldsp = Object.keys(options.fields).map(function(key) {
						return key + ':' + options.fields[key];
					}).join(';');
					return api_endpoint + '/search/user?q=' + searchtext + '&fields=' + fieldsp;
				} else {
					throw 'search text required.';
				}
			}
			if (!options.only) {
				url += ('&only=' + options.only);
			}
		})();
		$http.get(url).then(
			function(response) {
				if (response.status === 200) {
					var results = response.data.hits.map(function(hit) { return new SearchResult(hit); });
					promise.resolve(results);
				} else {
					promise.reject(response.data.error || response.statusText);
				}
			},
			function(response) {
				promise.reject(response.data.error || response.statusText);
			}
		);
		return promise.promise;
	};

	SearchManager.prototype.reset = function() {
		this.active = false;
		this.results = [];
//			this._searchtext = null;
//			this._options = {};
	};

	return SearchManager;

};

export default SearchService;
