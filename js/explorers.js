function createMap() {

    var outdoors = L.tileLayer('https://api.mapbox.com/styles/v1/alinaalina/cjdf495v05h9k2rp74jofvpcb/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiYWxpbmFhbGluYSIsImEiOiJjamRmM3c4M20wM2Q1MndvMHR5d3B3Z3JuIn0.gLm14to9IRdaLHdodrmdhg', {
            attribution: "Made by Alina"
        }),

        vintage = L.tileLayer("https://api.mapbox.com/styles/v1/alinaalina/cjdf3zrd89h672spkz10c2j7b/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiYWxpbmFhbGluYSIsImEiOiJjamRmM3c4M20wM2Q1MndvMHR5d3B3Z3JuIn0.gLm14to9IRdaLHdodrmdhg", {
            attribution: "Made by Mengtong"
        });

    var map = L.map('map', {
        center: [20, 0],
        zoom: 2,
        layers: [outdoors]
    });

    getData(map);

    var layers = {
        "Outdoors Style": outdoors,
        "Ancient Style": vintage
    };

    L.control.layers(layers).addTo(map);


}                                 //这个函数的目的是创建一个基本地图

function getData(map) {                                       //Import GeoJSON data
    $.ajax("data/MegaCities.geojson", {                      //load the data
        dataType: "json",
        success: function (response) {
            var attributes = processData(response);          //create an attributes array
            createPropSymbols(response, map, attributes);    //call function to create proportional symbols
            createSequenceControls(map, attributes);                     //因为要用到ajax带回来的数据，所以在这里面call这个函数
            createLegend(map, attributes);
        }
    });

}                                //这个函数的目的是为了获取数据文件中的数据，以及为别的函数加载数据

function processData(data) {                                    //build an attributes array from the data
    var attributes = [];                                       //empty array to hold attributes
    var properties = data.features[0].properties;              //properties of the first feature in the dataset

    for (var attribute in properties) {                         //push each attribute name into attributes array
        if (attribute.indexOf("Pop") > -1) {               //indexOf是JS的方法。目的是筛选，所有attribute中，含“pop”字符串的
            //如果要检索的字符串值没有出现，则indexOf方法返回 -1，所以>-1意味着该字符串出现了
            attributes.push(attribute);                   //push() 方法可把传入的新参数顺序添加到数组的尾部。它直接修改数组
        }
        ;
    }
    ;

    return attributes;
}                           //这个函数的目的是为了将数据变成数组，方便制作sequence

function pointToLayer(feature, latlng, attributes) {             //function to convert markers to circle markers
    var attribute = attributes[0];                              //此处预定是第一个值，后面再慢慢更新。Determine which attribute to visualize with proportional symbols

    var options = {                                             //create marker options
        fillColor: "#ff7800",
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    };

    var attValue = Number(feature.properties[attribute]);    //For each feature, determine its value for the selected attribute

    options.radius = calcPropRadius(attValue);           //Give each feature's circle marker a radius based on its attribute value

    var layer = L.circleMarker(latlng, options);             //create circle marker layer，L.circleMaker是API中的定好的方法


    var popupContent = "<p><b>City:</b> " + feature.properties.City + "</p>";
    var year = attribute.split("_")[1];                      //以“_”为中点切开attribute成两半，选[1]，即选择第二半。
    popupContent += "<p><b>Population in " + year + ":</b> " + feature.properties[attribute] + " million</p>";


    layer.bindPopup(popupContent, {
        offset: new L.Point(0, -options.radius)
    });


    layer.on({                                          //event listeners to open popup on hover
        mouseover: function () {                          //若想让光标一移动到自定义的圆圈maker上就显示名字，可以通过add eventlistener的方法。
            this.openPopup();                           //当鼠标一移到圆圈maker上时，就触发与这个marker相连接的popup
        },
        mouseout: function () {
            this.closePopup();
        },
        click: function () {
            $("#panel").html(popupContent);
        }
    });

    return layer;                                        //return the circle marker to the L.geoJson pointToLayer option

}   //这个函数的目的是创建小图标、弹窗及其触发动作

function createPropSymbols(data, map, attributes) {                       //Add circle markers for point features to the map
    L.geoJson(data, {                                                   //create a Leaflet GeoJSON layer and add it to the map
        pointToLayer: function (feature, latlng) {
            return pointToLayer(feature, latlng, attributes);
        }
    }).addTo(map);
}    //这个函数是为了让图标的大小与对应的数字成比例

function calcPropRadius(attValue) {                       //calculate the radius of each proportional symbol
    var scaleFactor = 50;                                 //scale factor to adjust symbol size evenly 这是自己取的名字，不是API中自带的
    var area = attValue * scaleFactor;                    //area based on attribute value and scale factor
    var radius = Math.sqrt(area / Math.PI);                 //radius calculated based on area
    return radius;
}                   //这个函数是为了计算图标的大小

function updatePropSymbols(map, attribute) {                  //Resize proportional symbols according to new attribute values
    map.eachLayer(function (layer) {                           //eachLayer是leaflet API中的方法，用于对每个layer进行操作
        if (layer.feature && layer.feature.properties[attribute]) {              //feature in the layer真？所选的atteribute在这个layer的feature property真？
            var props = layer.feature.properties;                               //access feature properties，返回的是数组

            var radius = calcPropRadius(props[attribute]);                      //update each feature's radius based on new attribute values，返回数字

            layer.setRadius(radius);                                            //setRadius是leaflet API中的方法，可以为circle设置新的半径，返回值是数字

            var popupContent = "<p><b>City:</b> " + props.City + "</p>";        //add city to popup content string

            var year = attribute.split("_")[1];                                 //add formatted attribute to panel content string

            popupContent += "<p><b>Population in " + year + ":</b> " + props[attribute] + " million</p>";

            layer.bindPopup(popupContent, {                                     //replace the layer popup
                offset: new L.Point(0, -radius)
            });                                                                 //注意：只用对L.tileLayer更新，而不用对L.circleMaker layer更新
                                                                                //update the layer style and popup
        }
    });
}           //这个函数的目的是为了更新layer上的圈圈大小、数值以及popup内容

function createSequenceControls(map, attributes) {
    var SequenceControl = L.Control.extend({
        options: {
            position: 'bottomleft'
        },

        onAdd: function (map) {
            var container = L.DomUtil.create('div', 'sequence-control-container');
            $(container).append('<input class="range-slider" type="range" max=6 min=0 step=1 value=0>');

            /*
            $('.range-slider').attr({
                max: 6,
                min: 0,
                value: 0,
                step: 1
            });
            */

            $(container).append('<button class="skip" id="reverse" title="Reverse">Reverse</button>');
            $(container).append('<button class="skip" id="forward" title="Forward">Skip</button>');

            $(container).on('mousedown dblclick pointerdown', function (e) {
                L.DomEvent.stopPropagation(e);
            });

            return container;
        }
    });

    map.addControl(new SequenceControl());

    $("#reverse").html('<img src="img/reverse.png">');
    $("#forward").html('<img src="img/forward.png">');

    $('.skip').click(function () {                      //click listener for buttons
        var index = $('.range-slider').val();
        if ($(this).attr('id') == 'forward') {         //increment or decrement depending on button clicked
            index++;
            index = index > 6 ? 0 : index;            //if past the last attribute, wrap around to first attribute
        }                                             //注意：else if跟之前的if循环之间不要加；号
        else if ($(this).attr('id') == 'reverse') {
            index--;
            index = index < 0 ? 6 : index;            //if past the first attribute, wrap around to last attribute
        }
        ;

        $('.range-slider').val(index);                //update slider
        updatePropSymbols(map, attributes[index]);    //pass new attribute to update symbols
        updateLegend(map, attributes[index]);
    });

    $('.range-slider').on('input', function () {        //input listener for slider
        var index = $(this).val();
        updatePropSymbols(map, attributes[index]);    //pass new attribute to update symbols
        updateLegend(map, attributes[index]);
    });
}    //这个函数是为了创建slider

function createLegend(map, attributes) {
    var LegendControl = L.Control.extend({
        options: {
            position: 'bottomright'
        },

        onAdd: function (map) {
            var container = L.DomUtil.create('div', 'legend-control-container');   // create the control container with a particular class name

            $(container).append('<div id="temporal-legend">');                      //add temporal legend div to container

            var svg = '<svg id="attribute-legend" width="180px" height="180px">';  //step 1: start attribute legend svg string

            var circles = {
                max: 20,
                mean: 40,
                min: 60
            };

            for (var circle in circles) {
                svg += '<circle class="legend-circle" id="' + circle + '" fill="#F47821" fill-opacity="0.8" stroke="#000000" cx="30"/>';
                svg += '<text id="' + circle + '-text" x="65" y="' + circles[circle] + '"></text>';
            }

            /*
                        for (var i=0; i<circles.length; i++){                                  //Step 2: loop to add each circle and text to svg string
                            svg += '<circle class="legend-circle" id="' + circles[i] + '" fill="#F47821" fill-opacity="0.8" stroke="#000000" cx="90"/>';
                    };
            */
            $(container).on('mousedown dblclick pointerdown', function (e) {
                L.DomEvent.stopPropagation(e);
            });

            svg += "</svg>";                                                       //close svg string
            $(container).append(svg);                                              //add attribute legend svg to container
            return container;
        }
    });

    map.addControl(new LegendControl());
    updateLegend(map, attributes[0]);
}               //这个函数的目的是为了创建一个图例框

function updateLegend(map, attribute) {                             //Update the legend with new attribute
    var year = attribute.split("_")[1];                            //create content for legend
    var content = "Population in " + year;
    $('#temporal-legend').html(content);                           //replace legend content

    var circleValues = getCircleValues(map, attribute);            //get the max, mean, and min values as an object

    for (var key in circleValues) {
        var radius = calcPropRadius(circleValues[key]);            //get the radius

        $('#' + key).attr({                                          //Step 3: assign the cy and r attributes
            cy: 59 - radius,
            r: radius
        });

        $('#' + key + '-text').text(Math.round(circleValues[key] * 100) / 100 + " million");            //Step 4: add legend text

    }
}                //这个函数的目的是更新图例

function getCircleValues(map, attribute) {                  //Calculate the max, mean, and min values for a given attribute
    var min = Infinity,                                    //start with min at highest possible and max at lowest possible number
        max = -Infinity;

    map.eachLayer(function (layer) {
        if (layer.feature) {                                //get the attribute value
            var attributeValue = Number(layer.feature.properties[attribute]);

            if (attributeValue < min) {                     //test for min
                min = attributeValue;
            }


            if (attributeValue > max) {                     //test for max
                max = attributeValue;
            }

        }

    });

    var mean = (max + min) / 2;                            //set mean

    return {                                               //return values as an object
        max: max,
        mean: mean,
        min: min
    };
}

$(document).ready(createMap);


/*
var map = L.map('map').setView([51.505, -0.09], 13);

var layer1 = L.tileLayer('https://api.mapbox.com/styles/v1/alinaalina/cjdf495v05h9k2rp74jofvpcb/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiYWxpbmFhbGluYSIsImEiOiJjamRmM3c4M20wM2Q1MndvMHR5d3B3Z3JuIn0.gLm14to9IRdaLHdodrmdhg', {
    minZoom: 3,
    maxZoom: 14
}).addTo(map);



var marker = L.marker([51.5, -0.09]).addTo(map);

var circle = L.circle([51.508, -0.11], 500, {
    color: 'red',
    fillColor: '#f03',
    fillOpacity: 0.5
}).addTo(map);

var polygon = L.polygon([
    [51.509, -0.08],
    [51.503, -0.06],
    [51.51, -0.047]
]).addTo(map);

marker.bindPopup("<b>Hello world!</b><br>I am a popup.").openPopup();
circle.bindPopup("I am a circle.");
polygon.bindPopup("I am a polygon.");

var popup = L.popup()
    .setLatLng([51.5, -0.09])
    .setContent("I am a standalone popup.")
    .openOn(map);       //这里也可用addTo(map),但最好在连.的时候用open，在中间有两个括号时用add

L.popup();  //call popup函数

function onMapClick(e) {
    popup
        .setLatLng(e.latlng)
        .setContent("You clicked the map at " + e.latlng.toString())//这里的toString可要可不要，只是为了debug目的而加上而已
        .openOn(map);
}

map.on('click', onMapClick);
*/       //这段代码是在地图上画“多边形、圆圈、点”的那个例子

/*
function onEachFeature(feature, layer) {                //no property named popupContent; instead, create html string with all properties
    var popupContent = "";
    if (feature.properties) {
        //loop to add feature property names and values to html string
        for (var property in feature.properties){
            popupContent += "<p>" + property + ": " + feature.properties[property] + "</p>";
        }
        layer.bindPopup(popupContent);
    };
};

function getData(map){
    $.ajax("data/MegaCities.geojson", {
        dataType: "json",
        success: function(response){

            L.geoJson(response, {
                onEachFeature: onEachFeature
            }).addTo(map);
        }
    });
};
*/       //这段代码：点击每个点，能弹出相应的信息列表

/*
function getData(map){
    $.ajax("data/MegaCities.geojson", {
        dataType: "json",
        success: function(response){
            //create marker options
            var geojsonMarkerOptions = {
                radius: 8,
                fillColor: "#ff7800",
                color: "#000",
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
            };

            //create a Leaflet GeoJSON layer and add it to the map
            L.geoJson(response, {
                pointToLayer: function (feature, latlng){
                    return L.circleMarker(latlng, geojsonMarkerOptions);
                }
            }).addTo(map);
        }
    });
};
*/       //这段代码能把所有的点变成diy的小圈圈

/*
function getData(map){
    $.ajax("data/MegaCities.geojson", {
        dataType: "json",
        success: function(response){
            L.geoJson(response, {
                //use filter function to only show cities with 2015 populations greater than 20 million
                filter: function(feature, layer) {
                    return feature.properties.Pop_2015 > 20;
                }
            }).addTo(map);
        }
    });
};
*/       //这段代码起到过滤的作用，把满足过滤要求的显示出来

/*
function getData(map){
    $.ajax("data/MegaCities.geojson", {
        dataType: "json",
        success: function(response){
            console.log(response)

            var markers = L.markerClusterGroup();

            for (var i = 0; i < response.features.length; i++) {
                var a = response.features[i];
                var properties = "";
                for (var property in a.properties){
                    properties += "<p>" + property + ": " + a.properties[property] + "</p>";
                };
                var marker = L.marker(new L.LatLng(a.geometry.coordinates[1], a.geometry.coordinates[0]), { properties: properties });

                marker.bindPopup(properties);

                markers.addLayer(marker);
            }

            map.addLayer(markers);
        }
    });
}
*/       //不是很懂这下面两段，需要之后有时间再看看

/*
function getData(map){
    $.ajax("data/MegaCities.geojson", {
        dataType: "json",
        success: function(response){
            var geoJsonLayer = L.geoJson(response);
            var markers = L.markerClusterGroup();
            markers.addLayer(geoJsonLayer);
            map.addLayer(markers);
        }
    });
};
*/

/*
function createPropSymbols(data, map){
    var attribute = "Pop_2015";
    var geojsonMarkerOptions = {                             //create marker options
        radius: 8,
        fillColor: "#ff7800",
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    };
 */

/*
    L.geoJson(data, {                                                        //create a Leaflet GeoJSON layer and add it to the map
        pointToLayer: function (feature, latlng) {
            var attValue = Number(feature.properties[attribute]);            //Step 5: For each feature, determine its value for the selected attribute
                                                                             //这里的Number()是JS的函数，目的是把string转化成数值，有利于制作比例图标
            console.log(feature.properties, attValue);                       //examine the attribute value to check that it is correct
            geojsonMarkerOptions.radius = calcPropRadius(attValue);          //Step 6: Give each feature's circle marker a radius based on its attribute value
            return L.circleMarker(latlng, geojsonMarkerOptions);             //create circle markers
        }
    }).addTo(map);
};
*/

/*
GOAL: Proportional symbols representing attribute values of mapped features
//STEPS:
//1. Create the Leaflet map--done (in createMap())
//2. Import GeoJSON data--done (in getData())
//3. Add circle markers for point features to the map--done (in AJAX callback)
//4. Determine which attribute to visualize with proportional symbols
//5. For each feature, determine its value for the selected attribute
//6. Give each feature's circle marker a radius based on its attribute value
*/       //制作比例图标的伪代码

/*
//GOAL: Allow the user to sequence through the attributes and resymbolize the map according to each attribute
//STEPS:
//1. Create slider widget
//2. Create skip buttons
//3. Create an array of the sequential attributes to keep track of their order
//4. Assign the current attribute based on the index of the attributes array
//5. Listen for user input via affordances
//6. For a forward step through the sequence, increment the attributes array index;
//   for a reverse step, decrement the attributes array index
//7. At either end of the sequence, return to the opposite end of the seqence on the next step
//   (wrap around)
//8. Update the slider position based on the new index
//9. Reassign the current attribute based on the new attributes array index
//10. Resize proportional symbols according to each feature's value for the new attribute
*/       //制作sequence的伪代码

/*
    var layer = L.marker(latlng, {                            //hover功能,鼠标光标一移到点的附近，就能显示字。因为title是L.marker的一个option.
        title: feature.properties.City                        //该title option只对image marker起作用，而不能对自定义的圆圈maker起作用
    });
    */

/*
    var panelContent = "<p><b>City:</b> " + feature.properties.City + "</p>";
    var year = attribute.split("_")[1];
    panelContent += "<p><b>Population in " + year + ":</b> " + feature.properties[attribute] + " million</p>";

    var popupContent = feature.properties.City;


    layer.bindPopup(popupContent, {
        offset: new L.Point(0,-options.radius),
        closeButton: false
    });


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
*/

/*
PSEUDO-CODE FOR ATTRIBUTE LEGEND
1. Add an `<svg>` element to the legend container
2. Add a `<circle>` element for each of three attribute values: max, mean, and min
3. Assign each `<circle>` element a center and radius based on the dataset max, mean, and min values of the current attribute
4. Create legend text to label each circle
5. Update circle attributes and legend text when the data attribute is changed by the user
*/       //制作图例的伪代码

/*
$('#panel').append('<button class="skip" id="reverse">Reverse</button>');
$('#panel').append('<button class="skip" id="forward">Skip</button>');
$('#reverse').html('<img src="img/reverse.png">');
$('#forward').html('<img src="img/forward.png">');
$('#panel').append('<input class="range-slider" type="range">');        //在panel元素中，create range input element (slider)
*/

/*
function createSequenceControls(map, attributes){                                       //Step 1: Create new sequence controls
     var SequenceControl = L.Control.extend({                  //extend()方法可以在一个在leaflet源文件里已经定义好的constructor函数的基础上，让用户创建任意的新函数
        options: {
            position: 'bottomleft'
        },

        onAdd: function (map) {                                                        //this script is executed when the control is added to the map
            var container = L.DomUtil.create('div', 'sequence-control-container');     // create the control container div with a particular class name
            $(container).append('<input class="range-slider" type="range">');          //create range input element (slider)
            $(container).append('<button class="skip" id="reverse" title="reverse">reverse</button>');        //add skip buttons
            $(container).append('<button class="skip" id="forward" title="forward">forward</button>');

            $(container).on('pointerdown', function(e){                         //kill any mouse event listeners on the map
                L.DomEvent.stopPropagation(e);
            });

    $(".range-slider").attr({                                                 //set slider attributes
        max: 6,
        min: 0,
        value: 0,
        step: 1
    });

    $('.skip').click(function(){                      //click listener for buttons
        var index = $('.range-slider').val();
        if ($(this).attr('id') == 'forward'){         //increment or decrement depending on button clicked
            index++;
            index = index > 6 ? 0 : index;            //if past the last attribute, wrap around to first attribute
        }                                             //注意：else if跟之前的if循环之间不要加；号
        else
            if ($(this).attr('id') == 'reverse'){
            index--;
            index = index < 0 ? 6 : index;            //if past the first attribute, wrap around to last attribute
        };

        $('.range-slider').val(index);                //update slider
        console.log(index);
        updatePropSymbols(map, attributes[index]);    //pass new attribute to update symbols
    });

    $('.range-slider').on('input', function(){        //input listener for slider
        var index = $(this).val();
        console.log(index);
        updatePropSymbols(map, attributes[index]);    //pass new attribute to update symbols
    });

        map.addControl(new SequenceControl());
        return container;                                 // ... initialize other DOM elements, add listeners, etc.
        }
    });

};     //这个函数的目的是控制进度条、前进/后退键
*/       //createSequenceControl的demo









