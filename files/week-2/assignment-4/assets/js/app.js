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
		pages: ['send', 'stories', 'detail'],

		init: function() {
			template.render(app.pages);
			router.init(app.pages);
			app.checkCache();
		},

		checkCache: function() {
			// Checks on existing stories
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
		}
	};

	var story = {
		init: function(input) {
			var dataSet = JSON.parse(input);

			return dataSet.data;
		},

		// Will store sequence of words/gifs
		list: [],

		request: function(settings) {
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
		},

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
			story.request({
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
					console.error('Unfortunately, an error occurred: ', err);
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
					story.request({
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
							console.error('Unfortunately, an error occurred: ', err);
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
			story.request({
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
									story.request({
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
											console.error('Unfortunately, an error occurred: ', err);
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
					console.error('Unfortunately, and error occurred: ', err);
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
		data: [
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
				title: 'Found synonyms'
			}
		],

		render: function(pagelist) {
			template.data.map(function(page) {
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
		init: function(pagelist) {
			router.menu(pagelist);
			router.show(pagelist[0]);

			window.addEventListener('hashchange', function() {
				router.navigate(window.location.hash.replace('#', ''));
			});
		},

		menu: function(pagelist) {
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

				li.appendChild(anchor);
				ul.appendChild(li);
				nav.appendChild(ul);
			});
		},

		navigate: function(path) {
			var menulinks = utils.convertToArray(document.querySelectorAll('nav a'));

			var hash = '#' + path;
			window.location.href = hash;

			menulinks.map(function(anchor) {
				// Retrieves the hash part of the entire anchor-link
				var link = anchor.href.substr(anchor.href.indexOf('#'), anchor.href.length);

				if (link === hash) {
					anchor.classList.add('current');
				} else {
					anchor.classList.remove('current');
				}
			});

			this.show(path);
		},

		show: function(path) {
			var sectionList = utils.convertToArray(document.querySelectorAll('.content'));

			sectionList.map(function(section) {
				if (section.id === path) {
					section.classList.remove('hidden');
				} else {
					section.classList.add('hidden');
				}
			});
		}
	};

	// General functions
	var utils = {
		// Checks index of value in chosen array
		checkArray: function(value, arr) {
			return arr.indexOf(value);
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

}) ();
