var config = require('../config'),
	async = require('async'),
	User = require('../model/user');

var PM = function(user, account) {
	this._user = user;
	this._account_id = account && account.id;
}

PM.prototype.user = function(user) {
	if (user) {
		this._user = user;
		return this;
	} else {
		return this._user;
	}
}
PM.prototype.account = function(account) {
	if (account) {
		this._account_id = account.id;
		return this;
	}
}
PM.prototype.accountId = function(accountId) {
	if (accountId) {
		this._account_id = accountId;
		return this;
	}
}
PM.prototype.getPermissions = function() {
	if (this._account_id && this._user && this._user.permissions) {
		return this._user.permissions[this._account_id] || {};
	}
	return {};
}
PM.prototype.isAdmin = function() {
	return this.getPermissions().admin === true;
}
PM.prototype.can = function(action, item) {
	// action can be 'create', 'edit', 'delete', 'setControlled', 'setPublished'
	// if admin for current account, return always true
	if (!this._account_id && item.account_id) {
		this._account_id = item.account_id;
	}
	if (this.isAdmin()) { return true; }
	// for create action, directly category permission
	var permissions = this.getPermissions();
	if (action === 'create') {
		if (permissions[item] && permissions[item].create === true) {
			return true;
		} else {
			return false;
		}
	}
	var item_category_id = item.category_id;
	if (item_category_id && permissions[item_category_id]) {
		return (permissions[item_category_id][action] === true);
	}
	return false;
}
new Array('create', 'edit', 'delete', 'setControlled', 'setPublished').forEach(function(action) {
	PM.prototype['can' + action.charAt(0).toUpperCase() + action.slice(1)] = (function(action) {
		return function(item) {
			return this.can(action, item);
		}
	})(action);
});

PM.user = function(user) {
	return new PM(user);
}
PM.account = function(account) {
	return new PM(null, account);
}

module.exports = PM;
