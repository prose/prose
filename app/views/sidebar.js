var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var BranchesView = require('./sidebar/branches');
var OrgsView = require('./sidebar/orgs');
var HistoryView = require('./sidebar/history');
var SettingsView = require('./sidebar/settings');
var templates = require('../../dist/templates');
var utils = require('.././util');

module.exports = Backbone.View.extend({
    template: _.template(templates.drawer),

    subviews: [],

    initialize: function(options) {
      this.user = options.user;
    },

    initSubview: function(subview, options) {
      options = _.clone(options) || {};

      this[subview] = new views[subview](options);
      this[subview].setElement(this.$el.find('#' + subview));

      this.subviews.push(this[subview]);
      // this.subviews[subview] = this[subview];

      // TODO: is this.subviews being filled with abandoned views preventing garbage collection?
      console.log(this.subviews);

      this.renderSubview(subview);
    },

    renderSubview: function(subview) {
      this[subview].render();
    },

    render: function(options) {
      this.$el.html(this.template());

      _.each(this.subviews, function(subview) {
        subview.render();
      });

      return this;
    },

    open: function() {
      // TODO: call when in 'tree'/repo mode and when authenticated but no mode (profile)?
      this.$el.toggleClass('open', true);
      this.$el.toggleClass('mobile', false);
    },

    close: function() {
      this.$el.toggleClass('open mobile', false);
    },

    remove: function() {
      _.invoke(this.subviews, 'remove');
      this.subviews = [];

      Backbone.View.prototype.remove.apply(this, arguments);
    }
});
