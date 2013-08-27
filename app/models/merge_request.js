var _ = require('underscore');
var Backbone = require('backbone');

module.exports = Backbone.Model.extend({
  initialize: function(attributes, options) {
    _.bindAll(this);
    
    this.repo = attributes.repo || this.collection.repo;
  },
  
  link: function() {
    return "#" + this.repo.get('full_name') + '/merge-request/' + this.id;
  },
    
  url: function() {
    return this.repo.url() + '/merge_request/' + this.get('id');
  }
});
