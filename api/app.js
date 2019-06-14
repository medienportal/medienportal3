// Module dependencies
var express = require('express'),
	morgan = require('morgan'),
	compression = require('compression'),
	bodyParser = require('body-parser'),
	cookieParser = require('cookie-parser'),
	methodOverride = require('method-override'),
	errorhandler = require('errorhandler'),
	path = require('path'),
	config = require('./config'),
	mongoose = require('mongoose'),
	authentication = require('./controller/authentication');
// rollbar = new require('rollbar');

console.log(config);

if (process.env.NODE_ENV && (process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'test')) {
	// rollbar.handleUncaughtExceptions(config.rollbar.key, { exitOnUncaughtException: true });
}

// instantiate express app
var app = express();

global.uploadDir = path.resolve(path.dirname(require.main.filename), 'upload');

app.set('port', process.env.PORT || config.port || 9000); // standard port is 9000

app.use(morgan('dev'));
app.use(compression());
// Add some standard headers that belong to every request
// See service/allow_cross_domain.js for more information
app.use(require('./service/allow_cross_domain'));
app.use(bodyParser.urlencoded({ extended: false, limit: '2gb' }));
app.use(cookieParser());
app.use(bodyParser.json({ limit: '500mb' }));
app.use(methodOverride());
// checks if a current user is available.
app.use(authentication.current_user_middleware);
// checks if a current account is available
app.use(authentication.current_account_middleware);
// sets local cache
app.use(authentication.current_cache_middleware);

// load all the routes. See /routes.js for more information
var routes = require('./routes');
app.use(routes.global());
app.use('/api', routes.api());

app.use(require('./service/error_handling'));

if ('development' == app.get('env')) {
	app.use(errorhandler());
}

if (app.get('env') !== 'development' && app.get('env') !== 'test') {
	// app.use(rollbar.errorHandler(config.rollbar.key));
}

mongoose.set('debug', app.get('env') == 'development')

// MongoDB connection
mongoose.connect(config.mongo.db);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback() {
	console.log('connected to db successfully');
	// start app server
	app.listen(app.get('port'), function () {
		console.log('Express server listening on port ' + app.get('port'));
	});
});
