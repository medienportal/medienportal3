'use strict';

var VplanDirective = function() {
	return {
		restrict: 'E',
		scope: {
			user: '='
		},
		templateUrl: 'app/components/boxes/vplan/vplan.html',
		controller: ['$scope', '$http', function($scope, $http) {
			$scope.klass = {
				first: null,
				second: null
			};

			$scope.error = null;

			var _getVplan = function() {
				var url = api_endpoint + '/vplan';
				$http.get(url).then(function(response) {
					if (response.status === 200) {
						var fussinfos = null;
						try {
							fussinfos = response.data.vp.fuss && [0].fusszeile.map(function(z) {
								if (z.fussinfo[0]) { return z.fussinfo[0]; } else { return '. '; }
							}).join('');
						} catch(e) { fussinfos = ''; }
						$scope.vp = {
							kopf: response.data.vp.kopf && response.data.vp.kopf[0],
							fuss: fussinfos,
							aktionen: response.data.vp.haupt && response.data.vp.haupt[0].aktion,
							aufsichten: response.data.vp.aufsichten && response.data.vp.aufsichten[0].aufsichtszeile
						};
					} else {
						$scope.error = (response.data.error && response.data.error.message) || response.data || ('Fehler ' + response.status);
					}
				});

			};

			$scope.setKlass = function() {
				if (!$scope.klass.first) { alert('Gib deine Klasse ein!'); }
				if ($scope.klass.first < 11 && !$scope.klass.second) { alert('Gib deinen Klassenverband an!'); }
				if ($scope.klass.second) {
					$scope.user.klass = $scope.klass.first + '/' + $scope.klass.second;
				} else {
					$scope.user.klass = $scope.klass.first;
				}
				$scope.user.save().then(function() {
					if ($scope.user.klass) {
						_getVplan();
					}
				});
			};

			if ($scope.user.klass) {
				_getVplan();
			}
		}]
	};
};

export default VplanDirective;
