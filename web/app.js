'use strict';

/*
 * Express Dependencies
 */
var express = require('express'),
	serveStatic = require('serve-static'),
	reqest = require('request'),
	https = require('https'),
	fs = require('fs'),
	app = module.exports.app = exports.app = express(),
	port = process.env.PORT || 3000;

var request = require('request');

/*
 * Use Handlebars for templating
 */
var ejs = require('ejs'),
	engine = require('ejs-locals');

var staticDirs = function (app, env) {
	var dirs = {
		development: {
			'/app/index.css': '/.tmp/serve/app/index.css',
			'/app/vendor.css': '/.tmp/serve/app/vendor.css',
			'/app/index.js': '/.tmp/serve/app/index.js',
			'/app': '/src/app',
			'/assets': '/src/assets',
			'/images': '/src/assets/images',
			'/bower_components': '/bower_components',
			'favicon.ico': '/src/app/favicon.ico'
		},
		production: {
			'/assets': '/dist/assets',
			'/images': '/dist/assets/images',
			'/fonts': '/dist/assets/fonts',
			'/lib': '/dist/lib',
			'/scripts': '/dist/scripts',
			'/styles': '/dist/styles',
			'/templates': '/dist/templates',
			'favicon.ico': '/dist/favicon.ico'
		}
	};
	dirs['staging'] = dirs.production;
	if (!env || !dirs[env]) { env = 'development'; }
	console.log(dirs);
	console.log(env);
	Object.keys(dirs[env]).forEach(function (dir) {
		console.log('static dir: ', dir, ' ==> ', __dirname + dirs[env][dir]);
		app.use(dir, serveStatic(__dirname + dirs[env][dir], { redirect: false }))
	});
};
staticDirs(app, process.env.NODE_ENV);

// For gzip compression
//app.use(require('compression'));

/*
 * Config for Production and Development
 */

global.APP_CONFIG = require('./config');
console.log(global.APP_CONFIG);
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = global.APP_CONFIG.NODE_TLS_REJECT_UNAUTHORIZED ? '1' : '0';

app.engine('ejs', engine);

// if (app.get('env') !== 'development') {
app.use(require('morgan')(process.env.LOG_FORMAT || 'combined'));
// }

app.set('view engine', 'ejs');
if (['production', 'staging'].indexOf(process.env.NODE_ENV) > -1) {
	app.set('views', __dirname + '/dist');
} else {
	app.set('views', __dirname + '/.tmp/serve');
}

/*
 * Routes
 */

// API proxy
var request = require('request');
app.use('/api', function (req, res) {
	var url = global.APP_CONFIG.api_endpoint + '/api' + req.url;

	var toRequest = request.defaults({
		timeout: 25 * 60 * 1000
	});

	req.pipe(toRequest(url))
		.on('error', function (err) {
			console.log(err)
		})
		.pipe(res)
		.on('error', function (err) {
			console.log(err)
		});
});

app.use('/opensearch.xml', function (req, res) {
	var url = global.APP_CONFIG.api_endpoint;
	req.pipe(request(url)).pipe(res);
});

// Index Page
app.get('/*', function (req, res, next) {
	var headers = {};
	headers['origin'] = req.protocol + '://' + req.get('host');
	var url = (global.APP_CONFIG.api_local || global.APP_CONFIG.api_endpoint) + '/api/account';
	request({
		url: url,
		headers: headers,
		json: true
	}, function (_err, _res, _body) {
		if (_res && _res.statusCode === 404) {
			return res.render('error404');
		}
		res.render('index', {
			config: global.APP_CONFIG,
			account: (_body && _body.account) || {},
			request: req,
			node_env: (process.env.NODE_ENV || 'development'),
			is_dev_env: (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'staging')
		});
	});
});

/*
 * Start it up
 */
app.listen(process.env.PORT || port);

console.log('Express started on port ' + port);
