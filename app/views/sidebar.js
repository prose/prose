var _ = require('underscore');
var Backbone = require('backbone');

var views = {
  branches: require('./sidebar/branches'),
  history: require('./sidebar/history'),
  orgs: require('./sidebar/orgs'),
  save: require('./sidebar/save'),
  settings: require('./sidebar/settings')
};

var templates = require('../../dist/templates');

module.exports = Backbone.View.extend({
  template: _.template(templates.drawer),

  subviews: [],

  initialize: function(options) {
    _.bindAll(this);
  },

  initSubview: function(subview, options) {
    if (!views[subview]) return false;

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

    _.invoke(this.subviews, 'render');

    return this;
  },

  open: function() {
    this.$el.toggleClass('open mobile', true);

    /*
    // TODO: call when in 'tree'/repo mode and when authenticated but no mode (profile)?
    this.$el.toggleClass('open', true);
    this.$el.toggleClass('mobile', false);
    */
  },

  close: function() {
    this.$el.toggleClass('open mobile', false);
  },

  closeSettings: function() {
    this.$el.find('.file a').removeClass('active');

    if (app.state.mode === 'blob') {
      this.$el.find('.file .preview').addClass('active');
    } else {
      this.$el.find('.file .edit').addClass('active');
    }

    $('#prose').toggleClass('open mobile', false);
  },


  toggle: function() {
    this.$el.toggleClass('open mobile');
  },

  remove: function() {
    _.invoke(this.subviews, 'remove');
    this.subviews = [];

    Backbone.View.prototype.remove.apply(this, arguments);
  }
});
