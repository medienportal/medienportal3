var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

var MessageSchema = Schema({
  from_user_id: Schema.Types.ObjectId,
  to_user_id: Schema.Types.ObjectId,
  content: String,
  read: Date,
  created_at: {
  	type: Date,
  	default: new Date
  }
});

module.exports = mongoose.model('Message', MessageSchema);;