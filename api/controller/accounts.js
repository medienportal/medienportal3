var config = require('../config'),
	async = require('async'),
	Mandrill = require('mandrill-api'),
	mandrill_client = new Mandrill.Mandrill(config.mandrill.key),
	Account = require('../model/account'),
	Activity = require('../model/activity'),
	Page = require('../model/page'),
	Category = require('../model/category'),
	Collection = require('../model/collection'),
	File = require('../model/file'),
	User = require('../model/user'),
	Cache = require('../service/cache'),
	PermissionManager = require('../service/permission_manager');

exports.getPublicConfigurationJavascript = function(req, res, next) {
	var content;
	if (req.account) {
		params = JSON.stringify(req.account.config.public);
		content = 'configuration = ' + params;
	} else {
		content = 'window.location.href="http://unsdrei.com"';
	}
	res.setHeader('Content-Type', 'text/javascript');
	res.send(200, content);
};

exports.getCurrent = function(req, res, next) {
	if (!req.account) return res.send(400);
	res.send(200, { account:
		{
			_id: req.account._id,
			title: req.account.title,
			name: req.account.name,
			config: ((req.account.config && req.account.config.public) || {})
		}
	});
};

exports.updateBannerImage = function AccountUpdateBannerImage(req, res, next) {
	if (!PermissionManager.user(req.current_user).account(req.account).isAdmin()) return res.send(403);

	File.fromRequest(req).once('finished', function(err, file) {
		Account.findByIdAndUpdate(req.account.id, { $set: { 'config.public.banner': {
			file_id: file.id,
			versions: file.versions
		} } }, function (_err) {
			if (_err) return next(_err);
			Account.findById(req.account.id, function(__err, __account) {
				if (__err) return next(__err);
				req.account = __account;
				res.send(200, {account: __account});
			});
		});
	});
};

exports.setConfig = function(req, res, next) {
	if (!PermissionManager.user(req.current_user).account(req.account).isAdmin()) return res.send(403);
	if (!req.body.config) return res.send(400);
	try {
		var length = Object.keys(req.body.config);
		if (length < 1) {
			throw new Error('config object is empty');
		}
	} catch(e) {
		return res.send(400);
	}
	var query = {$set: {}};
	Object.keys(req.body.config).forEach(function(key) {
		query.$set['config.public.' + key] = req.body.config[key];
	});
	console.log(query);
	Account.findByIdAndUpdate(
		req.account.id,
		query,
		function(_err, _account) {
			if (_err) return next(_err);
			Account.findById(_account.id, function(__err, __account) {
				if (__err) return next(__err);
				return res.send(200, { account: {
					_id: __account._id,
					title: __account.title,
					name: __account.name,
					config: ((__account.config && __account.config.public) || {})
				} });
			});
		}
	);
}

// this returns the info that is necessary to show the homepage,
// including latest comments and greetings, latest articles and collections,
// categories, users, ...
exports.homepage = function(req, res, next) {
	var users, topstory, pages, tags, topics, collections, categories, randomPages, activities;
	if (!req.account) return res.send(400);
	var cached = req.cache.getRoute('/home');
	if (cached) {
		return res.send(200, cached);
	}
	var pageQuery = function() {
		var homepCategories = categories.filter(function(cat) {
			return (cat && cat.config && (cat.config.hide_from_homepage === true));
		}).map(function(cat) {
			return cat._id;
		});
		return {
			account_id: req.account.id,
			category_id: { $nin: homepCategories },
			status: 'PUBLISHED'
		};
	};
	async.waterfall([
		function(callback) {
			Category.find({ account_id: req.account.id }, callback);
		},
		function(_categories, callback){
			categories = _categories;
			Page.find(pageQuery())
				.sort('-created_at')
				.limit(15)
				.exec(callback);
		},
		function(_pages, callback) {
			pages = _pages;

			var query = { account_id: req.account.id };
			if (req.account.config && req.account.config.private && req.account.config.private.topstory) {
                var topstoryVal = req.account.config.private.topstory.split(':');
                if (!topstoryVal.length > 1) { return callback(null, {}); }
                var topstoryModel = topstoryVal[0],
                    topstoryId = topstoryVal[1];
                query._id = topstoryId;
                if (topstoryModel == 'page') query.status = 'PUBLISHED';
                if (topstoryModel == 'page') return Page.findOne(query, function(_err, _page) {
                    callback(_err, { page: _page });
                });
                if (topstoryModel == 'collection') return Collection.findOne(query, function(_err, _collection) {
                    callback(_err, { collection: _collection });
                });
                return callback(new Error('Invalid type.'));
            } else {
                callback(null, {});
            }
		},
		function(_topstory, callback) {
			topstory = _topstory;
            if (pages.length < 4) return callback(null, []);
			Page.count(pageQuery(), function(err, count) {
				var rand = Math.random() * (count - 2);
				if (rand < 0) rand = 0;
				if (err) callback(err);
				Page.find(pageQuery())
					.skip(rand)
					.limit(-2)
					.exec(callback);
			});
		},
		function(_randomPages, callback){
			randomPages = _randomPages;
			tags = [];
			topics = [];
			// TO DO: get this via mongodb aggregation
			Page.find({ account_id: req.account._id }, function(err, _allPages) {
				if (err) return callback(err);
				_allPages.map(function (page) {
					return {
						tags: page.tags,
						topic: page.topic
					};
				}).forEach(function (obj) {
					var pageTags = obj.tags;
					topics.push(obj.topic);
					pageTags.forEach(function (tag) {
						tags.push(tag);
					});
				});
				var unique = function (tag, index, self) {
					return tag && (self.indexOf(tag) === index);
				};
				tags = tags.filter(unique);
				topics = topics.filter(unique);
				var query = pageQuery();
				delete query.status;
				Collection.find(query)
					.sort('-created_at')
					.limit(5)
					.exec(callback);
			});
		},
		function(_collections, callback){
			collections = _collections;
			User.find({ account_id: req.account.id })
				.exec(callback);
		},
		function(_users, callback) {
			users = _users;
			Activity
				.find({ account_id: req.account.id })
				.sort({created_at: 'desc'})
				.limit(50)
				.exec(callback);
		}
	], function (err, _activities) {
		if (err) return next(err);
		activities = _activities;
		var response = {
			pages: pages,
			randomPages: randomPages,
			topstory: topstory,
			tags: tags,
			topics: topics,
			categories: categories,
			collections: collections,
			users: users,
			activities: activities
		};
		res.send(200, req.cache.setRoute('/home', response, 12 * 60 * 60));
	});
}

exports.getHomeForUser = function(req, res, next) {
	var currentUserId = req.current_user ? req.current_user._id.toString() : null;
	if (!req.params.user_id) {
		return res.send(404);
	}
	if (!req.current_user) {
		return res.send(403);
	};
	if (req.params.user_id !== currentUserId) {
		return res.send(403);
	}
	var pages, collections;
	var query;
	if (PermissionManager.user(req.current_user).account(req.account).isAdmin()) {
		query = {
			account_id: req.account._id,
			$or: [
				{
					status: { $ne: 'PUBLISHED', $exists: true }
				},
				{
					author: {
						$elemMatch: {
							author_type: 'panda',
							author_id: currentUserId
						}
					},
					status: { $ne: 'PUBLISHED' }
				}
			]
		}
	} else {
		query = {
			account_id: req.account._id,
			author: {
				$elemMatch: {
					author_type: 'panda',
					author_id: currentUserId
				}
			},
			status: { $ne: 'PUBLISHED' }
		};
	}
	async.parallel({
		pages: function(callback){
			Page.find(query, callback);
		},
		collections: function(callback){
			Collection.find(query, callback);
		}
	},
	function(err, results) {
		if (err) { return next(err); }
		res.send(200, results);
	});
}

exports.feedback = function(req, res, next) {
	if (!req.body.message) return next({ status: 400, shortCode: 'missingArgument', meta: 'message' });
	var message = {
		"text": "feedback from mp3.\nAccount: " + req.account + "\nuser: " + req.current_user + "UA: " + req.headers['user-agent'] + "message: " + req.body.message,
		"subject": "mp3 feedback",
		"from_email": "medienportal@unsdrei.de",
		"from_name": "Das Medienportal",
		"to": [{
			"email": "contact@unsdrei.de",
			"name": "unsdrei GbR",
			"type": "to"
		}],
		"tags": [
		"feedback"
		],
		"subaccount": "medienportal",
	};
	mandrill_client.messages.send({
		message: message,
		async: true,
		ip_pool: "Main Pool"
	},
	function(result) {
		console.log(result);
	},
	function(error) {
		console.log(error)
	});
	res.send(200);
}
