/* Leaflet Lab Example */

//Create the Leaflet map
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

//object constructor function example using popups
function Popup(properties, attribute, layer, radius){
	//assign properties to prototype
	this.properties = properties;
	this.attribute = attribute;
	this.layer = layer;
	this.year = attribute.split("_")[1];
	this.population = this.properties[attribute];
	this.content = "<p><b>City:</b> " + this.properties.City + "</p><p><b>Population in " + this.year + ":</b> " + this.population + " million</p>";

	//assign method to prototype
	this.bindToLayer = function(){
		this.layer.bindPopup(this.content, {
			offset: new L.Point(0,-radius)
		});
	};
};

//function to convert markers to circle markers
function pointToLayer(feature, latlng, attributes){
	//Assign the current attribute based on the first index of the attributes array
	var attribute = attributes[0];

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
function createPropSymbols(data, map, attributes){
	//create a Leaflet GeoJSON layer and add it to the map
	L.geoJson(data, {
		pointToLayer: function(feature, latlng){
			return pointToLayer(feature, latlng, attributes);
		}
	}).addTo(map);
};

//Calculate the max, mean, and min values for a given attribute
function getCircleValues(map, attribute){
	//start with min at highest possible and max at lowest possible number
	var min = Infinity,
		max = -Infinity;

	map.eachLayer(function(layer){
		//get the attribute value
		if (layer.feature){
			var attributeValue = Number(layer.feature.properties[attribute]);

			//test for min
			if (attributeValue < min){
				min = attributeValue;
			};

			//test for max
			if (attributeValue > max){
				max = attributeValue;
			};
		};
	});

	//set mean
	var mean = (max + min) / 2;
	
	//return values as an object
	return {
		max: max,
		mean: mean,
		min: min
	};
};

function updateLegend(map, attribute){
	//create content for legend
	var year = attribute.split("_")[1];
	var content = "Population in " + year;

	//replace legend content
	$('#temporal-legend').html(content);

	//get the max, mean, and min values as an object
	var circleValues = getCircleValues(map, attribute);

	for (var key in circleValues){
		//get the radius
		var radius = calcPropRadius(circleValues[key]);

		$('#'+key).attr({
			cy: 59 - radius,
			r: radius
		});

		$('#'+key+'-text').text(Math.round(circleValues[key]*100)/100 + " million");
	};
};

//Resize proportional symbols according to new attribute values
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
	updateLegend(map, attribute);
};

//Create new sequencing controls
function createSequenceControls(map, attributes){
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

	//click listener for buttons
	$('.skip').click(function(){
		//get the old index value
		var index = $('.range-slider').val();

		//increment or decriment depending on button clicked
		if ($(this).attr('id') == 'forward'){
			index++;
			//if past the last attribute, wrap around to first attribute
			index = index > 6 ? 0 : index;
		} else if ($(this).attr('id') == 'reverse'){
			index--;
			//if past the first attribute, wrap around to last attribute
			index = index < 0 ? 6 : index;
		};

		//update slider
		$('.range-slider').val(index);

		//pass new attribute to update symbols
		updatePropSymbols(map, attributes[index]);
	});

	//input listener for slider
	$('.range-slider').on('input', function(){
		//get the new index value
		var index = $(this).val();

		//pass new attribute to update symbols
		updatePropSymbols(map, attributes[index]);
	});
};

function createLegend(map, attributes){
	var LegendControl = L.Control.extend({
		options: {
			position: 'bottomright'
		},

		onAdd: function (map) {
			// create the control container with a particular class name
			var container = L.DomUtil.create('div', 'legend-control-container');

			//add temporal legend div to container
			$(container).append('<div id="temporal-legend">')

			//start attribute legend svg string
			var svg = '<svg id="attribute-legend" width="160px" height="60px">';

			//object to base loop on
			var circles = {
				max: 20,
				mean: 40,
				min: 60
			};

			//loop to add each circle and text to svg string
			for (var circle in circles){
				//circle string
				svg += '<circle class="legend-circle" id="' + circle + '" fill="#F47821" fill-opacity="0.8" stroke="#000000" cx="30"/>';

				//text string
				svg += '<text id="' + circle + '-text" x="65" y="' + circles[circle] + '"></text>';
			};

			// //array of circle names to base loop on
			// var circles = ["max", "mean", "min"];

			// //loop to add each circle and text to svg string
			// for (var i=0; i<circles.length; i++){
			// 	//circle string
			// 	svg += '<circle class="legend-circle" id="' + circles[i] + 
			// 	'" fill="#F47821" fill-opacity="0.8" stroke="#000000" cx="30"/>';
			// };

			//close svg string
			svg += "</svg>";

			//add attribute legend svg to container
			$(container).append(svg);

			return container;
		}
	});

	map.addControl(new LegendControl());

	updateLegend(map, attributes[0]);
};

//build an attributes array from the data
function processData(data){
	//empty array to hold attributes
	var attributes = [];

	//properties of the first feature in the dataset
	var properties = data.features[0].properties;
	//push each attribute name into attributes array
	for (var attribute in properties){
		//only take attributes with population values
		if (attribute.indexOf("Pop") > -1){
			attributes.push(attribute);
		};
	};

	return attributes;
};

//Import GeoJSON data
function getData(map){
	//load the data
	$.ajax("data/MegaCities.geojson", {
		dataType: "json",
		success: function(response){
			//create an attributes array
			var attributes = processData(response);

			createPropSymbols(response, map, attributes);
			createSequenceControls(map, attributes);
			createLegend(map, attributes);

		}
	});
};

$(document).ready(createMap);