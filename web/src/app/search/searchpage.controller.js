'use strict';

class SearchPageCtrl {
	constructor($scope, $routeParams, $location, DataCache, MainSearch, LayoutManager) {
		this.$scope = $scope;
		this.cache = DataCache;
		this.options = {
			fields: SearchPageCtrl.objectFromQuery($location.$$search.f),
			searchtext: $routeParams.searchtext
		};
		MainSearch.get({
			text: this.options.searchtext,
			options: this.options
		});
		this.sm = MainSearch;
		this.searchtext = $routeParams.searchtext;
		LayoutManager.setBannerImage();

		this.localSearchOptions = {
			sort: {
				value: 'score',
				sort: '-'
			},
			filter: {
				media: 'all'
			}
		};

		this.getFilterFilterOptions = function(value) {
			var args = $scope.search.localSearchOptions.filter;
			var mediaF = args.media;
			if (mediaF === 'gallery') {
				return value.type === 'collection';
			} else if (mediaF === 'video') {
				return value.source.modules && value.source.modules.filter(mod => mod.type === 'vidlyvideo').length > 0;
			} else if (mediaF === 'audio') {
				return value.source.modules && value.source.modules.filter(mod => mod.type === 'soundcloudaudio').length > 0;
			} else {
				return true;
			}
		};
	}
	getOrderFilterOptions() {
		var args = this.localSearchOptions.sort;
		switch (args.value) {
			case 'score':
				return `${args.sort}score`;
			case 'date':
				return `${args.sort}source.created_at`;
			case 'likes':
				return `${args.sort}source.likes.length`;
			case 'comments':
				return `${args.sort}source.comments.length`;
			default:
				return `${args.sort}source.created_at`;
		}
	}
}
SearchPageCtrl.objectFromQuery = function(string) {
	if (!string) {
		return {};
	}
	return (string || document.location.search)
		.replace(/(^\?)/,'').split(';')
		.map(function(n){return n = n.split(':'),this[n[0]] = n[1],this;}.bind({}))[0];
};
SearchPageCtrl.$inject = ['$scope', '$routeParams', '$location', 'DataCache', 'MainSearch', 'LayoutManager'];

export default SearchPageCtrl;
