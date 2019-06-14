'use strict';

class MainCtrl {
	constructor (LayoutManager) {
		LayoutManager.setBannerImage();
	}
}

MainCtrl.$inject = ['LayoutManager'];

export default MainCtrl;
