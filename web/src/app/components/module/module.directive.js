'use strict';

var ModuleDirective = function(RealTime) {
	return {
		restrict: 'A',
		scope: {
			module: '=',
			page: '='
		},
		template: '<article ng-include src="\'app/components/module/\' + module.type + \'.html\'"></article>',
		controller: ['$scope', 'DataCache', 'SearchService', 'ScraperManager', function($scope, DataCache, SearchService, ScraperManager) {
			$scope.cache = DataCache;
			$scope.current_user = DataCache.current_user;
			$scope.isEditing = function() {
				return DataCache.current_user.edit_mode && DataCache.current_user.canEditPage($scope.page);
			};

			$scope.realtime = function() {
				var channelname = 'private-modules-page-' + $scope.page.id;
				RealTime.triggerClientEvent(channelname, 'update', { module: $scope.module });
			};

			$scope.realtimeAndSave = function() {
				$scope.realtime();
				$scope.module.save($scope.page).then(function() {
					$scope.getAllLinkItems();
				});
			};

			$scope.playVideo = function($inviewpart) {
				if ($inviewpart === 'both') {
					var $elem = $('#module_' + $scope.module._id).find('video').get(0);
					if ($elem.paused && !$scope.hasplayed) {
						$elem.play();
						$scope.hasplayed = true;
					}
				}
			};

			$scope.sm = new SearchService();
			$scope.searchByTitle = function(text, callback) {
				const URLRegexp = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
				if (URLRegexp.test(text)) {
					// if text is a url, get scraper info
					ScraperManager.getOpenGraphDataFromUrl(text)
						.then(result => callback([result]));
				} else {
					// if not, search by title
					$scope.sm.get({
						text: text,
						only: 'title'
					}).then(function(results) {
						callback(results.map(res => res.item()));
					});
				}
			};
			$scope.selectLink = function(target, link) {
				if (typeof target === 'object') {
					if (target.type === 'external') {
						link.type = target.type;
						if (!/^http/.test(target.src)) {
							target.src = `http://${target.src}`;
						}
						link.src = target.src;
						link.og = target.og;
					} else {
						link.type = 'internal';
						link.src = target.id;
						link.modelName = target.modelName;
					}
				}
				$scope.realtimeAndSave();
			};

			$scope.setFile = function($files, options) {
				$scope.module.setFile($files, $scope.page, options).then(function() {
					$scope.realtime();
				});
			};

			$scope.deleteFile = function(file) {
				var i = $scope.module.files.indexOf(file);
				$scope.module.files.splice(i, 1);
				$scope.realtimeAndSave();
			};

			var getLinkItem = function(link) {
				if (link.type === 'internal') {
					let fn = `load${link.modelName}`;
					if (DataCache[fn]) {
						DataCache[fn](link.src).then(
							function(item) {
								link._item = item;
							}
						);
					}
				}
			};

			$scope.getAllLinkItems = function() {
				if ($scope.module.type === 'link') {
					$scope.module.files.forEach(getLinkItem);
				}
			};

			$scope.getMimeType = function(mime_type) {
				if (mime_type === 'video/mov' || mime_type === 'video/m4v') {
					return 'video/mp4';
				} else {
					return mime_type;
				}
			};

			$scope.getAllLinkItems();

		}]
	};
};

export default ModuleDirective;
