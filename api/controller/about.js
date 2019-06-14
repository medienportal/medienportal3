var path = require('path'),
fs = require('fs'),
async = require('async');


var packageJson = function(cb) {
    var rootpath = path.resolve(path.dirname(require.main.filename), 'package.json');
    fs.readFile(rootpath, {}, function(err, res){
        var content = JSON.parse(res.toString());
        return cb(null, content);
    });
}

exports.getInfo = function(req, res, next) {
    var package_json,
    response = {};
    if (req.param('secretkeytoheaven') === 'nhraVDzJeGFbZrzsiddu8CJYqXFdVYmC6nrv') {
        async.waterfall([
            packageJson
        ], function (err, _package_json) {
            package_json = _package_json;

            response.environment = process.env.NODE_ENV;
            response['package'] = package_json;
            res.send(200, response);

        });
    } else {
        res.send(403);
    }
}
