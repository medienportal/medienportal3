var config = require('../config'),
	ICal = require('ical');


exports.get = function(req, res, next) {
	var accountConfig = req.account.config && req.account.config.public;
	var url = accountConfig && accountConfig.MP3CalendarUri;
	if (!url) {
		return res.send(400);
	}

	var cacheKey = 'events-uri:' + url;
	var cached = req.cache.get(cacheKey);
	if (cached) {
		return res.send(cached);
	}

	ICal.fromURL(url, {}, function(err, data) {
		var events = [];
		if (err) {
			return next(err);
		}
		for (var k in data){
			if (data.hasOwnProperty(k)) {
				var event = data[k];
				if (event.start && event.start > new Date()) {
					console.log("Event",
						event.summary,
						'is in',
						event.location);
					console.log('START: ', event.start);
					console.log('EVENT: ', event);
					events.push(event);
				}
			}
		}

		var response = { events: events };
		req.cache.set(cacheKey, response, 60 * 60); // cache 1 hour

		res.send(200, response);
	});
}
