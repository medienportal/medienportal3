'use strict';

class GreetingsCtrl {
	constructor(DataCache, Greeting, ContentTransformer, $route) {
		this.cache = DataCache;
		this.moment = moment;
		this.transform = ContentTransformer.detectLinks;
		this.newGreeting = {
			content: '',
			author: {
				author_id: ''
			}
		};
		this.Greeting = Greeting;
		this.$route = $route;
	}
	addGreeting() {
		var greeting = new this.Greeting({ content: this.newGreeting.content });
		if (!this.cache.current_user.isLoggedIn() && this.newGreeting.author.author_id) {
			greeting.author.author_id = this.newGreeting.author.author_id;
		}
		greeting.save().then((greeting) => {
			this.cache.greetings[greeting.id] = greeting;
			this.newGreeting = {};
			this.$route.reload();
		});
	}
	greetings() {
		return Object.keys(this.cache.greetings).map(greetid => this.cache.greetings[greetid]);
	}
	realignAllGreetings() {}
}
GreetingsCtrl.$inject = ['DataCache', 'Greeting', 'ContentTransformer', '$route'];

export default GreetingsCtrl;
