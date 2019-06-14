var assert = chai.assert;

describe('Message model', function() {
	var Message;
	beforeEach(module('medienportal.services'));
  beforeEach(module('medienportal.factories'));
  beforeEach(module('angularFileUpload'));
	beforeEach(inject(function($injector) {
		Message = $injector.get('Message');
	}))
	it('can get id', function() {
		var message = new Message({_id: 123456});
		assert.equal(message.id, 123456);
	});
  it('can set id', function() {
    var message = new Message();
    message.id = 6789;
    assert.equal(message._id, 6789);
  });
});
