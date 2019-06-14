'use strict';

class UserLoginCtrl {
	constructor($scope, $http, $timeout, DataCache, ezfb, GooglePlus, toaster) {
		this.cache = DataCache;
		this.$scope = $scope;
		this.$http = $http;
		this.status = 'anmelden';
		this.ezfb = ezfb;
		this.GooglePlus = GooglePlus;
		this.$timeout = $timeout;
		this.toaster = toaster;
	}
	handlePositiveResponse(data) {
		console.log(data);
		if (this.$scope.closeThisDialog) {
			this.$scope.closeThisDialog();
		} else {
			this.$scope.open('/');
		}
	}
	handleNegativeResponse(data) {
		this.status = ((typeof data.data === 'object') && (data.data.error)) ? (data.data.error.msg) : data.data;
		console.log(this.status);
		this.$timeout(() => { this.status = 'anmelden'; }, 3000);
	}
	facebookLogin() {
		this.status = 'Bitte warten ...';
		var response = (response) => {
			if (response.status === 'connected') {
				this.cache
					.loginUserViaFacebook(response)
					.then((data) => {
						if (data.status === 200) {
							this.handlePositiveResponse(data);
						} else {
							this.handleNegativeResponse(data);
						}
					});
			}
		};
		this.ezfb.login({ scope: 'email' }).then(response);
	}
	gPlusLogin() {
		this.status = 'Bitte warten ...';
		this.GooglePlus.login().then((response) => {
			if (response instanceof Error) {
				return this.toaster.pop('error', 'Fehler', response.message);
			}
			this.cache
				.loginUserViaGoogle(response)
				.then((data) => {
					if (data.status === 200) {
						this.handlePositiveResponse(data);
					} else {
						this.handleNegativeResponse(data);
					}
				});
		});
	}
	emailLogin() {
		if (!this.loginuser || !this.loginuser.email || !this.loginuser.password) {
			return this.handleNegativeResponse({ data: 'Bitte fülle Email und Passwort aus.' });
		}
		this.status = 'Bitte warten ...';
		this.cache
			.loginUserViaEmail(this.loginuser.email, this.loginuser.password)
			.then((data) => {
				if (data.status === 200) {
					this.handlePositiveResponse(data);
				} else {
					this.handleNegativeResponse(data);
				}
			});
	}
	requestPasswordRecoveryPage() {
		this.step = 'request_password_recovery';
	}
	requestPWRecovery(email) {
		this.pw_recovery_status = false;
		if (!email) {
			return;
		}
		this.$http.post(api_endpoint + '/password_request', {
			email: email
		}).then((response) => {
			if (response.status === 200) {
				this.pw_recovery_status = 'OK';
			} else {
				this.pw_recovery_status = response.data;
			}
		}, () => {
			this.pw_recovery_status = 'Es ist ein unbekannter Fehler aufgetreten. Versuche es später noch einmal.';
		});
	}
	mainPage() {
		this.step = false;
	}
}

UserLoginCtrl.$inject = ['$scope', '$http', '$timeout', 'DataCache', 'ezfb', 'GooglePlus', 'toaster'];

export default UserLoginCtrl;
