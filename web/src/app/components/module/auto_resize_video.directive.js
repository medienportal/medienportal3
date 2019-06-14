'use strict';

var AutoResizeVideoDirective = function() {
	return {
		restrict: 'A',
		link: function(scope, elm) {
			var element, height;
			element = elm[0];
			if (element.nodeName !== 'VIDEO') {
				throw new Error('This is no video!');
			}
			var setCorrectHeight = function(ratio) {
				if (!ratio) {
					ratio = element.videoWidth / element.videoHeight;
				}
				height = parseInt(element.parentElement.clientWidth / 1.77, 10);
				element.style.height = height + 'px';
			};
			setCorrectHeight(16/9);
			element.addEventListener('loadedmetadata', function() {
				setCorrectHeight();
				window.addEventListener('resize', function() {
					setCorrectHeight();
				}, true);
			}, false);
		}
	};
};

export default AutoResizeVideoDirective;
