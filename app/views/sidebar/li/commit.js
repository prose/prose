var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var templates = require('../../../../dist/templates');

module.exports = Backbone.View.extend({
  template: templates.sidebar.li.commit,

  tagName: 'li',

  events: {
    'mouseenter a.removed': 'eventMessage',
    'mouseleave a.removed': 'eventMessage',
    'click a.removed': 'restore'
  },

  initialize: function(options) {
    this.branch = options.branch;
    this.file = options.file;
    this.files = options.repo.branches.findWhere({ name: options.branch }).files;
    this.repo = options.repo;
    this.view  = options.view;
  },

  render: function() {
    var data = {
      file: this.file,
      repo: this.repo.toJSON(),
      branch: this.branch,
      status: this.file.status
    };

    this.$el.html(_.template(this.template, data, { variable: 'commit' }));
    return this;
  },

  message: function(message) {
    this.$el.find('.message').html(message);
    this.$el.attr('title', message);
  },

  eventMessage: function(e) {
    switch(e.type) {
      case 'mouseenter':
        this.message(t('sidebar.repo.history.actions.restore'));
        break;
      case 'mouseleave':
        this.message(this.file.filename);
        break;
    }

    return false;
  },

  state: function(state) {
    // TODO: Set data-state attribute to toggle icon in CSS?
    // this.$el.attr('data-state', state);

    var $icon = this.$el.find('.ico');
    $icon.removeClass('added modified renamed removed saving checkmark error')
      .addClass(state);
  },

  restore: function(e) {
    var path = this.file.filename;

    // Spinning icon
    this.message(t('actions.restore.restoring') + ' ' + path);
    this.state('saving');

    this.files.restore(this.file, {
      success: (function(model, res, options) {
        this.message(t('actions.restore.restored') + ': ' + path);
        this.state('checkmark');

        this.$el.find('a')
          .removeClass('removed')
          .attr('title', t('actions.restore.restored') + ': ' + this.file.filename);

        // Re-render Files view once collection has updated
        this.view.files.render();
      }).bind(this),
      error: (function(model, xhr, options) {
        // Log actual error message
        this.message(['Error', xhr.status, xhr.statusText].join(' '));
        this.state('error');
      }).bind(this)
    });

    return false;
  }
});
