var mapSelector = '#district-club-map';


DistrictClubMap.prototype = {
    googleMapsAPIKey: null,
    district: null,
    corsProxy: 'https://cors-anywhere.herokuapp.com/'
};


// Division.prototype = {
//     name: null,
//     hue: 0,
//     areas: []
// };
//
// Area.prototype = {
//     name: null,
//     lightness: 0
// };


function DistrictClubMap() {}


var params
function setMapParameters(mapParams) {
    params = mapParams;
}


$(document).ready(function () {
    getClubInfo();
    $('body').append(
        $('<script>', {
            src:'https://maps.googleapis.com/maps/api/js?key='
                + params.googleMapsAPIKey
                + '&callback=clubMap'}));
});


var clubInfo;
function getClubInfo() {
    console.log('getting club info');
    var url = 'https://www.toastmasters.org/api/sitecore/FindAClub/Search';
    $.get(
        params.corsProxy + url,
        {
            district: params.district,
            advanced: 1,
            latitude: 1, // breaks when zero or missing
            longitude: 1, // breaks when zero or missing
        },
        function(data) {
            console.log('Club information retrieved for District ' + params.district);
            clubInfo = data;
            console.log('yaya! we got the club info');
        },
        'json'
    );
}


function clubMap() {
    if (clubInfo !== undefined) {
        initialiseDistrictData();
        initialiseColours();
        var mapCenter = getCenter(clubInfo);
        var mapProperties = {
            center: new google.maps.LatLng(mapCenter.latitude, mapCenter.longitude),
            zoom: 5
        }
        var map = new google.maps.Map($(mapSelector)[0], mapProperties);

        addClubMarkers(map);
        return;
    }
    setTimeout(clubMap, 1000);
}


function addClubMarkers(map) {
    for (var i = 0; i < clubInfo.Clubs.length; i++) {
        var club = clubInfo.Clubs[i];
        var marker = new google.maps.Marker({
            position: new google.maps.LatLng(club.Address.Coordinates.Latitude,
                                             club.Address.Coordinates.Longitude),
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 12,
                fillColor: getColour(clubInfo.Clubs[i]),
                fillOpacity: 0.8,
                strokeOpacity: 0.0,

            },
            label: {
                color: '#111111',
                text: parseInt(club.Classification.Area.Name).toString()
            },
            infoWindow: new google.maps.InfoWindow({
                            content: formatForDisplay(club)
                        })
        });

        marker.addListener('click', function() {
            var infoWindowMap = this.infoWindow.getMap();
            if (infoWindowMap == null || typeof infoWindowMap == "undefined") {
                this.infoWindow.open(map, this);
            } else {
                this.infoWindow.close();
            }
        });
        marker.setMap(map);
    }
}


function formatForDisplay(club) {
    return club.Identification.Name + ' (' + club.Identification.Id.DisplayFriendlyFormat + ') '
            + 'Area: ' + club.Classification.Division.Name + club.Classification.Area.Name;
}


function getCenter(clubInfo) {
    //TODO: implement this for the given club info
    return { latitude: -38, longitude: 142 };
}


function getColour(club) {
    var division = getDivision(club.Classification.Division.Name)
    var hue = division !== null ? division.hue : 0;
    var area = getArea(club.Classification.Area.Name)
    var lightness = area !== null ? area.lightness : 0.5;
    var saturation = 1 - (1 - lightness)/3 ;
    return "hsl(" + hue + ", " + saturation * 100 + "%, " + lightness * 100 + "%)";
}

function Division(name) {
    this.name = name;
}

var divisions = new Array();
var areas = new Array();
function initialiseDistrictData() {
    for (var i = 0; i < clubInfo.Clubs.length; i++) {

        var division;
        if (getDivision(clubInfo.Clubs[i].Classification.Division.Name) !== null) {
            division = getDivision(clubInfo.Clubs[i].Classification.Division.Name);
        } else {
            division = new Object();
            division.name = clubInfo.Clubs[i].Classification.Division.Name;
            division.areas = new Array();
            divisions.push(division);
        }


        if (getArea(clubInfo.Clubs[i].Classification.Area.Name !== null)) {
            continue;
        }
        var area = new Object();
        area.name = clubInfo.Clubs[i].Classification.Area.Name;
        division.areas.push(area);
        areas.push(area);
    }
}

function getDivision(name) {
    for (var i = 0; i < divisions.length; i++) {
        if (divisions[i].name == name) {
            return divisions[i];
        }
    }
    return null;
}

function getArea(name) {
    for (var i = 0; i < areas.length; i++) {
        if (areas[i].name == name) {
            return areas[i];
        }
    }
    return null;
}


function initialiseColours() {
    if (clubInfo == undefined) {
        log('Cannot initialise colours - no club data');
        return;
    }

    // DIVISION HUES
    var divisionCount = divisions.length;
    for (var d = 0; d < divisionCount; d++) {
        divisions[d].hue = d * 360.0/(divisionCount + 1)
        var areaCount = divisions[d].areas.length;
        for (var a = 0; a < areaCount; a++) {
            divisions[d].areas[a].lightness = 0.15 + 0.7/areaCount * (a + 1);
        }
    }
}
