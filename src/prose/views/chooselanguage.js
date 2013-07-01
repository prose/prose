var $ = require('jquery-browserify');
var Backbone = require('backbone');
var _ = require('underscore');
var cookie = require('../cookie');
var LOCALES = require('../../../translations/locales');

module.exports = Backbone.View.extend({
  className: 'inner deep prose',

  events: {
    'click .language': 'setLanguage' 
  },

  render: function() {
    var tmpl = _.template(window.app.templates.chooselanguage);

    this.$el
      .empty()
      .append(tmpl({
        languages: LOCALES,
        active: app.locale
      }));
    return this;
  },

  setLanguage: function(e) {
    if (!$(e.target).hasClass('active')) {
      var code = $(e.target).data('code');
      cookie.set('lang', code);

      // Check if the browsers language is supported
      app.locale = code;

      if (app.locale && app.locale !== 'en') {
          $.getJSON('./translations/locales/' + app.locale + '.json', function(result) {
              window.locale[app.locale] = result;
              window.locale.current(app.locale);
          });
      }

      this.render();
    }

    return false;
  }
});
