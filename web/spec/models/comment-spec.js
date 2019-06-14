var assert = chai.assert;

describe('Comment model', function() {
	var Comment;
	beforeEach(module('medienportal.services'));
  beforeEach(module('medienportal.factories'));
  beforeEach(module('angularFileUpload'));
	beforeEach(inject(function($injector) {
		Comment = $injector.get('Comment');
	}))
	it('can get id', function() {
		var comment = new Comment({_id: 123456});
		assert.equal(comment.id, 123456);
	});
  it('can set id', function() {
    var comment = new Comment();
    comment.id = 6789;
    assert.equal(comment._id, 6789);
  });
});
