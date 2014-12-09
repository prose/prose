
var File = require('../../../app/models/file');

var mocks = require('../mocks'),
    response = require('../../fixtures/get-file-response.json');


describe('file model', function() {
  var file;
  var server, callbacks, fileContents;
  
  before(function () { server = sinon.fakeServer.create(); });
  after(function () { server.restore(); });
  
  beforeEach(function() {
    file = mocks().file();
    callbacks = mocks.stubs(['success', 'error', 'complete']);
    server.respondWith('GET', file.url(), JSON.stringify(response));
    file.set('content_url', 'https://api.gihub.com/repos/blah/blahblah/git/blahblahblah')
  })
  

  it('fetches data from github api and content directly content URL', function() {
    
    var content = 'content from server';
    
    expect(file.get('content')).to.not.equal(content);
    expect(file.get('sha')).to.not.equal(response.sha);
    
    file.fetch(callbacks);
    
    server.respondWith('GET', file.get('content_url'), content);
    server.respond();
    
    expect(callbacks.success).to.have.been.calledOnce;
    expect(callbacks.complete).to.have.been.calledOnce;
    expect(server.requests.length).to.equal(2);

    expect(file.get('content')).to.equal(content);
    expect(file.get('sha')).to.equal(response.sha);
  })
  
  
  it('parses YAML frontmatter when present', function() {
    var content = 'my content',
        yaml = '---\nlayout: post\npublished: true\n---\n';
     
    file.fetch(callbacks);
    server.respondWith('GET', file.get('content_url'), yaml + content);
    server.respond();
    
    expect(callbacks.success).to.have.been.calledOnce;
    
    expect(file.get('metadata')).to.deep.equal({
      layout: 'post',
      published: true
    });
  })
  
  it('appends a single newline if not already present', function() {
    var content = 'my content',
        yaml = '---\nlayout: post\npublished: true\n---\n';
    
    file.fetch(callbacks);
    server.respondWith('GET', file.get('content_url'), yaml + content);
    server.respond();
    
    expect(callbacks.success).to.have.been.calledOnce;
    
    expect(file.get('content')).to.equal(content + '\n');
  });
  
  it('trims all whitespace *except* final newline from end of content', function() {
    var content = 'my content',
        extraspace = '\n\t  \t\t\n   \n\t\t \n',
        yaml = '---\nlayout: post\npublished: true\n---\n';
    
    file.fetch(callbacks);
    server.respondWith('GET', file.get('content_url'), yaml + content + extraspace);
    server.respond();
    
    expect(callbacks.success).to.have.been.calledOnce;
    
    expect(file.get('content')).to.equal(content + '\n');
  })

});
