
var Repo = require('../../../app/models/repo');

var spies = require('../../mocks/helpers').spies,
    repoResponse = require('../../fixtures/get-repos-response.json');


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
    
    var callbacks = spies(['success', 'error', 'complete']);
    
    repo.fetch(callbacks);
    
    server.respondWith(JSON.stringify(repoResponse));
    server.respond();
    
    expect(callbacks.success).to.have.been.calledOnce;
    expect(callbacks.complete).to.have.been.calledOnce;
    
  })
});
