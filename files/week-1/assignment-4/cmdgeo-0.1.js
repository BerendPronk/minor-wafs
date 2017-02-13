(function() {
	'use strict';

	/***
	* cmdaan.js
	*   Bevat functies voor CMDAan stijl geolocatie welke uitgelegd
	*   zijn tijdens het techniek college in week 5.
	*
	*   Author: J.P. Sturkenboom <j.p.sturkenboom@hva.nl>
	*   Credit: Dive into html5, geo.js, Nicholas C. Zakas
	*
	*   Copyleft 2012, all wrongs reversed.
	*/

	// Variable declaration
	var config = {
		sandbox: "SANDBOX",
		linear: "LINEAR",
		gpsAvailable: "GPS_AVAILABLE",
		gpsUnavailable: "GPS_UNAVAILABLE",
		positionUpdated: "POSITION_UPDATED",
		refreshRate: 1000,

		currentPosition: false,
		currentPositionMarker: false,
		customDebugging: false,
		debugId: false,
		map: false,
		interval: false,
		intervalCounter: false,
		updateMap: false,

		locationArray: [],
		markerArray: [],

		positionMarker: '/assets/img/icon/pos.svg'
	};

	// Event functies - bron: http://www.nczonline.net/blog/2010/03/09/custom-events-in-javascript/ Copyright (c) 2010 Nicholas C. Zakas. All rights reserved. MIT License
	// Gebruik: ET.addListener('foo', handleEvent); ET.fire('event_name'); ET.removeListener('foo', handleEvent);
	function EventTarget() {
		this._listeners = {};
	}

	EventTarget.prototype = {
		constructor: EventTarget,

		addListener: function(a, c) {
			if (typeof this._listeners[a] && (this._listeners[a] = [])) {
				return "undefined";
			}
			this._listeners[a].push(c);
		},

		fire: function(a) {
			if (typeof a && (a = { type: a })) {
				return "string";
			}
			if (a.target || (a.target = this)) {
				return true;
			}

			if (!a.type) {
				throw Error("Event object missing 'type' property.");
			}

			if (this._listeners[a.type] instanceof Array) {

				for (var c = this._listeners[a.type], b = 0, d = c.length; b < d; b++) {
					c[b].call(this, a);
				}
			}
		},

		removeListener: function(a, c) {

			if (this._listeners[a] instanceof Array) {
				for (var b = this._listeners[a], d = 0, e = b.length; d < e; d++) {

					if (b[d] === c) {
						b.splice(d, 1);
						break;
					}
				}
			}
		}
	};

	var ET = new EventTarget();

	var geo = {
		config: {
			route: null,
			routeList: null,
			location: null,
			newPos: null,
			pos1: null,
			pos2: null,
			markerLatLng: null,
			marker: null
		},

		// Test of GPS beschikbaar is (via geo.js) en vuur een event af
		init: function () {
			debug.debugMessage("Controleer of GPS beschikbaar is...");

			ET.addListener(config.gpsAvailable, geo.startInterval);
			ET.addListener(config.gpsUnavailable, function() {
				debug.debugMessage("GPS is niet beschikbaar.");
			});

			if (geo_position_js.init()) {
				ET.fire(config.gpsAvailable);
			} else {
				ET.fire(config.gpsUnavailable);
			}
		},

		// Start een interval welke op basis van refreshRate de positie updated
		startInterval: function (event) {
			debug.debugMessage("GPS is beschikbaar, vraag positie.");

			geo.updatePosition();

			config.interval = this.setInterval(geo.updatePosition, config.refreshRate);

			ET.addListener(config.positionUpdated, geo.checkLocations);
		},

		// Vraag de huidige positie aan geo.js, stel een callback in voor het resultaat
		updatePosition: function () {
			config.intervalCounter++;

			geo_position_js.getCurrentPosition(geo.setPosition, debug.geoErrorHandler, {
				enableHighAccuracy: true
			});
		},

		// Callback functie voor het instellen van de huidige positie, vuurt een event af
		setPosition: function (position) {
			config.currentPosition = position;
			ET.fire(config.positionUpdated);
			debug.debugMessage(config.intervalCounter + " positie lat:" + position.coords.latitude + " long:" + position.coords.longitude);
		},

		// Controleer de locaties en verwijs naar een andere pagina als we op een locatie zijn
		checkLocations: function (event) {

			// Liefst buiten google maps om... maar helaas, ze hebben alle coole functies
			for (var i = 0; i < config.locationArray.length; i++) {
				geo.config.location = {
					coords: {
						latitude: config.locationArray[i][3],
						longitude: config.locationArray[i][4]
					}
				};

				if (geo.calculateDistance(locatie, config.currentPosition) < config.locationArray[i][2]) {

					// Controle of we NU op die locatie zijn, zo niet gaan we naar de betreffende page
					if (window.location != config.locationArray[i][1] && localStorage[config.locationArray[i][0]] == "false") {

						// Probeer local storage, als die bestaat incrementeer de locatie
						try {

							if (localStorage[config.locationArray[i][0]] == "false") {
								localStorage[config.locationArray[i][0]] = 1;
							} else {
								localStorage[config.locationArray[i][0]]++;
							}
						} catch (error) {
							debug.debugMessage("Localstorage kan niet aangesproken worden: " + error);
						}

						// TODO: Animeer de betreffende marker
						window.location = config.locationArray[i][1];
						debug.debugMessage("Speler is binnen een straal van " +  config.locationArray[i][2] + " meter van " + config.locationArray[i][0]);
					}
				}
			}
		},

		// Bereken het verchil in meters tussen twee punten
		calculateDistance: function (p1, p2) {
			geo.config.pos1 = new google.maps.LatLng(p1.coords.latitude, p1.coords.longitude);
			geo.config.pos2 = new google.maps.LatLng(p2.coords.latitude, p2.coords.longitude);
			return Math.round(google.maps.geometry.spherical.computeDistanceBetween(pos1, pos2), 0);
		},


		// GOOGLE MAPS FUNCTIES
		/**
		 * generate_map(myOptions, canvasId)
		 *  roept op basis van meegegeven opties de google maps API aan
		 *  om een kaart te genereren en plaatst deze in het HTML element
		 *  wat aangeduid wordt door het meegegeven id.
		 *
		 *  @param myOptions:object - een object met in te stellen opties
		 *      voor de aanroep van de google maps API, kijk voor een over-
		 *      zicht van mogelijke opties op http://
		 *  @param canvasID:string - het id van het HTML element waar de
		 *      kaart in ge-rendered moet worden, <div> of <canvas>
		 */
		generateMap: function (myOptions, canvasId) {

			// TODO: Kan ik hier asynchroon nog de google maps api aanroepen? dit scheelt calls
			debug.debugMessage("Genereer een Google Maps kaart en toon deze in #" + canvasId);
			config.map = new google.maps.Map(document.getElementById(canvasId), myOptions);

			geo.config.routeList = [];

			// Voeg de markers toe aan de map afhankelijk van het tourtype
			debug.debugMessage("Locaties intekenen, tourtype is: " + tourType);

			for (var i = 0; i < config.locationArray.length; i++) {

				// Met kudos aan Tomas Harkema, probeer local storage, als het bestaat, voeg de locaties toe
				try {

					if (localStorage.visited === undefined || utils.isNumber(localStorage.visited)) {
						localStorage[config.locationArray[i][0]] = false;
					} else {
						return null;
					}
				} catch (error) {
					debug.debugMessage("Localstorage kan niet aangesproken worden: " + error);
				}

				geo.config.markerLatLng = new google.maps.LatLng(config.locationArray[i][3], config.locationArray[i][4]);
				routeList.push(markerLatLng);

				config.markerArray[i] = {};

				for (var attr in locatieMarker) {
					config.markerArray[i][attr] = locatieMarker[attr];
				}

				config.markerArray[i].scale = config.locationArray[i][2] / 3;

				geo.config.marker = new google.maps.Marker({
					position: markerLatLng,
					map: map,
					icon: config.markerArray[i],
					title: config.locationArray[i][0]
				});
			}

			// TODO: Kleur aanpassen op het huidige punt van de tour
			if (tourType == config.linear) {

				// Trek lijnen tussen de punten
				debug.debugMessage("Route intekenen");

				geo.config.route = new google.maps.Polyline({
					clickable: false,
					map: map,
					path: routeList,
					strokeColor: "Black",
					strokeOpacity: 0.6,
					strokeWeight: 3
				});
			}

			// Voeg de locatie van de persoon door
			config.currentPositionMarker = new google.maps.Marker({
				position: mapOptions.center,
				map: map,
				icon: config.positionMarker,
				title: "U bevindt zich hier"
			});

			// Zorg dat de kaart geupdated wordt als het positionUpdated event afgevuurd wordt
			ET.addListener(config.positionUpdated, geo.updateNewPosition);
		},


		// Update de positie van de gebruiker op de kaart
		updateNewPosition: function (event) {

			// use currentPosition to center the map
			geo.config.newPos = new google.maps.LatLng(config.currentPosition.coords.latitude, config.currentPosition.coords.longitude);

			config.map.setCenter(newPos);
			config.currentPositionMarker.setPosition(newPos);
		}
	};

	// FUNCTIES VOOR DEBUGGING
	var debug = {

		geoErrorHandler: function(code, message) {
			debug.debugMessage("geo.js error " + code + ": " + message);
		},

		debugMessage: function(message) {
			if (config.customDebugging && config.debugId) {
				return document.getElementById(config.debugId).innerHTML;
			} else {
				console.log(message);
			}
		},

		setCustomDebugging: function(debugId) {
			config.debugId = this.debugId;
			config.customDebugging = true;
		}
	};

	var utils = {
		isNumber: function(n) {
			return !isNaN(parseFloat(n)) && isFinite(n);
		}
	};

	geo.init();

}) ();