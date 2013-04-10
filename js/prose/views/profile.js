(function (config, models, views, routers, utils, templates) {

  views.Profile = Backbone.View.extend({
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
          title: 'Your Projects',
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

    filterFiles: function () {
      _.delay(_.bind(function () {
        var searchstr = this.$('#filter').val();
        this.model = filterProjects(this.cache, searchstr);
        this.renderResults();
      }, this), 10);
    },

    renderResults: function () {
      $('#projects', this.el).empty().append(templates.projects(this.model));
    }

  });

}).apply(this, window.args);
