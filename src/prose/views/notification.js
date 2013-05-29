var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');

module.exports = Backbone.View.extend({

  id: 'notification',
  className: 'notification round',

  events: {
    'click .create': 'createPost'
  },

  initialize: function() {
    this.model = this.options;
  },

  render: function() {
    var view = this;
    this.eventRegister = app.eventRegister;

    var pathTitle = (app.state.path) ? app.state.path : '';
    this.eventRegister.trigger('documentTitle', 'Error ' + pathTitle + '/' + app.state.file + ' at ' + app.state.branch);
    var tmpl = _(window.app.templates.notification).template();

    // Basically for any previous path we want to try
    // and bring a user back to the directory tree.
    var hash = document.location.hash.split('/');
    var parts = hash.slice(0, hash.length -1);
    if (parts[2]) parts[2] = 'tree';

    var previous = parts.join('/');

    $(this.el).html(tmpl(_.extend(this.model, {
      key: view.model.key,
      message: view.model.message,
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
