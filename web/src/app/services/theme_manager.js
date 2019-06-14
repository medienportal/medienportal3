'use strict';

class MP3Theme {
	constructor(additionalStyles, options = {}) {
		this.styles = additionalStyles;
		this.title = options.title;
		this.image = options.image;
		this.uniqueId = options.uniqueId || 'standard';
	}
	getStyles() {
		return this.styles;
	}
}

var themes = [
	new MP3Theme( // rot und punkte
		``,
		{
			title: 'Standard',
			image: '/assets/images/themes/theme_01.png',
			uniqueId: 'standard'
		}
	),
	new MP3Theme( // rot und punkte
		`
			body {
				background-color: #FFF4D8;
				background-image: url(/assets/images/bg_04.png);
			}
			.pagebody .intro {
					background: #7384B2;
			}
			.pagebody h3 {
				background: #7384B2;
			}
			.pagebody {
  				border: 1px solid #7384B2;
			}
		`,
		{
			title: 'Beige Sahne',
			image: '/assets/images/themes/theme_02.png',
			uniqueId: 'beige1'
		}
	),
	new MP3Theme( // schwarz un weiß
		`
			body {
				background-image: url(/assets/images/bg_08.png);
				background-color: #fff;
			}
			.pagebody .intro {
					background: #EFEFEF;
					color: #333;
			}
			.pagebody h3 {
				background: #EFEFEF;
				color: #333;
			}
			.pagebody {
  				border: 1px solid #EFEFEF;
			}
		`,
		{
			title: 'retro B/W',
			image: '/assets/images/themes/theme_03.png',
			uniqueId: 'bw1'
		}
	),
	new MP3Theme( // grünn braun
		`
			body {
				background-image: url(/assets/images/bg_11.png);
				background-color: #a9d8b2;
			}
			.pagebody .intro {
					background: #185A48;
			}
			.pagebody h3 {
				background: #185A48;
			}
			.pagebody {
  				border: 1px solid #185A48;
			}
		`,
		{
			title: 'Grüner Hulk',
			image: '/assets/images/themes/theme_04.png',
			uniqueId: 'medecine'
		}
	)
];

var LayoutManagerService = function($rootScope, $sce, DataCache) {
	var service = {
		currentTheme: null,
		setTheme(theme) {
			this.currentTheme = theme;
		},
		getStyles() {
			return $sce.trustAs('css', this.currentTheme.getStyles());
		},
		setThemeById(id) {
			var found = themes.filter(theme => theme.uniqueId === id);
			if (found.length > 0) {
				this.setTheme(found[0]);
			} else {
				this.setThemeById('standard');
			}
			if (!$rootScope.$$phase) {
				$rootScope.$apply();
			}
		},
		getAvailableThemes() {
			return themes;
		},
		loadInitialTheme() {
			this.setThemeById(DataCache.account.getConfig('Mp3ThemeUniqueId') || 'standard');
		},
		saveCurrentTheme() {
			var i = themes.indexOf(this.currentTheme);
			if (i > -1) {
				DataCache.account.setConfig('Mp3ThemeUniqueId', this.currentTheme.uniqueId);
			}
		}
	};
	service.loadInitialTheme();
	return service;
};

export default LayoutManagerService;
