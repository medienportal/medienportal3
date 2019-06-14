'use strict';

// getemoji.com
// http://apps.timwhitlock.info/unicode/inspect

var PandaReplaceEmojisDirective = function() {
	return {
		restrict: 'A',
		link: function(scope, elm) {
			var replace = function() {
				elm.val(elm.val().replace(':)', '\ud83d\ude04'));
				elm.val(elm.val().replace(':P', '\ud83d\ude1d'));
				elm.val(elm.val().replace(':*', '\ud83d\ude18'));
				elm.val(elm.val().replace(':(', '\ud83d\ude1f'));
				elm.val(elm.val().replace('<3', '\u2665\uFE0F'));
				elm.val(elm.val().replace('(y)', '\ud83d\ude04'));
			};
			elm.on('keyup change', replace);
		}
	};
};

export default PandaReplaceEmojisDirective;
