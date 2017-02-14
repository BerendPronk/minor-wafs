(function () {
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
			// toggle intro section on page entry
			sections.toggle('#intro');

			window.addEventListener('hashchange', function() {
				sections.toggle(window.location.hash);
			});
		}
	};

	var sections = {
		list: document.querySelectorAll('.content'),

		toggle: function(hash) {
			this.list.forEach(function(section) {
				// ternary if-else to remove hidden classname if statement returns true
				'#' + section.id == hash ? section.classList.remove('hidden') : section.classList.add('hidden');
			});
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

}) ();
