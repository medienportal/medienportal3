var assert = chai.assert;

describe('Module model', function() {
	var Module;
	beforeEach(module('medienportal.services'));
  beforeEach(module('medienportal.factories'));
  beforeEach(module('angularFileUpload'));
	beforeEach(inject(function($injector) {
		Module = $injector.get('Module');
	}))
	it('can get id', function() {
		var module = new Module({_id: 123456});
		assert.equal(module.id, 123456);
	});
  it('can set id', function() {
    var module = new Module();
    module.id = 6789;
    assert.equal(module._id, 6789);
  });
});
