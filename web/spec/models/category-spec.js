var assert = chai.assert;

describe('Category model', function() {
	var Category;
	beforeEach(module('medienportal.services'));
  beforeEach(module('medienportal.factories'));
	beforeEach(inject(function($injector) {
		Category = $injector.get('Category');
	}))
	it('can get id', function() {
		var category = new Category({_id: 123456});
		assert.equal(category.id, 123456);
	});
  it('can set id', function() {
    var category = new Category();
    category.id = 6789;
    assert.equal(category._id, 6789);
  });
});
