var colors  = ['#00ff99', '#fff35c', '#ff6666', '#00ccff', '7d7fe8#'];
var title	= document.querySelector('h1');

var results  = document.querySelector('#results');
var story	 = document.querySelector('#story');

var input 	 = document.querySelector('#search textarea');
var submit 	 = document.querySelector('#search input[type="submit"]');
var feedback = document.querySelector('#feedback');

var app = {

	init: function() {
		var pages = ['home', 'story', 'details'];

		data.render(pages);
		Router.init('hash', pages);
		menu.render(pages);

		// cycle through giphy theme colours
		setInterval(function() {
			var random = Math.floor(Math.random() * 5);

			title.style.color = colors[random];
			submit.style.backgroundColor = colors[random];
		}, 2500);

		submit.addEventListener('click', gifs.search);
	}
};

var request = {
	trigger: function(settings) {
		return new Promise(function(resolve, reject) {
			var req = new XMLHttpRequest;

			req.open(settings.type, settings.url);

			req.addEventListener('load', function() {
				if (this.status >= 200 && this.status < 400) {
					resolve(req.responseText);
				} else {
					reject({
						status: this.status,
						statusText: req.statusText
					});
				}
			});

			req.addEventListener('error', function() {
				reject({
					status: req.status,
					statusText: req.statusText
				});
			});

			req.send();
		});
	}
};

var gifs = {

	init: function(input) {
		var dataSet = JSON.parse(input);

		return dataSet.data;
	},

	search: function() {
		event.preventDefault();

		// prevents an api request if the user did not give any input
		if (!input.value.length) {
			return false;
		}

		// clear current results
		// utils.clearList(results);

		// converts spaces to plus-symbols
		// var query = input.value.split(' ').join('+');

		// request.trigger({
		// 	type: 'GET',
		// 	url:  'http://api.giphy.com/v1/stickers/search?q=' + query + '&api_key=dc6zaTOxFJmzC'
		// })
		// 	.then(function(rawInput) {
		// 		var data = gifs.init(rawInput);

		// 		gifs.feedback(data);
		// 		gifs.render(data);
		// 	})
		// 	.catch(function(err) {
		// 		console.error('Unfortunately, an error occurred: ', err.status);
		// 	});

		var loader = document.querySelector('#loader');
		loader.textContent = 'LOADING';

		request.trigger({
			type: 'POST',
			url:  'http://apis.paralleldots.com/keywords?q=' + input.value + '&apikey=pIklELbRNqSO5ZUZCp8LclScsAaRw3dcKCp67xRsnJI'
		})
			.then(function(rawInput) {
				// results.
				console.log(rawInput)
			})
			.catch(function(err) {
				console.error('Unfortunately, an error occurred: ', err.status);
			});
	},

	feedback: function(dataArr) {
		// sets feedback based on amount returned
		if (dataArr.length === 0) {
			utils.feedback("No results for <span class='query'>" + input.value + "</span> found.", 'negative');
		} else if (dataArr.length === 1) {
			utils.feedback(dataArr.length + " result for <span class='query'>" + input.value + "</span>:", 'positive');
		} else {
			utils.feedback(dataArr.length + " results for <span class='query'>" + input.value + "</span>:", 'positive');
		}
	},

	render: function(dataArr) {

		// adds an <li> element for each result
		dataArr.map(function(res) {
			var newRes;

			newRes = document.createElement('li');
			newRes.classList.add('gif');
			newRes.innerHTML = "<img src='http://i.giphy.com/" + res.id + ".gif'>";

			// adds functionality to every list-item
			// newRes.addEventListener('click', gifs.addInteraction);

			results.appendChild(newRes);
		});
	},

	addInteraction: function() {
		var storyItem;
		var img = this.querySelector('img');

		// utils.clearList(results);
		utils.resetInput();
		utils.feedback("Story item added!", 'add');

		storyItem = document.createElement('li');
		storyItem.appendChild(img);

		story.appendChild(storyItem);
	}
};

app.init();
