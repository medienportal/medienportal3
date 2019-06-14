'use strict';

export function hasMongoId(model) {
	Object.defineProperty(model, 'id', {
		get: function() {
			return this._id;
		},
		set: function(id) {
			this._id = id;
			return id;
		}
	});

	model.isNew = function() {
		return (this._id === null);
	};
}
