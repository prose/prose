
var Repo = require('../../../app/models/repo');

var repoResponse = require('../../fixtures/get-repos-response.json');


describe('repo model', function() {
  var repo;
  
  var server;
  
  before(function () { server = sinon.fakeServer.create(); });
  after(function () { server.restore(); });
  
  beforeEach(function() {
    repo = new Repo({
      name: 'repo-name',
      owner: {
        id: 0,
        login: 'login-name'
      }
    });
  })

  it('sets the name and owner attributes', function() {
    expect(repo.get('name')).to.equal('repo-name');
    expect(repo.get('owner')).to.deep.equal({id: 0, login: 'login-name'});
  });
  
  it('builds the API url correctly', function() {
    expect(repo.url()).to.equal('https://api.github.com/repos/login-name/repo-name')
  });
  
  it('fetches data from the endpoint.', function() {
    
    var success = sinon.spy(),
        error = sinon.spy(),
        complete = sinon.spy();
    
    repo.fetch({
      success: success,
      error: error,
      complete: complete
    });
    
    server.respondWith(JSON.stringify(repoResponse));
    server.respond();
    
    expect(success).to.have.been.calledOnce;
    expect(complete).to.have.been.calledOnce;
    
  })
});
