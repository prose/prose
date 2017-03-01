var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var CommitView = require('../sidebar/li/commit');
var templates = require('../../../dist/templates');
var util = require('../../util');

module.exports = Backbone.View.extend({
  template: templates.li.file,

  tagName: 'li',

  className: 'item clearfix',

  events: {
    'click a.delete': 'destroy'
  },

  initialize: function(options) {
    this.branch = options.branch;
    this.history = options.history;
    this.model = options.model;
    this.repo = options.repo;
    this.router = options.router;

    this.$el.attr('data-index', options.index);

    if (!this.model.get('binary')) {
      this.$el.attr('data-navigate', '#' + this.repo.get('owner').login + '/' +
        this.repo.get('name') + '/edit/' + this.branch + '/' +
        this.model.get('path'));
    }
  },

  render: function() {
    var data = _.extend(this.model.attributes, {
      branch: this.branch,
      repo: this.repo.attributes
    });

    var config = this.model.collection.config;
    var rooturl = config && config.rooturl;

    var regex = new RegExp('^' + rooturl + '(.*)');
    var jailpath = rooturl ? data.path.match(regex) : false;

    data.jailpath = jailpath ? jailpath[1] : data.path;

    if (config && jailpath) {
      if (data.image && ~data.path.indexOf(config.prose.media)) {
        data.previewurl = config.prose.siteurl + jailpath[1];
      }

      if (data.markdown) {
        var uripath = util.getURLFromPath(jailpath[1]);
        data.previewurl = config.prose.siteurl + '/' + uripath;
      }
    }

    this.$el.html(_.template(this.template, data, {
      variable: 'file'
    }));

    return this;
  },

  destroy: function(e) {
    if (confirm(t('actions.delete.warn'))) {
      this.model.destroy({
        success: (function(model, res, options) {
          var commit = res.commit;

          var view = new CommitView({
            branch: this.branch,
            file: _.extend(commit, {
              contents_url: model.get('content_url'),
              filename: model.get('path'),
              status: 'removed'
            }),
            repo: this.repo,
            view: this.view
          });

          this.history.$el.find('#commits').prepend(view.render().el);
          this.history.subviews[commit.sha] = view;

          this.$el.fadeOut('fast');
        }).bind(this),
        error: (function(model, xhr, options) {
          this.router.error(xhr);
        }).bind(this)
      });
    }

    return false;
  }
});
