var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');

module.exports = Backbone.View.extend({

  id: 'notification',

  events: {
    'click .create': 'createPost'
  },

  initialize: function() {
    this.model = this.options;
  },

  render: function() {
    var tmpl = _(window.app.templates.notification).template();
    $(this.el).html(tmpl(this.model));
    return this;
  },

  createPost: function (e) {
    var hash = window.location.hash.split('/');
    hash[2] = 'new';
    hash[hash.length - 1] = '?file=' + hash[hash.length - 1];

    router.navigate(_(hash).compact().join('/'), true);
    return false;
  }

});
