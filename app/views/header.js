var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var utils = require('../util');
var templates = require('../../dist/templates');

module.exports = Backbone.View.extend({
  template: _.template(templates.heading),

  events: {
    'focus input.filepath': 'checkPlaceholder',
    'keypress input.filepath': 'saveFilePath'
  },

  initialize: function(options) {
    this.user = options.user;
    this.repo = options.repo;
    this.file = options.file;
    this.alterable = options.alterable;
  },

  checkPlaceholder: function(e) {
    if (app.state.mode === 'new') {
      var $target = $(e.target, this.el);
      if (!$target.val()) {
        $target.val($target.attr('placeholder'));
      }
    }
  },

  filenameInput: function() {
    $('.filepath', this.el).focus();
  },

  render: function() {
    var login = this.user ? this.user.get('login') : this.repo.get('owner').login;

    this.$el.html(this.template({
      alterable: this.alterable,
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
      writable: this.repo ? this.repo.get('permissions').push : undefined
    }));

    return this;
  }
});
