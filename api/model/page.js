var config = require('../config'),
    mongoose = require('mongoose'),
    async = require('async'),
    es = require('elasticsearch').Client(JSON.parse(JSON.stringify(config.elasticsearch))),
    filesizes = require('../config/filesizes'),
	Schema = mongoose.Schema,
    Comment = require('./comment'),
    Module = require('./module'),
    User = require('./user');

var existsFilter = function(o) { return o; }

var PageSchema = Schema({
	title: String,
	created_at: {
		type: Date,
		"default": Date.now
	},
	updated_at: {
		type: Date,
		"default": Date.now
	},
	released_at: {
		type: Date,
		"default": Date.now
	},
	status: String,
	type: String,
	author: [
		{
			author_type: String,
			author_id: String
		}
	],
	category_id: {
		type: String,
		required: true
	},
    subcategory_id: {
        type: Schema.Types.ObjectId
    },
	tags: [String],
	topic: String,
	page_type: String,
	likes: [String],
	modules: [
		{
			module_id: Schema.Types.ObjectId,
			position_on_page: Number
		}
	],
	comments: [Schema.Types.ObjectId],
	config: Schema.Types.Mixed,
	account_id: {
		type: Schema.Types.ObjectId,
		required: true
	},
	__viewsCount: {
		type: Number,
		default: 0
	}
});

PageSchema.index({ account_id: 1 });
PageSchema.index({ account_id: 1, tags: 1, status: 1 });
PageSchema.index({ account_id: 1, topic: 1, status: 1 });
PageSchema.index({ account_id: 1, category_id: 1, status: 1 });

PageSchema.pre('save', function (next) {
	if (!this.created_at) this.created_at = new Date();
	this.updated_at = new Date();
	next();
    this.index();
});

PageSchema.methods.isPublished = function() {
    return this.status === 'PUBLISHED';
};

PageSchema.methods.isControlled = function() {
    return this.status === 'CONTROLLED';
};

PageSchema.methods.isReady = function() {
    return this.status === 'READY';
};

PageSchema.methods.index = function(callback) {
    var page = this;
    async.series({
        comments: function(_callback){
            async.map(page.comments, function(comment_id, cb) {
                Comment.findById(comment_id, function(_err, _comment) {
                    if (_err) return cb(_err);
                    User.stringRepresentation(_comment.author, function(__err, _name) {
                        _comment.author = _name;
                        cb(null, {
                            content: _comment.content,
                            author: _name,
                            created_at: _comment.created_at,
                            user_agent: _comment.user_agent,
                            reported: _comment.reported,
                            secured: _comment.secured
                        });
                    });
                });
            }, _callback);
        },
        modules: function(_callback){
            var module_ids = page.modules.map(function(modobj) { return modobj.module_id; });
            async.map(module_ids, function(id, cb) {
                Module.findById(id, function(err, module) {
                    if (err) return cb(err);
                    if (!module) return cb(null, null);
                    var mod = module.toObject();
                    mod.files = [];
                    cb(err, mod);
                });
            }, _callback);
        },
        authors: function(_callback) {
            async.map(page.author, function(author, cb) {
                User.stringRepresentation(author, cb);
            }, _callback);
        },
    },
    function(err, results) {
        if (err) return callback(err);
        var objectToIndex = {
            title: page.title,
            excerp: page.config && page.config.excerp,
            created_at: page.created_at,
            updated_at: page.updated_at,
            released_at: page.released_at,
            status: page.status,
            type: page.type,
            author: results.authors,
            category_id: page.category_id,
            category_sub: page.category_sub,
            tags: page.tags,
            topic: page.topic,
            page_type: page.page_type,
            thumbnails: {},
            modules: results.modules.filter(existsFilter).map(function(module) {
                return {
                    title: module.title,
                    content: module.content,
                    type: module.type,
                    state: module.state
                }
            }),
            comments: results.comments,
            account_id: page.account_id,
            viewsCount: page.__viewsCount,
            likesCount: page.likes.length
        };
        var previewConfig = page.config && page.config.preview;
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
            type: 'page',
            id: page._id.toString(),
            body: objectToIndex
        }, callback);
    });

}

var Page = mongoose.model('Page', PageSchema);

Page.Search = {
    recreateIndex: function(callback) {
        async.series([
            function(cb) {
                es.indices.exists({index: 'items'}, function(_err, exists) {
                    if (_err) { throw _err;  }
                    if (exists) {
                        es.indices.delete({index: 'items'}, cb);
                    } else {
                        cb();
                    }
                });
            },
            function(cb) {
                es.indices.create({index: 'items'}, cb);
            },
            function(cb) {
                es.indices.putMapping({
                    index: 'items',
                    type: 'page',
                    body: {
                        properties: {
                            title: {
                                type: "string",
                                analyzer: "german"
                            },
                            excerp: {
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
                            status: {
                                type: "string",
                                index: "not_analyzed"
                            },
                            type: {
                                type: "string",
                                index: "not_analyzed"
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
                            page_type: {
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
                            modules: {
                                properties: {
                                    title: {
                                        type: "string",
                                        analyzer: "german"
                                    },
                                    content: {
                                        type: "string",
                                        analyzer: "german"
                                    },
                                    type: {
                                        type: "string",
                                        index: "not_analyzed"
                                    },
                                    state: {
                                        type: "string",
                                        index: "not_analyzed"
                                    }
                                }
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
                            likescount: {
                                type: "long"
                            },
                            account_id: {
                                type: "string",
                                index: "not_analyzed"
                            },
                            viewsCount: {
                                type: "long"
                            }
                        }
                    }
                }, cb);
            }
        ], callback);
    },
    reindexAll: function(callback) {
        Page.find({}, function(_err, _pages) {
            if (_err) return callback(_err);
            async.eachSeries(_pages, function(page, cb) {
                console.log('indexing ', page.title, '.');
                page.index(cb);
            }, callback);
        });
    }
};

module.exports = Page;
