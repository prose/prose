(function(config, models, views, routers, utils, templates) {

views.Profile = Backbone.View.extend({
  id: 'start',

  render: function() {
    $(this.el).html(templates.profile(this.model));
    $('#sidebar').empty().html(templates.sidebarOrganizations(this.model));
    return this;
  }
});

}).apply(this, window.args);
