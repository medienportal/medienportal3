var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

var GreetingSchema = Schema({
	content: {
		type: String,
		required: true
	},
	author: {
		author_type: String,
		author_id: String
	},
	account_id: {
		type: Schema.Types.ObjectId,
		required: true
	},
	created_at: {
		type: Date,
		default: new Date
	}
});

module.exports = mongoose.model('Greeting', GreetingSchema);;