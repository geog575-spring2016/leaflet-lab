/* Leaflet Quick Start Guide and GeoJSON tutorials */

//create Leaflet map object
var map = L.map('map')
	//set the map center at the given coordinates and zoom at level 13
	.setView([51.505, -0.09], 13);

//create Leaflet tileLayer to display map tiles, given tileset url and layer options
var tileLayer = L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
    maxZoom: 18,
    id: 'northlandiguana.li83eogk',
    accessToken: 'pk.eyJ1Ijoibm9ydGhsYW5kaWd1YW5hIiwiYSI6IldJU1N4Y0UifQ.wpNgLPfnWQOBDWCgynJRiw'
})
	//add tileLayer to map
	.addTo(map);

//create Leaflet marker layer at given latlng coordinates
var marker = L.marker([51.5, -0.09])
	//add marker to map
	.addTo(map);

//create Leaflet circle layer at given latlng coordinates with a radius of 500 meters and given path options, and add to map
var circle = L.circle([51.508, -0.11], 500, {
    color: 'red',
    fillColor: '#f03',
    fillOpacity: 0.5
}).addTo(map);

//create Leaflet polygon layer with three latlng coordinate pairs (triangle), and add to map
var polygon = L.polygon([
    [51.509, -0.08],
    [51.503, -0.06],
    [51.51, -0.047]
]).addTo(map);

//bind a popup with the given HTML content to the marker
marker.bindPopup("<b>Hello world!</b><br>I am a popup.")
	//open the popup immediately
	.openPopup();
//bind popups with the given text content to the circle and polygon that will open on click
circle.bindPopup("I am a circle.");
polygon.bindPopup("I am a polygon.");

//create a standalone popup
var popup = L.popup()
	//set the popup coordinates
    .setLatLng([51.5, -0.09])
    //set the popup text content
    .setContent("I am a standalone popup.")
    //open the popup immediately, closing any previous popups
    .openOn(map);

//map click listener handler
function onMapClick(e) {
	//access previously created popup
    popup
    	//open the popup at the place where the user clicked
        .setLatLng(e.latlng)
        //set the popup content with the latlng coordinates
        .setContent("You clicked the map at " + e.latlng.toString())
        //open the popup, closing the previous one
        .openOn(map);
}

//when the user clicks, fire the handler onMapClick()
map.on('click', onMapClick);

//function to call on each GeoJSON feature
function onEachFeature(feature, layer) {
    // does this feature have a property named popupContent?
    if (feature.properties && feature.properties.popupContent) {
    	//if so, bind a popup with its content to the feature layer
        layer.bindPopup(feature.properties.popupContent);
    }
}

var geojsonFeature = {
    "type": "Feature",
    "properties": {
        "name": "Coors Field",
        "amenity": "Baseball Stadium",
        "popupContent": "This is where the Rockies play!"
    },
    "geometry": {
        "type": "Point",
        "coordinates": [-104.99404, 39.75621]
    }
};

L.geoJson(geojsonFeature, {
    onEachFeature: onEachFeature
}).addTo(map);

var myLines = [{
    "type": "LineString",
    "coordinates": [[-100, 40], [-105, 45], [-110, 55]]
}, {
    "type": "LineString",
    "coordinates": [[-105, 40], [-110, 45], [-115, 55]]
}];

var myStyle = {
    "color": "#ff7800",
    "weight": 5,
    "opacity": 0.65
};

L.geoJson(myLines, {
    style: myStyle
}).addTo(map);

var states = [{
    "type": "Feature",
    "properties": {"party": "Republican"},
    "geometry": {
        "type": "Polygon",
        "coordinates": [[
            [-104.05, 48.99],
            [-97.22,  48.98],
            [-96.58,  45.94],
            [-104.03, 45.94],
            [-104.05, 48.99]
        ]]
    }
}, {
    "type": "Feature",
    "properties": {"party": "Democrat"},
    "geometry": {
        "type": "Polygon",
        "coordinates": [[
            [-109.05, 41.00],
            [-102.06, 40.99],
            [-102.03, 36.99],
            [-109.04, 36.99],
            [-109.05, 41.00]
        ]]
    }
}];

L.geoJson(states, {
    style: function(feature) {
        switch (feature.properties.party) {
            case 'Republican': return {color: "#ff0000"};
            case 'Democrat':   return {color: "#0000ff"};
        }
    }
}).addTo(map);

var someFeatures = [{
    "type": "Feature",
    "properties": {
        "name": "Coors Field",
        "show_on_map": true
    },
    "geometry": {
        "type": "Point",
        "coordinates": [-104.99404, 39.75621]
    }
}, {
    "type": "Feature",
    "properties": {
        "name": "Busch Field",
        "show_on_map": false
    },
    "geometry": {
        "type": "Point",
        "coordinates": [-104.98404, 39.74621]
    }
}];

L.geoJson(someFeatures, {
    filter: function(feature, layer) {
        return feature.properties.show_on_map;
    }
}).addTo(map);