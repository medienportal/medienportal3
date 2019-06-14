'use strict';

import { hasMongoId } from '../../../services/class_extensions.js';

var ActivityFactory = function() {

	class Activity {
		constructor(options = {}) {
			this._id = options._id || null;
			this.trigger = options.trigger || null;
			this.type = options.type || null;
			this.content = options.content || null;
			this.targets = options.targets || [];
			this.created_at = new Date(options.created_at) || null;
			hasMongoId(this);
		}
		update(data) {
			var activity = this;
			Object.keys(this).forEach(function(key) {
				activity[key] = data[key];
			});
		}
	}

	return Activity;
};

export default ActivityFactory;
