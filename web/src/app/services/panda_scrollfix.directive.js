'use strict';

/*
 * This directive adds or removes a class depending on the scrolling position of the window.
 * <header panda-scrollfix scrollfix-class="fixed" scrollfix-top-margin="10"></header>
 * possible attributes:
 * scrollfix-class: class to be added when element position is on top
 * scrollfix-top-margin: margin to the top needed before class is added
 */
var PandaScrollfixDirective = function() {
	return {
		restrict: 'A',
		link: function(scope, elm, attrs) {
			var offsetTop = elm[0].offsetTop;
			var offsetTopMargin = attrs.scrollfixTopMargin ? parseInt(attrs.scrollfixTopMargin, 10) : 0;
			window.addEventListener('scroll', function() {
				var offsetTopAllowed = window.scrollY - offsetTopMargin;
				if (offsetTop < offsetTopAllowed) {
					elm[0].classList.add(attrs.scrollfixClass);
				} else {
					elm[0].classList.remove(attrs.scrollfixClass);
				}
			});
		}
	};
};

export default PandaScrollfixDirective;
