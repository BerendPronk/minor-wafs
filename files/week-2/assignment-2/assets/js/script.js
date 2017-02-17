(function () {

	var utils = {
		convertToArray: function(arr) {
			return Array.prototype.slice.call(arr);
		}
	};

	/*
		Source: Tutorial for native Javasript routing
		Author: Krasimir Tsonev
		URL: http://krasimirtsonev.com/blog/article/A-modern-JavaScript-router-in-100-lines-history-api-pushState-hash-url
	*/
	var Router = {
		routes: [],

		mode: null,

		root: '/',

		config: function(opts) {
			this.mode = opts && opts.mode && opts.mode == 'history'
						&& !!(history.pushState) ? 'history' : 'hash';
			this.root = opts && opts.root ? '/' + this.clearSlashes(opts.root) + '/' : '/';
			return this;
		},

		getSlug: function() {
			var slug = '';
			if (this.mode === 'history') {
				slug = this.clearSlashes(decodeURI(location.pathname + location.search));
				// regex to remove GET parameters
				slug = slug.replace(/\?(.*)$/, '');
				slug = this.root != '/' ? slug.replace(this.root, '') : slug;
			} else {
				var match = window.location.href.match(/#(.*)$/);
				slug = match ? match[1] : '';
			}
			return this.clearSlashes(slug);
		},

		// removes slashes of begin and end of string
		clearSlashes: function(path) {
			return path.toString().replace(/\$/, '').replace(/^\//, '');
		},

		// fills the routes array
		add: function(re, handler) {
			if (typeof re == 'function') {
				handler = re;
				re = '';
			}
			this.routes.push({ re: re, handler: handler} );
			return this;
		},

		// deleting of a route can only happen it matches a regular expression or the handler passed to the 'add' method
		remove: function(param) {
			for (var i = 0, r; i < this.routes.length, r = this.routes[i]; i++) {
				if (r.handler === param || r.re.toString() === param.toString()) {
					this.routes.splice(i, 1);
					return this;
				}
			}
			return this;
		},

		// clears the Class
		flush: function(param) {
			this.routes = [];
			this.mode = null;
			this.root = '/';
			return this;
		},

		check: function(f) {
			var slug = f || this.getSlug();
			for (var i = 0; i < this.routes.length; i++) {
				var match = slug.match(this.routes[i].re);
				if (match) {
					match.shift();
					this.routes[i].handler.apply({}, match);
					return this;
				}
			}
			return this;
		},

		listen: function() {
			var self = this;
			var current = self.getSlug();
			var fn = function() {
				if (current !== self.getSlug()) {
					current = self.getSlug();
					self.check(current);
				}
			};
			clearInterval(this.interval);
			this.interval = setInterval(fn, 50);
			return this;
		},

		navigate: function(path) {
			path = path ? path : '';
			if (this.mode === 'history') {
				history.pushState(null, null, this.root + this.clearSlashes(path));
			} else {
				window.location.href = window.location.href.replace(/#(.*)$/, '') + '#' + path;
			}

			this.show(this.clearSlashes(path));

			return this;
		},

		show: function(hash) {

			var sectionList = utils.convertToArray(document.querySelectorAll('.content'));

			sectionList.map(function(section) {
				section.id === hash ? section.classList.remove('hidden') : section.classList.add('hidden');
			});
		}
	};

	// configuration
	Router.config({
		// mode: 'hash'
		mode: 'history'
	});

	// return to the initial state
	Router.navigate();

	Router
		.add('', function() {
			console.log('intro');
		})
		.add(/results/, function() {
			console.log('results');
		})
		.add(/details/, function() {
			console.log('details');
		})
		.add(function() {
			console.log('default')
		})
		.check()

	Router.navigate('/intro');
	Router.show('intro');

	// shows which anchor is currently active
	var anchors = utils.convertToArray(document.querySelectorAll('nav a'));

	anchors.map(function(link) {
		link.addEventListener('click', function() {
			for (var j = 0; j < anchors.length; j++) {
				anchors[j].classList.remove('current');
			}
			this.classList.add('current');

			Router.navigate('/' + this.getAttribute('data-anchor'));
		});
	})

}) ();
