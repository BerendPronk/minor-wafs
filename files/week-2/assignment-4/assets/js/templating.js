var data = {
	/*
		Source: Tutorial for native Javasript templating
		URL: http://codoki.com/2015/09/01/native-javascript-templating/
	*/
	array: [
		{
			template: "home",
			title: "Intro",
			hint: "Enter your story and see it come to life!",
			loader: "One moment, please"
		},
		{
			template: "story",
			title: "Front-end Best Practices",
			content: "Suspendisse pulvinar, augue ac venenatis condimentum, sem libero volutpat nibh, nec pellentesque velit pede quis nunc.",
			image: "http://placecage.com/c/550/400"
		},
		{
			template: "details",
			title: "Details",
			content: "Mauris turpis nunc, blandit et, volutpat molestie, porta ut, ligula. Fusce pharetra convallis urna. Quisque ut nisi.",
			image: "http://placecage.com/c/550/440"
		}
	],
	render: function(pagelist) {

		for (var i = 0; i < pagelist.length; i++) {
			var page = data.array[i];
			var template = document.querySelector('#' + page.template);

			template.classList.add('content');

			switch (page.template) {

				case 'home':
					template.querySelector('.hint').textContent = page.hint;
					template.querySelector('#loader').textContent = page.loader;
				break;

				case 'story':
					// item.getElementsByClassName(page.template + "-title")[0].innerHTML += page.title;
					// item.getElementsByClassName(page.template + "-content")[0].innerHTML += page.content;
					// item.getElementsByClassName(page.template + "-image")[0].src += page.image;
				break;

				case 'details':
					// item.getElementsByClassName(page.template + "-title")[0].innerHTML += page.title;
					// item.getElementsByClassName(page.template + "-content")[0].innerHTML += page.content;
					// item.getElementsByClassName(page.template + "-image")[0].src += page.image;
				break;

				default:
					// item.getElementsByClassName(page.template + "-title")[0].innerHTML += page.title;
					// item.getElementsByClassName(page.template + "-content")[0].innerHTML += page.content;
					// item.getElementsByClassName(page.template + "-image")[0].src += page.image;
			}
		}
	}
};