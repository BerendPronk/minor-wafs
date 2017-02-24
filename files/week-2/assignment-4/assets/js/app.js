(function() {
	var dom = {
		input: document.querySelector('#search textarea'),
		submit: document.querySelector('#search input[type="submit"]'),
		loader: document.querySelector('#loader'),
		filter: document.querySelector('#filter'),
		filterInput: document.querySelector('#filter [type="checkbox"]'),
		storiesSubtitle: document.querySelector('#stories p'),
		results: document.querySelector('#results'),
		feedback: document.querySelector('#feedback'),
		synonymTitle: document.querySelector('#detail h2'),
		synonyms: document.querySelector('#synonyms')
	};

	var app = {

		init: function() {
			var pages = ['send', 'stories', 'detail'];

			template.render(pages);
			router.init('hash', pages);
			menu.render(pages);
		}
	};

	var request = {
		trigger: function(settings) {
			return new Promise(function(resolve, reject) {
				var req = new XMLHttpRequest();

				req.open(settings.type, settings.url);

				req.addEventListener('load', function() {
					if (this.status >= 200 && this.status < 400) {
						resolve(this.responseText);
					} else {
						reject({
							status: this.status,
							statusText: this.statusText
						});
					}
				});

				req.addEventListener('error', function() {
					reject({
						status: this.status,
						statusText: this.statusText
					});
				});

				req.send();
			});
		}
	};

	var story = {

		init: function(input) {
			var dataSet = JSON.parse(input);

			return dataSet.data;
		},

		// Will store sequence of words/gifs
		list: [],

		exists: function(state) {
			if (state) {
				dom.filter.classList.remove('hidden');
				dom.storiesSubtitle.textContent = '';
			} else {
				dom.filter.classList.add('hidden');
				dom.storiesSubtitle.textContent = 'No stories found';
			}
		},

		search: function() {
			event.preventDefault();

			// Prevents an API request if the user didn't give any input
			if (!dom.input.value.length) {
				return false;
			}

			// Shows loader
			dom.loader.classList.remove('hidden');

			// Removes 'No stories found' feedback and shows filter
			story.exists(true);

			// Sends 'POST' request to the Paralleldots keyword API
			request.trigger({
				type: 'POST',
				url:  'http://apis.paralleldots.com/keywords?q=' + dom.input.value + '&apikey=pIklELbRNqSO5ZUZCp8LclScsAaRw3dcKCp67xRsnJI'
			})
				.then(function(rawKeywords) {
					// Creates DOM-elements for to be added story
					var newStory = document.createElement('li');
					var newStoryList = document.createElement('ul');

					// Will store the length of the gif output array
					var gifCount;

					story.process(JSON.parse(rawKeywords));

					// Timeout to prevent function from executing to quickly
					setTimeout(function() {
						var indexArr = [];

						// Will store a number to rearrange duplicate indexes
						var newIndex;

						// Pushes index of every list-item in array to be sorted
						story.list.map(function(li) {
							indexArr.push(Number(li.getAttribute('data-index')));
						});

						// Sorts the index-array in order to check for doubles
						indexArr.sort(function(a, b) {
							return a - b;
						});

						// Sets new-index for each missing index in index-array
						for (var i = 0; i < indexArr[indexArr.length - 1]; i++) {
							if (i != indexArr[i]) {
								newIndex = i;
							}
						}

						// Sets double index to correct index
						story.list.map(function(li) {
							var index = Number(li.getAttribute('data-index'));

							// Checks if index is double and isn't the final occurance
							if ((indexArr[index] == indexArr[index + 1]) && indexArr[index] != indexArr[indexArr.length]) {
								// Sets correct index
								li.setAttribute('data-index', newIndex);

								// Removes target from index-array
								indexArr.splice(index, 1);
							}
						});

						// Sorts indexes by number
						story.list.sort(function(a, b) {
							return Number(a.getAttribute('data-index')) > Number(b.getAttribute('data-index')) ? 1 : -1;
						});

						// Applies newly arranged list with correct indexes
						story.list.map(function(li) {
							newStoryList.appendChild(li);
						});
						newStory.appendChild(newStoryList);
						dom.results.insertBefore(newStory, dom.results.firstChild);

						// Stores the story locally
						localStorage.setItem('stories', dom.results.innerHTML);

						// Navigates to the stories section
						router.navigate('stories');

						// Count the amount of gifs found for story
						gifCount = newStoryList.querySelectorAll('.gif').length;

						if (gifCount === 0) {
							utils.feedback('Found ' + gifCount + ' Gifs to enhance your story', 'negative');
						} else if (gifCount === 1) {
							utils.feedback('Found ' + gifCount + ' Gif to enhance your story!', 'positive');
						} else {
							utils.feedback('Found ' + gifCount + ' Gifs to enhance your story!', 'positive');
						}

						// Clears story-input
						utils.resetInput();
						story.list = [];

						// Refreshes filter on entry
						story.filter(false);
					}, 1000);
				})
				.catch(function(err) {
					console.error('Unfortunately, an error occurred: ', err.status);
				});
		},

		process: function(keywords) {
			// Will store every keyword
			var tagList = [];

			// More giphy's, no comma's
			// var storyTextArr = dom.input.value.replace(/,/g, '').split(' ');

			// Less giphy's, all comma's
			var storyTextArr = dom.input.value.split(' ');

			// Merges all the keywords in a single tag-array
			keywords.map(function(keyword) {
				var keywordArr = keyword[0].split(' ');

				tagList = tagList.concat(keywordArr);
			});

			storyTextArr.map(function(word) {
				// Checks if word exists in the taglist
				if (utils.checkArray(word, tagList) != -1) {
					// Sends 'GET' request to the Giphy API
					request.trigger({
						type: 'GET',
						url:  'http://api.giphy.com/v1/gifs/search?q=' + word + '&api_key=dc6zaTOxFJmzC'
					})
						.then(function(rawGiphy) {
							var data = story.init(rawGiphy);
							var rand = Math.floor(Math.random() * data.length);
							var newLi = document.createElement('li');

							newLi.setAttribute('data-index', utils.checkArray(word, storyTextArr));
							newLi.innerHTML = '<img src="http://i.giphy.com/' + data[rand].id + '.gif">' + '<span class="label">' + word + '</span>';
							newLi.classList.add('gif');
							newLi.addEventListener('click', function() {
								story.showDetails(word);
							});
							newLi.addEventListener('mouseover', function() {
								story.showLink(data[rand].url);
							});

							story.list.push(newLi);
						})
						.catch(function(err) {
							console.error('Unfortunately, an error occurred: ', err.status);
						});

					// Removes used tag from taglist
					tagList.splice(utils.checkArray(word, tagList), 1);
				} else {
					var newLi = document.createElement('li');

					newLi.textContent = word;
					newLi.setAttribute('data-index', utils.checkArray(word, storyTextArr));

					story.list.push(newLi);
				}
			});
		},

		filter: function(state) {
			// Stores immediate children (single stories) of results in array
			var stories = utils.convertToArray(dom.results.querySelectorAll(':scope > li'));

			if (this.checked || state === true) {
				stories.map(function(story) {
					var elements = utils.convertToArray(story.querySelectorAll('li'));

					// Hides every story-elements
					elements.map(function(element) {
						element.classList.add('hidden');
					})

					// Filters out the gifs
					var filterGifs = elements.filter(function(element) {
						return element.classList.contains('gif');
					});

					// Removes classname to hide from every gif
					filterGifs.map(function(gif) {
						gif.classList.remove('hidden');
					});
				});
			} else {
				stories.map(function(story) {
					var elements = utils.convertToArray(story.querySelectorAll('li'));

					// Reveals every story-element
					elements.map(function(element) {
						element.classList.remove('hidden');
					});
				});
			}
		},

		showDetails: function(word) {
			var wordID = word.toLowerCase();

			// Clears synonym results before making a new request
			utils.clearList(dom.synonyms);

			// Navigates to the stories section
			router.navigate('detail');

			// Updates title based on selected word
			dom.synonymTitle.innerHTML = 'Found synonyms for <span class="tag">' + word + '</span>';

			// Sends 'GET' reuest to Yandex Dictionary API
			request.trigger({
				type: 'GET',
				url: 'https://dictionary.yandex.net/api/v1/dicservice.json/lookup?key=dict.1.1.20170223T233030Z.71899a3fb947bc19.e4fcdcdd9ae99bf36ee480c684992b301afacc9f&lang=en-en&text=' + wordID
			})
				.then(function(rawData) {
					// Retrieves definition of selected word
					var def = JSON.parse(rawData).def[0];

					// Maps through translations if they exist
					if (def.tr) {
						var translations = def.tr;

						translations.map(function(trWord) {
							var synonyms = trWord.syn;

							// Maps through synonyms if they exist
							if (synonyms) {
								synonyms.map(function(synWord) {
									var tag = synWord.text;

									// Sends 'GET' request to Gihpy API for each synonym
									request.trigger({
										type: 'GET',
										url:  'http://api.giphy.com/v1/gifs/search?q=' + tag + '&api_key=dc6zaTOxFJmzC'
									})
										.then(function(rawGiphy) {
											var data = story.init(rawGiphy);
											var randGif = Math.floor(Math.random() * data.length);
											var randColor = Math.floor(Math.random() * 5);
											var newLi = document.createElement('li');

											// Randomize background-color of labels
											var colors = ['0, 255, 153', '255, 243, 92', '255, 102, 102', '0, 204, 255', '125, 127, 232'];

											newLi.innerHTML = '<img src="http://i.giphy.com/' + data[randGif].id + '.gif">' + '<span class="label" style="background-color:rgba(' + colors[randColor] + ', .5)">' + tag + '</span>';
											newLi.classList.add('gif');
											newLi.addEventListener('click', function() {
												story.showDetails(tag)
											});
											newLi.addEventListener('mouseover', function() {
												story.showLink(data[randGif].url);
											});

											dom.synonyms.appendChild(newLi);
										})
										.catch(function(err) {
											console.error('Unfortunately, an error occurred: ', err.status);
										});
								});
							}
						});

						// Counts amount of displayed synonyms, stops counting after a second
						setTimeout(function() {
							var synonymCount = dom.synonyms.querySelectorAll('.gif').length;

							// Gives feedback based on amount of found synonyms
							if (synonymCount === 0) {
								utils.feedback('Found ' + synonymCount + ' synonyms', 'negative');
							} else if (synonymCount === 1) {
								utils.feedback('Found ' + synonymCount + ' synonym!', 'positive');
							} else {
								utils.feedback('Found (at least) ' + synonymCount + ' synonyms!', 'positive');
							}
						}, 1000);
					}
				})
				.catch(function(err) {
					console.error('Unfortunately, and error occurred: ', err.status);
				})
		},

		showLink: function(url) {
			// Possibility to show downloadlink on gif-mouseover
			// console.log(url);
		}
	};

	// Templating
	var template = {
		/*
			Template is based on following source.
			Source: Tutorial for native Javasript templating
			URL: http://codoki.com/2015/09/01/native-javascript-templating/
		*/
		array: [
			{
				template: 'send',
				hint: 'Enter your story and see it come to life!',
				placeholder: 'What\'s your story?',
				submit: 'Search',
				loader: 'One moment, please..'
			},
			{
				template: 'stories',
				title: 'My stories',
				label: 'Only Giphy\'s',
			},
			{
				template: 'detail',
				title: 'Found synonyms',
				content: 'Mauris turpis nunc, blandit et, volutpat molestie, porta ut, ligula. Fusce pharetra convallis urna. Quisque ut nisi.',
				image: 'http://placecage.com/c/550/440'
			}
		],
		render: function(pagelist) {

			template.array.map(function(page) {
				var section = document.querySelector('#' + page.template);
				section.classList.add('content');

				switch (page.template) {

					case 'send':
						section.querySelector('.hint').textContent = page.hint;
						section.querySelector('textarea').placeholder = page.placeholder;
						section.querySelector('[type="submit"]').value = page.submit;
						section.querySelector('#loader').textContent = page.loader;

						dom.submit.addEventListener('click', story.search);
					break;

					case 'stories':
						section.querySelector('h2').textContent = page.title;
						section.querySelector('label span').textContent = page.label;

						dom.filterInput.addEventListener('change', story.filter);
					break;

					case 'detail':
						section.querySelector('h2').textContent = page.title;
					break;
				}
			});
		}
	};

	// Routing
	var router = {
		pages: {
			toggle: function(hash) {
				var list = utils.convertToArray(document.querySelectorAll('.content'));

				list.map(function(section) {
					// Ternary if-else to remove hidden classname if statement returns true
					'#' + section.id == hash ? section.classList.remove('hidden') : section.classList.add('hidden');
				});
			}
		},

		/*
			Source: Tutorial for native Javasript routing
			Author: Krasimir Tsonev
			URL: http://krasimirtsonev.com/blog/article/A-modern-JavaScript-router-in-100-lines-history-api-pushState-hash-url
		*/
		routes: [],

		mode: null,

		root: '/',

		init: function(routingmode, pagelist) {

			// Configuration
			router.config({
				mode: routingmode // Hash or history
			});

			pagelist.map(function(menulink) {
				router
					.add('/' + menulink, function() {
						// Space for functionality
					});
			});

			router.add(function() {
				// Space for functionality
			});

			router.check();

			// Return to the initial state
			// router.navigate();

			router.navigate(pagelist[0]);

			router.show(pagelist[0]);
		},

		config: function(opts) {
			this.mode = opts && opts.mode && opts.mode == 'history'	&& !!(history.pushState) ? 'history' : 'hash';
			this.root = opts && opts.root ? '/' + this.clearSlashes(opts.root) + '/' : '/';
			return this;
		},

		getSlug: function() {
			var slug = '';
			if (this.mode === 'history') {
				slug = this.clearSlashes(decodeURI(location.pathname + location.search));
				// Regex to remove 'GET' parameters
				slug = slug.replace(/\?(.*)$/, '');
				slug = this.root != '/' ? slug.replace(this.root, '') : slug;
			} else {
				var match = window.location.href.match(/#(.*)$/);
				slug = match ? match[1] : '';
			}
			return this.clearSlashes(slug);
		},

		// Removes slashes of begin and end of string
		clearSlashes: function(path) {
			return path.toString().replace(/\$/, '').replace(/^\//, '');
		},

		// Fills the routes array
		add: function(re, handler) {
			if (typeof re == 'function') {
				handler = re;
				re = '';
			}
			this.routes.push({ re: re, handler: handler} );
			return this;
		},

		// Deleting of a route can only happen it matches a regular expression or the handler passed to the 'add' method
		remove: function(param) {
			for (var i = 0, r; i < this.routes.length, r = this.routes[i]; i++) {
				if (r.handler === param || r.re.toString() === param.toString()) {
					this.routes.splice(i, 1);
					return this;
				}
			}
			return this;
		},

		// Clears the Class
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
			var navigation = utils.convertToArray(document.querySelectorAll('nav a'));
			path = path ? path : '';

			if (this.mode === 'history') {
				history.pushState(null, null, this.root + this.clearSlashes(path));
			} else {
				var hash = window.location.href.replace(/#(.*)$/, '') + '#' + path;

				window.location.href = hash;
				router.pages.toggle(hash);
			}

			navigation.map(function(anchor) {
				if (anchor.href === hash) {
					anchor.classList.add('current');
				} else {
					anchor.classList.remove('current');
				}
			});

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

	var menu = {
		render: function(pagelist) {
			var nav = document.querySelector('nav');
			var ul = document.createElement('ul');

			pagelist.map(function(link) {
				// Early exit to prevent details-page from being rendered in the navigation
				if (link === 'detail') {
					return false;
				}

				var li = document.createElement('li');
				var anchor = document.createElement('a');

				anchor.href = '#' + link;
				if (link === 'send') {
					anchor.classList.add('current');
				}

				anchor.textContent = link;
				anchor.setAttribute('data-anchor', link);

				li.append(anchor);
				ul.append(li);
				nav.append(ul);
			});

			// Shows which anchor is currently active
			var anchors = utils.convertToArray(document.querySelectorAll('nav a'));

			anchors.map(function(link) {

				link.addEventListener('click', function() {
					for (var i = 0; i < anchors.length; i++) {
						anchors[i].classList.remove('current');
					}
					this.classList.add('current');

					router.navigate(this.getAttribute('data-anchor'));
				});
			});
		}
	};

	// General functions
	var utils = {
		// Checks index of value in chosen array
		checkArray: function(value, array) {
			return array.indexOf(value);
		},

		// Converts nodelist to array
		convertToArray: function(arr) {
			return Array.prototype.slice.call(arr);
		},

		// Clears an <ul> / <ol>
		clearList: function(list) {
			while (list.firstChild) {
				list.removeChild(list.firstChild);
			}
		},

		// Clears input and feedback
		resetInput: function() {
			dom.loader.classList.add('hidden');
			dom.input.value = '';
		},

		feedback: function(msg, state) {
			dom.feedback.innerHTML = msg;

			dom.feedback.classList.add('active');
			dom.feedback.classList.add(state);

			// Removes feedback after three seconds
			setTimeout(function() {
				dom.feedback.classList.remove('active');
				dom.feedback.classList.remove(state);
			}, 3000);
		}
	};

	app.init();

	// Checks on existing stories (doesn't work in app.init?)
	if (localStorage.stories) {
		// Splits stories-string in an array on every element
		var savedStories = localStorage.getItem('stories').split('><');
		var gifs;

		// Removes 'No stories found' feedback and shows filter
		story.exists(true);

		// i'm not proud of it.
		for (var i = 0; i < savedStories.length; i++) {
			if (i == 0) {
				savedStories[i] = savedStories[i] + '>';
			} else if (i == savedStories.length - 1) {
				savedStories[i] = '<' + savedStories[i];
			} else {
				savedStories[i] = '<' + savedStories[i] + '>';
			}
		}

		// Reconstructs stories in the result list
		savedStories.reduce(function(a, b) {
			return dom.results.innerHTML = a + b;
		});

		// Adds functionality to every gif
		gifs = utils.convertToArray(document.querySelectorAll('.gif'));
		gifs.map(function(gif) {
			gif.addEventListener('click', function() {
				story.showDetails(gif.querySelector('.label').textContent);
			});
			gif.addEventListener('mouseover', function() {
				story.showLink(gif.querySelector('img').src);
			});
		})

		router.navigate('stories');

		// Refreshes filter on entry
		story.filter(false);
	} else {
		// Shows 'No stories found' feedback and hides filter
		story.exists(false);
	}
}) ();
