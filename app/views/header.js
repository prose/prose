var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var utils = require('../util');
var templates = require('../../dist/templates');

module.exports = Backbone.View.extend({
  template: templates.header,

  events: {
    'focus input': 'checkPlaceholder',
    'change input[data-mode="path"]': 'updatePath',
    'change input[data-mode="title"]': 'updateTitle'
  },

  initialize: function(options) {
    _.bindAll(this);

    this.user = options.user;
    this.repo = options.repo;
    this.file = options.file;
    this.input = options.input;
    this.title = options.title;
    this.placeholder = options.placeholder;
    this.alterable = options.alterable;
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

    var data = {
      alterable: this.alterable,
      avatar: avatar,
      repo: this.repo ? this.repo.attributes : undefined,
      isPrivate: isPrivate,
      input: this.input,
      path: path,
      placeholder: this.placeholder,
      user: user,
      title: title,
      mode: this.title ? 'title' : 'path',
      translate: this.file ? this.file.get('translate') : undefined
    };

    this.$el.empty().append(_.template(this.template, data, {
      variable: 'data'
    }));

    return this;
  },

  checkPlaceholder: function(e) {
    if (this.file.isNew()) {
      var $target = $(e.target, this.el);
      if (!$target.val()) {
        $target.val($target.attr('placeholder'));
      }
    }
  },

  updatePath: function(e) {
    this.file.set('path', e.currentTarget.value);
    this.trigger('makeDirty');
    return false;
  },

  updateTitle: function(e) {
    // makeDirty updates the metadata so there's no
    // need to set it in the model here.
    this.trigger('makeDirty');
    return false;
  },

  inputGet: function() {
    return this.$el.find('.headerinput').val();
  },

  headerInputFocus: function() {
    this.$el.find('.headerinput').focus();
  }
});
