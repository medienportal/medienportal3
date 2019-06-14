var config = require('../../config'),
	filesizes = require('../../config/filesizes'),
	async = require('async'),
	util = require('util'),
	events = require('events'),
	URL = require('url'),
	zencoder = require('zencoder')(config.zencoder.key);

var ZencoderProcessor = function(options) {
	if (!options) {
		options = {};
	}
	if (!options.file) {
		throw 'Please specify file';
	}
	if (!options.mimetype) {
		try {
			this.type = this.file.mimetype.split('/')[1];
		} catch(e) {
			this.type = 'video';
		}
	}
	this.file = options.file;
};
util.inherits(ZencoderProcessor, events.EventEmitter);


ZencoderProcessor.prototype.process = function(callback) {
	if (!callback) {
		callback = function() {};
	}
	var processor = this;
	var file = this.file;
	if (!/(video|audio)\/(.*)/ig.test(this.file.mimetype)) {
		return callback(new Error('File is not video or audio'), null);
	}
	async.waterfall([
		function(cb) {
			file.state = 'processing';
			file.save(cb);
		},
		function(_file, updatedNum, cb) {
			var inputPath = 's3://' + config.amazon.s3.bucket + _file.versions.original.relativeUrl;
			var zencoderConfig = processor.getZencoderConfig(inputPath);
			zencoder.Job.create(zencoderConfig, cb);
		},
		function(jobInfo, apiRequest, cb) {
			var jobId = jobInfo.id;
			var getJobProgress = function() {
				zencoder.Job.progress(jobId, function(err, jobDetails) {
					var fn = (jobDetails.state === 'finished') ? getJobDetails : getJobProgress;
					setTimeout(fn, 1500);
				});
			}
			var getJobDetails = function() {
				zencoder.Job.details(jobId, function(err, jobDetails) {
					if (jobDetails.job.state === 'finished') {
						cb(null, jobDetails.job);
					} else {
						cb(new Error(jobDetails.job.state));
					}
				});
			}
			getJobProgress();
		}
	], function(err, jobDetails) {
		if (err) {
			return callback(err);
		}
		console.log('this.file: ', this.file);
		console.log('before updateJobDetails file: ', file);
		processor.updateFileWithJobDetails(jobDetails);
		console.log('after updateJobDetails file: ', file);
		file.save(function(_err, _file) {
			if (err) {
				console.log('ERR!: ', _err);
			}
			console.log('saved file: ', _file);
			console.log('arguments: ', arguments);
			callback(_err, _file);
		});
	});
};

ZencoderProcessor.prototype.getZencoderConfig = function(inputPath) {
	var processor = this;
	var formats = filesizes[this.type + 's'];
	var outputs = Object.keys(formats).map(function(key) {
		var format = formats[key];
		var output = format.output;
		output.url = 's3://' + config.amazon.s3.bucket + '/' + processor.file.generateFilepath({ version: key });
		return output;
	});
	return {
		input: inputPath,
		outputs: outputs
	}
};

ZencoderProcessor.prototype.updateFileWithJobDetails = function(jobDetails) {
	var file = this.file;
	if (!file.versions) {
		file.versions = {};
	}

	file.state = 'processed';
	file.meta = {
		input: jobDetails.input_media_file,
		job_id: jobDetails.id,
		created_at: jobDetails.created_at,
		updated_at: jobDetails.updated_at,
		finished_at: jobDetails.finished_at
	};

	if (file.meta.input.duration_in_ms) {
		file.duration = parseInt(file.meta.input.duration_in_ms / 1000, 10) + 1;
	}

	jobDetails.output_media_files.forEach(function(f) {
		var url = URL.parse(f.url);
		file.versions[f.label] = {
			relativeUrl: url.path,
			absoluteUrl: f.url,
			relativeHost: url.host,
			name: f.label
		}
	});

	return file;
}

module.exports = ZencoderProcessor;
