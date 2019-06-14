var config = require('../config'),
	mongoose = require('mongoose'),
	Schema = mongoose.Schema;

var AccountSchema = Schema({
	"name": String,
	"title": {
		"type": String,
		"unique": true
	},
	"urls": [],
	"config": {
		"public": Schema.Types.Mixed,
		"private": Schema.Types.Mixed
	},
	active_plan: Schema.Types.Mixed
});

AccountSchema.path('title').validate(function (title) {
	if (!title || !(title.length > 0)) return false;
	return (!title.match(/\W/g));
}, 'Title must not have special characters.');

AccountSchema.methods.setAttributeForMonth = function(year, month, key, value) {
	if (!this.config.private._time) this.config.private._time = {};
	if (!this.config.private._time.year) this.config.private._time.year = {};
	if (!this.config.private._time.month) this.config.private._time.month = {};
	this.config.private._time.month[key] = value;
};

AccountSchema.methods.getAttributeForMonth = function(year, month, key) {
	return this.config.private._time && this.config.private.time.year && this.config.private._time.year.month && this.config.private._time.year.month[key];
};

// shortcut for user.hasRight, but in reversed params order.
// , for example `current_user.can('edit', 'chamäleon') => true/false`
AccountSchema.methods.addMediaSeconds = function(seconds, callback) {
	if (!callback) callback = function() {};

	var year = new Date().getFullYear();
	var month = new Date().getMonth();

	var key = 'config.private._time.' + year + '.' + month + '.media_conversion_time';

	var query = { $inc: {} };
	query['$inc'][key] = seconds;

	this.update(query, callback);
};

AccountSchema.methods.getCompleteUrl = function() {
	if (this.urls.length < 1) {
		return 'https://' + this.title + '.' + config.app_url;
	}
	return this.urls[0];
};

module.exports = mongoose.model('Account', AccountSchema);;
