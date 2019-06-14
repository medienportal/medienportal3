'user strict';

var categories = [
	{
		"_id": "52adfb44e4b0d71646ad6571",
		"config": {
			"effect_wierd": true,
			"show_facebook_box": false,
			"facebook_box_url": "gd.schuelerzeitung"
		},
		"title": "Chamäleon",
		"created_at": "2014-02-05T18:53:58.837Z"
	},
	{
		"_id": "52c7fd7ae4b05704e7e33f9d",
		"config": {
			"pageType": "collectionPage"
		},
		"navigation": [
			{
				"title": "2014"
			},
			{
				"default": true,
				"title": "2013"
			},
			{
				"title": "2012"
			}
		],
		"title": "Fotos",
		"created_at": "2014-02-05T18:53:58.838Z"
	},
	{
		"_id": "52adfb32e4b0d71646ad6570",
		"config": {
			"pageType": "standardPage",
			"show_facebook_box": true,
			"facebook_box_url": "pages/PodcastAG/330261530456",
			"effect_wierd": false
		},
		"title": "Multimedia",
		"created_at": "2014-02-05T18:53:58.838Z"
	},
	{
		"_id": "52d84c5ce4b0756d1f0e2872",
		"config": {
			"pageType": "greetingsPage"
		},
		"title": "Grüße",
		"created_at": "2014-02-05T18:53:58.838Z"
	},
	{
		"_id": "52d84be0e4b0756d1f0e286d",
		"config": {
			"pageType": "collectionPage"
		},
		"title": "Kunst",
		"created_at": "2014-02-05T18:53:58.838Z"
	}];

angular.module('mockedData')
	.value('standardSetup', function(singleCollectionMock, singlePageMock) {
		return {
			homepage: {
				pages: [singlePageMock]
			},
			collections: {
				collections: [singleCollectionMock]
			},
			categories: {
				categories: categories
			},
			comments: [],
			users: {
				users: [
					{
						_id: '123',
						name: 'User123 User',
						email: 'user123@gmail.com',
						first_name: 'User123',
						last_name: 'User',
						services: [{service_name: 'facebook', identification: '123'}]
					},
					{
						_id: '456',
						name: 'Dagmar Hilde',
						email: 'dagmar@gmail.com',
						first_name: 'Dagmar',
						last_name: 'Hilde',
						services: [{service_name: 'facebook', identification: '456'}]
					},
					{
						_id: '789',
						name: 'Harry Potter',
						email: 'hp@hogwarts.magic',
						first_name: 'Harry',
						last_name: 'Potter',
						services: [{service_name: 'facebook', identification: '789'}]
					},
					{
						_id: 'abc',
						name: 'Tom Cruise',
						email: 'tommy@scientology.com',
						first_name: 'Tom',
						last_name: 'Cruise',
						services: [{service_name: 'facebook', identification: 'abc'}]
					}
				]
			},
			greetings: [],
			tags: []
		}
	});