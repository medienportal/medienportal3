'use strict';

class FeedbackCtrl {
	constructor($scope, $http, toaster, DataCache) {
		this.error = null;
		this.loading = false;
		this.message = {
			content: '',
			file: null
		};

		this.$http = $http;
		this.toaster = toaster;
		this.cache = DataCache;
		this.$scope = $scope;
	}
	send() {
		this.loading = true;
		if (!this.message || !this.message.content) {
			this.error = 'Bitte gib einen Text ein.';
			this.loading = false;
			return;
		}
		this.$http.post(configuration.feedback_endpoint, {
			content: this.message.content,
			file: this.message.file || null,
			url: window.location.href,
			account_id: this.cache.account.id,
			user_id: this.cache.current_user.isLoggedIn() ? this.cache.current_user.id : null
		}).then(response => {
			this.loading = false;
			if (response.status === 200 || response.status === 201) {
				this.error = null;
				let text = 'Vielen Dank für deine Nachricht.';
				if (this.cache.current_user.isLoggedIn()) {
					text += `${text} Wir melden uns bei dir.`;
				}
				this.toaster.pop('success', 'Nachricht übermittelt.', text);
				this.message = {
					content: '',
					file: null
				};
			} else {
				this.error = (response.data || response.data.error) || response.statusText || 'Unbekannter Fehler.';
			}
		});
	}
	setFile(files) {
		if (!files || !files.length) {
			return;
		}
		let file = files[0];
		if (!(/^image/.test(file.type))) {
			this.toaster.pop('error', 'Falsches Dateiformat', 'Dem Feedback-Formular können nur Bilder angehangen werden.');
			return;
		}
		let reader = new FileReader();
		reader.onload = (event) => {
			this.message.file = event.target.result;
			this.$scope.$apply();
		};
		reader.readAsDataURL(file);
	}
}

FeedbackCtrl.$inject = ['$scope', '$http', 'toaster', 'DataCache'];

export default FeedbackCtrl;
