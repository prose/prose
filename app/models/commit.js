var _ = require('underscore');
var Backbone = require('backbone');

module.exports = Backbone.Model.extend({
  initialize: function(attributes, options) {
    _.bindAll(this);

    this.repo = attributes.repo;
  },
  
  link: function() {
    return "#" + this.repo.get('full_name') + '/commit/' + this.get('sha');
  },
  
  url: function() {
    return this.repo.url() + '/commits/' + this.get('sha');
  }
});
