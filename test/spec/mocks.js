
var $ = require('jquery-browserify'),
    sinon = require('sinon');
    
    
var Branches = require('../../app/collections/branches'),
    Files = require('../../app/collections/files'),
    
    Branch = require('../../app/models/branch'),
    File = require('../../app/models/file'),
    Repo = require('../../app/models/repo'),
    
    
    AppView = require('../../app/views/app');
    

module.exports = function() {
  return {
    _repos: {},
    
    router: function() {
      return this._router = this._router || 
        stubs(['error', 'navigate', 'notify']);
    },
    
    /*
    NOTE: don't mock LoaderView, SidebarView, or NavView, as we can just get 
    those off the app.
    */
    app: function() {
      return this._app = this._app ||
        new AppView({
          el: '#prose',
          model: {},
          user: null
        });
    },
    
    branches: function(repo) {
      return this._branches = this._branches ||
        new Branches([], this.repo(repo));
    },
    
    repo: function(repo, owner) {
      repo = repo || 'repo-name';
      owner = owner || {id: 0, login: 'login-name'};
      return this._repos[repo] = this._repos[repo] || 
        new Repo({ name: repo, owner: owner });
    }
  }
}
// provide stubs() function as a more direct utility.
module.exports.stubs = stubs; 
  
/*
General / Util
*/
function stubs(object, methods) {
  if(!methods) {
    methods = object;
    object = {};
  }
  methods.forEach(function(methodName) {
    object[methodName] = sinon.spy();
  });
  return object;
}
