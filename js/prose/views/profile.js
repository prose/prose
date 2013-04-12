var Backbone = require('backbone');
var $ = require('jquery-browserify');
var _ = require('underscore');

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

      $(this.el).empty().append(templates.profile(data));
      this.renderResults();

      $('#drawer')
        .empty()
        .append(templates.sidebarOrganizations(this.model));

      _.delay(function () {
        shadowScroll($('#projects'), $('.content-search'));
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
          this.model = filterProjects(this.cache, '');
          this.renderResults();
        }, this), 10);
      } else {
        _.delay(_.bind(function () {
          var searchstr = $('#filter', this.el).val();
          this.model = filterProjects(this.cache, searchstr);
          this.renderResults();
        }, this), 10);
      }
    },

    renderResults: function () {
      $('#projects', this.el).empty().append(templates.projects(this.model));
    }

});
