'use strict';

class ScraperManager {
	constructor($http) {
		this.$http = $http;
	}

	getOpenGraphDataFromUrl(url) {
		return this.$http.get(`${api_endpoint}/web-meta?url=${url}`).then(response => {
			if (response.status === 200) {
				return response.data;
			} else {
				let message = response.data.error || response.data;
				throw new Error(message);
			}
		});
	}
}

ScraperManager.$inject = ['$http'];

export default ScraperManager;
