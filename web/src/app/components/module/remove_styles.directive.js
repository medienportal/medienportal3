'use strict';

var RemoveStylesContenteditableDirective = function() {
	return {
		restrict: 'A',
		link: function(scope, elm) {
			elm[0].addEventListener('paste', function(e) {
				e.preventDefault();
				var text = e.clipboardData.getData('text/plain');
				document.execCommand('insertText', false, text);
			});
		}
	};
};

export default RemoveStylesContenteditableDirective;
