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
    this.message('Restoring ' + path);
    this.state('saving');

    this.files.restore(this.file, {
      success: (function(model, res, options) {
        this.message('Restored ' + path);
        this.state('checkmark');

        // render Files view once collection has updated
        this.view.files.render();
      }).bind(this),
      error: (function(model, xhr, options) {
        // log actual error message
        this.message(['Error', xhr.status, xhr.statusText].join(' '));
        this.state('error');
      }).bind(this)
    });

    return false;
  },

  render: function() {
    this.$el.html(_.template(this.template, {
      file: this.file,
      repo: this.repo.toJSON(),
      branch: this.branch,
      status: this.file.status
    }, { variable: 'commit' }));

    return this;
  }
});
