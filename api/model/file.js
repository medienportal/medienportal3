var mongoose = require('mongoose'),
	Schema = mongoose.Schema;
var config = require('../config'),
	gm = require('gm'),
	Busboy = require('busboy'),
	async = require('async'),
	events = require('events'),
	filesizes = require('../config/filesizes'),
	URL = require('url'),
	PATH = require('path'),
	AWS = require('aws-sdk'),
	ZencoderProcessor = require('../service/uploader/zencoder'),
	s3 = new AWS.S3({
		accessKeyId: config.amazon.s3.key,
		secretAccessKey: config.amazon.s3.secret,
		apiVersion: '2012-08-10',
		region: config.amazon.s3.region
	});

events.EventEmitter.defaultMaxListeners = 0;

var FileSchema = Schema({
	title: String,
	versions: Schema.Types.Mixed,
	mimetype: String,
	filesize: Number,
	original_filename: String,
	state: String,
	account_id: Schema.Types.ObjectId,
	created_at: { type: Date, default: Date.now },
	meta: Schema.Types.Mixed,
	duration: Number,
	private: Boolean,
	author: {
		author_id: Schema.Types.ObjectId,
		author_type: String
	}
});

var File = mongoose.model('File', FileSchema);

File.fromRequest = function(request, options) {
	if (!options) {
		options = {};
	};

	var emitter = new events.EventEmitter();
	emitter.setMaxListeners(0);

	try {
		var busboy = new Busboy({ headers: request.headers });
	} catch(e) {
		setTimeout(function() {
			if (/Unsupported content type/.test(e.message)) {
				emitter.emit('finished', null, null);
			} else {
				emitter.emit('finished', e);
			}
		});
		return emitter;
	}

	var error = null;

	busboy.once('file', function(_fieldname, _file, _filename, _encoding, _mimetype) {
		File.fromStream(_file, {
			filename: _filename,
			mimetype: _mimetype,
			user: request.current_user,
			private: (options.private === true),
			account: request.account,
			emitter: emitter
		});
	});
	request.pipe(busboy);
	return emitter;
};

File.fromStream = function(stream, options) {
	if (!options) {
		options = {};
	}
	var emitter = options.emitter || new events.EventEmitter();
	if (!options.filename) { options.filename = ''; }
	if (!options.mimetype) { options.mimetype = ''; }
	if (!options.user) { options.current_user = {}; }
	if (!options.account) { options.account = {}; }
	if (!options.emitter) { console.log('no emitter given. Create new emitter'); emitter = new events.EventEmitter(); }

	var file = new File({
		original_filename: options.filename,
		mimetype: options.mimetype,
		account_id: options.account.id,
		private: options.private,
		state: 'new'
	});
	if (options.user && options.user.id) {
		file.author.author_type = 'panda';
		file.author.author_id = options.user.id;
	}
	file.save(function(err) {
		if (err) {
			return emitter.emit('finished', err);
		}

		var uploadStreams = [{
			name: 'original',
			stream: stream,
			ContentType: options.mimetype,
			fullPath: file.generateFilepath({ version: 'original' })
		}];

		if (/image\/(.*)/ig.test(options.mimetype)) {

			gm(stream).identify(function(_err, _identification) {
				if (_identification) {
					try {
						file.meta = JSON.stringify(_identification);
					} catch(e) {}
				}
			});

			Object.keys(filesizes.image).map(function(sizeName) {
				var conversionOptions = filesizes.image[sizeName];
				var conversion =
					gm(stream, options.filename)
						.autoOrient()
						.resize(conversionOptions.width, conversionOptions.height, conversionOptions.options)
						.enhance();
				if (conversionOptions.crop) {
					conversion.crop(conversionOptions.width, conversionOptions.height, 0, 0);
				}

				// now upload
				var uploadStream = conversion.stream();
				uploadStreams.push({
					name: sizeName,
					stream: uploadStream,
					ContentType: options.mimetype,
					fullPath: file.generateFilepath({ version: sizeName })
				});
			});
		}

		async.map(uploadStreams, function(item, callback) {
			var uploadParams = {
				Bucket: config.amazon.s3.bucket,
				Key: item.fullPath,
				Body: item.stream
			};
			s3.upload(uploadParams, function(err, result) {
				if (err) {
					return callback(err);
				}
				var url = URL.parse(result.Location);
				item.result = {
					ETag: result.ETag,
					Location: decodeURIComponent(result.Location),
					relativeUrl: decodeURIComponent(url.path),
					absoluteUrl: decodeURIComponent(result.Location),
					relativeHost: url.host,
					name: item.name
				}
				item.ETag = result.ETag;
				item.Location = result.Location;
				callback(null, item);
			});
		}, function(err, versions) {
			if (err) {
				file.remove();
				return emitter.emit('finished', err, null);
			}
			if (!file.versions) {
				file.versions = {};
			}
			versions.forEach(function(fileObject) {
				file.versions[fileObject.name] = {
					name: fileObject.name,
					ETag: fileObject.ETag,
					relativeUrl: fileObject.result.relativeUrl,
					absoluteUrl: fileObject.result.absoluteUrl
				}
			});

			var originalFile = file.versions['original'];
			var getParams = {
				Bucket: config.amazon.s3.bucket,
				Key: originalFile.relativeUrl.replace(/^\//, '')
			};
			s3.headObject(getParams, function(_err, data) {
				if (_err) {
					console.warn(_err);
				} else {
					file.filesize = data.ContentLength;
				}
				file.save(function(__err) {
					if (__err) {
						return emitter.emit('finished', __err);
					}
					emitter.emit('finished', null, file);

					file.postProcess(function(___err, ___file) {
						emitter.emit('postprocessed', ___err, ___file);
					});
				});
			});
		});
	});
	return emitter;
};

File.generateFilepath = function(options) {
	var filePath = [];
	if (options.basePath) {
		filePath.push(options.basePath);
	};
	var uniqueId = [options.size, (new Date().getTime()) + Math.floor(Math.random() * 100000)].join('');
	filePath.push(uniqueId);

	if (options.filename) {
		filePath.push(PATH.extname(options.filename));
	}
	return filePath.join('');
};

File.prototype.getUploadBasePath = function(options) {
	if (!options) {
		options = {};
	}
	var account_id = this.account_id || options.account_id,
		file_id = this.id || options.file_id;
	if (!account_id && options.private !== true) {
		throw 'No account id given';
	}
	if (!file_id) {
		throw 'No file id given';
	}
	return account_id + '/files/' + file_id + '/';
};

File.prototype.generateFilepath = function(options) {
	if (!options) {
		options = {};
	}
	var path = File.generateFilepath({
		filename: options.filename || this.original_filename,
		version: options.version || '',
		basePath: options.basePath || this.getUploadBasePath()
	});
	return path;
};

File.prototype.postProcess = function(callback) {
	var file = this;

	if (/(video|audio)\/(.*)/ig.test(file.mimetype)) {
		var processor = new ZencoderProcessor({ file: file });
		processor.process(callback);
	}

}

module.exports = File;
