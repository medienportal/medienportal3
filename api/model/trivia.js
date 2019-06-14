var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

var TriviaSchema = Schema({
	account_id: {
		type: Schema.Types.ObjectId,
		required: true
	},
	content: String,
	created_at: {
		type: Date,
		default: new Date
	}
});

var Trivia = mongoose.model('Trivia', TriviaSchema);

module.exports = Trivia;