var async = require('async'),
	Busboy = require('busboy'),
	mongoose = require('mongoose'),
	Page = require('../model/page'),
	User = require('../model/user'),
	Comment = require('../model/comment'),
	Module = require('../model/module'),
	Activity = require('../model/activity'),
	File = require('../model/file'),
	Likes = require('../service/likes'),
	Topstory = require('../service/topstory'),
	Cache = require('../service/cache'),
	Mailer = require('../service/mailer'),
	PermissionManager = require('../service/permission_manager');

var _build_query = function(account, user) {
	var pages_query = { account_id: account._id };
	if (!user) {
		pages_query['status'] = 'PUBLISHED';
	} else if (user && !PermissionManager.user(user).account(account).isAdmin()) {
		pages_query['$or'] = [
			{
				author: {
					$elemMatch: {
						author_type: 'panda',
						author_id: user.id
					}
				}
			},
			{
				status: 'PUBLISHED'
			}
		];
	} else {
		// user is admin, does only see pages that have a status (others are 'not ready')
		pages_query['status'] = { $ne: '', $exists: true };
	}
	return pages_query;
};

// This function lists all pages for the current account
// `req.account` must be set
// `req.param('category_id')` can be set
// `req.param('category_sub')` can be set
exports.list = function PageList(req, res, next) {
	if (!req.account) return next({ status: 400, shortCode: 'noAccount' });
	var pages, modules;
	var pages_query = _build_query(req.account, req.current_user);
	if (req.param('category_id')) pages_query['category_id'] = req.param('category_id');
	async.waterfall([
		function (cb) {
			Page.find(pages_query, cb);
		},
		function (pages_res, cb) {
			pages = pages_res;
			Module.find({}, cb);
		}
	], function (err, modules) {
		if (err) return next(err);
		res.send(200, { modules: modules, pages: pages });
	});
};

// This gets all the tags for all the pages available for a specific account
// `req.account` must be set
exports.tagList = function PageTagsList(req, res, next) {
	if (!req.account) return next({ status: 400, shortCode: 'noAccount' });
	Page.find(_build_query(req.account, req.current_user), function (err, pages) {
		if (err) return next(err);
		var tags = [];
		pages.map(function (page) {
			return page.tags;
		})
			.forEach(function (pageTags) {
				pageTags.forEach(function (tag) {
					tags.push(tag);
				});
			})
		tags = tags.filter(function (tag, index, self) {
			return self.indexOf(tag) === index;
		});
		res.send(200, { tags: tags });
	});
};

exports.getOne = function PageGetOne(req, res, next) {
	var page, modules, comments, page_id = req.param('page_id');
	if (!page_id) return res.send(400);
	var cached = req.cache.getRoute('/page/' + page_id);
	if (cached) {
		return res.send(cached);
	}
	async.waterfall([
		function (cb) {
			Page.findById(page_id, cb);
		},
		function (page_res, cb) {
			page = page_res;
			if (!page) return cb(new Error('page does not exist'));
			var module_ids = page.modules.map(function (mod) {
				return mod.module_id;
			});
			page.__viewsCount = (page.__viewsCount || 0) + 1;
			Module.find({ _id: { $in: module_ids } }, cb);
		},
		function (mods, cb) {
			modules = mods;
			Comment.find({ _id: { $in: page.comments }}, cb);
		},
		function (_comments, cb) {
			comments = _comments;
			Page.update({_id: page_id}, { $inc: { '__viewsCount':  1} }, cb);
		}, function() {
			var response_obj = { page: page, modules: modules, comments: comments };
			res.send(200, req.cache.setRoute('/page/' + page_id, response_obj, 6 * 60 * 60));
		}
	], function (err) {
		if (err.message === 'page does not exist') {
			return res.send(404);
		}
		if (err.name === 'CastError') {
			return res.send(404);
		}
		if (err) return next(err);
	});
};

// This function creates a page.
// POST value must be a hash with page model contents
// User must have rights to create a page;
// Account must be given
exports.create = function PageCreate(req, res, next) {
	if (!req.current_user) return res.send(401);
	if (!req.account) return res.send(400);
	if (!req.body.page) return res.send(400);
	var catId = req.body.page.category_id;
	if (!req.body.page.category_id) return res.send(400);
	delete req.body.page.id;  // do net set own id
	delete req.body.page._id;
	delete req.body.page.status;
	req.body.page.account_id = req.account._id;
	if (!PermissionManager.user(req.current_user).account(req.account).can('create', req.body.page.category_id)) return res.send(403);
	Page.create(req.body.page, function (err, page) {
		if (err) return next(err);
		res.send(200, { page: page });
	});
};

exports.update = function PageUpdate(req, res, next) {
	if (!req.current_user) return res.send(401);
	if (!req.body.page) return res.send(400);
	if (!req.param('page_id')) return res.send(400);
	delete req.body.page.id;  // do net set own id
	delete req.body.page._id;
	delete req.body.page.status;
	Page.findById(req.param('page_id'), function(err, page) {
		if (err) return next(err);
		if (!PermissionManager.user(req.current_user).can('edit', page)) return res.send(403);
		if (!PermissionManager.user(req.current_user).account(req.account).isAdmin() && (page.status === 'PUBLISHED' || page.status === 'CONTROLLED')) return res.send(403);
		Page.findByIdAndUpdate(req.param('page_id'), req.body.page, function (err, page) {
			if (err) return next(err);
			Page.findById(req.param('page_id'), function(_err, _page) {
				if (_err) return next(_err);
				res.send(200, { page: _page });
				_page.index();
			});
		});
	});
};

exports.setPageStatus = function PageUpdate(req, res, next) {
	var status = req.body.status;
	if (!status) return res.send(400);
	if (!req.param('page_id')) return res.send(400);
	if (!req.current_user) return res.send(401);
	Page.findById(req.param('page_id'), function(_err, _page) {
		if (!_page) return res.send(404);
		if (['READY', 'CONTROLLED', 'PUBLISHED'].indexOf(status) < 0) {
			// status is not allowed
			return res.send(400);
		}
		if (status === 'READY') {
			// To-Do: check if user is elligible
		} else if (status === 'CONTROLLED') {
			// check if user is elligible
			if (!PermissionManager.user(req.current_user).canSetControlled(_page)) return res.send(403);
		} else if (status === 'PUBLISHED') {
			// check if user is elligible
			if (!PermissionManager.user(req.current_user).canSetPublished(_page)) return res.send(403);
		}
		Page.findByIdAndUpdate(req.param('page_id'), { $set: { status: status } }, function (err, page) {
			if (err) return next(err);
			page.status = status;
			res.send(200, { page: page });
			if (status === 'READY') {
				var _notificationAdminQuery = { $or: [{}, {}, {}] };
				_notificationAdminQuery.$or[0]['permissions.' + page.account_id + '.admin'] = true;
				_notificationAdminQuery.$or[1]['permissions.' + page.account_id + '.' + page.category_id + '.canSetControlled'] = true;
				_notificationAdminQuery.$or[2]['permissions.' + page.category_id + '.' + page.category_id + '.canSetPublished'] = true;
				_notificationAdminQuery.settings = { notifications: { item_is_set_ready: true } };
				User.find(_notificationAdminQuery, function(err, users) {
					if (err) {
						return console.error(err);
					}
					users.forEach(function(user) {
						if (user.id === req.current_user.id) {
							return;
						}
						Mailer.NotificationItemIsSetReady({
							item: page,
							link: req.account.getCompleteUrl() + '/page/' + page.id,
							user: user,
							author: req.current_user
						}).send();
					});
				});
			}
		});
	});
};

exports.updatePreviewImage = function PageUpdatePreviewImage(req, res, next) {
	if (!req.param('page_id')) {
		return next({ status: 400, shortCode: 'missingArgument', meta: 'page'});
	}

	var mp3FileEmitter = File.fromRequest(req);
	mp3FileEmitter.once('finished', function(error, file) {
		if (error) {
			return res.send(400, error);
		}

		Page.findByIdAndUpdate(req.param('page_id'), {
			'config.preview': {
				file_id: file.id,
				versions: file.versions
			}
		}, function (err, page) {
			if (err) return next(err);
			Page.findById(page._id, function(_err, _page) {
				if (_err) return next(_err);
				res.send(200, { page: _page });
			});
		});
	});
};

exports.updateBannerImage = function PageUpdateBannerImage(req, res, next) {
	var mp3FileEmitter = File.fromRequest(req);
	mp3FileEmitter.once('finished', function(error, file) {
		if (error) {
			return res.send(400, error);
		}

		Page.findByIdAndUpdate(req.param('page_id'), {
			'config.banner': {
				file_id: file.id,
				versions: file.versions
			}
		}, function (err, page) {
			if (err) return next(err);
			Page.findById(page._id, function(_err, _page) {
				if (_err) return next(_err);
				res.send(200, { page: _page });
			});
		});
	});
};

exports.remove = function PageRemove(req, res, next) {
	if (!req.param('page_id')) return res.send(400);
	Page.findByIdAndRemove(req.param('page_id'), req.body.page, function (err, page) {
		if (err) return next(err);
		res.send(200, page);
	});
};

exports.addLike = Likes.addLikeFunction(Page);
exports.makeTopstory = Topstory.makeTopstoryFunction(Page);

/*
 *
 *    Modules
 *
 */

// A Module can only be created/edited if it belongs to a page, as
// it must be garanteed the user has access to the page in order
// to know his rights regarding the module.
exports.createModule = function PageCreate(req, res, next) {
	if (!req.body.module) {
		return res.send(400, { error: 'no module given' });
	}
	delete req.body.module.id;  // do not set own id
	delete req.body.module._id;
	File.fromRequest(req).once('finished', function(err, file) {
		var updatedModule = req.body.module;
		if (!err && file) {
			updatedModule.files = [{
				file_id: file.id,
				versions: file.versions,
				meta: file.meta
			}];
		} else {
			if (err) {
				console.log('err: ', err);
				return res.send(400, err);
			}
		}
		var module = new Module(req.body.module);
		module.save(function (err, module) {
			if (err) return next(err);
			res.send(module);
		});
	});
};

exports.updateModule = function ModuleUpdate(req, res, next) {
	if (!req.param('page_id')) return res.send(400);
	if (!req.param('module_id')) return res.send(400);
	if (!req.current_user) return res.send(401);
	if (req.body.module) {
		delete req.body.module.id;  // do not set own id
		delete req.body.module._id;
	}

	var updatedModule = req.body.module || {};

	var modObj = {}; // copy req.body.module
	Object.keys(updatedModule).forEach(function(key) {
		modObj[key] = updatedModule[key];
	});
	modObj._id = req.param('module_id');

	Page.findById(req.param('page_id'), function(err, page) {
		if (err) {
			return next(err);
		}
		if (
			!req.current_user.isAuthorOf(page) &&
			!PermissionManager.user(req.current_user).can('edit', page)
		) {
			return res.send(403);
		}
		if (!PermissionManager.account(req.account).user(req.current_user).isAdmin() &&
			(page.isPublished() || page.isControlled())) {
			return res.send(403);
		}

		updatedModule.state = 'finished';

		var fileEmitter = File.fromRequest(req);
		fileEmitter.once('finished', function(_err, _file) {
			if (!_err && _file) {
				if (!updatedModule.files) {
					updatedModule.files = [];
				}
				updatedModule.files.push({
					file_id: _file._id,
					versions: _file.versions,
					meta: _file.meta
				});
			} else {
				if (!req.body.module) {
					return res.send(400);
				}
			}

			Module.findByIdAndUpdate(req.param('module_id'), { $set: updatedModule }, function (__err, module) {
				if (__err) {
					return next(__err);
				}
				if (!module) {
					res.send(404);
				}
				Module.findById(module.id, function(_err, _module) {
					if (_err) return next(_err);
					res.send(200, { module: _module });
				});
			});
	        page.index();
		});
		fileEmitter.once('postprocessed', function(_err, _file) {
			Module.update({
				'_id': req.param('module_id'),
				'files.file_id': new mongoose.Types.ObjectId(_file.id)
			}, {
				$set: {
					'files.$.versions': _file.versions,
					'files.$.meta': _file.meta
				}
			}, function(__err) {
				if (__err) {
					console.warn('err');
				}
			});
		});
	});
};

exports.removeModule = function ModuleRemove(req, res, next) {
	if (!req.param('page_id')) return res.send(400);
	console.log(req.param('module_id'));
	Page.findByIdAndUpdate(req.param('page_id'), {
			$pull: { modules: { module_id: req.param('module_id') } }
		}, function (err, page) {
		if(err) {
			console.log(err);
		}
		if (err) return next(err);
		if (!page) return res.send(404);
		Module.findByIdAndRemove(req.param('module_id'), function (err) {
			if (err) return next(err);
			res.send(200, { page: page });
		});
        page.index();
	});
};

/*
 *
 *    Comments
 *
 */

// A Comment can only be created/edited if it belongs to a page, as
// it must be garanteed the user has access to the page in order
// to know his rights regarding the module.
exports.createComment = function PageCommentCreate(req, res, next) {
	if (!req.account) return res.send(400);
	if (!req.body.comment) return res.send(400);
	if (!req.body.comment.content) return res.send(400);
	if (!req.param('page_id')) return res.send(400);
	delete req.body.comment.id;  // do not set own id
	delete req.body.comment._id;
	var comment = req.body.comment;
	comment.item_id = req.param('page_id');
	comment.user_agent = req.headers['user-agent'];
	comment.account_id = req.account.id;
	comment.created_at = new Date();
	if (!comment.author)
		comment.author = {};
	if (req.current_user) {
		comment.author.author_type = 'panda';
		comment.author.author_id = req.current_user.id;
	} else {
		comment.author.author_type = 'custom';
		if (!comment.author.author_id)
			comment.author.author_id = 'Gast';
	}
	Page.findById(req.param('page_id'), function(__err, __page) {
		if (__err) return next(_err);
		if (!__page) return res.send(404);
		if (__page.status !== 'PUBLISHED') return res.send(403, { error: 'Comments for unpublished articles are not allowed.' });
		Comment.create(req.body.comment, function (_err, _comment) {
			if (_err) return next(_err);
			Page.findByIdAndUpdate(req.param('page_id'), { $push: { comments: _comment.id } }, function (err, page) {
				if (err) return next(err);
				page.comments.push(_comment._id);
				Activity.fromComment(_comment, function(_err, activity) {
					res.send(200, {page: page, comment: _comment, activity: activity});
          page.index();
				});
			});
		});
	});
};

// A Comment can only be created/edited if it belongs to a page, as
// it must be garanteed the user has access to the page in order
// to know his rights regarding the module.
exports.removeComment = function PageCommentCreate(req, res, next) {
	if (!req.account) return res.send(400, 'no account given');
	if (!req.param('comment_id')) return res.send(400, 'no comment_id given');
	if (!req.param('page_id')) return res.send(400, 'no page id given');
	var page;
	async.waterfall([
		function(callback){
			Page.findById(req.param('page_id'), callback);
		},
		function(_page, callback){
			page = _page;
			Comment.findById(req.param('comment_id'), callback);
		}
	], function (err, comment) {
		if (!PermissionManager.user(req.current_user).can('edit', page)) {
			return res.send(403);
		}
		if (page.id.toString() !== comment.item_id.toString()) return res.send(404);
		// TO-DO: allow comment deletion for some categories only
		page.update({ $pull: { comments: comment.id } }, function(err, numAff) {
			if (err) return next(err);
			if (!numAff) return next(new Error('no comment pulled from this page'));
			comment.removeCorrespondingActivities();
			comment.remove(function(err) {
				if (err) return next(err);
				Page.findById(page.id, function(e, updatedPage) {
					res.send(200, { page: updatedPage });
                    updatedPage.index();
				});
			});
		});
	});
};

exports.updateComment = function PageCommentUpdate(req, res, next) {
	if (!req.param('page_id')) return res.res(400);
	if (!req.param('comment_id')) return res.res(400);
	delete req.body.comment.id;  // do not set own id
	delete req.body.comment._id;
	Comment.findByIdAndUpdate(req.param('comment_id'), req.body.comment, function (err, comment) {
		if (err) return next(err);
		if (!comment) res.send(404);
		res.send(200, comment);
        Page.findById(req.param('page_id'), function(_err, _page) {
            if (_err) return;
            _page.index();
        });
	});
};
