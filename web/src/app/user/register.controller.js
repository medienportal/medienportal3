'use strict';

class UserRegisterCtrl {
	constructor($rootScope, $scope, $timeout, $location, $http, $cookies, ezfb, GooglePlus, DataCache, User, toaster) {
		this.$rootScope = $rootScope;
		this.$scope = $scope;
		this.$timeout = $timeout;
		this.$location = $location;
		this.$http = $http;
		this.$cookies = $cookies;
		this.ezfb = ezfb;
		this.GooglePlus = GooglePlus;
		this.DataCache = DataCache;
		this.User = User;
		this.toaster = toaster;

		this.avatar = { selected: 1 };
		this.status = 'registrieren';
		this.userInfo = {};
		this.step = 0;
	}
	getName() {
		var name = this.userInfo.name;
		if (!name) {
			return {};
		}
		var comps = name.split(' ');
		if (comps.length < 2) {
			return { first_name: comps[0] };
		}
		return {
			last_name: comps.pop(),
			first_name: comps.join(' ')
		};
	}
	handlePositiveResponse(res) {
		var user = new this.User(res.data);
		var sessionToken = res.headers('X-PANDA-AUTH-SESSION-ID-SET');
		this.step = 1;
		this.user = user;
		this.$http.defaults.headers.common['X-PANDA-AUTH-SESSION-ID'] = sessionToken;
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
				this.DataCache
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
			this.DataCache
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
	doRegister() {
		this.status = 'Du wirst registriert ...';
		var userInfo = {
			email: this.userInfo.email,
			first_name: this.getName().first_name,
			last_name: this.getName().last_name
		};
		var user = new this.User(userInfo);
		user.password = this.userInfo.password;
		user.save().then((data) => {
			var user = data.user,
				sessionToken = data.sessionToken,
				error = data.error;
			if (user && sessionToken) {
				this.step = 2;
				this.user = user;
				this.$cookies.put('X-PANDA-AUTH-SESSION-ID', sessionToken);
				this.$http.defaults.headers.common['X-PANDA-AUTH-SESSION-ID'] = sessionToken;
			} else {
				this.status = error || 'Registrierung fehlgeschlagen.';
				this.$timeout(() => { this.status = 'registrieren'; }, 5000);
			}
		});
	}
	setAvatarFromHdd(files) {
		if (!files || files.length < 1) {
			return;
		}
		var file = files[0];
		var fr = new FileReader();
		fr.onload = ($e) => {
			var canvas = document.createElement('canvas'),
				context = canvas.getContext('2d'),
				image = new Image();
			canvas.width = 200;
			canvas.height = 200;
			image.onload = () => {
				var dims = (function(img) {
					var width, height;
					if (img.width > img.height) {
						height = 200;
						width = parseInt(200 * (img.width / img.height), 10);
					} else {
						width = 200;
						height = parseInt(200 * (img.height / img.width), 10);
					}
					return { width: width, height: height };
				})(image);
				context.drawImage(image, 0, 0, dims.width, dims.height);
				this.avatar.custom_source = canvas.toDataURL();
				this.avatar.selected = 'custom';
				this.$scope.$apply();
			};
			image.src = $e.target.result;
		};
		fr.readAsDataURL(file);
	}
	isWebcamAvailable() {
		return (window.navigator.webkitGetUserMedia ||
				window.navigator.mozGetUserMedia ||
				window.navigator.msGetUserMedia ||
				window.navigator.getUserMedia);
	}
	setupAvatarscreenFromWebcam() {
		window.navigator.getUserMedia = window.navigator.getUserMedia || window.navigator.webkitGetUserMedia || window.navigator.mozGetUserMedia || window.navigator.msGetUserMedia;
		if (!window.navigator.getUserMedia) {
			return false;
		}
		this.step = 2.5;
		window.navigator.getUserMedia(
			{
				video: {
					mandatory: {},
					optional: [{ minAspectRatio: '1' }, { maxAspectRatio: '1' }]
				}
			},
			(localMediaStream) => {
				var video = document.getElementById('webcam-screen-video');
				if (localMediaStream) {
					this.localMediaStream = localMediaStream;
					video.src = (window.URL && window.URL.createObjectURL(localMediaStream)) || localMediaStream;
					video.play();
					this.$scope.$apply();
				}
			},
			(err) => {
				this.localMediaStream = null;
				this.step = 2;
				console.error(err);
			}
		);
	}
	saveUserAvatarFromWebcam() {
		var video = document.getElementById('webcam-screen-video');
		if (this.localMediaStream) {
			var canvas = document.createElement('canvas');
			canvas.width = 200;
			canvas.height = 200;
			var context = canvas.getContext('2d');
			context.drawImage(video, 0, 0, 200, 200);
			this.avatar.custom_source = canvas.toDataURL();
			this.avatar.selected = 'custom';
			this.step = 2;
		}
	}
	getAvatarObjectFromCustomNr(i) {
		return {
			'small': '/assets/images/profilNo' + i.toString() + '.jpg',
			'small@2x': '/assets/images/profilNo' + i.toString() + '.jpg',
			'middle': '/assets/images/profilNo' + i.toString() + '.jpg',
			'middle@2x': '/assets/images/profilNo' + i.toString() + '.jpg',
			'big': '/assets/images/profilNo' + i.toString() + '.jpg',
			'big@2x': '/assets/images/profilNo' + i.toString() + '.jpg',
		};
	}
	saveUserAvatar() {
		this.step = 3;
		if (this.avatar.selected === 'custom') {
			if (this.avatar.file) {
				this.user.uploadImage(this.avatar.file);
			} else {
				this.user.uploadImage(this.avatar.custom_source);
			}
		} else {
			this.user.avatar = this.getAvatarObjectFromCustomNr(this.avatar.selected);
			this.user.save('avatar');
		}
	}
	saveUserClass() {
		if (!this.newklass || !this.newklass.first) {
			this.closeModal();
			return;
		}
		var first = this.newklass.first;
		var second = this.newklass.second;
		if (second) {
			this.user.klass = first + '/' + second;
		} else {
			this.user.klass = first;
		}
		this.user.save('klass');
		this.closeModal();
	}
	closeModal() {
		if (this.$scope.closeThisDialog) {
			this.$scope.closeThisDialog();
		} else {
			this.$scope.open('/');
		}
		if (this.user) {
			this.DataCache.current_user = this.user;
			if (!this.$rootScope.$$phase) { this.$rootScope.$apply(); }
		}
	}
}

export default UserRegisterCtrl;
