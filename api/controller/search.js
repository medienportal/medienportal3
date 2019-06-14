var config = require('../config'),
    es = require('elasticsearch').Client(config.elasticsearch),
    ogs = require('open-graph-scraper');

var baseBodyFilter = function(account_id) {
	return {
		and: [
			{
				term: {
					status: "PUBLISHED"
				},
			},
			{
				term: {
					account_id: account_id
				}
			}
		]
	}
};

var searchbody = function(searchtext, account_id) {
    var body = {};
	if (!searchtext) {
		body = { query: { filtered: { } } };
	} else {
        body = {
            query: {
                filtered: {
                    query: {
                        bool: {
                            should: [
                                { prefix: {
                                    title: {
                                        value: searchtext.toLowerCase(),
                                        boost: 1.5
                                    }
                                } },
                                { match: {
                                    title: {
                                        query: searchtext,
                                        boost: 2.0
                                    }
                                } },
                                { match: {
                                    "files.title": {
                                        query: searchtext,
                                        boost: 1.2
                                    }
                                } },
                                { prefix: {
                                    "files.title": {
                                        value: searchtext.toLowerCase(),
                                        boost: 1.0
                                    }
                                } },
                                { match: {
                                    "files.content": {
                                        query: searchtext,
                                        boost: 1.1
                                    }
                                } },
                                { match: {
                                    "modules.content": searchtext
                                } },
                                { match: {
                                    author: searchtext
                                } },
                                { prefix: {
                                    author: searchtext.toLowerCase()
                                } },
                                { match: {
                                    tags: {
                                        query: searchtext,
                                        boost: 1.5
                                    }
                                } },
                                { match: {
                                    "comments.content": {
                                        query: searchtext,
                                        boost: 0.9
                                    }
                                } },
                                { match: {
                                    "comments.author": {
                                        query: searchtext,
                                        boost: 0.7
                                    }
                                } },
                                { match: {
                                    "files.comments.content": {
                                        query: searchtext,
                                        boost: 0.9
                                    }
                                } },
                                { match: {
                                    "files.comments.author": {
                                        query: searchtext,
                                        boost: 0.7
                                    }
                                } }
                            ]
                        }
                    },
                    filter: baseBodyFilter(account_id)
                }
            }
        };
    }
    body.from = 0;
    body.size = 150;
    return body;
};

exports.listPages = function(req, res, next) {
    if (!req.param('q') && !req.param('fields')) return res.send(400);
    var searchtext = req.param('q'),
        searchfields = req.param('fields'),
		searchonly = req.param('only');

    var callback = function(_err, _result) {
        if (_err) return next(_err);
        var json = _result.hits;
        json.took = _result.took;
        res.send(json);
    }

	var esbody = searchbody(searchtext, req.account.id);

    //	fields=topic:bla;tag:blu
	if (searchfields) {
		esbody.query.filtered.filter = { and: [baseBodyFilter(req.account.id)] };
		searchfields.split(';').map(function(field) {
			var key,
				val,
				ar = searchfields.split(':'),
				term = {};
			if (searchfields.length > 1) {
				key = ar[0];
				val = ar[1];
				term[key] = val;
				esbody.query.filtered.filter.and.push({ term: term });
			}
		});
	}

    // search only specific fields
	if (searchonly) {
		esbody.query.filtered.query.bool.should = esbody.query.filtered.query.bool.should.filter(function(should) {
			var field = Object.keys(should.match);
			field = (field.length > 0) && field[0];
			return (field === searchonly);
		});
	}
    console.log(esbody);
	es.search(
		{
			index: 'items',
			type: 'page,collection',
			body: esbody
		},
		callback
	);
}

exports.listUsers = function(req, res, next) {
    if (!req.param('q')) return res.send(400);
    var searchtext = req.param('q');

    var callback = function(_err, _result) {
        if (_err) return next(_err);
        var json = _result.hits;
        json.took = _result.took;
        res.send(json);
    }
    es.search({
        index: 'users',
        type: 'user',
        body: {
            query: {
                filtered: {
                    query: {
                        bool: {
                            should: [
                                { match: {
                                    first_name: {
                                        query: searchtext,
                                        boost: 1.5
                                    }
                                } },
                                { match: {
                                    last_name: {
                                        query: searchtext,
                                        boost: 1.7
                                    }
                                } },
                                { match: {
                                    name: {
                                        query: searchtext,
                                        boost: 1.5
                                    }
                                } },
                                { match: {
                                    email: {
                                        query: searchtext,
                                        boost: 1.0
                                    }
                                } },
                                { match: {
                                    description: {
                                        query: searchtext,
                                        boost: 0.8
                                    }
                                } },
                                { match: {
                                    klass: {
                                        query: searchtext,
                                        boost: 0.5
                                    }
                                } },
                            ]
                        }
                    },
                    filter: {
                        term: {
                            account_id: req.account.id
                        }
                    }
                }
            },
            from: 0,
            size: 25
        }
    }, callback);
}

exports.opensearch = function(req, res, next) {
    var host = req.headers['host'];
    var result = '<?xml version="1.0" encoding="UTF-8"?>'
                + '<OpenSearchDescription xmlns="http://a9.com/-/spec/opensearch/1.1/">'
                    + '<ShortName>' + req.account.title + '</ShortName>'
                    + '<Description>' + req.account.name + ' durchsuchen.</Description>'
                    + '<Tags>Medienportal</Tags>'
                    + '<Contact>kontaktiere@unsdrei.de</Contact>'
                    + '<Url type="text/html" template="https://' + host +'/search/{searchTerms}&amp;ps={startPage?}"/>'
                + '</OpenSearchDescription>';
    res.set({
        'Content-Type': 'application/opensearchdescription+xml'
    });
    res.send(200, result);
};

exports.scrapeWebOpenGraph = function(req, res, next) {
    var URLRegexp = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    if (!req.query.url) {
        return res.send(400, { error: 'URL required.' });
    }
    if (!URLRegexp.test(req.query.url)) {
        return res.send(400, { error: 'URL not valid.' });
    }
    if (!/^http/.test(req.query.url)) { // add http:// if no protocol is given (eg: www.google.com)
        req.query.url = 'http://' + req.query.url;
    }
    var options = {
        url: req.query.url,
        timeout: 2500
    };
    ogs(options, function(err, results) {
        if (err) {
            return next(err);
        }
        var link = {
            type: 'external',
            src: req.query.url,
            og: results.data
        };
        res.send(link);
    });
};
