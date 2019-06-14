'use strict';

class ApplicationCtrl {
	constructor(LayoutManager, SocialManager, ThemeManager) {
		this.lm = LayoutManager;
		this.sm = SocialManager;
		this.ThemeManager = ThemeManager;
	}
}

ApplicationCtrl.$inject = ['LayoutManager', 'SocialManager', 'ThemeManager'];

export default ApplicationCtrl;
