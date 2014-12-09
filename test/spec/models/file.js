
var File = require('../../../app/models/file');

var mocks = require('../mocks'),
    filedata = require('../../fixtures/get-file-response.json');


describe('file model', function() {
  var mock;
  var server, callbacks, fileContents;
  
  before(function () { server = sinon.fakeServer.create(); });
  after(function () { server.restore(); });
  beforeEach(function() {
    mock = mocks();
    callbacks = mocks.stubs(['success', 'error', 'complete']);
  })
  
  /*
  Create a mock File model and set up the fake server to respond to a fetch().
  Returns the mock file.
  */
  var filecount = 0;
  function  mockFile(content, data) {
    var file = mock.file();
    server.respondWith('GET', file.url(), JSON.stringify(data));
    file.set('content_url', 'https://api.gihub.com/repos/blah/blahblah/git/'+filecount++);
    server.respondWith('GET', file.get('content_url'), content);
    return file;
  }



  it('fetches data from github api and content directly content URL', function() {
    
    var content = 'content from server',
        file = mockFile(content, filedata);
    
    expect(file.get('content')).to.not.equal(content);
    expect(file.get('sha')).to.not.equal(filedata.sha);
    
    file.fetch(callbacks);
    
    server.respond();
    
    expect(callbacks.success).to.have.been.calledOnce;
    expect(callbacks.complete).to.have.been.calledOnce;
    expect(server.requests.length).to.equal(2);

    expect(file.get('content')).to.equal(content);
    expect(file.get('sha')).to.equal(filedata.sha);
  })
  
  
  it('parses YAML frontmatter when present', function() {
    var content = 'my content',
        yaml = '---\nlayout: post\npublished: true\n---\n',
        file = mockFile(yaml + content, filedata);
     
    file.fetch(callbacks);
    server.respond();
    
    expect(callbacks.success).to.have.been.calledOnce;
    
    expect(file.get('metadata')).to.deep.equal({
      layout: 'post',
      published: true
    });
  })
  
  describe('trailing whitespace', function() {
    var content = 'my content',
        extraspace = '\n\t  \t\t\n   \n\t\t \n',
        yaml = '---\nlayout: post\npublished: true\n---\n';
        
    it('appends a single newline if not already present', function() {
      var file = mockFile(yaml + content, filedata);
      file.fetch(callbacks);
      server.respond();
      expect(callbacks.success).to.have.been.calledOnce;
      expect(file.get('content')).to.equal(content + '\n');
    });
    
    it('trims all whitespace *except* final newline from end of content', function() {
      var file = mockFile(yaml + content + extraspace, filedata)
      file.fetch(callbacks);
      server.respond();
      expect(callbacks.success).to.have.been.calledOnce;
      expect(file.get('content')).to.equal(content + '\n');
    })
  })


});
