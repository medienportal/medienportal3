var config = require('../../config')

var mongoose = require('mongoose'),
    assert = require('assert'),
    Collection = require('../../model/collection'),
    User = require('../../model/user'),
    Account = require('../../model/account'),
    CollectionCtrl = require('../../controller/collections'),
    Cache = require('../../service/cache'),
    chai = require('chai'),
    expect = chai.expect,
	nonext = function(err) { throw 'this function should never have been called! Err: ' + err }

describe('Collections Controller', function () {
	var newCollection, collectionWithFiles, loggedInUser;
    var i = 0;
	beforeEach(function(done) {
        i++;
		process.env.NODE_ENV = 'test';
	    mongoose.connect(config.mongo.db, {}, function() {
	        Collection.remove(done);
	    });
	});
	beforeEach(function(done) {
		collectionWithFiles = new Collection({
			title: 'test Collection With Files',
			category_id: '507f1f77bcf86cd799439015',
			account_id: '507f1f77bcf86cd799439011',
			files: [{
				file_type: 'image/jpeg',
				files: {},
				comments: [],
				likes: []
			},
			{
				file_type: 'image/jpeg',
				files: {},
				comments: [],
				likes: []
			},
			{
				file_type: 'image/jpeg',
				files: {},
				comments: [],
				likes: []
			},
			{
				file_type: 'image/jpeg',
				files: {},
				comments: [],
				likes: []
			}],
			config: {}
		});
		collectionWithFiles.save(done);
	});
	beforeEach(function(done) {
		Collection.create({
			title: 'test Collection',
			category_id: 'cat123456',
			account_id: '507f1f77bcf86cd799439011'
		}, function(err, collection) {
			if (err) throw err;
			newCollection = collection;
			User.create({
				first_name: 'Alexis',
				last_name: 'Rinaldoni',
				name: 'Alexis Rinaldoni',
				email: 'arinaldoni' + i + '@me.com',
				permissions: { '507f1f77bcf86cd799439011': { admin: true } },
				account_id: '507f1f77bcf86cd799439011'
			}, function(err, user) {
				if (err) throw err;
				loggedInUser = user;
				done();
			});
		});
	});
	describe('create a collection', function() {
		var req, loggedInUser;
        var i = 0;
		beforeEach(function(done) {
            i++;
			req = {
				param: function(name) { return this.params[name]; },
				params: { collection_id: newCollection.id },
				connection: { remoteAddress: '127.0.0.1' },
				body: {}
			}
			loggedInUser = new User({
				first_name: 'Alexis',
				last_name: 'Rinaldoni',
				name: 'Alexis Rinaldoni',
				email: ('duduu' + i + '@me.com'),
				permissions: { '507f1f77bcf86cd799439011': { admin: true } },
				account_id: '507f1f77bcf86cd799439011'
			});
			loggedInUser.save(done);
		});
		it('returns a 401 if user is not logged in', function(done) {
			CollectionCtrl.create(req, { send: function(status, body) {
				expect(status).to.equal(401);
				expect(body).not.to.exist;
				done();
			} }, nonext);
		});
		it('returns a 400 if no collection is given', function(done) {
			req.current_user = loggedInUser;
			CollectionCtrl.create(req, { send: function(status, body) {
				expect(status).to.equal(400);
				expect(body).not.to.exist;
				done();
			} }, nonext);
		});
		it('should create a collection if everything is OK', function(done) {
			req.current_user = loggedInUser;
			req.body.collection = { title: 'My New Collection', category_id: 'cat1z4723ui' };
			req.account = { _id: '507f1f77bcf86cd799439011' }
			CollectionCtrl.create(req, { send: function(status, body) {
				expect(status).to.equal(200);
				expect(body.title).to.equal('My New Collection');
				done();
			} }, nonext);
		});
	});
    describe('find a collection', function() {
        var req, loggedInUser, i = 0;
        beforeEach(function(done) {
            req = {
                param: function(name) { return this.params[name]; },
                params: { collection_id: newCollection.id },
                connection: { remoteAddress: '127.0.0.1' },
                account: { id: '507f1f77bcf86cd799439011' },
                cache: Cache.acc('507f1f77bcf86cd799439011'),
                body: {}
            }
            loggedInUser = new User({
                first_name: 'Alexis',
                last_name: 'Rinaldoni',
                name: 'Alexis Rinaldoni',
                email: 'thetesternumberOneMasterOfAllCollV' + i + '@mastermind.com',
                permissions: { '507f1f77bcf86cd799439011': { admin: true } },
                account_id: '507f1f77bcf86cd799439011'
            });
            i++;
            loggedInUser.save(done);
        });
        it('should return a 400 if collection id is not supplied', function(done) {
            req.params = {};
            CollectionCtrl.getOne(req, { send: function(status, body) {
                expect(status).to.equal(400);
                expect(body).not.to.exist;
                done();
            } }, nonext);
        });
        it('should return a 404 if collection id does not exist', function(done) {
            req.params = { collection_id: '507f1f77bcf86cd799439011' };
            CollectionCtrl.getOne(req, { send: function(status, body) {
                expect(status).to.equal(404);
                expect(body).not.to.exist;
                done();
            } }, nonext);
        });
        it('should return a 404 if collection id is total bullshit', function(done) {
            req.params = { collection_id: 'thisIsTotalBullshitForeverShitYeKnow' };
            CollectionCtrl.getOne(req, { send: function(status, body) {
                expect(status).to.equal(404);
                expect(body).not.to.exist;
                done();
            } }, nonext);
        });
        it('should return the correct collection if all is OK', function(done) {
            CollectionCtrl.getOne(req, {
                send: function(status, body) {
                    expect(status).to.equal(200);
                    expect(body).to.exist;
                    expect(body).to.have.property('collection');
                    expect(body.collection.title).to.equal(newCollection.title);
                    done();
                }
            }, nonext);
        });
    });
    describe('delete a collection', function() {
		var req,
            collectionToBeDeleted;
        beforeEach(function(done) {
    		collectionToBeDeleted = new Collection({
    			title: 'test Collection With Files',
    			category_id: '507f1f77bcf86cd799439015',
    			account_id: '507f1f77bcf86cd799439011',
    			files: [{
    				file_type: 'image/jpeg',
    				files: {},
    				comments: [],
    				likes: []
    			},
    			{
    				file_type: 'image/jpeg',
    				files: {},
    				comments: [],
    				likes: []
    			},
    			{
    				file_type: 'image/jpeg',
    				files: {},
    				comments: [],
    				likes: []
    			},
    			{
    				file_type: 'image/jpeg',
    				files: {},
    				comments: [],
    				likes: []
    			}],
    			config: {}
    		});
    		collectionToBeDeleted.save(done);
    	});
		beforeEach(function() {
			req = {
				param: function(name) { return this.params[name]; },
				params: { collection_id: collectionToBeDeleted.id },
				connection: { remoteAddress: '127.0.0.1' },
				body: {},
				current_user: loggedInUser,
				account: { id: '507f1f77bcf86cd799439011', _id: '507f1f77bcf86cd799439011' }
			}
		});
		it('should return a 400 if no collection_id is given', function(done) {
			req.params.collection_id = undefined;
			var res = { send: function(status, body) {
				expect(status).to.equal(400);
				done();
			} }
			CollectionCtrl.remove(req, res, nonext);
		});
		it('should return a 404 if collection does not exist', function(done) {
			req.params.collection_id = '507f1f77bcf86cd799430000';
			var res = { send: function(status, body) {
				expect(status).to.equal(404);
				done();
			} }
			CollectionCtrl.remove(req, res, nonext);
		});
		it('should return a 403 if user is not admin', function(done) {
			User.create({
				first_name: 'Bla',
				last_name: 'Bliblu',
				name: 'Tester Tester du',
				email: 'blablablablabla081597@testmaildomain.com',
				permissions: { '507f1f77bcf86cd799439011': { admin: false } },
				account_id: '507f1f77bcf86cd799439011'
			}, function(err, user) {
				if (err) throw err;
				req.current_user = user;
				var res = { send: function(status, body) {
					expect(status).to.equal(403);
					done();
				} }
				CollectionCtrl.remove(req, res, nonext);
			});
		});
		it('should delete the collection if all data is ok', function(done) {
			var res = { send: function(status, body) {
				expect(status).to.equal(200);
				Collection.findById(req.param('collection_id'), function(err, collection) {
					expect(err).not.to.exist;
					expect(collection).not.to.exist;
					done();
				});
			} }
			CollectionCtrl.remove(req, res, nonext);
		});
	});
	describe('delete a collectionfile', function() {
		var req ;
		beforeEach(function() {
			req = {
				param: function(name) { return this.params[name]; },
				params: { collection_id: collectionWithFiles.id, file_id: collectionWithFiles.files[0]._id },
				connection: { remoteAddress: '127.0.0.1' },
				body: {},
				current_user: loggedInUser,
				account: { id: '507f1f77bcf86cd799439011', _id: '507f1f77bcf86cd799439011' }
			}
		});
		it('should return a 400 if no collection_id is given', function(done) {
			req.params.collection_id = undefined;
			var res = { send: function(status, body) {
				expect(status).to.equal(400);
				done();
			} }
			CollectionCtrl.removeFile(req, res, nonext);
		});
		it('should return a 400 if no file_id is given', function(done) {
			req.params.file_id = undefined;
			var res = { send: function(status, body) {
				expect(status).to.equal(400);
				done();
			} }
			CollectionCtrl.removeFile(req, res, nonext);
		});
		it('should return a 404 if collection does not exist', function(done) {
			req.params.collection_id = '507f1f77bcf86cd799430000';
			var res = { send: function(status, body) {
				expect(status).to.equal(404);
				done();
			} }
			CollectionCtrl.removeFile(req, res, nonext);
		});
		it('should return a 404 if file does not exist', function(done) {
			req.params.file_id = '507f1f77bcf86cd799430000';
			var res = { send: function(status, body) {
				expect(status).to.equal(404);
				done();
			} }
			CollectionCtrl.removeFile(req, res, nonext);
		});
		it('should return a 403 if user is not admin', function(done) {
			User.create({
				first_name: 'Bla',
				last_name: 'Bliblu',
				name: 'Tester Tester du',
				email: 'blablablablabla@me.com',
				permissions: { '507f1f77bcf86cd799439011': { admin: false } },
				account_id: '507f1f77bcf86cd799439011'
			}, function(err, user) {
				if (err) throw err;
				req.current_user = user;
				var res = { send: function(status, body) {
					expect(status).to.equal(403);
					done();
				} }
				CollectionCtrl.removeFile(req, res, nonext);
			});
		});
		it('should delete the file if all data is ok', function(done) {
			Collection.findById(req.param('collection_id'), function(e, coll) {
				var fileLength = coll.files.length;
				var res = { send: function(status, body) {
					expect(status).to.equal(200);
					Collection.findById(req.param('collection_id'), function(_err, _collection) {
						expect(_err).not.to.exist;
						expect(_collection.files.length).to.equal(fileLength - 1);
						done();
					});
				} }
				CollectionCtrl.removeFile(req, res, nonext);
			});
		});
	});
    describe('update a collectionfile', function() {
        var req;
        beforeEach(function() {
            req = {
                param: function(name) { return this.params[name]; },
                params: {
                    collection_id: collectionWithFiles.id,
                    file_id: collectionWithFiles.files[0]._id,
                    file: {
                        title: 'Mein neuer Titel'
                    },
                },
                connection: { remoteAddress: '127.0.0.1' },
                body: {},
                current_user: loggedInUser,
				account: { id: '507f1f77bcf86cd799439011', _id: '507f1f77bcf86cd799439011' }
            }
        });
        it('should return a 400 if no collection_id is given', function(done) {
            req.params.collection_id = undefined;
            var res = { send: function(status, body) {
                expect(status).to.equal(400);
                done();
            } }
            CollectionCtrl.updateFile(req, res, nonext);
        });
        it('should return a 400 if no file is given', function(done) {
            req.params.file = undefined;
            var res = { send: function(status, body) {
                expect(status).to.equal(400);
                done();
            } }
            CollectionCtrl.updateFile(req, res, nonext);
        });
        it('should return a 400 if no file_id is given', function(done) {
            req.params.file_id = undefined;
            var res = { send: function(status, body) {
                expect(status).to.equal(400);
                done();
            } }
            CollectionCtrl.updateFile(req, res, nonext);
        });
        it('should return a 404 if collection does not exist', function(done) {
            req.params.collection_id = '507f1f05bcf86cd799430000';
            var res = { send: function(status, body) {
                expect(status).to.equal(404);
                done();
            } }
            CollectionCtrl.updateFile(req, res, nonext);
        });
        it('should return a 404 if file does not exist', function(done) {
            req.params.file_id = '507f1f05bcf86cd799430649'
            var res = { send: function(status, body) {
                expect(status).to.equal(404);
                done();
            } }
            CollectionCtrl.updateFile(req, res, nonext);
        });
        it('should return a 403 if user is not admin', function(done) {
            User.create({
                first_name: 'Bla',
                last_name: 'Bliblu',
                name: 'Tester Tester du',
                email: 'blablablablabla2@me.com',
                permissions: { '507f1f77bcf86cd799439011': { admin: false } },
                account_id: '507f1f77bcf86cd799439011'
            }, function(err, user) {
                if (err) throw err;
                req.current_user = user;
                var res = { send: function(status, body) {
                    expect(status).to.equal(403);
                    done();
                } }
                CollectionCtrl.updateFile(req, res, nonext);
            });
        });
        it('should update the title if all data is ok', function(done) {
            req.params.file.title = 'Ein neuer Titel';
            var res = {
                send: function(status, body) {
                    expect(status).to.equal(200);
                    Collection.findById(req.params.collection_id, function(_err, _collection) {
                        var file = _collection.files.filter(function(_file) { return _file._id == req.params.file_id.toString(); })[0];
                        expect(_collection).to.have.property('title');
                        expect(_collection).to.have.property('files');
                        expect(file).to.have.property('_id');
                        expect(file._id).to.exist;
                        expect(file).to.have.property('title');
                        expect(file.title).to.equal('Ein neuer Titel');
                        expect(_collection._id.toString()).to.equal(_collection._id.toString());
                        expect(_collection.files.length).to.equal(collectionWithFiles.files.length);
                        done();
                    });
                }
            }
            CollectionCtrl.updateFile(req, res, nonext);
        });
    });
	describe('change collection status', function() {
		var req = {
			param: function(key) { return this.params[key]; }
		};
		beforeEach(function () {
			req.account = { id: newCollection.account_id };
			req.params = { collection_id: newCollection.id };
			req.body = {};
		});
		it('user cannot change the collection status if no status is given', function(done) {
			req.body.status = null;
			CollectionCtrl.setCollectionStatus(req, {
				send: function(status, body) {
					expect(status).to.equal(400);
					expect(body).to.not.exist;
					done();
				}
			}, nonext);
		});
		it('user cannot change the collection status if he is not logged in', function(done) {
			req.body.status = 'PUBLISHED';
			CollectionCtrl.setCollectionStatus(req, {
				send: function(status, body) {
					expect(status).to.equal(401);
					expect(body).to.not.exist;
					done();
				}
			}, nonext);
		});
		it('user can change the collection status to "READY" if he is logged in', function(done) {
			req.current_user = new User({ permissions: {} });
			req.body.status = 'READY';
			CollectionCtrl.setCollectionStatus(req, {
				send: function(status, body) {
					expect(status).to.equal(200);
					expect(body).to.have.property('collection');
					expect(body.collection).to.have.property('status');
					expect(body.collection.status).to.equal('READY');
					done();
				}
			}, nonext);
		});
		it('user cannot change the collection status to "CONTROLLED" if he is not admin', function(done) {
			req.body.status = 'CONTROLLED';
			req.current_user = new User({ permissions: {} });
			CollectionCtrl.setCollectionStatus(req, {
				send: function(status, body) {
					expect(status).to.equal(403);
					expect(body).to.not.exist;
					done();
				}
			}, nonext);
		});
		it('user cannot change the collection status to "PUBLISHED" if he is not admin', function(done) {
			req.body.status = 'PUBLISHED';
			req.current_user = new User({ permissions: {} });
			CollectionCtrl.setCollectionStatus(req, {
				send: function(status, body) {
					expect(status).to.equal(403);
					expect(body).to.not.exist;
					done();
				}
			}, nonext);
		});
		it('user can change the collection status to "PUBLISHED" if he is admin', function(done) {
			req.body.status = 'PUBLISHED';
			req.current_user = new User({ permissions: { '507f1f77bcf86cd799439011': { admin: true } } });
			CollectionCtrl.setCollectionStatus(req, {
				send: function(status, body) {
					expect(status).to.equal(200);
					expect(body).to.have.property('collection');
					expect(body.collection).to.have.property('status');
					expect(body.collection.status).to.equal('PUBLISHED');
					done();
				}
			}, nonext);
		});
	});
	describe('make topstory', function() {
		var account;
		before(function(done) {
			account = new Account({
				name: "Gymnasium Delitzsch",
				title: "mein_testaccount_so_und_so_weiter_bla_bla",
				urls: ["mport.al", "gymnasium-delitzsch"]
			})
			account.save(done);
		});
		it('has makeTopstory function', function () {
			expect(CollectionCtrl).to.have.property('makeTopstory');
			expect(CollectionCtrl.addLike).to.be.a('function');
		});
		it('should return a 400 error if no collection_id is given', function() {
			var req = {
				account: account,
				param: function(name) { return this.params[name]; },
				params: { }
			}
			CollectionCtrl.makeTopstory(req, { send: function(status, body) {
				expect(status).to.equal(400);
			} }, nonext);
		});
		it('should return a 401 error if user is not logged in', function() {
			var req = {
				account: account,
				param: function(name) { return this.params[name]; },
				params: { }
			}
			CollectionCtrl.makeTopstory(req, { send: function(status, body) {
				expect(status).to.equal(400);
			} }, nonext);
		});
		it('should return a 403 error if user is not admin is given', function() {
			var req = {
				account: account,
				param: function(name) { return this.params[name]; },
				params: { },
				current_user: new User({ permissions: {} })
			}
			CollectionCtrl.makeTopstory(req, { send: function(status, body) {
				expect(status).to.equal(400);
			} }, nonext);
		});
		it('should make a story topstory', function() {
			var req = {
				account: account,
				param: function(name) { return this.params[name]; },
				params: { collection_id: newCollection.id },
				current_user: new User({ permissions: {} })
			};
			req.current_user.account_id = account.id;
			req.current_user.permissions[account.id] = { admin: true };
			CollectionCtrl.makeTopstory(req, { send: function(status, body) {
				expect(status).to.equal(200);
			} }, nonext);
		});
	});
	describe('liking an album', function () {
		var req;
		beforeEach(function() {
			req = {
				param: function(name) { return this.params[name]; },
				params: { collection_id: newCollection.id },
				connection: { remoteAddress: '127.0.0.1' }
			}
		});
		describe('with a logged in user', function() {

			before(function(done) {
				User.create({
					first_name: 'Alexis',
					last_name: 'Rinaldoni',
					name: 'Alexis Rinaldoni',
					email: 'tim.cookie@me.com',
					permissions: { '507f1f77bcf86cd799439011': { admin: true } },
					account_id: '507f1f77bcf86cd799439011'
				}, function(_err, _user) {
					if (_err) throw _err;
					loggedInUser = _user;
					done();
				});
			});

			it('should add a like', function (done) {
				req.current_user = loggedInUser;
				var res = {
					send: function(status, body) {
						expect(status).to.equal(200);
						expect(body).to.have.property('collection');
						expect(body.collection.likes.length).to.equal(1);
						expect(body.collection.likes[0]).to.equal(loggedInUser.id);
						done();
					}
				};
				CollectionCtrl.addLike(req, res, done);
			});
			it('should remove a like', function (done) {
				req.current_user = loggedInUser;
				var res = {
					send: function(status, body) {
						expect(status).to.equal(200);
						expect(body).to.have.property('collection');
						expect(body.collection.likes.length).to.equal(0);
						done();
					}
				};
				CollectionCtrl.addLike(req, { send: function(status) {
					expect(status).to.equal(200);
					CollectionCtrl.addLike(req, res, function(_err) { throw _err; });
				} }, function(_err) { throw _err; });
			});
		});
		describe('with an anonymous user', function() {

			it('should add a like', function (done) {
				var res = {
					send: function(status, body) {
						expect(status).to.equal(200);
						expect(body).to.have.property('collection');
						expect(body.collection.likes.length).to.equal(1);
						expect(body.collection.likes[0]).to.equal('custom:127.0.0.1');
						done();
					}
				};
				CollectionCtrl.addLike(req, res, done);
			});
			it('should remove a like', function (done) {
				req.current_user = loggedInUser;
				var res = {
					send: function(status, body) {
						expect(status).to.equal(200);
						expect(body).to.have.property('collection');
						expect(body.collection.likes.length).to.equal(0);
						done();
					}
				};
				CollectionCtrl.addLike(req, { send: function(status) {
					expect(status).to.equal(200);
					CollectionCtrl.addLike(req, res, function(_err) { throw _err; });
				} }, function(_err) { throw _err; });
			});
		});
	});
	describe('liking a collectionfile', function () {
		var req;
		beforeEach(function() {
			req = {
				param: function(name) { return this.params[name]; },
				params: {
					collection_id: collectionWithFiles.id,
					file_id: collectionWithFiles.files[0]._id
				},
				connection: { remoteAddress: '127.0.0.1' }
			}
		});
		it('should return a 400 if no collection_id is given', function(done) {
			req.params.collection_id = undefined;
			CollectionCtrl.addLikeToFile(req, { send: function(status, body) {
				expect(status).to.equal(400);
				done();
			} }, nonext);
		});
		it('should return a 400 if no file_id is given', function(done) {
			req.params.file_id = undefined;
			CollectionCtrl.addLikeToFile(req, { send: function(status, body) {
				expect(status).to.equal(400);
				done()
			} }, nonext);
		});
		it('should return a 404 if collection does not exist', function(done) {
			req.params.collection_id = '507f1f77bcf86cd799439999';
			CollectionCtrl.addLikeToFile(req, { send: function(status, body) {
				expect(status).to.equal(404);
				done()
			} }, nonext);
		});
		describe('with a logged in user', function() {
			var loggedInUser;
			before(function(done) {
				User.create({
					first_name: 'Alexis',
					last_name: 'Rinaldoni',
					name: 'Alexis Rinaldoni',
					email: 'arinaldoni@me.com',
					permissions: { '507f1f77bcf86cd799439011': { admin: true } },
					account_id: '507f1f77bcf86cd799439011'
				}, function(_err, _user) {
					if (_err) throw _err;
					loggedInUser = _user;
					done();
				});
			});

			it('should add a like', function (done) {
				req.current_user = loggedInUser;
				var res = {
					send: function(status, body) {
						expect(status).to.equal(200);
						expect(body).to.have.property('collection');
						expect(body.collection.files[0].likes.length).to.equal(1);
						expect(body.collection.files[0].likes[0]).to.equal(loggedInUser.id.toString());
						expect(body).to.have.property('collectionfile');
						expect(body.collectionfile.likes.length).to.equal(1);
						expect(body.collectionfile.likes[0]).to.equal(loggedInUser.id.toString());
						done();
					}
				};
				CollectionCtrl.addLikeToFile(req, res, done);
			});
			it('should remove a like', function (done) {
				req.current_user = loggedInUser;
				var res = {
					send: function(status, body) {
						expect(status).to.equal(200);
						expect(body).to.have.property('collection');
						expect(body.collection.files[0].likes.length).to.equal(0);
						expect(body).to.have.property('collectionfile');
						expect(body.collectionfile.likes.length).to.equal(0);
						done();
					}
				};
				CollectionCtrl.addLikeToFile(req, { send: function(status, body) {
					expect(status).to.equal(200);
					CollectionCtrl.addLikeToFile(req, res, nonext);
				} }, function(_err) { throw _err; });
			});
		});
		describe('with an anonymous user', function() {

			it('should add a like', function (done) {
				req.current_user = undefined;
				var res = {
					send: function(status, body) {
						expect(status).to.equal(200);
						expect(body).to.have.property('collection');
						expect(body.collection.files[0].likes.length).to.equal(1);
						expect(body.collection.files[0].likes[0]).to.equal('custom:127.0.0.1');
						expect(body).to.have.property('collectionfile');
						expect(body.collectionfile.likes.length).to.equal(1);
						expect(body.collectionfile.likes[0]).to.equal('custom:127.0.0.1');
						done();
					}
				};
				CollectionCtrl.addLikeToFile(req, res, done);
			});
			it('should remove a like', function (done) {
				req.current_user = undefined;
				var res = {
					send: function(status, body) {
						expect(status).to.equal(200);
						expect(body).to.have.property('collection');
						expect(body.collection.files[0].likes.length).to.equal(0);
						expect(body).to.have.property('collectionfile');
						expect(body.collectionfile.likes.length).to.equal(0);
						done();
					}
				};
				CollectionCtrl.addLikeToFile(req, { send: function(status, body) {
					expect(status).to.equal(200);
					CollectionCtrl.addLikeToFile(req, res, nonext);
				} }, function(_err) { throw _err; });
			});
		});
	});
	describe('commenting', function () {
		var req;
		beforeEach(function() {
			req = {
				param: function(name) { return this.params[name]; },
				body: { comment: { content: 'test test test' } },
				account: { id: '4cdfb11e1f3c000000007822' },
				headers: { 'user-agent': 'Panda Test 0.2' },
				params: { collection_id: collectionWithFiles.id, file_id: collectionWithFiles.files[0].id },
				connection: { remoteAddress: '127.0.0.1' }
			}
		});
		describe('with a logged in user', function() {

			before(function(done) {
				User.create({
					first_name: 'Alexis',
					last_name: 'Rinaldoni',
					name: 'Alexis Rinaldoni',
					email: 'speakingmaster@me.com',
					permissions: { 'a1b2c3': { admin: true } },
					account_id: 'a1b2c3'
				}, function(_err, _user) {
					if (_err) throw _err;
					loggedInUser = _user;
					done();
				});
			});
			describe('creation', function() {
				it('should create a comment if all info is given', function (done) {
					req.current_user = loggedInUser;
					var res = {
						send: function(status, body) {
							expect(status).to.equal(200);
							expect(body).to.have.property('collection');
							expect(body.collection._id.toString()).to.equal(req.param('collection_id'));
							expect(body).to.have.property('comment');
							expect(body.comment.content).to.equal('test test test');
							expect(body.comment).to.have.property('author');
							expect(body.comment.author.author_type).to.equal('panda');
							expect(body.comment.author.author_id).to.equal(loggedInUser._id.toString());
							done();
						}
					};
					CollectionCtrl.addCommentToFile(req, res, done);
				});
				it('should create an activity when commenting', function (done) {
					req.current_user = loggedInUser;
					var res = {
						send: function(status, body) {
							expect(status).to.equal(200);
							expect(body.activity).to.exist;
							expect(body.activity.type).to.equal('comment');
							expect(body.activity.targets.length).to.equal(1);
							expect(body.activity.targets[0].item_id.toString()).to.equal(body.collection._id.toString());
							expect(body.activity.trigger.author_type).to.equal('panda');
							expect(body.activity.trigger.author_id).to.equal(loggedInUser.id);
							expect(body.activity.targets[0].comment_id.toString()).to.equal(body.comment._id.toString());
							done();
						}
					};
					CollectionCtrl.addCommentToFile(req, res, done);
				});
				it('should not create a comment if no content', function (done) {
					req.current_user = loggedInUser;
					req.body.comment.content = undefined;
					var res = {
						send: function(status, body) {
							expect(status).to.equal(400);
							expect(body).to.not.exist;
							done();
						}
					};
					CollectionCtrl.addCommentToFile(req, res, done);
				});
				it('should not create no account is given', function (done) {
					req.current_user = loggedInUser;
					req.account = undefined;
					var res = {
						send: function(status, body) {
							expect(status).to.equal(400);
							expect(body).to.not.exist;
							done();
						}
					};
					CollectionCtrl.addCommentToFile(req, res, done);
				});
			});
		});
		describe('with an anonymous user', function() {
			it('should create a comment if all info is given', function (done) {
				var res = {
					send: function(status, body) {
						expect(status).to.equal(200);
						expect(body).to.have.property('collection');
						expect(body.collection._id.toString()).to.equal(req.param('collection_id'));
						expect(body).to.have.property('comment');
						expect(body.comment.content).to.equal('test test test');
						expect(body.comment).to.have.property('author');
						expect(body.comment.author.author_type).to.equal('custom');
						expect(body.comment.author.author_id).to.equal('Gast');
						done();
					}
				};
				CollectionCtrl.addCommentToFile(req, res, done);
			});
			it('should create a comment with a custom author name', function (done) {
				req.body.comment.author = { author_id: 'Mein Eigener Name' };
				var res = {
					send: function(status, body) {
						expect(status).to.equal(200);
						expect(body).to.have.property('collection');
						expect(body.collection._id.toString()).to.equal(req.param('collection_id'));
						expect(body).to.have.property('comment');
						expect(body.comment.content).to.equal('test test test');
						expect(body.comment).to.have.property('author');
						expect(body.comment.author.author_type).to.equal('custom');
						expect(body.comment.author.author_id).to.equal('Mein Eigener Name');
						done();
					}
				};
				CollectionCtrl.addCommentToFile(req, res, done);
			});
			it('should create an activity when commenting', function (done) {
					req.body.comment.author = { author_id: 'Mein Eigener Name' };
					var res = {
						send: function(status, body) {
							expect(status).to.equal(200);
							expect(body.activity).to.exist;
							expect(body.activity.type).to.equal('comment');
							expect(body.activity.targets.length).to.equal(1);
							expect(body.activity.targets[0].item_id.toString()).to.equal(body.collection._id.toString());
							expect(body.activity.trigger.author_type).to.equal('custom');
							expect(body.activity.trigger.author_id).to.equal('Mein Eigener Name');
							expect(body.activity.targets[0].comment_id.toString()).to.equal(body.comment._id.toString());
							done();
						}
					};
					CollectionCtrl.addCommentToFile(req, res, done);
				});
			it('should not create a comment if no content', function (done) {
				req.body.comment.content = undefined;
				var res = {
					send: function(status, body) {
						expect(status).to.equal(400);
						expect(body).to.not.exist;
						done();
					}
				};
				CollectionCtrl.addCommentToFile(req, res, done);
			});
			it('should not create no account is given', function (done) {
				req.account = undefined;
				var res = {
					send: function(status, body) {
						expect(status).to.equal(400);
						expect(body).to.not.exist;
						done();
					}
				};
				CollectionCtrl.addCommentToFile(req, res, done);
			});
		});
	});
});
