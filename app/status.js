var config = require('./config'); 
var $ = require('jquery-browserify'); 

module.exports = {
  githubApi: function(cb) {
    $.ajax({
      type: 'GET',
      url: config.apiStatus + '?callback=?',
      dataType: 'jsonp',
      success: function(res) {
        return cb(res);
      }
    });
  }
}
