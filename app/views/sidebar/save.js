var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var NavView = require('../nav');
var templates = require('../../../dist/templates');
var util = require('../../util');

module.exports = Backbone.View.extend({
  template: templates.sidebar.save,

  events: {
    'change .commit-message': 'setMessage',
    'click a.cancel': 'emit',
    'click a.confirm': 'emit'
  },

  initialize: function(options) {
    _.bindAll(this);

    this.sidebar = options.sidebar;
    this.file = options.file;

    // Re-render updated path in commit message
    this.listenTo(this.file, 'change:path', this.updatePlaceholder);
  },

  emit: function(e) {
    var action = $(e.currentTarget).data('action');
    this.sidebar.trigger(action, e);
    return false;
  },

  setMessage: function(e) {
    var value = e.currentTarget.value;
    this.file.set('message', value);
  },

  updatePlaceholder: function(model, value, options) {
    var name = util.extractFilename(value)[1];

    var placeholder = this.file.isNew() ?
      t('actions.commits.created', { filename: name }) :
      t('actions.commits.updated', { filename: name });

    this.file.set('placeholder', placeholder);
    this.$el.find('.commit-message').attr('placeholder', placeholder);
  },

  render: function() {
    var writable = this.file.get('writable') ?
      t('sidebar.save.save') :
      t('sidebar.save.submit')

    this.$el.html(_.template(this.template, writable, {
      variable: 'writable'
    }));

    this.updatePlaceholder(this.file, this.file.get('path'));

    return this;
  }
});
