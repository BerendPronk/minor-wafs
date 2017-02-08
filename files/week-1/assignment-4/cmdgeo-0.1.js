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
	var sandbox = "SANDBOX";
	var linear = "LINEAR";
	var gpsAvailable = "GPS_AVAILABLE";
	var gpsUnavailable = "GPS_UNAVAILABLE";
	var positionUpdated = "POSITION_UPDATED";
	var refreshRate = 1000;

	var currentPosition,
		currentPositionMarker,
		customDebugging,
		debugId,
		map,
		interval,
		intervalCounter,
		updateMap = false;

	var locationArray,
		markerArray = [];

	var positionMarker = '/assets/img/icon/pos.svg';

	// Event functies - bron: http://www.nczonline.net/blog/2010/03/09/custom-events-in-javascript/ Copyright (c) 2010 Nicholas C. Zakas. All rights reserved. MIT License
	// Gebruik: ET.addListener('foo', handleEvent); ET.fire('event_name'); ET.removeListener('foo', handleEvent);
	function EventTarget() {
		this._listeners = {};
	}

	EventTarget.prototype = {
		constructor: EventTarget,

		addListener: function(a, c) {
			"undefined" == typeof this._listeners[a] && (this._listeners[a] = []);
			this._listeners[a].push(c);
		},

		fire: function(a) {
			"string" == typeof a && (a = {
				type: a
			});
			a.target || (a.target = this);

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
		// Test of GPS beschikbaar is (via geo.js) en vuur een event af
		init: function () {
			debugMessage("Controleer of GPS beschikbaar is...");

			ET.addListener(gpsAvailable, _startInterval);
			ET.addListener(gpsUnavailable, function() {
				debugMessage("GPS is niet beschikbaar.");
			});

			if (geo_position_js.init()) {
				ET.fire(gpsAvailable);
			} else {
				ET.fire(gpsUnavailable);
			}
		},

		init();

		// Start een interval welke op basis van refreshRate de positie updated
		_startInterval: function (event) {
			debugMessage("GPS is beschikbaar, vraag positie.");

			_updatePosition();

			interval = this.setInterval(_updatePosition, refreshRate);

			ET.addListener(positionUpdated, _checkLocations);
		},

		// Vraag de huidige positie aan geo.js, stel een callback in voor het resultaat
		_updatePosition: function () {
			intervalCounter++;

			geo_position_js.getCurrentPosition(_setPosition, _geoErrorHandler, {
				enableHighAccuracy: true
			});
		},

		// Callback functie voor het instellen van de huidige positie, vuurt een event af
		_setPosition: function (position) {
			currentPosition = position;
			ET.fire(positionUpdated);
			debugMessage(intervalCounter + " positie lat:" + position.coords.latitude + " long:" + position.coords.longitude);
		},

		// Controleer de locaties en verwijs naar een andere pagina als we op een locatie zijn
		_checkLocations: function (event) {

			// Liefst buiten google maps om... maar helaas, ze hebben alle coole functies
			for (var i = 0; i < locationArray.length; i++) {
				var locatie = {
					coords: {
						latitude: locationArray[i][3],
						longitude: locationArray[i][4]
					}
				};

				if (_calculateDistance(locatie, currentPosition) < locationArray[i][2]) {

					// Controle of we NU op die locatie zijn, zo niet gaan we naar de betreffende page
					if (window.location != locationArray[i][1] && localStorage[locationArray[i][0]] == "false") {

						// Probeer local storage, als die bestaat incrementeer de locatie
						try {

							if (localStorage[locationArray[i][0]] == "false") {
								localStorage[locationArray[i][0]] = 1;
							} else {
								localStorage[locationArray[i][0]]++;
							}
						} catch (error) {
							debugMessage("Localstorage kan niet aangesproken worden: " + error);
						}

						// TODO: Animeer de betreffende marker
						window.location = locationArray[i][1];
						debugMessage("Speler is binnen een straal van " +  locationArray[i][2] + " meter van " + locationArray[i][0]);
					}
				}
			}
		},

		// Bereken het verchil in meters tussen twee punten
		_calculateDistance: function (p1, p2) {
			var pos1 = new google.maps.LatLng(p1.coords.latitude, p1.coords.longitude);
			var pos2 = new google.maps.LatLng(p2.coords.latitude, p2.coords.longitude);
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
			debugMessage("Genereer een Google Maps kaart en toon deze in #" + canvasId);
			map = new google.maps.Map(document.getElementById(canvasId), myOptions);

			var routeList = [];

			// Voeg de markers toe aan de map afhankelijk van het tourtype
			debugMessage("Locaties intekenen, tourtype is: " + tourType);

			for (var i = 0; i < locationArray.length; i++) {

				// Met kudos aan Tomas Harkema, probeer local storage, als het bestaat, voeg de locaties toe
				try {

					if (localStorage.visited === undefined || isNumber(localStorage.visited)) {
						localStorage[locationArray[i][0]] = false;
					} else {
						return null;
					}
				} catch (error) {
					debugMessage("Localstorage kan niet aangesproken worden: " + error);
				}

				var markerLatLng = new google.maps.LatLng(locationArray[i][3], locationArray[i][4]);
				routeList.push(markerLatLng);

				markerArray[i] = {};

				for (var attr in locatieMarker) {
					markerArray[i][attr] = locatieMarker[attr];
				}

				markerArray[i].scale = locationArray[i][2] / 3;

				var marker = new google.maps.Marker({
					position: markerLatLng,
					map: map,
					icon: markerArray[i],
					title: locationArray[i][0]
				});
			}

			// TODO: Kleur aanpassen op het huidige punt van de tour
			if (tourType == linear) {

				// Trek lijnen tussen de punten
				debugMessage("Route intekenen");

				var route = new google.maps.Polyline({
					clickable: false,
					map: map,
					path: routeList,
					strokeColor: "Black",
					strokeOpacity: 0.6,
					strokeWeight: 3
				});
			}

			// Voeg de locatie van de persoon door
			currentPositionMarker = new google.maps.Marker({
				position: kaartOpties.center,
				map: map,
				icon: positionMarker,
				title: "U bevindt zich hier"
			});

			// Zorg dat de kaart geupdated wordt als het positionUpdated event afgevuurd wordt
			ET.addListener(positionUpdated, updatePosition);
		},


		// Update de positie van de gebruiker op de kaart
		updatePosition: function (event) {

			// use currentPosition to center the map
			var newPos = new google.maps.LatLng(currentPosition.coords.latitude, currentPosition.coords.longitude);

			map.setCenter(newPos);
			currentPositionMarker.setPosition(newPos);
		}
	};

	function isNumber(n) {
		return !isNaN(parseFloat(n)) && isFinite(n);
	}

	// FUNCTIES VOOR DEBUGGING
	var debug = {

		_geoErrorHandler: function(code, message) {
			debugMessage("geo.js error " + code + ": " + message);
		},

		debugMessage: function(message) {
			if (customDebugging && debugId) {
				return document.getElementById(debugId).innerHTML;
			} else {
				console.log(message);
			}
		},

		setCustomDebugging: function(debugId) {
			debugId = this.debugId;
			customDebugging = true;
		}
	};

}) ();