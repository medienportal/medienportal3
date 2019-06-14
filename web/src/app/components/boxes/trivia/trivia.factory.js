'use strict';

import { hasMongoId } from '../../../services/class_extensions';

var TriviaFactory = function($http, $q, $injector) {

	class Trivia {
		constructor(options = {}) {
			this._id = options._id || null;
			this.content = options.content || null;
			this.created_at = options.created_at || null;
			hasMongoId(this);
		}

		update(data) {
			Object.keys(this).forEach( (key) => {
				if (data[key]) { this[key] = data[key]; }
			});
		}

		save() {
			var trivia = this;
			var promise = $q.defer();
			if (!this.id) {
				$http.post(api_endpoint + '/trivia', { trivia: this })
					.success(function(data) {
						trivia.update(data.trivia);
						promise.resolve(trivia);
					})
					.error(function(data) {
						promise.reject({ error: data.data, status: data.status });
					});
			} else {
				$http.put(api_endpoint + '/trivia/' + this.id, { trivia: this })
					.success(function(data) {
						if (data && data.trivia) {
							trivia.update(data.trivia);
						}
						promise.resolve(trivia);
					})
					.error(function(data) {
						promise.reject(data);
					});
			}
			return promise.promise;
		}

		delete() {
			var DataCache = $injector.get('DataCache'),
				i = DataCache.trivias.indexOf(this),
				promise = $q.defer();
			$http.put(api_endpoint + '/trivia/' + this.id)
				.success(function() {
					if (i > -1) {
						DataCache.trivias.splice(i, 1);
					}
					promise.resolve();
				})
				.error(function(data) {
					promise.reject(data);
				});
		}
	}


	return Trivia;
};

export default TriviaFactory;
