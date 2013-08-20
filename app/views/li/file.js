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

    if (!this.model.get('binary')) {
      this.$el.attr('data-navigate', '#' + this.repo.get('owner').login + '/' +
        this.repo.get('name') + '/edit/' + this.branch + '/' +
        this.model.get('path'));
        
      this.$el.attr('data-path',this.model.get('path'));
    }
  },

  render: function() {
    var data = _.extend(this.model.attributes, {
      branch: this.branch,
      repo: this.repo.attributes
    });

    this.$el.html(_.template(this.template, data, {
      variable: 'file'
    }));

    return this;
  },

  destroy: function(e) {
    if (confirm(t('actions.delete.warn'))) {
      this.model.destroy({
        success: (function(model, res, options) {
          
          console.log('got here, successful destroy');
          
          var commit = res.commit_details;

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

          // this.history.$el.find('#commits').prepend(view.render().el);
          // this.history.subviews[commit.sha] = view;

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
