var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var templates = require('../../dist/templates');

module.exports = Backbone.View.extend({
  id: 'repos',

  template: _.template(templates.repos),

  initialize: function(options) {
    this.model = options.model;
  },

  render: function(collection, options) {
    this.$el.html(this.template({ user: this.model.user.toJSON(), orgs: this.model.toJSON() }));

    var $projects = $('#projects', this.el);
    $projects.empty();

    var tmpl = _(window.app.templates.repo).template();
    collection.each(function(repo, index) {
      $projects.append(tmpl(repo.attributes));
    });

    return this;
  }
});
