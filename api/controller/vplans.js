var async = require('async'),
	request = require('request'),
	xml2js = require('xml2js'),
	Buffer = require('buffer').Buffer,
	Iconv  = require('iconv').Iconv,
	User = require('../model/user');

var urlForVplanForDate = function(date) {
	var formattedDate = date.getFullYear() + ("0" + (date.getMonth()+1)).slice(-2) + ("0" + date.getDate()).slice(-2);
	return 'http://www.ehrenberg-gymnasium.de/assets/Uploads/vPlan/vps' + formattedDate + '.xml';
}

// get next working day (mon - fry)
var tomorrow = function() {
	var daysUntilTomorrow = 1;
	if (new Date().getDay() === 5) daysUntilTomorrow = 3;
	if (new Date().getDay() === 6) daysUntilTomorrow = 2;
	return new Date(new Date().getTime() + daysUntilTomorrow * 24 * 60 * 60 * 1000);
}

exports.get = function(req, res, next) {
	if (!req.current_user) return res.send(403);
	var klass = req.current_user.klass;
	if (!klass) return res.send(400, 'No class set.');

	var url = urlForVplanForDate(tomorrow());

	request({
		url: url,
		encoding: null
	}, function(err, response, body) {
		if (err) return next(err);
        if (response.statusCode === 404) return res.send(422, { error: { message: 'Es steht kein Vertretungsplan zur Verfügung.' } });
		if (response.statusCode !== 200) return next(new Error('got ' + response.statusCode + ' from VPLAN server.'));
		response.setEncoding('binary');
		var iconv = new Iconv('ISO-8859-1', 'UTF-8');
		xml2js.parseString(iconv.convert(body), { async: true }, function(err, resultJson) {
			if (err) return next(err);
			resultJson.vp.haupt[0].aktion = resultJson.vp.haupt[0].aktion.filter(function(aktion) {
				return aktion.klasse.filter(function(klasse) {
					var regexp = new RegExp("^" + klass);
					return klasse.match(regexp) || !klasse.match(/^[\d]/);
				}).length > 0;
			});
			res.send(resultJson);
		});
	});
}
