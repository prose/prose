var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var templates = require('../../dist/templates');
var util = require('../util');

module.exports = Backbone.View.extend({
  id: 'notification',

  className: 'notification round',

  template: templates.notification,

  events: {
    'click .create': 'createPost'
  },

  initialize: function(options) {
    options = _.clone(options) || {};
    _.bindAll(this);

    this.message = options.message;
    this.error = options.error;
    this.options = options.options;
  },

  render: function() {
    util.documentTitle(t('docheader.error'));

    var data = {
      message: this.message,
      error: this.error,
      options: this.options
    }

    this.$el.html(_.template(this.template, data, {
      variable: 'data'
    }));

    return this;
  },

  createPost: function (e) {
    var hash = window.location.hash.split('/');
    hash[2] = 'new';

    var path = hash[hash.length - 1].split('?');
    hash[hash.length - 1] = path[0] + '?file=' + path[0];

    // append query string
    if (path.length > 1) {
      hash[hash.length - 1]  += '&' + path[1];
    }

    router.navigate(_(hash).compact().join('/'), { trigger: true });
    return false;
  }
});
