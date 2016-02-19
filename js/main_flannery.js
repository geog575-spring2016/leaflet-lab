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
function calcPropRadius(attValue, info) {
	//scale factor to adjust symbol size evenly
	var scaleFactor = 500;
	//area determined using Flannery perceptual scaling
	var area = 1.0083 * Math.pow((attValue/info.min), 0.5716) * scaleFactor;

	//radius calculated based on area
	var radius = Math.sqrt(area/Math.PI);

	return radius;
};

//function to convert markers to circle markers
function pointToLayer(feature, latlng, info){
	//Determine which attribute to visualize with proportional symbols
	var attribute = "Pop_2015";

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
	options.radius = calcPropRadius(attValue, info);
	console.log(options.radius);

	//create circle marker layer
	var layer = L.circleMarker(latlng, options);

	//original popupContent changed to panelContent
	var panelContent = "<p><b>City:</b> " + feature.properties.City + "</p>";

	//add formatted attribute to panel content string
	var year = attribute.split("_")[1];
	panelContent += "<p><b>Population in " + year + ":</b> " + feature.properties[attribute] + " million</p>";

	//popup content is now just the city name
	var popupContent = feature.properties.City;

	//bind the popup to the circle marker
	layer.bindPopup(popupContent, {
		offset: new L.Point(0,-options.radius),
		closeButton: false 
	});

	//event listeners to open popup on hover and fill panel on click
	layer.on({
		mouseover: function(){
			this.openPopup();
		},
		mouseout: function(){
			this.closePopup();
		},
		click: function(){
			$("#panel").html(panelContent);
		}
	});

	//return the circle marker to the L.geoJson pointToLayer option
	return layer;
};

//Discover max and min values of dataset
function processData(data){
	//count down for min, up for max
	var	min = Infinity,
		max = -Infinity;

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
			};
		};
	};

	return {
		min: min,
		max: max
	};
};

//Add circle markers for point features to the map
function createPropSymbols(data, map){
	//process the data
	var info = processData(data);

	//create a Leaflet GeoJSON layer and add it to the map
	L.geoJson(data, {
		pointToLayer: function(feature, latlng){
			return pointToLayer(feature, latlng, info);
		}
	}).addTo(map);
};

//Step 1: Create new Leaflet control
function createSequenceControls(map){
	//create range input element (slider)
	$('#panel').append('<input class="range-slider" type="range">');

	//set slider attributes
	$('.range-slider').attr({
		max: 6,
		min: 0,
		value: 0,
		step: 1
	});
};

//Import GeoJSON data
function getData(map){
	//load the data
	$.ajax("data/MegaCities.geojson", {
		dataType: "json",
		success: function(response){

			createPropSymbols(response, map);
			createSequenceControls(map);

		}
	});
};

$(document).ready(createMap);