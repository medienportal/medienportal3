var mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	Activity = require('./activity');

var PageCommentSchema = Schema({
	content: {
		type: String,
		required: true
	},
	account_id: {
		type: Schema.Types.ObjectId,
		required: true
	},
	author: {
		author_type: String,
		author_id: String
	},
	item_id: Schema.Types.ObjectId,
	file_id: Schema.Types.ObjectId,
	created_at: {
		type: Date,
		default: new Date
	},
	user_agent: String,
	reported: {
		type: Boolean,
		default: false
	},
	secured: {
		type: Boolean,
		default: false
	},
});

PageCommentSchema.index({ account_id: 1, item_id: 1, file_id: 1 });
PageCommentSchema.index({ account_id: 1, reported: 1 });

PageCommentSchema.methods.removeCorrespondingActivities = function(callback) {
	if (!callback) {
		callback = function() {};
	}
    Activity.remove({
		"type": "comment",
		"targets.comment_id": this.id
	}, callback);
};

module.exports = mongoose.model('PageComment', PageCommentSchema);;
