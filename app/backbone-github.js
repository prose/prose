var _ = require('underscore');
var cookie = require('./cookie');
var config = require('./config');

var Backbone = require('backbone');
var Repo = require('./models/repo');

function _request(method, path, data, cb, raw, sync, headers) {
  var xhr = new XMLHttpRequest();
  if (!raw) {xhr.dataType = "json";}

  xhr.open(method, config.api + path, !sync);
  if (!sync) {
    xhr.onreadystatechange = function () {
      if (this.readyState == 4) {
        if (this.status >= 200 && this.status < 300 || this.status === 304) {
          cb(null, raw ? this.responseText : this.responseText ? JSON.parse(this.responseText) : true, this);
        } else {
          cb({request: this, error: this.status});
        }
      }
    };
  }
  xhr.setRequestHeader('Accept','application/vnd.github.raw');
  xhr.setRequestHeader('Content-Type','application/json');

  if (headers) {
    for (var i = 0; i < headers.length; i++) {
      header = headers[i];
      xhr.setRequestHeader(header[0], header[1]);
    }
  }

  if ((config.auth == 'oauth' && config.token) || (config.auth == 'basic' && config.username && config.password)) {
     xhr.setRequestHeader('Authorization', config.auth === 'oauth' ?
      'token '+ config.token :
      'Basic ' + Base64.encode(config.username + ':' + config.password)
     );
   }

  if (data) {
    xhr.send(JSON.stringify(data));
  } else {
    xhr.send();
  }

  if (sync) return xhr.response;
}

var github = {
  'repos': function repos(method, model, options) {
    switch(method) {
      case 'read':
        _request('GET', '/users/' + options.user + '/repos', null, function(err, res, xhr) {
          var owners = {};

          _.each(res, function(repo) {
            model.add(new Repo(repo, model), { 'merge': true });
          });
        });
        break;
      default:
        throw('Method not found: ' + method);
        break;
    }
  },

  'user': function user(method, model, options) {
    switch(method) {
      case 'read':
        _request('GET', '/user', null, function(err, res, xhr) {
          model.set(res);
          if (_.isFunction(options.success)) options.success(model, res, options);
        });
        break;
      default:
        throw('Method not found: ' + method);
        break;
    }
  }
};

module.exports = (function sync(method, model, options) {
  if (_.isFunction(this[model.name])) {
    this[model.name](method, model, options);
  } else {
    throw('Function not found: ' + model.name);
  }
}).bind(github);
