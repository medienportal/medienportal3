'use strict';

class PasswordRecoveryCtrl {
	constructor($http, $routeParams, $location, LayoutManager) {
		this.$errors = [];
		this.$routeParams = $routeParams;
		this.$http = $http;
		this.$location = $location;
		LayoutManager.hideBanner();
	}
	isLinkValid() {
		return !!this.$location.$$search.h;
	}
	submitRequest(recovery) {
		this.$errors = [];
		var token = this.$routeParams.token;
		if (!token) {
			this.$errors.push('Der Link ist nicht gültig!');
		}
		if (!recovery || !recovery.newpassword) {
			this.$errors.push('Gib bitte ein neues Passwort ein.');
		}
		if (recovery && recovery.newpassword_repeat !== recovery.newpassword) {
			this.$errors.push('Beide Passwörter müssen übereinstimmen.');
		}
		if (this.$errors.length > 0) {
			return;
		}
		this.$http.post(api_endpoint + '/user/password', {
			newpassword: recovery.newpassword,
			newpassword_repeat: recovery.newpassword_repeat,
			token: token
		}).then((response) => {
			if (response.status === 200) {
				alert('Dein Passwort wurde erfolgreich geändert.');
				this.$location.path('/');
			} else {
				this.$errors.push('Es ist ein Fehler aufgetreten. ' + response.data);
			}
		}, (response) => {
			this.$errors.push(response.data);
		});
	}
}
PasswordRecoveryCtrl.$inject = ['$http', '$routeParams', '$location', 'LayoutManager'];

export default PasswordRecoveryCtrl;
