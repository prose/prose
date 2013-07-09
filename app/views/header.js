var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var utils = require('../util');
var templates = require('../../dist/templates');

module.exports = Backbone.View.extend({
  template: templates.heading,

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

  inputGet: function() {
    return this.$el.find('.headerinput').val();
  },

  headerInputFocus: function() {
    this.$el.find('.headerinput').focus();
  },

  render: function() {
    var user = this.user ? this.user.get('login') : this.repo.get('owner').login;
    var permissions = this.repo ? this.repo.get('permissions') : undefined;
    var isPrivate = this.repo && this.repo.get('private') ? true : false;
    var title = t('heading.explore');
    var avatar;
    var path = user;

    if (this.user) {
      avatar = '<img src="' + this.user.get('avatar_url') + '" width="40" height="40" alt="Avatar" />';
    } else if (this.file) {
      // File View
      avatar = '<span class="ico round document ' + this.file.get('lang') + '"></span>';
      title = this.file.get('path');
    } else {
      // Repo View
      var lock = (isPrivate) ? ' private' : '';

      title = this.repo.get('name');
      path = path + '/' + title;
      avatar = '<div class="avatar round"><span class="icon round repo' + lock + '"></span></div>';
    }

    var heading = {
      alterable: this.alterable,
      avatar: avatar,
      repo: this.repo ? this.repo.attributes : undefined,
      isPrivate: isPrivate,
      inputValue: this.inputValue,
      path: path,
      user: user,
      title: title,

      // These needed?
      metadata: this.file ? this.file.get('metadata') : undefined,
      translate: this.file ? this.file.get('translate') : undefined,
      writable: permissions ? permissions.push : false
    };

    this.$el.empty().append(_.template(this.template, heading, {
      variable: 'heading'
    }));

    return this;
  }
});
