var assert = chai.assert;

describe('Greeting model', function() {
	var Greeting;
	beforeEach(module('medienportal.services'));
  beforeEach(module('medienportal.factories'));
  beforeEach(module('angularFileUpload'));
	beforeEach(inject(function($injector) {
		Greeting = $injector.get('Greeting');
	}))
	it('can get id', function() {
		var greeting = new Greeting({_id: 123456});
		assert.equal(greeting.id, 123456);
	});
  it('can set id', function() {
    var greeting = new Greeting();
    greeting.id = 6789;
    assert.equal(greeting._id, 6789);
  });
});
