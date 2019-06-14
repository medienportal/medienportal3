var	express = require('express'),
	authentication = require('./controller/authentication'),
	pages = require('./controller/pages'),
	comments = require('./controller/comments'),
	greetings = require('./controller/greetings'),
	messages = require('./controller/messages'),
	categories = require('./controller/categories'),
	collections = require('./controller/collections'),
	users = require('./controller/users'),
	vplans = require('./controller/vplans'),
	events = require('./controller/events'),
	accounts = require('./controller/accounts'),
	trivias = require('./controller/trivias'),
    about = require('./controller/about'),
	pusher = require('./controller/pusher'),
    search = require('./controller/search'),
    admin = require('./controller/admin'),
    Cache = require('./service/cache');

exports.api = function(app) {

	var router = express.Router();

	router.get('/info.json', about.getInfo);

	router.get('/configuration.js', accounts.getPublicConfigurationJavascript);
	router.post('/feedback', accounts.feedback);

	router.get('/user/me', authentication.get_self);
	router.get('/users', users.list);
	router.post('/user',
		Cache.invalidateRouteMW('/users'),
		Cache.invalidateRouteMW('/home'),
		users.create);
	router.get('/user/:user_id', users.getOne);
	router.put('/user/:user_id',
		Cache.invalidateRouteMW('/user/:user_id'),
		Cache.invalidateRouteMW('/users'),
		Cache.invalidateRouteMW('/home'),
		users.update);
	router.put('/user/:user_id/permissions',
		Cache.invalidateRouteMW('/user/:user_id'),
		Cache.invalidateRouteMW('/home'),
		Cache.invalidateRouteMW('/users'),
		users.updatePermissions);
	router.post('/user/:user_id/avatar',
		Cache.invalidateRouteMW('/user/:user_id'),
		Cache.invalidateRouteMW('/users'),
		Cache.invalidateRouteMW('/home'),
		users.setAvatar);
	router.post('/password_request', Cache.invalidateRouteMW('/user/:user_id'), users.requestPwReset);
	router.post('/user/password', users.resetPW);
	router.post('/login/fb', authentication.via_fb);
	router.post('/login/google', authentication.via_google);
	router.post('/login/email', authentication.via_email);

	router.get('/home', accounts.homepage);
	router.get('/home/:user_id', accounts.getHomeForUser);
	router.get('/account', accounts.getCurrent);
	router.post('/account/banner', accounts.updateBannerImage);
	router.patch('/account/config', accounts.setConfig);

	router.get('/pages', pages.list);
	router.get('/tags', pages.tagList);
	router.post('/page', pages.create);
	router.get('/page/:page_id', pages.getOne);
	router.put('/page/:page_id', Cache.invalidateRouteMW('/page/:page_id'), pages.update);
	router.delete('/page/:page_id', Cache.invalidateRouteMW('/page/:page_id'), pages.remove);
	router.post('/page/:page_id/like',
		Cache.invalidateRouteMW('/page/:page_id'),
		Cache.invalidateRouteMW('/home'),
		pages.addLike);
	router.put('/page/:page_id/topstory',
		Cache.invalidateRouteMW('/home'),
		pages.makeTopstory);

	router.post('/page/:page_id/module', Cache.invalidateRouteMW('/page/:page_id'), pages.createModule);
	router.put('/page/:page_id/module/:module_id', Cache.invalidateRouteMW('/page/:page_id'), pages.updateModule);
	router.put('/page/:page_id/status',
		Cache.invalidateRouteMW('/page/:page_id'),
		Cache.invalidateRouteMW('/home'),
		pages.setPageStatus);
	router.delete('/page/:page_id/module/:module_id',
		Cache.invalidateRouteMW('/page/:page_id'),
		pages.removeModule);


	router.post('/page/:page_id/comment',
		Cache.invalidateRouteMW('/comments'),
		Cache.invalidateRouteMW('/page/:page_id'),
		Cache.invalidateRouteMW('/home'),
		pages.createComment);
	router.delete('/page/:page_id/comment/:comment_id',
		Cache.invalidateRouteMW('/comments'),
		Cache.invalidateRouteMW('/page/:page_id'),
		Cache.invalidateRouteMW('/home'),
		pages.removeComment);
	router.post('/page/:page_id/preview',
		Cache.invalidateRouteMW('/page/:page_id'),
		pages.updatePreviewImage);
	router.post('/page/:page_id/banner',
		Cache.invalidateRouteMW('/page/:page_id'),
		pages.updateBannerImage);

	router.get('/collections', collections.list);
	router.get('/collection/:collection_id', collections.getOne);
	router.post('/collection', collections.create);
	router.put('/collection/:collection_id', collections.update);
	router.delete('/collection/:collection_id',
		Cache.invalidateRouteMW('/collection/:collection_id'),
		Cache.invalidateRouteMW('/home'),
		collections.remove);
	router.put('/collection/:collection_id/status',
		Cache.invalidateRouteMW('/collection/:collection_id'),
		Cache.invalidateRouteMW('/home'),
		collections.setCollectionStatus);
	router.post('/collection/:collection_id/like', collections.addLike);
	router.put('/collection/:collection_id/topstory', collections.makeTopstory);
	router.post('/collection/:collection_id/preview', collections.updatePreviewImage);
	router.post('/collection/:collection_id/banner', collections.updateBannerImage);
	router.post('/collection/:collection_id/file', collections.addFile);
    router.put('/collection/:collection_id/file/:file_id', collections.updateFile);
	router.delete('/collection/:collection_id/file/:file_id', collections.removeFile);
	router.post('/collection/:collection_id/file/:file_id/comment',
		Cache.invalidateRouteMW('/comments'),
		Cache.invalidateRouteMW('/home'),
		collections.addCommentToFile);
	router.post('/collection/:collection_id/file/:file_id/like',
		Cache.invalidateRouteMW('/home'),
		collections.addLikeToFile);

	router.get('/comments', comments.list);
	router.post('/comment/:comment_id/report', comments.report);
	router.post('/comment/:comment_id/unreport', comments.unreport);
	router.get('/greetings', greetings.list);
	router.post('/greeting',
		Cache.invalidateRouteMW('/greetings'),
		greetings.create);

	router.get('/messages', messages.list);
	router.post('/message', messages.create);
	router.post('/message/:message_id/read', messages.read);

	router.get('/categories', categories.list);
	router.post('/category',
		Cache.invalidateRouteMW('/home'),
		categories.create);
	router.get('/category/:category_id',
		categories.getCategoryWithPagesAndCollectionsAndModules);
	router.put('/category/:category_id',
		Cache.invalidateRouteMW('/category/:category_id'),
		Cache.invalidateRouteMW('/home'),
		categories.update);
	router.post('/category/:category_id/banner',
		Cache.invalidateRouteMW('/category/:category_id'),
		Cache.invalidateRouteMW('/home'),
		categories.updateBannerImage);
	router.delete('/category/:category_id',
		Cache.invalidateRouteMW('/category/:category_id'),
		Cache.invalidateRouteMW('/home'),
		categories.remove);
	router.post('/category/:category_id/subcategory',
		Cache.invalidateRouteMW('/category/:category_id'),
		Cache.invalidateRouteMW('/home'),
		categories.addSubcategory);
	router.put('/category/:category_id/subcategory/:subcategory_id',
		Cache.invalidateRouteMW('/category/:category_id'),
		Cache.invalidateRouteMW('/home'),
		categories.editSubcategory);
	router.delete('/category/:category_id/subcategory/:subcategory_id',
		Cache.invalidateRouteMW('/category/:category_id'),
		Cache.invalidateRouteMW('/home'),
		categories.removeSubcategory);

	router.post('/category/:category_id/module', Cache.invalidateRouteMW('/category/:category_id'), categories.createModule);
	router.put('/category/:category_id/module/:module_id', Cache.invalidateRouteMW('/category/:category_id'), categories.updateModule);
	router.delete('/category/:category_id/module/:module_id',
		Cache.invalidateRouteMW('/category/:category_id'),
		categories.removeModule);

	router.get('/trivias', trivias.list);
	router.post('/trivia', trivias.create);
	router.put('/trivia/:trivia_id', trivias.update);
	router.delete('/trivia/:trivia_id', trivias.delete);

	router.post('/pusher/auth.json', pusher.authentication);

    router.get('/search', search.listPages);
    router.get('/search/user', search.listUsers);
    router.get('/web-meta', search.scrapeWebOpenGraph);

	// boxes
	router.get('/vplan', vplans.get);
	router.get('/events', events.get);

	// admin only
	router.get('/usage', admin.usage);
	return router;
};

exports.global = function(app) {
	var router = express.Router();

	router.get('/opensearch.xml', search.opensearch);

	router.get('/debug.json', function(req, res, next) {
    	res.send(200, {
    		headers: req.headers
    	});
    });

	return router;
}
