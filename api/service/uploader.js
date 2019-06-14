var config = require('../config'),
	filesizes = require('../config/filesizes'),
	fs  = require('fs'),
	temp = require('temp'),
	gm = require('gm'),
	async = require('async'),
	knox = require('knox'),
	request = require('request'),
	restler = require('restler'), // restler is way easyier than request for multipart uploads
	zencoder = require('zencoder')(config.zencoder.key),
	Realtime = require('../service/realtime.js'),
	s3client = knox.createClient({
		key: config.amazon.s3.key,
		secret: config.amazon.s3.secret,
		bucket: config.amazon.s3.bucket
	});

var getFunctionForResizeToSize = function(filesize_options, filepath, newfilename) {
  return function(cb) {
    var name = filesize_options.name
      , width = filesize_options.width
      , height = filesize_options.height
      , options = filesize_options.options
    var conversion =
      gm(filepath)
      .autoOrient()
      .resize(width, height, options)
      .enhance();
    if (filesize_options.crop) {
      conversion.crop(width, height, 0, 0);
    }
    conversion.write(newfilename, function(r1, r2, args) {
      var returnObject = {};
	  console.log('size ' + name + ' will be laid to ' + newfilename);
      returnObject[name] = newfilename;
      cb(null, returnObject);
    });
  }
};

var getVideoConfig = function(input_path, output_path) {
	var outputs = Object.keys(filesizes.videos).map(function(key) {
		var format = filesizes.videos[key];
		var url =
			's3://' + config.amazon.s3.bucket + output_path + (new Date().getTime()) + Math.floor(Math.random() * 100000) + '_' + format.target + '.' + format.extension;
		var output = format.output;
		output.url = url;
		return output;
	});
	return {
		input: input_path,
		outputs: outputs
	}
}

exports.uploadImage = function(file, path, convert_type, uploadPreviewCallback) {
	console.log('will upload preview; Arguments: ', arguments);
	console.log('global upload dir: ', global.uploadDir)
	console.log('generate newfilename: ', newfilenameWithoutExtension);
	var s3request;
	var filetype = file.type;
	if (!filetype.match(/^image\/.*$/)) return callback(new Error('file must be image'));



  async.waterfall([
    function(cb) {
      async.series(
        Object.keys(filesizes.images[convert_type]).map(function(size) {
          var newfilename = newfilenameWithoutExtension + '_' + size + '.' + extension;
          return getFunctionForResizeToSize(filesizes.images[convert_type][size], filepath, newfilename);
        }), cb);
    },
	  function(results, cb) {
		  var resultsObject = {};
		  async.map(
			  results,
			  function(pathObject, callback) {
				  var size = Object.keys(pathObject)[0];
				  var imgpath = pathObject[size];
				  var fullpath =
					  path + (new Date().getTime()) + Math.floor(Math.random() * 100000) + '_' + size + '.' + extension;
				  s3client.putFile(imgpath, fullpath, function(err, s3result) {
					  fs.unlink(imgpath, function() {});
					  if (err) return callback(err);
					  if (!s3result.statusCode == 200)
						  return callback(new Error('s3 result is not OK, is: ' + s3result.statusCode + ': ' + s3result.body));
					  var cf_path = config.amazon.cloudfront.url + fullpath;
					  var sizeObj = {}
					  sizeObj[size] = cf_path;
					  callback(null, sizeObj);
				  })
			  },
			  function(err, results) {
				  if (err) return cb(err);
				  var previewObj = {};
				  results.forEach(function(resultObj) {
					  var size = Object.keys(resultObj)[0];
					  var url = resultObj[size];
					  previewObj[size] = url;
				  });
				  cb(null, previewObj);
			  });
	  }
  ], uploadPreviewCallback);
}
exports.uploadMedium = function(file, path, callback, upload_options) {
  if (!upload_options) upload_options = {};
	var filepath = file.path;
	var extension = filepath.split(".")[filepath.split(".").length - 1]
	var newfilename = temp.path({ dir: global.uploadDir, suffix: ('.' + extension)});
	var s3request;
	var fullpath = path + (new Date().getTime()) + Math.floor(Math.random() * 100000) + '.' + extension;
	var filetype = file.type;

  var IMAGE_WIDTH = filesizes.images.image_module.standard.width,
      IMAGE_HEIGHT = filesizes.images.image_module.standard.height,
      IMAGE_OPTIONS = filesizes.images.image_module.standard.options;

	if (filetype.match(/^image\/.*$/)) {
		async.waterfall([
			function(cb) {
				gm(filepath)
				.autoOrient()
				.resize(IMAGE_WIDTH, IMAGE_HEIGHT, IMAGE_OPTIONS)
				.enhance()
				.write(newfilename, cb);
			},
			function(r1, r2, args, cb) {
				s3request = s3client.putFile(newfilename, fullpath, cb);
			}
			], function(err, s3result) {
				if (err)
					return callback(err);
				if (s3result.statusCode != 200)
					return callback(new Error('file could not be uploaded to S3; Error Code: ' + s3result.statusCode));
				callback(null, config.amazon.cloudfront.url + fullpath);
			});
	} else if (filetype.match(/^video\/.*$/)) {
		var s3filepath;
		console.log('detect video. Will uplaod video ...');
		async.waterfall([
			function(cb) {
				s3request = s3client.putFile(filepath, fullpath, cb);
				console.log('will upload video to s3 ...');
			},
			function(s3result, cb) {
				s3filepath = 's3://' + config.amazon.s3.bucket + fullpath;
				var videoconfig = getVideoConfig(s3filepath, path);
				zencoder.Job.create(videoconfig, cb);
				console.log('create Job on Zencoder ...');
			},
			function(data, req, cb) {
				var jobId = data.id;
				var getJobProgress = function() {
					zencoder.Job.progress(jobId, function(err, details) {
						var state = [];
						if (details.progress) state.push(details.progress + '%');
						if (details.state) state.push(details.state);
						if (details.input && details.input.current_event) state.push('(' + details.input.current_event + ')');
						var state = state.join(' ');
						sendState(state);
						var fn = (details.state === 'finished') ? getJobDetails : getJobProgress;
						setTimeout(fn, 1500);
					});
				}
				var getJobDetails = function() {
					zencoder.Job.details(jobId, function(err, details) {
						if (details.job.state === 'finished') {
							cb(null, details.job);
						} else {
							cb(new Error(details.job.state));
						}
					});
				}
				var sendState = function(state) {
					var channelname = 'private-modules-page-' + upload_options.page_id;
					var eventname = 'client-update';
					upload_options.module.state = state;
					Realtime.triggerEvent(channelname, eventname, { module: upload_options.module }, function(err) {
						if (err) console.log(err);
					});
				};
				getJobProgress();
			}], function(err, job) {
				if (err) return callback(err);
				console.log('job finished: ', job);
				// var file = File.fromZencoderJob(job);
				callback(null, file);
			});
	} else if (filetype.match(/^audio\/.*$/)) {
		var s3filepath;
		async.waterfall([
			function(cb) {
				var url = 'https://api.soundcloud.com/oauth2/token';
				request.post(url, {
					form: {
						client_id: config.soundcloud.client_id,
						client_secret: config.soundcloud.client_secret,
						grant_type: 'password',
						username: config.soundcloud.username,
						password: config.soundcloud.password
					}
				}, cb);
			},
			function(result, content, cb) {
				var access_token = JSON.parse(content).access_token;
				var url = config.soundcloud.endpoint + '/tracks.json';
				var options = {
					'track[title]': 'PANDA SOUNDFILE',
					'track[asset_data]': restler.file(filepath, null, file.size, null, 'application/octet-stream'),
					'oauth_token': access_token
				}
				var request = restler.post(url, {
					data: options,
					multipart: true
				})
				request.on('complete', function(data) {
					cb(null, data);
				});
				request.on('error', function(error) {
					cb(error);
				})
			}], function(err, response) {
				callback(err, (response, response && response.permalink_url));
			});
  } else if (filetype.match(/^application\/.*pdf$/)) {
    var newfilename_comps, fullpath_comps, extension;
    var extension = 'jpg'

    newfilename_comps = newfilename.split('.');
    newfilename_comps.pop();
    newfilename = newfilename_comps.join('.') + '.' + extension;

    fullpath_comps = fullpath.split('.');
    fullpath_comps.pop();
    fullpath = fullpath_comps.join('.') + '.' + extension

    async.waterfall([
      function(cb) {
        gm(filepath)
          .autoOrient()
          .resize(IMAGE_WIDTH, IMAGE_HEIGHT, IMAGE_OPTIONS)
          .enhance()
          .write(newfilename, cb);
      },
      function(r1, r2, args, cb) {
        s3request = s3client.putFile(newfilename, fullpath, cb);
      }], function(err, s3result) {
        if (err)
          return callback(err);
        if (s3result.statusCode != 200)
          return callback(new Error('file could not be uploaded to S3; Error Code: ' + s3result.statusCode));
        callback(null, config.amazon.cloudfront.url + fullpath);
      });
	} else {
		callback(new Error('File type not supported!'))
	}
}
