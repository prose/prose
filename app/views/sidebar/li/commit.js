var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var templates = require('../../../../dist/templates');
var util = require('../../../util');

module.exports = Backbone.View.extend({
  template: templates.sidebar.li.commit,

  tagName: 'li',

  className: 'item',

  events: {
    'mouseenter .removed': 'eventMessage',
    'mouseleave .removed': 'eventMessage',
    'click .removed': 'restore'
  },

  initialize: function(options) {
    var file = options.file;

    this.branch = options.branch;
    this.file = file;
    this.files = options.repo.branches.findWhere({ name: options.branch }).files;
    this.repo = options.repo;
    this.view  = options.view;
  },

  render: function() {
    var file = this.file;
    var binary = util.isBinary(file.filename);

    var data = {
      branch: this.branch,
      file: file,
      mode: binary ? 'tree' : 'edit',
      path: binary ?
        util.extractFilename(file.filename)[0] : file.filename,
      repo: this.repo.toJSON(),
      status: file.status
    };

    var title = file.status.charAt(0).toUpperCase() + file.status.slice(1) +
      ': ' + file.filename;

    this.$el.attr('title', title)
      .html(_.template(this.template, data, { variable: 'data' }));

    return this;
  },

  message: function(message) {
    this.$el.find('.message').html(message);
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

        this.$el
          .attr('title', t('actions.restore.restored') + ': ' + this.file.filename);

        this.$el.find('a').removeClass('removed');

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
