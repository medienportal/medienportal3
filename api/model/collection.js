var config = require('../config'),
    mongoose = require('mongoose'),
    async = require('async'),
    es = require('elasticsearch').Client(JSON.parse(JSON.stringify(config.elasticsearch))),
    filesizes = require('../config/filesizes'),
    Schema = mongoose.Schema,
    User = require('./user'),
    Comment = require('./comment');

var existsFilter = function(o) { return o; }

var CollectionSchema = Schema({
	title: String,
	created_at: {
		type: Date,
		"default": Date.now
	},
	updated_at: {
		type: Date,
		"default": Date.now
	},
	released_at: Date,
    status: String,
	date: Date,
	author: [{
		author_type: String,
		author_id: String
	}],
	category_id: {
		type: String,
		required: true
	},
    subcategory_id: {
        type: Schema.Types.ObjectId
    },
	tags: String,
	topic: String,
	likes: {
		"type": [String],
		"default": []
	},
	files: [
		{
			comments: [Schema.Types.ObjectId],
            title: String,
            description: String,
			likes: [String],
            file: {
                file_id: Schema.Types.ObjectId,
                versions: Schema.Types.Mixed,
                meta: Schema.Types.Mixed,
                original_filename: String
            }
		}
	],
	config: Schema.Types.Mixed,
	account_id: {
		type: Schema.Types.ObjectId,
		required: true
	}
});

CollectionSchema.pre('save', function(next) {
	if (!this.created_at) this.created_at = new Date();
	this.updated_at = new Date();
	next();
});

CollectionSchema.post('save', function(collection) {
    collection.index();
});

CollectionSchema.methods.index = function(callback) {
    var collection = this;
    async.series({
        files: function(_callback){
            async.map(collection.files.filter(existsFilter), function(file, cb) {
                async.map(file.comments.filter(existsFilter), function(comment_id, _cb) {
                    Comment.findById(comment_id, function(_err, _comment) {
                        if (_err) return _cb(_err);
                        User.stringRepresentation(_comment.author, function(__err, _name) {
                            _comment.author = _name;
                            _cb(null, {
                                content: _comment.content,
                                author: _name,
                                created_at: _comment.created_at,
                                user_agent: _comment.user_agent,
                                reported: _comment.reported,
                                secured: _comment.secured
                            });
                        });
                    });
                }, function(err, results) {
                    cb(err, {
                        file_type: file.file_type,
                        comments: results,
                        title: file.title,
                        description: file.description
                    });
                });
            }, _callback);
        },
        authors: function(_callback) {
            async.map(collection.author, function(author, cb) {
                User.stringRepresentation(author, cb);
            }, _callback);
        },
    },
    function(err, results) {
        if (err) return callback(err);

        var likesCount = 0;
        if (collection.files.length === 1 && collection.files[0].likes) {
            likesCount = collection.files[0].likes.length;
        } else if (collection.files.length > 1) {
            likesCount = collection.files.map(function(file) {
                if (file.likes && file.likes.length) {
                    return file.likes.length;
                }
                return 0;
            }).reduce(function(a, b) {
                return (a || 0) + (b || 0);
            });
        }

        var objectToIndex = {
            title: collection.title,
            created_at: collection.created_at,
            updated_at: collection.updated_at,
            released_at: collection.released_at,
            date: collection.date,
            author: results.authors,
            category_id: collection.category_id,
            category_sub: collection.category_sub,
            tags: collection.tags,
            topic: collection.topic,
            thumbnails: {},
            files: results.files,
            account_id: collection.account_id,
            likesCount: likesCount
        };
        var previewConfig = collection.config && collection.config.preview;
        Object.keys(filesizes.image).forEach(function(size) {
            var url;
            if (previewConfig && previewConfig.file_id) {
				url = previewConfig.versions &&
				    previewConfig.versions[size] &&
				    previewConfig.versions[size].absoluteUrl;
			} else if (previewConfig) {
				url = previewConfig[size];
			}
            if (url) {
                objectToIndex.thumbnails[size] = url;
            }
        });
        es.index({
            index: 'items',
            type: 'collection',
            id: collection._id.toString(),
            body: objectToIndex
        }, callback);
    });

}

var Collection = mongoose.model('Collection', CollectionSchema);

Collection.Search = {
    recreateIndex: function(callback) {
        async.series([
            function(cb) {
                es.indices.exists({index: 'items'}, function(_err, exists) {
                    if (_err) { throw _err;  }
                    if (!exists) {
                        console.log('create index ...');
                        es.indices.create({index: 'items'}, cb);
                    } else {
                        es.indices.existsType({index: 'items', type: 'collection'}, function(_err, _exists) {
                            if (_err) throw _err;
                            if (_exists) {
                                es.indices.deleteMapping({index: 'items', type: 'collection'}, cb);
                            } else {
                                setTimeout(cb);
                            }
                        });
                    }
                });
            },
            function(cb) {
                es.indices.putMapping({
                    index: 'items',
                    type: 'collection',
                    body: {
                        properties: {
                            title: {
                                type: "string",
                                analyzer: "german"
                            },
                            created_at: {
                                type: "date"
                            },
                            updated_at: {
                                type: "date"
                            },
                            released_at: {
                                type: "date"
                            },
                            date: {
                                type: "date"
                            },
                            author: {
                                type: "string",
                                analyzer: "simple"
                            },
                            category_id: {
                                type: "string",
                                index: "not_analyzed"
                            },
                            category_sub: {
                                type: "string",
                                index: "not_analyzed"
                            },
                            tags: {
                                type: "string",
                                index: "not_analyzed"
                            },
                            topic: {
                                type: "string",
                                index: "not_analyzed"
                            },
                            thumbnails: {
                                properties: {
                                    "small": {
                                        type: "string",
                                        index: "no"
                                    },
                                    "small@2x": {
                                        type: "string",
                                        index: "no"
                                    },
                                    "middle_mobile": {
                                        type: "string",
                                        index: "no"
                                    },
                                    "middle_mobile@2x": {
                                        type: "string",
                                        index: "no"
                                    },
                                    "middle": {
                                        type: "string",
                                        index: "no"
                                    },
                                    "middle@2x": {
                                        type: "string",
                                        index: "no"
                                    },
                                    "banner": {
                                        type: "string",
                                        index: "no"
                                    },
                                    "banner@2x": {
                                        type: "string",
                                        index: "no"
                                    }
                                }
                            },
                            files: {
                                properties: {
                                    file_type: {
                                        type: "string",
                                        index: "not_analyzed"
                                    },
                                    comments: {
                                        properties: {
                                            content: {
                                                type: "string",
                                                analyzer: "german"
                                            },
                                            author: {
                                                type: "string",
                                                index: "not_analyzed"
                                            },
                                            created_at: {
                                                type: "date"
                                            },
                                            user_agent: {
                                                type: "string",
                                                index: "not_analyzed"
                                            },
                                            reported: {
                                                type: "boolean",
                                            },
                                            secured: {
                                                type: "boolean"
                                            }
                                        }
                                    },
                                    title: {
                                        type: "string",
                                        analyzer: "german"
                                    },
                                    description: {
                                        type: "string",
                                        analyzer: "german"
                                    }
                                }
                            },
                            account_id: {
                                type: "string",
                                index: "not_analyzed"
                            },
                            likesCount: {
                                type: "long"
                            }
                        }
                    }
                }, cb);
            }
        ], callback);
    },
    reindexAll: function(callback) {
        Collection.find({}, function(_err, _collections) {
            console.log('indexing ', _collections.length, ' collections ...');
            if (_err) return callback(_err);
            async.eachSeries(_collections, function(collection, cb) {
                console.log('indexing ', collection.title, '.');
                collection.index(cb);
            }, callback);
        });
    }
}

module.exports = Collection;
