var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var templates = require('../../../../dist/templates');

module.exports = Backbone.View.extend({
  template: templates.sidebar.li.commit,

  tagName: 'li',

  events: {
  },

  initialize: function(options) {
    this.file = options.file;
    this.model = options.file.commit;
    this.repo = options.repo;
    this.branch = options.branch;
  },

  restore: function(e) {
    var $target = $(e.currentTarget);
    var $overlay = $(e.currentTarget).find('.overlay');
    var path = $target.data('path');

    // Spinning icon
    var message = '<span class="ico small inline saving"></span> Restoring ' + path;
    $overlay.html(message);

    app.models.restoreFile(app.state.user, app.state.repo, app.state.branch, path, app.state.history.commits[path][0].url, function(err) {
      if (err) {
        message = '<span class="ico small inline error"></span> Error Try again in 30 Seconds';
        $overlay.html(message);
      } else {
        message = '<span class="ico small inline checkmark"></span> Restored ' + path;
        $overlay.html(message);
        $overlay.removeClass('removed').addClass('restored');

        // Update the listing anchor link
        $target
          .removeClass('removed')
          .attr('title', 'Restored ' + path)
          .addClass('added');

        // Update the anchor listing icon
        $target.find('.removed')
          .removeClass('removed')
          .addClass('added');
      }
    });

    return false;
  },

  render: function() {
    this.$el.html(_.template(this.template, {
      file: this.file,
      model: this.model.toJSON(),
      repo: this.repo.toJSON(),
      branch: this.branch,
      status: this.file.status
    }, { variable: 'commit' }));

    return this;
  }
});
