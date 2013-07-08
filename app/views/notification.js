var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var templates = require('../../dist/templates');

module.exports = Backbone.View.extend({
  id: 'notification',

  className: 'notification round',

  template: _.template(templates.notification),

  events: {
    'click .create': 'createPost'
  },

  initialize: function() {
    this.model = this.options;
  },

  render: function() {
    this.eventRegister.trigger('documentTitle', t('docheader.error'));

    // Basically for any previous path we want to try
    // and bring a user back to the directory tree.
    var hash = document.location.hash.split('/');
    var parts = hash.slice(0, hash.length -1);
    if (parts[2]) parts[2] = 'tree';

    var previous = parts.join('/');

    this.$el.html(this.template(_.extend(this.model, {
      key: this.model.key,
      message: this.model.message,
      previous: previous,
      pathFromFile: (app.state.file) ? true : false
    })));

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

    router.navigate(_(hash).compact().join('/'), true);
    return false;
  }

});
