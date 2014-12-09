
var File = require('../../../app/models/file');

var mocks = require('../mocks'),
    response = require('../../fixtures/get-file-response.json');


describe('file model', function() {
  var file;
  var server;
  
  before(function () { server = sinon.fakeServer.create(); });
  after(function () { server.restore(); });
  
  beforeEach(function() {
    file = mocks().file();
  })
  
  it('fetches data from github api and content directly content URL', function() {
    
    var content = 'content from server';
    var callbacks = mocks.stubs(['success', 'error', 'complete']);
    
    
    server.respondWith('GET', file.url(), JSON.stringify(response));
    file.set('content_url', 'https://api.gihub.com/repos/blah/blahblah/git/blahblahblah')
    server.respondWith('GET', file.get('content_url'), content);
    
    expect(file.get('content')).to.not.equal(content);
    expect(file.get('sha')).to.not.equal(response.sha);
    
    file.fetch(callbacks);
    
    server.respond();
    
    expect(callbacks.success).to.have.been.calledOnce;
    expect(callbacks.complete).to.have.been.calledOnce;
    expect(server.requests.length).to.equal(2);

    expect(file.get('content')).to.equal(content);
    expect(file.get('sha')).to.equal(response.sha);
  })
});
