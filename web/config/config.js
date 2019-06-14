module.exports = {
	api_endpoint: process.env.API_ENDPOINT,
	upload_endpoint: process.env.UPLOAD_ENDPOINT,
	MAX_SIMULTANIOUS_UPLOAD_REQUESTS: Number(process.env.MAX_SIMULTANIOUS_UPLOAD_REQUESTS),
	CDN_PATH: process.env.CDN_PATH,
	GA_TRACKING_CODE: process.env.GA_TRACKING_CODE,
	NODE_TLS_REJECT_UNAUTHORIZED: true,
	public_configuration: {
		app: {
			html5mode: true,
			hashprefix: '!',
			cookie_domain: process.env.COOKIE_DOMAIN
		},
		facebook: {
			appId: process.env.FACEBOOK_APPID
		},
		google: {
			clientId: process.env.GOOGLE_CLIENTID
		},
		pusher: {
			key: process.env.PUSHER_KEY
		},
		feedback_endpoint: process.env.FEEDBACK_ENDPOINT
	}
}