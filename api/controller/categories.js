var Category = require('../model/category'),
	Page = require('../model/page'),
	Collection = require('../model/collection'),
	Module = require('../model/module'),
	File = require('../model/file'),
	Cache = require('../service/cache'),
	PermissionManager = require('../service/permission_manager'),
	async = require('async');

// list all categories for the current account
// `req.account` is required
exports.list = function CategoryList(req, res, next) {
	var categories, modules;
	if (!req.account) return res.send(400);
	async.waterfall([
		function(cb) {
			Category.find({ account_id: req.account.id }, cb);
		},
		function(_categories, cb) {
			categories = _categories;
			var allModuleIds = [].concat.apply([], categories.map(function(category) {
				return category.modules.map(function(moduleObj) {
					return moduleObj.module_id;
				});
			}));
			console.log('all module ids: ', allModuleIds);
			Module.find({ _id: { $in: allModuleIds } }, cb);
		}
	], function(err, _modules) {
		if (err) {
			return next(err);
		}
		modules = _modules;
		res.send(200, req.cache.setRoute('/categories', {
			categories: categories,
			modules: modules
		}));
	});
};

// list details for the current category and all pages for the current category
// `req.account` is required
// `req.param('category_id')` is required
// `req.param('limit')` can be used to limit the number of pages
// `req.param('start')` can be used to set the start index of the returned pages
exports.getCategoryWithPagesAndCollectionsAndModules = function CategoryDetails(req, res, next) {
	var categories, category, pages, collections, modules;
	if (!req.account) return res.send(400);
	if (!req.param('category_id')) return res.send(400);
	var cached = req.cache.getRoute('/category/' + req.param('category_id'));
	if (cached) {
		return res.send(cached);
	}
	async.waterfall([
		function(callback){
			Category.findById(req.param('category_id'), callback);
		},
		function(_category, callback) {
			category = _category;
			var moduleIds = category.modules.map(function(moduleObj) {
				return moduleObj.module_id;
			});
			Module.find({_id: { $in: moduleIds } }, callback);
		},
		function(_modules, callback){
			modules = _modules;
			Page.find({ category_id: category.id }, callback);
		},
		function(_pages, callback){
			pages = _pages;
			Collection.find({ category_id: category.id }, callback);
		}
	], function (err, _collections) {
		collections = _collections;
		if (!category) return res.send(404);
		var response = {
			category: category,
			pages: pages,
			collections: collections,
			modules: modules
		};
		res.send(200, req.cache.setRoute('/category/' + req.param('category_id'), response, 2 * 60 * 60));
	});
};

// create a new category.
// req.account is required
// body must include category parameter.
exports.create = function CategoryCreate(req, res, next) {
	if (!req.account) return res.send(400);
	if (!req.current_user) return res.send(401);
	if (!PermissionManager.user(req.current_user).account(req.account).isAdmin()) return res.send(403);
	if (!req.body.category) return res.send(400);
	req.body.category.account_id = req.account.id;
	delete req.body.category.id;  // do net set own id
	delete req.body.category._id;
	Category.create(req.body.category, function (err, category) {
		if (err) return next(err);
		res.send(200, {category: category});
	});
};

exports.update = function CategoryUpdate(req, res, next) {
	if (!req.account) return res.send(400);
	if (!req.current_user) return res.send(401);
	if (!PermissionManager.user(req.current_user).account(req.account).isAdmin()) return res.send(403);
	if (!req.body.category) return res.send(400);
	if (!req.param('category_id')) return res.send(400);
	Category.findById(req.param('category_id'), function(err, category) {
		if (!category) return res.send(404);
		req.body.category.account_id = req.account.id;
		delete req.body.category.id;  // do net set own id
		delete req.body.category._id;
		Category.findByIdAndUpdate(req.param('category_id'), req.body.category, function (err, category) {
			if (err) return next(err);
			Category.findById(req.param('category_id'), function(_err, _category) {
				if (_err) return next(_err);
				res.send(200, { category: _category });
			});
		});
	});
};

exports.remove = function CategoryRemove(req, res, next) {
	if (!req.param('category_id')) return res.send(400);
	if (!PermissionManager.user(req.current_user).account(req.account).isAdmin()) return res.send(403);
	Category.findByIdAndRemove(req.param('category_id'), req.body.category, function (err, category) {
		if (err) return next(err);
		res.send(200, category);
	});
};

exports.updateBannerImage = function CategoryUpdateBannerImage(req, res, next) {
	if (!PermissionManager.user(req.current_user).account(req.account).isAdmin()) {
		return res.send(403);
	}
	if (!req.param('category_id')) {
		return next({ status: 400, shortCode: 'missingArgument', meta: 'category'});
	}

	var mp3FileEmitter = File.fromRequest(req);
	mp3FileEmitter.once('finished', function(error, file) {
		if (error) {
			return res.send(400, error);
		}

		Category.findByIdAndUpdate(req.param('category_id'), {
			'config.banners': {
				file_id: file.id,
				versions: file.versions
			}
		}, function (err, page) {
			if (err) {
				return next(err);
			}
			Category.findById(req.param('category_id'), function(_err, _category) {
				if (err) return next(err);
				res.send(200, {category: _category});
			});
		});
	});
};

/*
 *
 *    Subcategories
 *
 */

exports.addSubcategory = function(req, res, next) {
	if (!req.param('category_id')) {
		return res.send(400);
	}
	if (!req.current_user) {
		return res.send(401);
	}
	Category.findById(req.param('category_id'), function(err, category) {
		if (err) { return next(err); }
		if (!category) { return res.send(404); }
		if (!PermissionManager.user(req.current_user).accountId(category.account_id).isAdmin()) {
			return res.send(403);
		}
		if (!req.body.subcategory) {
			return res.send(400);
		}
		Category.findByIdAndUpdate(req.param('category_id'), {
			$push: {
				navigation: {
					title: req.body.subcategory.title,
					position: req.body.subcategory.position
				}
			}
		}, function(_err, _category) {
			if (_err) { return next(_err); }
			Category.findById(_category.id, function(__err, __category) {
				var matches = __category.navigation.filter(function(sub) {
					return sub.title.toString() === req.body.subcategory.title.toString() &&
							sub.position.toString() === req.body.subcategory.position.toString()
				});
				var subcat = matches && matches[matches.length -1];
				res.send(200, {
					category: __category,
					subcategory: subcat
				});
			});
		});
	});
}

exports.removeSubcategory = function (req, res, next) {
	if (!req.param('category_id')) return res.send(400);
	if (!req.param('subcategory_id')) return res.send(400);
	Category.findById(req.param('category_id'), function(err, category) {
		if (!category) {
			return res.send(404);
		}
		if (!PermissionManager.user(req.current_user).accountId(category.account_id).isAdmin()) return res.send(403);
		var matches = category.navigation.length && category.navigation.filter(function(nav) {
			return nav.id === req.param('subcategory_id');
		});
		if (!matches || !matches.length) {
			return res.send(404);
		}
		Category.findByIdAndUpdate(category.id,
			{
				$pull: {
					navigation: {
						_id: req.param('subcategory_id')
					}
				}
			}, function(_err) {
				if (_err) { return next(_err); }
				Category.findById(category.id, function(__err, __category) {
					if (__err) { return next(__err); }
					res.send(200, { category: __category });
				});
			}
		);
	});
};

exports.editSubcategory = function(req, res, next) {
	if (!req.param('category_id')) return res.send(400);
	if (!req.param('subcategory_id')) return res.send(400);
	if (!req.body.subcategory) return res.send(400);
	var newSubcategory = {
		title: req.body.subcategory.title,
		position: req.body.subcategory.position
	};
	Category.findById(req.param('category_id'), function(err, category) {
		if (!category) {
			return res.send(404);
		}
		if (!PermissionManager.user(req.current_user).accountId(category.account_id).isAdmin()) return res.send(403);
		var matches = category.navigation.length && category.navigation.filter(function(nav) {
			return nav.id === req.param('subcategory_id');
		});
		if (!matches || !matches.length) {
			return res.send(404);
		}
		Category.update(
			{ "_id": category.id, "navigation._id": req.param('subcategory_id') },
			{
				"$set": {
					"navigation.$.title": newSubcategory.title,
					"navigation.$.position": newSubcategory.position
				}
			},
			function(_err) {
				if (_err) { return next(_err); }
				Category.findById(category.id, function(__err, __category) {
					if (__err) { return next(__err); }
					var subcat = __category.navigation.filter(function(sub) {
						return sub._id.toString() === req.param('subcategory_id');
					})[0];
					res.send(200, {
						category: __category,
						subcategory: subcat
					});
				});
			}
		)
	});
};

/*
 *
 *    Modules
 *
 */

// A Module can only be created/edited if it belongs to a category, as
// it must be garanteed the user has access to the category in order
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
	if (!req.param('category_id')) return res.send(400);
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

	Category.findById(req.param('category_id'), function(err, category) {
		if (err) {
			return next(err);
		}
		if (!PermissionManager.account(req.account).user(req.current_user).isAdmin()) {
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
	        // category.index(); // would index category here
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
	if (!req.param('category_id')) return res.send(400);
	Category.findByIdAndUpdate(req.param('category_id'), {
			$pull: { modules: { module_id: req.param('module_id') } }
		}, function (err, category) {
		if(err) {
			console.log(err);
		}
		if (err) return next(err);
		if (!category) return res.send(404);
		Module.findByIdAndRemove(req.param('module_id'), function (err) {
			if (err) return next(err);
			res.send(200, { category: category });
		});
        // category.index();
	});
};
