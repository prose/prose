var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');

module.exports = Backbone.View.extend({
  id: 'start',
  className: 'start',

  render: function() {
    var tmpl = _(window.app.templates.start).template();
    $(this.el).empty().append(tmpl(this.model));
    return this;
  }
});
