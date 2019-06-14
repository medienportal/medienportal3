var assert = chai.assert;

describe('User model', function() {
	var User;
	beforeEach(module('medienportal.services'));
  beforeEach(module('medienportal.factories'));
	beforeEach(inject(function($injector) {
		User = $injector.get('User');
	}))
	it('can get id', function() {
		var user = new User({_id: 123456});
		assert.equal(user.id, 123456);
	});
  it('can set id', function() {
    var user = new User();
    user.id = 6789;
    assert.equal(user._id, 6789);
  });
});
