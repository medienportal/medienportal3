var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

var PageModuleSchema = Schema({
  title: String,
  content: String,
  files: [Schema.Types.Mixed],
  type: String,
  state: String
});

module.exports = mongoose.model('PageModule', PageModuleSchema);;