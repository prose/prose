// Putting util functions into the _ namespace, which is handy

// Run an array of functions in serial.
_.serial = function () {
  (_(arguments).reduceRight(_.wrap, function() {}))();
};

// Convert a javascript object to its YAML representation
// IMPORTANT! Not working reliably with nested objects
_.toYAML = function(data) {
  function serializeValue(val) {
    function serializeArray(a) {
      return a.map(function(elem) { return "- "+ elem}).join("\n");
    }
    if (_.isArray(val)) return "\n"+serializeArray(val);
    return _.isNumber(val) || _.isBoolean(val) ? val : "\""+val+"\"";
  }
  return Object.keys(data).map(function(key) {
    return key +": "+ serializeValue(data[key]);
  }).join("\n");
};

_.parentPath = function(path) {
  return path.replace(/\/?[a-zA-Z0-9_-]*$/, "");
}

_.topPath = function(path) {
  var match = path.match(/\/?([a-zA-Z0-9_-]*)$/);
  return match[1];
}

// Check for a valid post file name
_.validFilename = function(filename) {
  return !!filename.match(/^\d{4}-\d{2}-\d{2}-[a-zA-Z0-9_-]+\.md$/);
};

// Check for a valid post file name
_.clip = function(str, length) {
  var res = str.substr(0, length);
  if (length < str.length) res += " ...";
  return res;
};