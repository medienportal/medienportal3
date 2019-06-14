var mongoose = require('mongoose'),
    Realtime = require('../service/realtime'),
	Schema = mongoose.Schema;

var ActivitySchema = Schema({
	account_id: {
		type: Schema.Types.ObjectId,
		required: true
	},
	trigger: {
		author_type: String,
		author_id: String
	},
	type: String,
	content: String,
	targets: [{
		item_id: Schema.Types.ObjectId,
		file_id: Schema.Types.ObjectId,
		greeting_id: Schema.Types.ObjectId,
		comment_id: Schema.Types.ObjectId
	}],
	created_at: {
		type: Date,
		default: new Date
	}
});

ActivitySchema.methods.sendRealtime = function(callback) {
    Realtime.triggerEvent('activities', 'create', { activity: this }, callback);
}

var Activity = mongoose.model('Activity', ActivitySchema);

Activity.fromGreeting = function(greeting, callback) {
	if (!callback) { callback = function() {}; };
	if (!greeting.id) return callback(new Error('Greeting must have been saved to database.'));
	if (!greeting.author) return callback(new Error('Greeting is not valid.'));
	Activity.create({
		account_id: greeting.account_id,
		trigger: {
			author_type: greeting.author.author_type,
			author_id: greeting.author.author_id
		},
		type: 'greeting',
		content: greeting.content,
		targets: [{ greeting_id: greeting.id }]
	}, function(err, activity) {
        if (err) return callback(err);
        activity.sendRealtime();
        callback(null, activity);
    });
}

Activity.fromComment = function(comment, callback) {
	if (!callback) { callback = function() {}; };
	if (!comment.id) return callback(new Error('comment must have been saved to database.'));
	if (!comment.author) return callback(new Error('comment is not valid.'));
	Activity.create({
		account_id: comment.account_id,
		trigger: {
			author_type: comment.author.author_type,
			author_id: comment.author.author_id
		},
		type: 'comment',
		content: comment.content,
        created_at: comment.created_at,
		targets: [{
			comment_id: comment.id,
			item_id: comment.item_id,
			file_id: comment.file_id
		}]
	}, function(err, activity) {
        if (err) return callback(err);
        activity.sendRealtime();
        callback(null, activity);
    });
};

module.exports = Activity;
