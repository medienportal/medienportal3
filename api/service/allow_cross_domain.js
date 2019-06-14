var config = require('../config');

module.exports = function allowCrossDomainMiddleware(req, res, next) {
	var allow_origin = config.cors.allow_origin
	if (allow_origin === "**")
		allow_origin = req.headers.origin;
	res.header('Access-Control-Allow-Origin', allow_origin);
	res.header('Access-Control-Allow-Methods', 'GET,PUT,PATCH,POST,DELETE');
	res.header('Access-Control-Allow-Headers', 'Content-Type,X-PANDA-AUTH-SESSION-ID,X-PANDA-ACCOUNT-ID');
	res.header('Access-Control-Expose-Headers', 'X-PANDA-AUTH-SESSION-ID-SET');
	if (req.method === 'OPTIONS') return res.send(200);
	next();
}
