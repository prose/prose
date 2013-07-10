var $ = require('jquery-browserify');
var Backbone = require('backbone');
var _ = require('underscore');
var cookie = require('../cookie');
var templates = require('../../dist/templates');
var LOCALES = require('../../translations/locales');

module.exports = Backbone.View.extend({
  className: 'inner deep prose limiter',

  template: templates.chooselanguage,

  events: {
    'click .language': 'setLanguage' 
  },

  render: function() {
    var chooseLanguages = {
      languages: LOCALES,
      active: app.locale ? app.locale : window.locale._current
    };

    this.$el.empty().append(_.template(this.template, chooseLanguages, {
      variable: 'chooseLanguage'
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

      // Reflect changes. Could be more elegant.
      window.location.reload();
    }

    return false;
  }
});
