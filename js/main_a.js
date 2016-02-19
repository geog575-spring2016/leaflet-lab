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
	var scaleFactor = 0.5,
		//area based on attribute value, scale factor, and exponent
		area = Math.pow(attValue * scaleFactor, 3),
		//radius calculated based on area
		radius = Math.sqrt(area/Math.PI);

	return radius;
};

//function to convert markers to circle markers
function pointToLayer(feature, latlng){
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
	options.radius = calcPropRadius(attValue);

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

//Add circle markers for point features to the map
function createPropSymbols(data, map){
	//create a Leaflet GeoJSON layer and add it to the map
	L.geoJson(data, {
		pointToLayer: pointToLayer
	}).addTo(map);
};

//Step 1: Create new Leaflet control
function createSequenceControl(map){
	//create sequence control on map
	var sequenceControl = L.control({
			position: 'bottomleft'
		});

	//create the HTML elements to add to the DOM when the control is added to the map
	sequenceControl.onAdd = function(map){
		//create the control container div
		var container = L.DomUtil.create("div", "sequence-control-container");

		//kill any mousedown listeners on the map
		$(container).on('mousedown', function(e){
			L.DomEvent.stopPropagation(e);
		});
		
		//create slider input element
		var slider = L.DomUtil.create("input", "range-slider", container);

		//set slider attributes
		$(slider).attr({
			type: 'range',
			max: 6,
			min: 0,
			value: 0,
			step: 1
		});

		return container;
	};

	sequenceControl.addTo(map);
};

//Import GeoJSON data
function getData(map){
	//load the data
	$.ajax("data/MegaCities.geojson", {
		dataType: "json",
		success: function(response){

			createPropSymbols(response, map);
			createSequenceControl(map);

		}
	});
};

$(document).ready(createMap);