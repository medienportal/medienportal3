'user strict';

angular.module('mockedData', [])
	.value('singleCollectionMock', {
		collection: {
			_id: '1a2b3c',
			likes: ['123', '456', '789'],
			comments: [],
			modules: []
		},
		modules: [],
		comments: []
	})
	.value('singleCollectionLikeMock', {
		collection: {
			_id: '1a2b3c',
			likes: ['123', '456', '789', 'abc'],
		}
	});
