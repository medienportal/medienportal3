'use strict';

/*
 * This directive adds a class left or right depending on the position of the element in the page
 * <div panda-greeting-positioning></div>
 */
var pandaGreetingPositioningDirective = function() {
	var columns = [0, 0];
	var alignElement = function(element) {
		var height = element.clientHeight;
		if (columns[0] > columns[1]) {
			// put el into right column
			element.classList.add('right');
			columns[1] += height;
		} else {
			element.classList.add('left');
			columns[0] += height;
		}
	};
	return {
		restrict: 'A',
		scope: {},
		link: function(scope, elm) {
			var element = elm[0];
			setTimeout(function() {
				alignElement(element);
			}, 35);
		}
	};
};

export default pandaGreetingPositioningDirective;
