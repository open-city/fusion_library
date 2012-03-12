// FUSION MAP OPTIONS
var Fusion = Fusion || {};
Fusion.Options = Fusion.Options || {};
Fusion.Options.create = function(my_options) {
  my_options = typeof my_options !== 'undefined' ? my_options : {};
  var hash = $.extend({
    zoom: 10,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    mapTypeControl: false,
    streetViewControl: false,
    suppressInfoWindows: true
  }, my_options);
  return hash;
};

Fusion.Query = Fusion.Query || {};
Fusion.Query.create = function(hash) {
  query = [];
  query.push("SELECT " + ((typeof hash["select"] != "undefined") ? hash["select"] : "geometry"));
  query.push("FROM " + hash["from"]);

  if (hash["where"]) {
    query.push("WHERE " + hash["where"]);
  }

  return encodeURIComponent(query.join(" "));
};

// FUSION PAGE ELEMENT
Fusion.PageElement = Fusion.PageElement || {};
Fusion.PageElement.create = function(selector, options) {
  options = Fusion.Options.create(options);
  var fusion_page_element = new google.maps.Map(document.getElementById(selector), options);
  fusion_page_element.setOptions({styles: Fusion.Map.styles()});
  return fusion_page_element;
};

// FUSION MAP
Fusion.Map = Fusion.Map || {};
Fusion.Map.style = Fusion.Map.style || {};
Fusion.Map.style.create = function(type, options) {
  var style = {
    featureType: type,
    stylers: []
  }

  var stylers = [];
  $.each(options, function(key, value) {
    var hash = {}; hash[key] = value;
    stylers.push(hash);
  });
  style["stylers"] = stylers;

  return style;
};
Fusion.Map.styles = function(options) {
  var styles = [];

  styles.push(Fusion.Map.style.create("road", {visibility: "off", saturation: -100}));
  styles.push(Fusion.Map.style.create("landscape", {lightness: 75, saturation: -100}));
  styles.push(Fusion.Map.style.create("transit", {visibility: "off"}));
  styles.push(Fusion.Map.style.create("poi", {lightness: 60, saturation: -100}));
  styles.push(Fusion.Map.style.create("water", {hue: "#00b2ff"}));

  return styles;
};
Fusion.Map.create = function(selector, options) {
  this.page_element = Fusion.PageElement.create(selector, options);

  this.add_map_bounds = function(query_hash, callback) {
    var fusion_query = Fusion.Query.create(query_hash);
    new google.visualization.Query("http://www.google.com/fusiontables/gvizdata?tq="+fusion_query).send(callback);
  }

  this.set_map_bounds = function(response) {
    if (response.getDataTable().getNumberOfRows() > 0) {
      var map_bounds = new google.maps.LatLngBounds();
      var kml = response.getDataTable().getValue(0, 0);
      kml = kml.replace("<Polygon><outerBoundaryIs><LinearRing><coordinates>", "");
      kml = kml.replace("</coordinates></LinearRing></outerBoundaryIs></Polygon>", "");
      var boundPoints = kml.split(" ");

      $.each(boundPoints, function(index, value) {
        var boundItem = value.split(",");
        var point = new google.maps.LatLng(parseFloat(boundItem[1]), parseFloat(boundItem[0]));
        map_bounds.extend(point);
      });

      this.page_element.fitBounds(map_bounds);
    }
  }

  return this;
};

// LAYER
Fusion.Layer = Fusion.Layer || {};
Fusion.Layer.create = function(query_hash, page_element) {
  var layer = Fusion.Layer.GoogleFusionTablesLayer.create({
    query: query_hash,
    suppressInfoWindows: true
  });

  if (typeof page_element !== "undefined") {
    layer.setMap(page_element);
  }

  return layer;
};
Fusion.Layer.GoogleFusionTablesLayer = Fusion.Layer.GoogleFusionTablesLayer || {};
Fusion.Layer.GoogleFusionTablesLayer.create = function(options) {
  return new google.maps.FusionTablesLayer(options);
};

