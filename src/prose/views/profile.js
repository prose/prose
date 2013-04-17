var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var utils = require('.././util');

module.exports = Backbone.View.extend({
    id: 'profile',

    events: {
      'keyup #filter': 'filterFiles'
    },

    render: function () {
      var data = this.model;
      this.eventRegister = app.eventRegister;

      var header = {
          avatar: '<img src="' + data.user.avatar_url + '" width="40" height="40" alt="Avatar" />',
          parent: data.user.name || data.user.login,
          parentUrl: data.user.login,
          title: 'Explore Projects',
          titleUrl: data.user.login,
          alterable: false
      };

      this.eventRegister.trigger('headerContext', header);

      var tmpl = _(window.app.templates.profile).template();
      var sidebar = _(window.app.templates.sidebarOrganizations).template();

      $(this.el).empty().append(tmpl(data));
      this.renderResults();

      $('#drawer')
        .empty()
        .append(sidebar(this.model));

      _.delay(function () {
        utils.shadowScroll($('#projects'), $('.content-search'));
        $('#filter').focus();
      }, 1);

      // Cache to perform autocompletion on it
      this.cache = this.model;

      return this;
    },

    filterFiles: function (e) {
      // If this is the ESC key
      if (e.which === 27) {
        _.delay(_.bind(function () {
          $('#filter', this.el).val('');
          this.model = window.app.models.filterProjects(this.cache, '');
          this.renderResults();
        }, this), 10);
      } else {
        _.delay(_.bind(function () {
          var searchstr = $('#filter', this.el).val();
          this.model = window.app.models.filterProjects(this.cache, searchstr);
          this.renderResults();
        }, this), 10);
      }
    },

    renderResults: function () {
      var tmpl = _(window.app.templates.projects).template();
      var repos;
      var $projects = $('#projects', this.el);
          $projects.empty();

      // Flatten the listing if app.username === state.user
      if (this.model.state && (this.model.state.user === app.username)) {
        repos = _(this.model.owners).flatten();
      } else {
        repos = this.model.repos;
      }

      _(repos).each(function(r, i) {
        $projects.append(tmpl(_.extend(r, {
          index: i
        })));
      });
    }

});
