var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

var CategorySchema = Schema({
	title: String,
	created_at: {
		type: Date,
		"default": Date.now
	},
	config: Schema.Types.Mixed,
	navigation: [{
		title: String,
		position: Number
	}],
	position: Number,
	modules: [
		{
			module_id: Schema.Types.ObjectId,
			position_on_page: Number
		}
	],
	parent_category_id: {
		'type': Schema.Types.ObjectId,
		'default': null
	},
	account_id: {
		type: Schema.Types.ObjectId,
		required: true
	}
});

module.exports = mongoose.model('Category', CategorySchema);
