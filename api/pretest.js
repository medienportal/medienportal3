var config = require('./config'),
    mongoose = require('mongoose'),
    async = require('async')

if (process.env.NODE_ENV !== 'test') {
    throw 'only runnable in test environment for security reasons!';
}

client = require('./service/redis_client');

mongoose.connect(config.mongo.db);
var db = mongoose.connection;

client.flushdb(function(err) {
    if (err) throw err;
    console.log('redis db flushed.');
});

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
    console.log('connected to db successfully');
    // start app server
    async.each(['Account', 'Activity', 'Category', 'Comment', 'Greeting', 'Module', 'Message', 'Collection'], function(item, cb) {
        console.log('clear ', item, ' collection in db ...');
        models = {};
        models[item] = require('./model/' + item.toLowerCase());
        models[item].remove(cb);
    }, function(args){
        process.exit(0);
    });
});