var config = require('../config'),
	nodemailer = require('nodemailer'),
	sesTransport = require('nodemailer-ses-transport'),
	hbs = require('nodemailer-express-handlebars'),
	mailer = nodemailer.createTransport(sesTransport(config.amazon.ses)),
	path = require('path'),
	fs = require('fs');

mailer.use('compile', hbs({
	viewEngine: {
		partialsDir: path.join(__dirname, '../emails/partials'),
		defaultLayout: path.join(__dirname, '../emails/layout.handlebars')
	},
	viewPath: path.join(__dirname, '../emails/views')
}));

var Mailer = function(options) {
	this.options = options;
};

Mailer.prototype.send = function(callback) {
	if (!callback) {
		callback = function(err) { console.error(err); }
	}
	var options = this.options;
	options.from = options.from || 'Das Medienportal <support@medienportal.org>';

	mailer.sendMail(options, callback);
};

Mailer.PasswordRequestNotification = function(options) {
	if (!options.user) {
		throw new Error('No user given for Notification');
	}
	if (!options.link) {
		throw new Error('No link given for Notification');
	}
	var user = options.user,
		link = options.link;

	var mailerOptions = {
		template: 'user/pwreset',
		context: { user: user, link: link },
		to: user.email,
		subject: 'Dein neues Passwort für das Medienportal',
		text: 'Klicke auf folgenden Link um dein Passwort zurückzusetzen: ' + link
	};

	return new Mailer(mailerOptions);
};

Mailer.RegisterConfirmNotification = function(options) {
	if (!options.user) {
		throw new Error('No user given for Notification');
	}
	var user = options.user;

	var mailerOptions = {
		template: 'user/registration',
		context: { user: user },
		to: user.email,
		subject: 'Willkommen beim Medienportal.',
		text: 'Du wurdest erfolgreich beim Medienportal registriert.'
	};

	return new Mailer(mailerOptions);
};

Mailer.NotificationItemIsSetReady = function(options) {
	if (!options.user) {
		throw new Error('No user is set for notification');
	}
	if (!options.item) {
		throw new Error('No item is set for notification');
	}
	var item = options.item,
		user = options.user,
		link = options.link,
		author = options.author;

	var mailerOptions = {
		template: 'notification/item_is_set_ready',
		context: { item: item, link: link, user: user, author: author },
		to: user.email,
		subject: 'Ein neuer Artikel wurde fertiggestellt.',
		text: 'Ein neuer Artikel wurde fertiggestellt.'
	};

	return new Mailer(mailerOptions);

};

module.exports = Mailer;
