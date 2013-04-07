var Backbone = require('backbone');
var _ = require('underscore');
var chosen = require('chosen-jquery-browserify');
var jsyaml = require('js-yaml');
var key = require('keymaster');
var marked = require('marked');
var Base64 = require('js-base64');
var chrono = require('chrono');
var queue = require('queue-async');

window.app = {
    config: {},
    models: {},
    views: {},
    routers: {},
    utils: {},
    templates: _($('script[data-template]')).reduce(function(memo, el) {
        memo[el.getAttribute('data-template')] = _(el.innerHTML).template();
        return memo;
    }, {}),
    state: {'repo': ''},
    instance: {},
    eventRegister: _.extend({}, Backbone.Events)
};

window.args = _(window.app).toArray();

// Prevent exit when there are unsaved changes
window.onbeforeunload = function() {
  if (window.app.instance.mainView && window.app.instance.mainView.dirty)
    return 'You have unsaved changes. Are you sure you want to leave?';
};

function confirmExit() {
  if (window.app.instance.mainView && window.app.instance.mainView.dirty)
    return confirm('You have unsaved changes. Are you sure you want to leave?');
  return true;
}
