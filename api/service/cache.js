var STANDARD_TTL = 600; // 10 minutes

var BasicCache = function() {
	this.init();
}
BasicCache.prototype.init = function() {
	this._content = {};
	this._timeouts = {};
	this.isMainCache = false;
}
BasicCache.prototype.purge = function() {
	this._content = {};
}
BasicCache.prototype.invalidate = function(key) {
	this.set(key, null);
	return this;
}
BasicCache.prototype.invalidateRoute = function(route) {
	this.setRoute(route, null);
}
BasicCache.prototype.set = function(key, value, ttl) {
	var timeoutId = this._timeouts[key],
		self = this;
	if (key) {
		this._content[key] = value;
	}
	if (self) {
		this.clearTimeout(timeoutId);
	}
	if (ttl) {
		var ms = ttl * 1000;
		this._timeouts[key] = setTimeout(function(key) {
			self.set(key, null);
		}, ms, key);
	}
	return value;
}
BasicCache.prototype.clearTimeout = function(key) {
	var timeoutId = this._timeouts[key];
	if (timeoutId) {
		clearTimeout(timeoutId);
		return true;
	}
	return false;
}
BasicCache.prototype.setRoute = function(route, content, ttl) {
	if (route) {
		var key = 'route:' + route;
		this.set(key, content, ttl);
	}
	return content;
}
BasicCache.prototype.getRoute = function(route) {
	var key = 'route:' + route;
	return this.get(key);
}
BasicCache.prototype.get = function(key) {
	return this._content[key];
}

var MainCache = function() {
	this.init();
	this.isMainCache = true;
}
MainCache.prototype = Object.create(BasicCache.prototype);
MainCache.prototype.invalidateRouteMW = function(route) {
	var self = this;
	return function(req, res, next) {
		var path = route.replace(/:[A-Za-z0-9_]*/g, function(param) {
			param = param.slice(-param.length+1); // get rid of colon
			if (req.params[param]) {
				return req.params[param];
			} else {
				return '';
			}
		});
		req.cache.invalidateRoute(path);
		next();
	}
}
MainCache.prototype.acc = function(acc) {
	if (!acc) throw 'No account specified.';
	var cache = this.get(acc);
	if (!(cache && cache instanceof BasicCache)) {
		cache = new BasicCache();
		this.set(acc, cache);
	}
	return cache;
}

var cache = new MainCache();

module.exports = cache;
