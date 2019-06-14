'use strict';

var ContentTransformerService = function($sce) {

	var getYoutubeEmbedCode = function(videoquery) {
		var videoId = videoquery.split('&')[0];
		var html =
			'<div class="iframe_embed_responsive">' +
			'<iframe src="//www.youtube.com/embed/' +
			videoId +
			'" frameborder="0" allowfullscreen></iframe>' +
			'</div>';
		return html;
	};

	return {
		detectLinks: function(text) {
			var trust = $sce.trustAsHtml;
			// youtube 1
			var yt1 =
				(function(text) {
					var regexp = /(https?:\/\/)?(www.)?youtu\.be\/(.*)/i,
						matches = text.match(regexp);
					if (matches) {
						return text.replace(regexp, getYoutubeEmbedCode(matches[matches.length - 1]));
					}
					return null;
				})(text);
			if (yt1) {
				return trust(yt1);
			}
			// youtube 2
			var yt2 =
				(function(text) {
					var regexp = /(https?:\/\/)?(www\.)?youtube\.com\/watch\?v=(.*)/i,
						matches = text.match(regexp);
					if (matches) { return text.replace(regexp, getYoutubeEmbedCode(matches[matches.length - 1])); }
				})(text);
			if (yt2) {
				return trust(yt2);
			}
			return text;
		}
	};
};

export default ContentTransformerService;
