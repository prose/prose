var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');

module.exports = Backbone.View.extend({
  id: 'start',
  className: 'start',

  events: {
    'submit #login_form': '_login'
  },

  render: function() {
    var tmpl = _(window.app.templates.start).template();

    $('.header').hide();
    $('#prose').empty().html(tmpl(this.model));

    return this;
  },

  _login: function() {
    var self = this;

    var user = self.$('#github_user').val();
    var password = self.$('#github_password').val();

    login({username: user, password: password}, function(err) {
      if (err) return self.$('.bad-credentials').show();
      window.location.reload();
    });
    return false;
  }
});
