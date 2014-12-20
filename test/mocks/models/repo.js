var Repo = require('../../../app/models/repo'),
    distate = require('../helpers').distate;

module.exports = distate.register(mockRepo);
function mockRepo(repo, owner) {
  this._repos = this._repos || {};

  var repo = repo || 'repo-name';
  
  // other mocks delegate their repo arguments to this function; in case
  // the test author passed in an actual repo object, just return that.
  if(repo instanceof Repo) return repo;
  
  owner = owner || {
    id: 0,
    login: 'login-name'
  };
  return this._repos[repo] = this._repos[repo] ||
    new Repo({
      name: repo,
      owner: owner
    });
}
