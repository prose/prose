var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var utils = require('../util');
var templates = require('../../dist/templates');

module.exports = Backbone.View.extend({
  template: _.template(templates.heading),

  events: {
    'focus input': 'checkPlaceholder',
    'keypress input': 'updateFile'
  },

  initialize: function(options) {
    this.user = options.user;
    this.repo = options.repo;
    this.file = options.file;
    this.inputValue = options.inputValue;
    this.alterable = options.alterable;
  },

  checkPlaceholder: function(e) {
    if (this.file.isNew()) {
      var $target = $(e.target, this.el);
      if (!$target.val()) {
        $target.val($target.attr('placeholder'));
      }
    }
  },

  updateState: function(label) {
    this.$el.find('.popup').html(label);
  },

  updateFile: function() {
    this.trigger('makeDirty');
  },

  headerInputGet: function() {
    return this.$el.find('.headerinput');
  },

  headerInputFocus: function() {
    this.$el.find('.headerinput').focus();
  },

  render: function() {
    var login = this.user ? this.user.get('login') : this.repo.get('owner').login;
    var permissions = this.repo ? this.repo.get('permissions') : undefined;

    this.$el.html(this.template({
      alterable: this.alterable,
      inputValue: this.inputValue,
      avatar: this.file ?  '<span class="ico round document ' + this.file.get('lang') + '"></span>' :
        '<img src="' + this.user.get('avatar_url') + '" width="40" height="40" alt="Avatar" />',
      lang: this.file ? this.file.get('lang') : undefined,
      login: this.user ? this.user.get('login') : this.repo.get('owner').login,
      metadata: this.file ? this.file.get('metadata') : undefined,
      path: login,
      private: this.repo && this.repo.get('private') ? true : false,
      repo: this.repo ? this.repo.attributes : undefined,
      title: this.file ? this.file.get('path') : t('heading.explore'),
      translate: this.file ? this.file.get('translate') : undefined,
      user: this.user ? this.user.attributes : undefined,
      writable: permissions ? permissions.push : false
    }));

    return this;
  }
});
