'user strict';

angular.module('mockedData')
	.value('singlePageMock', {
		page: {
			_id: '1a2b3c',
			likes: ['123', '456', '789'],
			comments: [],
			modules: []
		},
		modules: [],
		comments: []
	})
	.value('singlePageLikeMock', {
		page: {
			_id: '1a2b3c',
			likes: ['123', '456', '789', 'abc', 'custom:127.0.0.1'],
			comments: [],
			modules: []
		}
	})
	.value('userLoggedInMock', {
		name: 'Alexis Rinaldoni',
		first_name: 'Alexis',
		last_name: 'Rinaldoni',
		rightsmanagment: {'*': {'*': true}},
		email: 'arinaldoni@me.com',
		services: []
	});