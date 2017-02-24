(function() {
	var results  = document.querySelector('#results');
	var story	 = document.querySelector('#story');

	var input 	 = document.querySelector('#search input[type="search"]');
	var submit 	 = document.querySelector('#search input[type="submit"]');
	var feedback = document.querySelector('#feedback');

	// will store a new list-item for every new giphy requested
	var newLi;

	// clears an ul / ol
	var clearList = function(list) {
		while (list.firstChild) {
			list.removeChild(list.firstChild);
		}
	};

	// clears input and feedback
	var resetInput = function() {
		input.value = "";
		input.focus();
		feedback.textContent = "";
		feedback.className = "";
	};

	submit.addEventListener('click', function() {
		event.preventDefault();

		// prevents an api request if the user did not give any input
		if (!input.value.length) {
			return false;
		}

		clearList(results);

		// converts spaces to plus-symbols
		var tagArr = input.value.split(' ');
		var query = tagArr.join('+');

		aja()
			// switch to using normal gif-images
			// .url('http://api.giphy.com/v1/gifs/search?q=' + query + '&api_key=dc6zaTOxFJmzC')
			.url('http://api.giphy.com/v1/stickers/search?q=' + query + '&api_key=dc6zaTOxFJmzC')
			.on('success', function(dataSet) {

				var dataArr = dataSet.data;

				// sets feedback based on amount returned
				feedback.className = "positive";

				if (dataArr.length === 0) {
					feedback.className = "negative";
					feedback.innerHTML = "No results for <span class='query'>" + input.value + "</span> found.";
				} else if (dataArr.length === 1) {
					feedback.innerHTML = dataArr.length + " result for <span class='query'>" + input.value + "</span>:";
				} else {
					feedback.innerHTML = dataArr.length + " results for <span class='query'>" + input.value + "</span>:";
				}

				// adds an <li> element for each result
				dataArr.map(function(res) {

					newLi = document.createElement('li');
					newLi.classList.add('gif');
					newLi.innerHTML = "<img src='http://i.giphy.com/" + res.id + ".gif'>";

					newLi.addEventListener('click', function() {
						var img = this.querySelector('img');

						clearList(results);
						resetInput();

						feedback.innerHTML = "Story item added!";
						feedback.className = "add";

						newLi = document.createElement('li');
						newLi.appendChild(img);
						story.appendChild(newLi);
					});

					results.appendChild(newLi);
				});
			})
			.go();
	});

}) ();
