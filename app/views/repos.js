var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var templates = require('../../dist/templates');

module.exports = Backbone.View.extend({
  id: 'repos',

  template: _.template(templates.repos),

  events: {
    'keyup #filter': 'search'
  },

  initialize: function(options) {
    this.model = options.model;
    this.listenTo(this.model, 'reset', this.render, this);
  },

  render: function() {
    this.$el.html(this.template({ user: this.model.user.toJSON(), orgs: this.model.toJSON() }));

    /*
    _.delay(function () {
      utils.fixedScroll($('.topbar'));
      $('#filter').focus();
    }, 1);
    */

    // Cache to perform autocompletion
    this.cache = this.model;

    var $projects = $('#projects', this.el);
    $projects.empty();

    var tmpl = _(window.app.templates.repo).template();
    this.model.each(function(repo, index) {
      $projects.append(tmpl(repo.attributes));
    });

    return this;
  },

  search: function(e) {
    // If this is the ESC key
    if (e.which === 27) {
      _.delay(_.bind(function () {
        $('#filter', this.el).val('');
        this.model = window.app.models.filterProjects(this.cache, '');
        this.renderResults();
      }, this), 10);
    } else if (e.which === 40 && $('.item').length > 0) {
        utils.pageListing('down'); // Arrow Down
        e.preventDefault();
        e.stopPropagation();
        $('#filter').blur();
    } else {
      _.delay(_.bind(function () {
        var searchstr = $('#filter', this.el).val();
        this.model = window.app.models.filterProjects(this.cache, searchstr);
        this.renderResults();
      }, this), 10);
    }
  }
});
