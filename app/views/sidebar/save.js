var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var NavView = require('../nav');
var templates = require('../../../dist/templates');
var utils = require('../../util');

module.exports = Backbone.View.extend({
    template: templates.sidebar.save,

    events: {
      'click a.cancel': 'emit',
      'click a.confirm': 'emit'
    },

    initialize: function(options) {
      this.sidebar = options.sidebar;
      this.file = options.file;
    },

    emit: function(e) {
      var action = $(e.currentTarget).data('action');
      this.sidebar.trigger(action, e);
      return false;
    },

    render: function() {
      var save = {
        action: this.file.get('writable') ?
          t('sidebar.save.save') :
          t('sidebar.save.submit')
      }

      this.$el.empty().append(this.template, save, {
        variable: 'save'
      });

      var placeholder = (this.file.isNew() ? 'Created ' : 'Updated ') + this.file.get('name');
      this.$el.find('.commit-message').attr('placeholder', placeholder).focus();

      return this;
    }
});
