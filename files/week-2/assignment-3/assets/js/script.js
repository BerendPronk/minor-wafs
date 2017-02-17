(function () {
	'use strict';

	// restore set hash on refresh
	history.pushState("", document.title, window.location.pathname);

	var app = {
		init: function() {
			menu.render();
			data.render();
			routes.init();
		}
	};

	var routes = {
		init: function() {
			// toggle intro section on page entry
			sections.toggle('#intro');

			window.addEventListener('hashchange', function() {
				sections.toggle(window.location.hash);
			});
		}
	};

	var sections = {
		toggle: function(hash) {
			var list = document.querySelectorAll('.content');

			list.forEach(function(section) {
				// ternary if-else to remove hidden classname if statement returns true
				'#' + section.id == hash ? section.classList.remove('hidden') : section.classList.add('hidden');
			});
		}
	};

	var data = {

		/*
			Source: Tutorial for native Javasript templating
			URL: http://codoki.com/2015/09/01/native-javascript-templating/
		*/
		array: [
			{ hash: "intro", title: "Intro", content: "Nam pretium turpis et arcu. Duis arcu tortor, suscipit eget, imperdiet nec, imperdiet iaculis, ipsum. Sed aliquam ultrices mauris.", image: "http://placecage.com/c/540/400"},
			{ hash: "list", title: "Front-end Best Practices", content: "Suspendisse pulvinar, augue ac venenatis condimentum, sem libero volutpat nibh, nec pellentesque velit pede quis nunc.", image: "http://placecage.com/c/550/400"},
			{ hash: "details", title: "Details", content: "Mauris turpis nunc, blandit et, volutpat molestie, porta ut, ligula. Fusce pharetra convallis urna. Quisque ut nisi.", image: "http://placecage.com/c/550/440"}
		],
		render: function() {
			data.array.forEach(function(section) {
				var body = document.querySelector('body');
				var template = document.getElementById('template').innerHTML;
				var item = document.createElement('section');

				item.id = section.hash;
				item.classList.add('content');

				item.innerHTML = template;

				item.getElementsByClassName("data-title")[0].innerHTML += section.title;
				item.getElementsByClassName("data-content")[0].innerHTML += section.content;
				item.getElementsByClassName("data-image")[0].src += section.image;

				body.append(item);
			});
		}
	};

	var menu = {
		render: function() {
			var nav = document.querySelector('nav');
			var ul = document.createElement('ul');

			data.array.forEach(function(link) {
				var li = document.createElement('li');
				var anchor = document.createElement('a');

				anchor.href = '#' + link.hash;
				if (link.hash === 'intro') {
					anchor.classList.add('current');
				}

				anchor.textContent = link.hash;

				li.append(anchor);
				ul.append(li);
				nav.append(ul);
			});

			// shows which anchor is currently active
			var anchors = document.querySelectorAll('nav a');

			for (var i = 0; i < anchors.length; i++) {
				anchors[i].addEventListener('click', function() {
					for (var j = 0; j < anchors.length; j++) {
						anchors[j].classList.remove('current');
					}
					this.classList.add('current');
				})
			}
		}
	};

	app.init();

}) ();
