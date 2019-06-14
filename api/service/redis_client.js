var config = require('../config'),
	redis = require('redis'),
	client = redis.createClient(config.redis.port, config.redis.host);

client.auth(config.redis.password, function() {
	if (config.redis.db) {
		client.select(config.redis.db);
	}
});

module.exports = client;