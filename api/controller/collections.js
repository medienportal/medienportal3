var async = require('async'),
	Comment = require('../model/comment'),
	Collection = require('../model/collection'),
	Activity = require('../model/activity'),
	File = require('../model/file'),
	User = require('../model/user'),
	Mailer = require('../service/mailer'),
	PermissionManager = require('../service/permission_manager'),
	Likes = require('../service/likes'),
	Topstory = require('../service/topstory'),
	gm = require('gm');

exports.list = function CollectionList(req, res, next) {
	Collection.find({}, function(err, collections) {
		if (err) return next(err);
		res.send({collections: collections});
	});
}

exports.getOne = function CollectionOne(req, res, next) {
	if (!req.account) return res.send(400);
	var collection, collection_id = req.param('collection_id');
	if (!collection_id) return res.send(400);
	async.waterfall([
		function(cb) {
			Collection.findById(collection_id, cb);
		},
		function(collection_res, cb) {
			collection = collection_res;
			if (!collection) return cb(new Error('collection does not exist'));
			var comments = [];
			collection.files.forEach(function(file) {
				if (file) {
					file.comments.forEach(function(comment) { comments.push(comment); });
				}
			});
			Comment.find({ _id: { $in: comments }}, cb);
		},
		function(comments, cb) {
			res.send(200, {collection: collection, comments: comments});
		}
	], function(err) {
		if (err.message === 'collection does not exist') {
			return res.send(404);
		}
		if (err.name === 'CastError') {
			return res.send(404);
		}
		if (err) return next(err);
	});
};

exports.create = function CollectionCreate(req, res, next) {
	if (!req.current_user) return res.send(401);
	if (!req.body.collection) return res.send(400);
	if (!req.account) return res.send(400);
	delete req.body.collection.id;  // do net set own id
	delete req.body.collection._id;
	req.body.collection.account_id = req.account._id;
	Collection.create(req.body.collection, function(err, collection) {
		if (err) return next(err);
		res.send(200, collection);
	});
}

exports.update = function CollectionUpdate(req, res, next) {
	var collection_id = req.param('collection_id');
	if (!req.body.collection) return res.send(400);
	if (!collection_id) return res.send(400);
	['_id', 'id', 'files', 'likes', 'account_id'].forEach(function(key) {
		delete req.body.collection[key];
	});
	Collection.findByIdAndUpdate(collection_id, { $set: req.body.collection }, function(err, collection) {
		if (err) return next(err);
		Collection.findById(collection._id, function(_err, _collection) {
			if (_err) return next(_err);
			res.send(200, {collection: _collection});
		});
        collection.index();
	});
};

exports.remove = function CollectionAddFile(req, res, next) {
	if (!req.param('collection_id')) return res.send(400, { error: 'collection_id is required.' });
	if (!req.current_user) return res.send(403, { error: 'You do not have the rights to edit the collection.' });
	if (!PermissionManager.user(req.current_user).account(req.account).isAdmin()) {
		return res.send(403, { error: 'You do not have the rights to edit the collection.' });
	}
	Collection.findOne({ _id: req.param('collection_id') }, function(_err, _collection) {
		if (_err) return next(_err);
		if (!_collection) return res.send(404, { error: 'Collection does not exist.' });
		Collection.findByIdAndRemove(req.param('collection_id'), function(__err) {
			if (__err) return next(__err);
			res.send(200);
            _collection.index();
		});
	});
};

exports.updatePreviewImage = function CollectionUpdatePreviewImage(req, res, next) {
	if (!req.param('collection_id')) {
		return next({ status: 400, shortCode: 'missingArgument', meta: 'collection'});
	}

	var mp3FileEmitter = File.fromRequest(req);
	mp3FileEmitter.once('finished', function(error, file) {
		if (error) {
			return res.send(400, error);
		}

		Collection.findByIdAndUpdate(req.param('collection_id'), {
			'config.preview': {
				file_id: file.id,
				versions: file.versions
			}
		}, function (err, collection) {
			if (err) return next(err);
			Collection.findById(collection._id, function(_err, _collection) {
				if (_err) return next(_err);
				res.send(200, { collection: _collection });
			});
		});
	});
};

exports.updateBannerImage = function PageUpdateBannerImage(req, res, next) {
	if (!req.param('collection_id')) {
		return next({ status: 400, shortCode: 'missingArgument', meta: 'collection'});
	}

	var mp3FileEmitter = File.fromRequest(req);
	mp3FileEmitter.once('finished', function(error, file) {
		if (error) {
			return res.send(400, error);
		}

		Collection.findByIdAndUpdate(req.param('collection_id'), {
			'config.banner': {
				file_id: file.id,
				versions: file.versions
			}
		}, function (err, collection) {
			if (err) return next(err);
			Collection.findById(collection._id, function(_err, _collection) {
				if (_err) return next(_err);
				res.send(200, { collection: _collection });
			});
		});
	});
};

exports.setCollectionStatus = function CollectionStatusUpdate(req, res, next) {
	var status = req.body.status;
	if (!status) return res.send(400);
	if (!req.param('collection_id')) return res.send(400);
	if (!req.current_user) return res.send(401);
	var pm = PermissionManager.user(req.current_user).account(req.account);
	Collection.findById(req.param('collection_id'), function(_err, _collection) {
		if (_err) return next(_err);
		if (!_collection) return res.send(404);
		if (['READY', 'CONTROLLED', 'PUBLISHED'].indexOf(status) < 0) {
			// status is not allowed
			return res.send(400);
		}
		if (status === 'READY') {
			// To-Do: check if user is elligible

		} else if (status === 'CONTROLLED') {
			// check if user is elligible
			if (!pm.canSetControlled(_collection)) return res.send(403);
		} else if (status === 'PUBLISHED') {
			// check if user is elligible
			if (!pm.canSetPublished(_collection)) return res.send(403);
		}
		Collection.findByIdAndUpdate(req.param('collection_id'), { $set: { status: status } }, function (err, collection) {
			if (err) return next(err);
			Collection.findById(req.param('collection_id'), function(_err, _collection) {
				if (_err) return next(_err);
				res.send(200, { collection: _collection });
				if (status === 'READY') {
					var _notificationAdminQuery = { $or: [{}, {}, {}] };
					_notificationAdminQuery.$or[0]['permissions.' + _collection.account_id + '.admin'] = true;
					_notificationAdminQuery.$or[1]['permissions.' + _collection.account_id + '.' + _collection.category_id + '.canSetControlled'] = true;
					_notificationAdminQuery.$or[2]['permissions.' + _collection.category_id + '.' + _collection.category_id + '.canSetPublished'] = true;
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
								item: _collection,
								link: req.account.getCompleteUrl() + '/collection/' + _collection.id,
								user: user,
								author: req.current_user
							}).send();
						});
					});
				}
			});
		});
	});
};

exports.addFile = function CollectionAddFile(req, res, next) {
	if (!req.param('collection_id')) return res.send(400);

	File.fromRequest(req).once('finished', function(error, file) {
		if (error) {
			return next(error);
		}

		var new_file = {
			file_type: 'image',
			comments: [],
			file: {
				file_id: file.id,
				versions: file.versions,
				meta: file.meta,
				original_filename: file.original_filename
			}
		}
		Collection.findByIdAndUpdate(req.param('collection_id'), { $push: { files: new_file } }, function(err, collection) {
			if (err) return next(err);
			if (!collection) return res.send(404);
			res.send({ collection: collection, file: new_file });
            collection.index();
		});
	});
}

exports.updateFile = function CollectionUpdateFile(req, res, next) {
    var file = req.param('file');
    if (typeof file === 'string') {
        try {
            file = JSON.parse(file);
        } catch (err) {
            return next(err);
        }
    }
    var file_id = req.param('file_id');
    if (!req.param('collection_id')) return res.send(400, { error: 'collection_id is required.' });
    if (!file) return res.send(400, { error: 'file is required.' });
    if (!file_id) return res.send(400, { error: 'file_id is required.' });
    if (!req.current_user) return res.send(403, { error: 'You do not have the rights to edit a collection.' });
    if (!PermissionManager.user(req.current_user).account(req.account).isAdmin()) {
    	return res.send(403, { error: 'You do not have the rights to edit a collection.' });
    }
    Collection.findOne({ _id: req.param('collection_id'), 'files._id': file_id }, function(_err, _collection) {
        if (_err) return next(_err);
        if (!_collection) return res.send(404, { error: 'Collection does not exist.' });
        var update_query = { $set: {} };
        Object.keys(file).forEach(function(_key) {
            update_query.$set['files.$.' + _key] = file[_key];
        });
        Collection.update(
            { _id: req.param('collection_id'), 'files._id': file_id },
            update_query,
            function(__err) {
                if (_err) return next(_err);
                Collection.findById(req.param('collection_id'), function(__err, __collection) {
                    res.send(200);
                    __collection.index();
                });
            }
        );
    });
}

exports.removeFile = function CollectionAddFile(req, res, next) {
	if (!req.param('collection_id')) return res.send(400, { error: 'collection_id is required.' });
	if (!req.param('file_id')) return res.send(400, { error: 'file_id is required.' });
	if (!req.current_user) return res.send(403, { error: 'You do not have the rights to edit the collection.' });
	if (!PermissionManager.user(req.current_user).account(req.account).isAdmin()) {
		return res.send(403, { error: 'You do not have the rights to edit the collection.' });
	}
	Collection.findOne({ _id: req.param('collection_id'), 'files._id': req.param('file_id') }, function(_err, _collection) {
		if (_err) return next(_err);
		if (!_collection) return res.send(404, { error: 'Collection does not exist.' });
		Collection.findByIdAndUpdate(req.param('collection_id'), { $pull: { files: { _id: req.param('file_id') } } }, function(__err) {
			if (__err) return next(__err);
			res.send(200);
            _collection.index();
		});
	})
};

exports.addCommentToFile = function CollectionFileCommentCreate(req, res, next) {
	if (!req.account) return res.send(400);
	if (!req.body.comment) return res.send(400);
	if (!req.body.comment.content) return res.send(400);
	if (!req.param('collection_id')) return res.send(400);
	if (!req.param('file_id')) return res.send(400);
	delete req.body.comment.id;  // do not set own id
	delete req.body.comment._id;
	var comment = req.body.comment;
	comment.item_id = req.param('collection_id');
	comment.file_id = req.param('file_id');
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
	Comment.create(req.body.comment, function(err, comment) {
		if (err) return next(err);
		Collection.findOneAndUpdate(
			{ '_id': req.param('collection_id'), 'files._id': req.param('file_id') },
			{ $push: { 'files.$.comments': comment.id } },
			function(err, collection) {
				if (err) return next(err);
				if (!collection) {
					res.send(404);
					return comment.remove();
				}
				Activity.fromComment(comment, function(err, activity) {
					res.send(200, { collection: collection, comment: comment, activity: activity });
                    collection.index();
				});
			});
	});
}

exports.addLike = Likes.addLikeFunction(Collection);
exports.makeTopstory = Topstory.makeTopstoryFunction(Collection);

exports.addLikeToFile = function CollectionFileAddLike(req, res, next) {
	var collectionId = req.param('collection_id');
	var fileId = req.param('file_id');
	if (!collectionId) return res.send(400);
	if (!fileId) return res.send(400);
	var userid;
	if (req.current_user) {
		userid = req.current_user._id.toHexString();
	} else {
		userid = 'custom:' + req.connection.remoteAddress;
	}
	Collection.findById(collectionId, function(err, collection) {
		if (err) return next(err);
		if (!collection) return res.send(404);

		// run through collection files array and return file with id fid
		var getFileFromCollection = function(col, fid) {
			return col.files.filter(function(f) { return f._id.toString() === fid.toString() });
		}

		async.waterfall([
			function(cb) {
				var updatedHash,
					file = getFileFromCollection(collection, fileId);
				if (file.length < 1) return res.send(404);
				file = file[0];
				if (file.likes.indexOf(userid) > -1) {
					updatedHash = { $pull: { 'files.$.likes': userid } }
				} else {
					updatedHash = { $push: { 'files.$.likes': userid } }
				}
				Collection.findOneAndUpdate({
					'_id': collectionId,
					'files._id': fileId
				}, updatedHash, cb);
			},
			function(collection) {
				var cb = arguments[arguments.length - 1];
				Collection.findById(collectionId, cb);
			}
			], function(err, collection) {
				if (err) return next(err);
				var file;
				try {
					file = getFileFromCollection(collection, fileId)[0];
				} catch(e) {
					file = null;
				}
				res.send(200, { collection: collection, collectionfile: file });
			});
	});
}
