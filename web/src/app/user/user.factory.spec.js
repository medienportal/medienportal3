'use strict';

describe('user model', function(){
	var User, Page, Collection;

	beforeEach(module('medienportal'));

	beforeEach(inject(function($injector) {
		User = $injector.get('User');
		Page = $injector.get('Page');
		Collection = $injector.get('Collection');
	}));

	var currentAccount = {
		_id: 'acc789654',
		id: 'acc789654'
	};
	window.currentAccount = currentAccount;

	describe('property assignments and returns', function() {
		it('should create a new user with important properties', function() {
			var options = {
				_id: 'abc',
				first_name: 'Alexis',
				last_name: 'Rinaldoni',
				klass: '5/4',
				email: 'alexis.rinaldoni@gmail.com',
				permissions: {},
				notValid: 'test457'
			};
			var user = new User(options);
			expect(user._id).toEqual('abc');
			expect(user.first_name).toEqual('Alexis');
			expect(user.last_name).toEqual('Rinaldoni');
			expect(user.klass).toEqual('5/4');
			expect(user.email).toEqual('alexis.rinaldoni@gmail.com');
			expect(user.permissions).toEqual({});
			expect(user.notValid).toEqual(undefined);
			expect(user.description).toEqual('');
		});

		it('should compute "name" property correctly', function() {
			var user = new User({
				first_name: 'Alexis',
				last_name: 'Rinaldoni'
			});
			expect(user.name).toEqual('Alexis Rinaldoni');
		});

		it('should have correct id property', function() {
			var user = new User({
				_id: '45678'
			});
			expect(user.id).toEqual('45678');
		});

		it('should update correctly', function() {
			var user = new User({
				first_name: 'the',
				last_name: 'King',
				email: 'theking@king.com'
			});
			user.update({
				first_name: 'Alexis',
				last_name: 'Rinaldoni',
				email: 'alexis.rinaldoni@gmail.com',
				inValid: 'this is not a valid property and should not be set.'
			});
			expect(user.first_name).toEqual('Alexis');
			expect(user.last_name).toEqual('Rinaldoni');
			expect(user.email).toEqual('alexis.rinaldoni@gmail.com');
			expect(user.name).toEqual('Alexis Rinaldoni');
			expect(user.inValid).toBeUndefined();
		});
	});

	describe('right managment', function() {
		var page;
		beforeEach(function() {
			page = new Page({
				_id: 'p765',
				title: 'Eine Seite',
				date: new Date(),
				status: '',
				category_id: 'c5678',
				subcategory_id: null,
				account_id: currentAccount._id
			});
		});
		it('should be able to create item if he is admin for the page\'s account', function() {
			var user = new User({
				permissions: { acc789654: {
					admin: true
				} }
			});
			expect(user.canCreatePage('c5678', 'acc789654')).toEqual(true);
		});
		it('should not be able to create item if he is admin for another as the page\'s account', function() {
			var user = new User({
				permissions: { acc789654: {
				}, acc98989898: {
					admin: true
				} }
			});
			expect(user.canCreatePage('c5678', 'acc789654')).toEqual(false);
		});
		it('should be able to create item if he has create right for the page\'s account and the category', function() {
			var user = new User({
				permissions: { acc789654: {
					c5678: {
						create: true
					}
				} }
			});
			expect(user.canCreatePage('c5678', 'acc789654')).toEqual(true);
		});
		it('should be not able to create item if he has no create right for the page\'s account and category', function() {
			var user = new User({
				permissions: {}
			});
			expect(user.canCreatePage('c5678', 'acc789654')).toEqual(false);
		});
		it('should be not able to create item if he has create right for the page\'s account and another category', function() {
			var user = new User({
				permissions: { acc789654: {
					c6666: {
						create: true
					}
				} }
			});
			expect(user.canCreatePage('c5678', 'acc789654')).toEqual(false);
		});
		it('should be able to edit item if he is admin for the page\'s account', function() {
			var user = new User({
				permissions: { acc789654: {
					admin: true
				} }
			});
			expect(user.canEditPage(page)).toEqual(true);
		});
		it('should not be able to edit item if he is amin for another account', function() {
			var user = new User({
				permissions: { acc789654: {
				},
				acc897654: {
					admin: true
				}}
			});
			expect(user.canEditPage(page)).toEqual(false);
		});
		it('should be able to edit item if he has the edit right for account and category', function() {
			var user = new User({
				permissions: { acc789654: {
					c5678: {
						edit: true
					}
				},
					acc897654: {
						admin: true
					}}
			});
			expect(user.canEditPage(page)).toEqual(true);
		});
		it('should not be able to edit item if he has the edit right for account but other category', function() {
			var user = new User({
				permissions: { acc789654: {
					c666: {
						edit: true
					}
				},
					acc897654: {
						admin: true
					}}
			});
			expect(user.canEditPage(page)).toEqual(false);
		});
		it('should not be able to edit item if he has the create right for account, but is not page\' s author', function() {
			var user = new User({
				permissions: { acc789654: {
					c5678: {
						create: true
					}
				},
					acc897654: {
						admin: true
					}}
			});
			expect(user.canEditPage(page)).toEqual(false);
		});
		it('should be able to edit item if he is the author of the item', function() {
			var user = new User({
				_id: 'us6754',
				permissions: { acc789654: {
					c5678: {
						create: false,
						edit: false
					}
				},
					acc897654: {
						admin: true
					}}
			});
			page.author = [{
				author_type: 'panda',
				author_id: user.id
			}];
			expect(user.canEditPage(page)).toEqual(true);
		});
		it('should be able to set the account the controlled if it has right', function() {
			var user = new User({
				_id: 'us6754',
				permissions: { acc789654: {
					c5678: {
						edit: false,
						setControlled: true
					}
				},
					acc897654: {
						admin: true
					}}
			});
			page.author = [{
				author_type: 'panda',
				author_id: user.id
			}];
			expect(user.canSetControlled(page)).toEqual(true);
			expect(user.can('setControlled', 'c5678', 'acc789654')).toEqual(true);
		});
		it('should be able to set the account the controlled if he is admin', function() {
			var user = new User({
				_id: 'us6754',
				permissions: { acc789654: {
					admin: true
				},
				acc897654: {
					admin: true
				}}
			});
			page.author = [{
				author_type: 'panda',
				author_id: user.id
			}];
			expect(user.canSetControlled(page)).toEqual(true);
			expect(user.can('setControlled', 'c5678', 'acc789654')).toEqual(true);
		});
		it('should be able to set the account the published if it has right', function() {
			var user = new User({
				_id: 'us6754',
				permissions: { acc789654: {
					c5678: {
						edit: false,
						setControlled: false,
						setPublished: true
					}
				},
					acc897654: {
						admin: true
					}}
			});
			page.author = [{
				author_type: 'panda',
				author_id: user.id
			}];
			expect(user.canSetPublished(page)).toEqual(true);
			expect(user.can('setPublished', 'c5678', 'acc789654')).toEqual(true);
		});
		it('should be able to set the account the published if he is admin', function() {
			var user = new User({
				_id: 'us6754',
				permissions: { acc789654: {
					admin: true
				},
					acc897654: {
						admin: true
					}}
			});
			page.author = [{
				author_type: 'panda',
				author_id: user.id
			}];
			expect(user.canSetPublished(page)).toEqual(true);
			expect(user.can('setPublished', 'c5678', 'acc789654')).toEqual(true);
		});
		it('should be able to delete the item if it has right', function() {
			var user = new User({
				_id: 'us6754',
				permissions: { acc789654: {
					c5678: {
						edit: false,
						delete: true
					}
				},
					acc897654: {
						admin: true
					}}
			});
			expect(user.canDelete(page)).toEqual(true);
		});
		it('should be able to set the account the published if he is admin', function() {
			var user = new User({
				_id: 'us6754',
				permissions: {
					acc789654: {
						admin: true
					},
					acc897654: {
						admin: true
					}
				}
			});
			expect(user.canDelete(page)).toEqual(true);
		});
	});

	describe('.isCoworker', function() {
		describe('for the current account', function() {
			it('should return true if user is admin', function() {
				var user = new User({
					_id: 'us6754',
					permissions: {
						acc789654: {
							admin: true
						},
						acc897654: {
							admin: true
						}
					}
				});
				expect(user.isCoworker()).toEqual(true);
			});
			it('should return false if user is nothing', function() {
				var user = new User({
					_id: 'us6754',
					permissions: {
						acc789654: {},
						acc897654: {
							admin: true
						}
					}
				});
				expect(user.isCoworker()).toEqual(false);
			});
			it('should return true if user can edit a category', function() {
				var user = new User({
					_id: 'us6754',
					permissions: {
						acc789654: {
							cat67549: {
								edit: true
							}
						},
						acc897654: {
							admin: true
						}
					}
				});
				expect(user.isCoworker()).toEqual(true);
			});
			it('should return false if user can edit a category of another account', function() {
				var user = new User({
					_id: 'us6754',
					permissions: {
						acc789654: {
						},
						acc897654: {
							edit: true
						}
					}
				});
				expect(user.isCoworker()).toEqual(false);
			});
		});
		describe('for another account', function() {
			it('should return true if user is admin', function() {
				var user = new User({
					_id: 'us6754',
					permissions: {
						acc789654: {
							admin: true
						},
						acc897654: {
							admin: true
						}
					}
				});
				expect(user.isCoworker('acc897654')).toEqual(true);
			});
			it('should return false if user is nothing', function() {
				var user = new User({
					_id: 'us6754',
					permissions: {
						acc789654: {
							admin: true
						},
						acc897654: {}
					}
				});
				expect(user.isCoworker('acc897654')).toEqual(false);
			});
			it('should return true if user can edit a category', function() {
				var user = new User({
					_id: 'us6754',
					permissions: {
						acc789654: {
							admin: true
						},
						acc897654: {
							cat67549: {
								edit: true
							}
						}
					}
				});
				expect(user.isCoworker('acc897654')).toEqual(true);
			});
			it('should return false if user can edit a category of another account', function() {
				var user = new User({
					_id: 'us6754',
					permissions: {
						acc789654: {

						},
						acc897654: {
						}
					}
				});
				expect(user.isCoworker('acc897654')).toEqual(false);
			});
		});
	});

});
