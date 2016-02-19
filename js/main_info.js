/* Leaflet Proportional Symbols Example */

//GOAL: Proportional symbols representing attribute values of mapped features

//Step 1: Create the Leaflet map
function createMap(){
	//create the map
	var map = L.map('map', {
		center: [20, 0],
		zoom: 2
	});

	//add OSM base tilelayer
	L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
	}).addTo(map);

	//call getData function
	getData(map);
};

//calculate the radius of each proportional symbol
function calcPropRadius(attValue) {
	//scale factor to adjust symbol size evenly
	var scaleFactor = 50;
	//area based on attribute value and scale factor
	var area = attValue * scaleFactor;
	//radius calculated based on area
	var radius = Math.sqrt(area/Math.PI);

	return radius;
};

function createPopup(properties, attribute, layer, radius){
	//add city to popup content string
	var popupContent = "<p><b>City:</b> " + properties.City + "</p>";

	//add formatted attribute to panel content string
	var year = attribute.split("_")[1];
	popupContent += "<p><b>Population in " + year + ":</b> " + properties[attribute] + " million</p>";

	//replace the layer popup
	layer.bindPopup(popupContent, {
		offset: new L.Point(0,-radius)
	});
};

function Popup(properties, attribute, layer, radius){
	this.properties = properties;
	this.attribute = attribute;
	this.layer = layer;
	this.year = attribute.split("_")[1];
	this.population = this.properties[attribute];
	this.content = "<p><b>City:</b> " + this.properties.City + "</p><p><b>Population in " + this.year + ":</b> " + this.population + " million</p>";

	this.bindToLayer = function(){
		this.layer.bindPopup(this.content, {
			offset: new L.Point(0,-radius)
		});
	};
};

//function to convert markers to circle markers
function pointToLayer(feature, latlng, info){
	//Assign the current attribute based on the first index of the attributes array
	var attribute = info.attributes[0];

	//create marker options
	var options = {
		fillColor: "#ff7800",
		color: "#000",
		weight: 1,
		opacity: 1,
		fillOpacity: 0.8
	};

	//For each feature, determine its value for the selected attribute
	var attValue = Number(feature.properties[attribute]);

	//Give each feature's circle marker a radius based on its attribute value
	options.radius = calcPropRadius(attValue);

	//create circle marker layer
	var layer = L.circleMarker(latlng, options);

	//createPopup(feature.properties, attribute, layer, options.radius);

	//create new popup
	var popup = new Popup(feature.properties, attribute, layer, options.radius);

	var popup2 = Object.create(popup);

	//change the content
	popup2.content = "<h2>" + popup.population + " million</h2>";

	//add popup to circle marker
	popup2.bindToLayer();

	//event listeners to open popup on hover and fill panel on click
	/*layer.on({
		mouseover: function(){
			this.openPopup();
		},
		mouseout: function(){
			this.closePopup();
		},
		click: function(){
			$("#panel").html(panelContent);
		
	});}*/

	//return the circle marker to the L.geoJson pointToLayer option
	return layer;
};

//Add circle markers for point features to the map
function createPropSymbols(data, map, info){
	//create a Leaflet GeoJSON layer and add it to the map
	L.geoJson(data, {
		pointToLayer: function(feature, latlng){
			return pointToLayer(feature, latlng, info);
		}
	}).addTo(map);
};

function updateTemporalLegend(attribute){
	//create content for legend
	var year = attribute.split("_")[1];
	var content = "Population in " + year;

	//replace legend content
	$('#temporal-legend').html(content);
};

//Step 10: Resize proportional symbols according to new attribute values
function updatePropSymbols(map, attribute){
	map.eachLayer(function(layer){
		if (layer.feature && layer.feature.properties[attribute]){
			//access feature properties
			var props = layer.feature.properties;
			
			//update each feature's radius based on new attribute values
			var	radius = calcPropRadius(props[attribute]);
			layer.setRadius(radius);

			createPopup(props, attribute, layer, radius);
		};
	});

	//update sequence legend
	updateTemporalLegend(attribute);
};

//Step 1: Create new sequencing controls
function createSequenceControls(map, info){
	var SequenceControl = L.Control.extend({
		options: {
			position: 'bottomleft'
		},

		onAdd: function (map) {
			// create the control container with a particular class name
			var container = L.DomUtil.create('div', 'sequence-control-container');

			//create range input element (slider)
			$(container).append('<input class="range-slider" type="range">');

			//add skip buttons
			$(container).append('<button class="skip" id="reverse" title="Reverse">Reverse</button>');
			$(container).append('<button class="skip" id="forward" title="Forward">Skip</button>');

			//kill any mouse event listeners on the map
			$(container).on('mousedown dblclick', function(e){
				L.DomEvent.stopPropagation(e);
			});

			return container;
		}
	});

	map.addControl(new SequenceControl());

	//set slider attributes
	$('.range-slider').attr({
		max: 6,
		min: 0,
		value: 0,
		step: 1
	});

	//replace button content with images
	$('#reverse').html('<img src="img/reverse.png">');
	$('#forward').html('<img src="img/forward.png">');

	//Step 5: click listener for buttons
	$('.skip').click(function(){
		//get the old index value
		var index = $('.range-slider').val();

		//Step 6: increment or decriment depending on button clicked
		if ($(this).attr('id') == 'forward'){
			index++;
			//Step 7: if past the last attribute, wrap around to first attribute
			index = index > 6 ? 0 : index;
		} else if ($(this).attr('id') == 'reverse'){
			index--;
			//Step 7: if past the first attribute, wrap around to last attribute
			index = index < 0 ? 6 : index;
		};

		//Step 8: update slider
		$('.range-slider').val(index);

		//Step 9: pass new attribute to update symbols
		updatePropSymbols(map, info.attributes[index]);
	});

	//Step 5: input listener for slider
	$('.range-slider').on('input', function(){
		//Step 6: get the new index value
		var index = $(this).val();

		//Step 9: pass new attribute to update symbols
		updatePropSymbols(map, info.attributes[index]);
	});
};

function createLegend(map, info){
	var LegendControl = L.Control.extend({
		options: {
			position: 'bottomright'
		},

		onAdd: function (map) {
			// create the control container with a particular class name
			var container = L.DomUtil.create('div', 'legend-control-container');

			$(container).append('<div id="temporal-legend">')

			$(container).append('<svg id="attribute-legend" width="180px" height="180px">');

			return container;
		}
	});

	var circles = [
		"max",
		"mean",
		"min"
	];

	for (var i=0; i<circles.length; i++){
		var circle = '<circle fill="#F47821" fill-opacity="0.8" stroke="#000000"/>'
	};

	map.addControl(new LegendControl());

	updateTemporalLegend(info.attributes[0]);
};

//Discover max and min values of dataset and build attributes array from the data
function processData(data){
	//count down for min, up for max
	var	min = Infinity,
		max = -Infinity,
		attributes = [];

	//loop through all features
	for (var feature in data.features){
		//pull out feature properties
		var properties = data.features[feature].properties;
		//loop though all properties of the feature
		for (var attribute in properties) {
			//if it's a mappable attribute
			if (attribute.indexOf("Pop") > -1){
				//if less than the current min, assign as min
				if (properties[attribute] < min) {
					min = properties[attribute];
				}
				//if greater than the current max, assign as max
				if (properties[attribute] > max) {
					max = properties[attribute];
				};

				//if not in attributes array, add
				if (attributes.indexOf(attribute) === -1){
					attributes.push(attribute);
				};
			};
		};
	};

	return {
		min: min,
		max: max,
		attributes: attributes
	};
};

//Import GeoJSON data
function getData(map){
	//load the data
	$.ajax("data/MegaCities.geojson", {
		dataType: "json",
		success: function(response){
			//create an attributes array
			var info = processData(response);

			createPropSymbols(response, map, info);
			createSequenceControls(map, info);
			createLegend(map, info);

		}
	});
};

$(document).ready(createMap);