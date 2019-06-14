'use strict';

export function RemoveHtmlFilter() {
	return function(string) {
		return string.replace(/<(?:.|\n)*?>/gm, '');
	};
}
export function OrderObjectsByFilter() {
	return function(items, field, reverse) {
		var filtered = [];
		angular.forEach(items, function(item) {
			filtered.push(item);
		});
		filtered.sort(function (a, b) {
			return (a[field] > b[field] ? 1 : -1);
		});
		if(reverse) {
			filtered.reverse();
		}
		return filtered;
	};
}

export function UaDetectorFilter() {
	return function(uastring) {
		if (uastring.match(/iPhone/)) {
			return 'vom iPhone';
		}
		if (uastring.match(/iPad/)) {
			return 'vom iPad';
		}
	};
}
