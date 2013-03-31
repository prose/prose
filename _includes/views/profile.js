(function(config, models, views, routers, utils, templates) {

views.Profile = Backbone.View.extend({
  id: 'start',

  render: function() {
    $(this.el).html(templates.profile(_.extend(this.model, app.state, {
        state: app.state
    })));

    $('#sidebar').empty();
    // $('#sidebar').empty().html(templates.sidebarOrganizations(this.model));
    return this;
  }
});

}).apply(this, window.args);
