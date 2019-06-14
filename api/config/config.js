module.exports = {
	"cors": {
		"allow_origin": process.env.CORS_ALLOWED_ORIGIN_HEADER
	},
	"app_url": process.env.APP_URL,
	"mongo": {
		"db": process.env.MONGO_URL
	},
	"elasticsearch": {
		"hosts": [
			process.env.ELASTICSEARCH_HOST
		]
	},
	"redis": {
		"host": process.env.REDIS_HOST,
		"port": process.env.REDIS_PORT,
		"password": process.env.REDIS_PASSWORD,
		"db": Number(process.env.REDIS_DB)
	},
	"rollbar": {
		"key": process.env.ROLLBAR_KEY
	},
	"amazon": {
		"s3": {
			"key": process.env.AWS_KEY,
			"secret": process.env.AWS_SECRET,
			"region": process.env.AWS_REGION,
			"bucket": process.env.S3_BUCKET_NAME
		},
		"cloudfront": {
			"url": process.env.CDN_URL
		},
		"ses": {
			"accessKeyId": process.env.AWS_KEY,
			"secretAccessKey": process.env.AWS_SECRET,
			"region": process.env.AWS_REGION,
			"rateLimit": 1
		}
	},
	"soundcloud": {
		"endpoint": process.env.SOUNDCLOUD_ENDPOINT,
		"client_id": process.env.SOUNDCLOUD_CLIENTID,
		"client_secret": process.env.SOUNDCLOUD_SECRET,
		"username": process.env.SOUNDCLOUD_USERNAME,
		"password": process.env.SOUNDCLOUD_PASSWORD
	},
	"google": {
		"clientId": process.env.GOOGLE_CLIENTID,
		"clientSecret": process.env.GOOGLE_SECRET
	},
	"mandrill": {
		"key": process.env.MANDRILL_KEY
	},
	"zencoder": {
		"key": process.env.ZENCODER_KEY
	},
	"pusher": {
		"app_id": process.env.PUSHER_APP_ID,
		"app_key": process.env.PUSHER_APP_KEY,
		"app_secret": process.env.PUSHER_APP_SECRET
	}
}