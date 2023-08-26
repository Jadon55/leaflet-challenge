// map backgrounds
var street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});
var topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
	attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
});
var MtbMap = L.tileLayer('http://tile.mtbmap.cz/mtbmap_tiles/{z}/{x}/{y}.png', {
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &amp; USGS'
});
var Stadia_AlidadeSmoothDark = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.{ext}', {
	minZoom: 0,
	maxZoom: 20,
	attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	ext: 'png'
});

// create layers for each dataset
var earthquakes = L.layerGroup();
var tectonicplates = L.layerGroup();

// create map and add layer and background options
let mapOptions = {
    Street: street,
    Topography: topo,
    "MtbMap": MtbMap,
    AlidadeSmoothDark: Stadia_AlidadeSmoothDark
};
let overlayMaps = {
    "Earthquake Data": earthquakes,
    "Tectonicplate Data": tectonicplates
};
let myMap = L.map("map", {
	center: [30, -100],
    zoom: 4,
    layers: [Stadia_AlidadeSmoothDark, earthquakes, tectonicplates]
});
L.control.layers(mapOptions, overlayMaps).addTo(myMap);

function getEarthquakeData(){
    // earthquake data
    d3.json("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson").then(data =>{
        // calls addPlate() for each Tectonicplate in the geoJson
        data.features.forEach(element => {
            addPoint(element);
        });
        // adds the legend to the map
        addLegend();
        // call getTectonicplatesData() after, so that the lines will appear ontop of the earthquake data
        getTectonicplatesData();
    });
};

function getTectonicplatesData(){
    // tectonicplate data
    d3.json("https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json").then(data =>{
        // calls addPlate() for each Tectonicplate in the geoJson
        data.features.forEach(element => {
            addPlate(element);
        });
    });
}

function addPoint(item){
    // fetching data
    let location = [item.geometry.coordinates[1], item.geometry.coordinates[0]]
    let size = item.properties.mag;
    let depth = item.geometry.coordinates[2];

    // assign the color of the circle according to the depth
    let color;
    if(depth > 90){
        color = "rgb(255,95,101)"
    } else if(depth > 70){
        color = "rgb(252,163,93)"
    } else if(depth > 50){
        color = "rgb(253,183,42)"
    } else if(depth > 30){
        color = "rgb(247,219,17)"
    } else if(depth > 10){
        color = "rgb(220,244,0)";
    } else{
        color = "rgb(163,246,0)";
    }

    // add earthquake to the map
    var circle = L.circle(location, {
        color: "black",
        fillColor: color,
        fillOpacity: 1,
        // size made larger
        radius: size*15000,
        weight: .5
    }).addTo(earthquakes);

    // add popup for the earthquake
    circle.bindPopup(`
        <h2>Mag: ${size}</h2>
        <h2>Depth: ${depth}</h2>
        <h2>Location: ${location}</h2>`
    );
};

function addLegend(){
    // HTML and CSS for the legend
    var legendContent = `
        <div class='my-legend'>
            <div class='legend-title' Style='text-align: center;'>Depth</div>
            <div class='legend-scale'>
                <ul class='legend-labels'>
                    <li><span style='background:rgb(163,246,0);'></span>-10-10</li>
                    <li><span style='background:rgb(220,244,0);'></span>10-30</li>
                    <li><span style='background:rgb(247,219,17);'></span>30-50</li>
                    <li><span style='background:rgb(253,183,42);'></span>50-70</li>
                    <li><span style='background:rgb(252,163,93);'></span>70-90</li>
                    <li><span style='background:rgb(255,95,101);'></span>90+</li>
                </ul>
            </div>
        </div>

        <style type='text/css'>
            .my-legend .legend-title {
                text-align: left;
                margin-bottom: 5px;
                font-weight: bold;
                font-size: 90%;
            }
            .my-legend .legend-scale ul {
                margin: 0;
                margin-bottom: 5px;
                padding: 0;
                float: left;
                list-style: none;
            }
            .my-legend .legend-scale ul li {
                font-size: 80%;
                list-style: none;
                margin-left: 0;
                line-height: 18px;
                margin-bottom: 2px;
            }
            .my-legend ul.legend-labels li span {
                display: block;
                float: left;
                height: 16px;
                width: 30px;
                margin-right: 5px;
                margin-left: 0;
                border: 1px solid #999;
            }
            .my-legend .legend-source {
                font-size: 70%;
                color: #999;
                clear: both;
            }
            .my-legend a {
                color: #777;
            }
        </style>`;
    // make legend element
    var legendControl = L.control({ position: 'bottomright' });
    // add the HTML to the legend element, and add it to the map
    legendControl.onAdd = function(map) {
        var div = L.DomUtil.create('div', 'info legend');
        div.innerHTML = legendContent;
        return div;
    };
    legendControl.addTo(myMap);
};

function addPlate(item){
    // reverse the lat and lon to match leaflet
    let locations = [];
    item.geometry.coordinates.forEach(element => {
        locations.push([element[1], element[0]]);
    });

    // graph the points making a line for the tectonicplate
    L.polyline(
        locations, 
        {
            color: "orange",
            weight: 2
        }
    ).addTo(tectonicplates);
};

// start the data collection and graphing
getEarthquakeData();