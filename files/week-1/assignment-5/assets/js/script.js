// (function () {
	'use strict';

	// restore set hash on refresh
	history.pushState("", document.title, window.location.pathname);

	var app = {
		init: function() {
			routes.init();
		}
	};

	var routes = {
		init: function() {
			window.addEventListener('hashchange', function() {

				var route = window.location.hash;

				sections.toggle(route);
			});
		}
	};

	var sections = {
		list: document.querySelectorAll('.content'),

		toggle: function(hash) {
			var link = document.querySelector(hash);

			this.list.forEach( function(section) {
				if ('#' + section.id == hash) {
					section.classList.remove('hidden');
				} else {
					section.classList.add('hidden');
				}
			})
		}
	};

	var anchors = document.querySelectorAll('nav a');

	for (var i = 0; i < anchors.length; i++) {
		anchors[i].addEventListener('click', function() {
			for (var j = 0; j < anchors.length; j++) {
				anchors[j].classList.remove('current');
			}
			this.classList.add('current');
		})
	}

	app.init();

// }) ();