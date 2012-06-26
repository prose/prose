// Run an array of functions in serial
// -------

_.serial = function () {
  (_(arguments).reduceRight(_.wrap, function() {}))();
};


// Parent path
// -------

_.parentPath = function(path) {
  return path.replace(/\/?[a-zA-Z0-9_-]*$/, "");
};


// Topmost path
// -------

_.topPath = function(path) {
  var match = path.match(/\/?([a-zA-Z0-9_-]*)$/);
  return match[1];
};


// Valid filename check
// -------

_.validFilename = function(filename) {
  return !!filename.match(/^([a-zA-Z0-9_-]|\.)+$/);
  // Disabled for now: the Jekyll post format layout
  // return !!filename.match(/^\d{4}-\d{2}-\d{2}-[a-zA-Z0-9_-]+\.md$/);
};


// Check if a given file is a Jekyll post
// -------

_.jekyll = function(path, file) {
  return !!(path.match('_posts') && _.markdown(file));
};

// Determines whether a given file is a markdown file or not
// -------

_.markdown = function(file) {
  var regex = new RegExp("\.(md|mkdn?|mdown|markdown)$");
  return !!(regex.test(file));
};

// Check for a valid post file name
// -------

_.clip = function(str, length) {
  var res = str.substr(0, length);
  if (length < str.length) res += " ...";
  return res;
};


// Chunked Path
// -------
// 
// _.chunkedPath('path/to/foo')
// =>
// [
//   { url: 'path',        name: 'path' },
//   { url: 'path/to',     name: 'to' },
//   { url: 'path/to/foo', name: 'foo' }
// ]

_.chunkedPath = function(path) {
  var chunks = path.split('/');
  return _.map(chunks, function(chunk, index) {
    var url = [];
    for (var i=0; i<=index; i++) {
      url.push(chunks[i]);
    }
    return {
      url: url.join('/'),
      name: chunk
    }
  });
}