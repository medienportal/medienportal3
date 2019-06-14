var async = require('async'),
	Greeting = require('../model/greeting'),
	Activity = require('../model/activity'),
	Cache = require('../service/cache'),
	PermissionManager = require('../service/permission_manager');

exports.list = function ListGreetings(req, res, next) {
	if (!req.account) return res.send(400);
	var cached = req.cache.getRoute('/greeetings');
	if (cached) { return res.send(cached); }
	Greeting.find({ account_id: req.account.id }, function(err, greetings) {
		if (err) return next(err);
		req.cache.setRoute('/greetings', { greetings: greetings });
		res.send(200, { greetings: greetings });
	});
}

exports.create = function GreetingCreate(req, res, next) {
	if (!req.account) return res.send(400);
	if (!req.body.greeting) return res.send(400);
	if (!req.body.greeting.content) return res.send(400);
	delete req.body.greeting.id;  // do not set own id
	delete req.body.greeting._id;
	req.body.greeting.account_id = req.account.id;
	var greeting = req.body.greeting;
	if (!greeting.author)
		greeting.author = {};
	if (req.current_user) {
		greeting.author.author_type = 'panda';
		greeting.author.author_id = req.current_user.id;
	} else {
		greeting.author.author_type = 'custom';
		if (!greeting.author.author_id)
			greeting.author.author_id = 'Gast';
	}
	Greeting.create(req.body.greeting, function(err, greeting) {
		if (err) return next(err);
		Activity.fromGreeting(greeting, function(_err, activity) {
			if (_err) return next(_err);
			res.send(200, { greeting: greeting, activity: activity });
		});
	});
}

exports.remove = function GreetingRemove(req, res, next) {
	if (!req.account) return res.send(400);
	if (!req.param('greeting_id')) return res.send(400);
	if (!req.current_user) return res.send(403);
	if (!PermissionManager.user(req.current_user).account(req.account).isAdmin()) return res.send(403);
	Greeting.findById(req.param('greeting_id')).remove(function(err) {
		if (err) return next(err);
		res.send(200);
	});
}