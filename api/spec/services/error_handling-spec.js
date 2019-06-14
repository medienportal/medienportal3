var config = require('../../config'),
	errorHandler = require('../../service/error_handling'),
	chai = require('chai'),
	expect = chai.expect;

describe('error handling middleware', function() {
	var err, req, res, next;
	beforeEach(function() {
		err = {};
		req = {};
		res = {};
		next = function() {};
		nonext = function() { throw new Error('should not have been called!'); }
	});
	it('should return the right status code it was given', function(done) {
		err = { status: 404 };
		res.send = function(status, body) {
			expect(status).to.equal(404);
			expect(body).to.have.property('shortCode');
			expect(body).to.have.property('message');
			done();
		}
		errorHandler(err, req, res, nonext);
	});
});