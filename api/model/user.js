var config = require('../config'),
	mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	async = require('async'),
	es = require('elasticsearch').Client(JSON.parse(JSON.stringify(config.elasticsearch))),
	redis = require('redis'),
	crypto = require('crypto'),
	client = require('../service/redis_client');

var UserSchema = Schema({
	name: String,
	first_name: String,
	last_name: String,
	email: {
		type: String,
        unique: true,
		required: true,
	},
	verified: Boolean,
	gender: String,
	password: String,
	klass: String,
	description: String,
	avatar: Schema.Types.Mixed,
    settings: {
        notifications: {
            item_is_set_ready: Boolean
        }
    },
	services: [{
		service_name: String,
		identification: String
	}],
    permissions: {
        type: Schema.Types.Mixed,
        required: true,
        default: {}
    },
    administration: {
        type: String
    },
	created_at: {
		type: Date,
		"default": Date.now
	},
	account_id: {
		type: String,
		required: true
	}
});

UserSchema.path('email').validate(function (email) {
	var emailRegex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	return emailRegex.test(email); // Assuming email has a text attribute
}, 'Email cannot be empty.')

UserSchema.path('account_id').validate(function(account_id) {
	return ((account_id && account_id.length > 0) == true);
}, 'Account Id cannot be empty.');

UserSchema.methods.isAccountAdmin = function(account) {
    if (this.isUnsdreiStaff()) { return true; }
    if (this.administration === 'admin') {
        if (this.account_id === account.id.toString()) {
            return true;
        }
    }
    return false;
}

UserSchema.methods.isUnsdreiStaff = function() {
    return this.administration === 'unsdrei';
}

UserSchema.methods.isAuthorOf = function(item) {
	var user = this;
	if (!item.author) return false;
	var authors = item.author.filter(function(author) {
		if (author.author_type == 'panda' && author.author_id == user.id) return true;
	});
	return authors.length > 0;
}

UserSchema.methods.setPassword = function(password, cb) {
	var user = this;
	if (!user.id) return cb(new Error('User must have been created'));
	if (!user.email) return cb(new Error('User has no email'));
	var salt_key = '__usersalt__' + user.email;
	var salt_val = crypto.randomBytes(96).toString('base64');
	async.waterfall([
		function(callback) {
			client.set(salt_key, salt_val, callback);
		},
		function(status, callback) {
			if (status !== 'OK') return callback(new Error('redis returns ' + status));
			crypto.pbkdf2(password, salt_val, 10000, 512, callback);
		}, function(derivedKey, callback) {
			var pass = derivedKey.toString('base64');
			user.password = pass;
			user.update({ password: pass }, callback);
		}
	], function(err) {
		cb(err, user);
	});
};

UserSchema.methods.index = function(callback) {
    var user = this;
    var objectToIndex = {
        name: user.name,
        first_name: user.first_name,
        last_name: user.last_name,
        description: user.description,
        klass: user.klass,
        gender: user.gender,
        account_id: user.account_id,
        services: (user.services || []),
        permissions: user.permissions,
        avatar: {}
    };
    ["small", "small@2x", "middle", "middle@2x", "big", "big@2x"].forEach(function(size) {
        objectToIndex.avatar[size] = user.avatar && user.avatar[size];
    });
    es.index({
        index: 'users',
        type: 'user',
        id: user._id.toString(),
        body: objectToIndex
    }, callback);
}

var User = mongoose.model('User', UserSchema);

User.authenticate = function(email, password, callback) {
	async.waterfall([
		function(cb) {
			client.get('__usersalt__' + email, cb);
		},
		function(salt, cb) {
			if (!salt) return cb(new Error('user password not known'));
			salt = salt.toString('base64');
			crypto.pbkdf2(password, salt, 10000, 512, cb);
		},
		function(derivedKey, cb) {
			User.findOne({ email: email, password: derivedKey.toString('base64') }, cb);
		}
	], function(err, _user) {
		if (err && err.message == 'user password not known') return callback(err);
		callback(err, _user);
	});
}

User.stringRepresentation = function(userObject, callback) {
    if (userObject.author_type === 'panda') {
        User.findById(userObject.author_id, function(err, user) {
            if (user) return callback(err, user.first_name + ' ' + user.last_name);
            callback(err, '???');
        });
    } else {
        setTimeout(function() { callback(null, (userObject.author_id || 'Gast')); });
    }
}

User.Search = {
    recreateIndex: function(callback) {
        async.series([
            function(cb) {
                es.indices.exists({index: 'users'}, function(_err, exists) {
                    if (_err) { throw _err;  }
                    if (exists) {
                        es.indices.delete({index: 'users'}, cb);
                    } else {
                        cb();
                    }
                });
            },
            function(cb) {
                es.indices.create({index: 'users'}, cb);
            },
            function(cb) {
                es.indices.putMapping({
                    index: 'users',
                    type: 'user',
                    body: {
                        properties: {
                            name: {
                                type: "string",
                                analyzer: "simple"
                            },
                            first_name: {
                                type: "string",
                                analyzer: "simple"
                            },
                            last_name: {
                                type: "string",
                                analyzer: "simple"
                            },
                            description: {
                                type: "string",
                                analyzer: "german"
                            },
                            klass: {
                                type: "string",
                                analyzer: "german"
                            },
                            gender: {
                                type: "string",
                                index: "not_analyzed"
                            },
                            account_id: {
                            	type: "string",
                            	index: "not_analyzed"
                            },
                            permissions: {
                                type: 'nested',
                                index: 'no'
                            },
                            avatar: {
                                properties: {
                                    "small": {
                                        type: "string",
                                        index: "no"
                                    },
                                    "small@2x": {
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
                                    "big": {
                                        type: "string",
                                        index: "no"
                                    },
                                    "big@2x": {
                                        type: "string",
                                        index: "no"
                                    }
                                }
                            },
                            services: {
                            	properties: {
                            		service_name: {
                            			type: 'string',
                            			index: 'no'
                            		},
                            		identification: {
                            			type: 'string',
                            			index: 'no'
                            		}
                            	}
                            }
                        }
                    }
                }, cb);
            }
        ], callback);
    },
    reindexAll: function(callback) {
        User.find({}, function(_err, _users) {
            if (_err) return callback(_err);
            async.eachSeries(_users, function(user, cb) {
                console.log('indexing ', user.first_name + ' ' + user.last_name, '.');
                user.index(cb);
            }, callback);
        });
    }
}


module.exports = User;
