
var File = require('../../../app/models/file');

var spies = require('../../mocks/helpers').spies,
    fileMocker = require('../../mocks/models/file'),
    filedata = require('../../fixtures/get-file-response.json');


describe('file model', function() {
  var server, callbacks, fileContents;

  before(function () { server = sinon.fakeServer.create(); });
  after(function () { server.restore(); });
  beforeEach(function() {
    // reset the DI state, so no File models are cached between tests.
    fileMocker.reset();
    callbacks = spies(['success', 'error', 'complete']);
  })

  /*
  Create a mock File model and set up the fake server to respond to a fetch().
  Returns the mock file.
  */
  var filecount = 0;
  function  mockFile(content, data) {
    var file = fileMocker();
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

    // use contain assertion (weaker than strict equality) to separate this from
    // tests that check for whitespace trimming
    expect(file.get('content')).to.contain(content);
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

    function whitespaceTests(withYaml) {
      var fileContent = withYaml ? (yaml + content) : content;

      it('appends a single newline if not already present', function() {
        var file = mockFile(fileContent, filedata);
        file.fetch(callbacks);
        server.respond();
        expect(callbacks.success).to.have.been.calledOnce;
        expect(file.get('content')).to.equal(content + '\n');
      });

      it('trims all EOF whitespace *except* single newline', function() {
        var file = mockFile(fileContent + extraspace, filedata)
        file.fetch(callbacks);
        server.respond();
        expect(callbacks.success).to.have.been.calledOnce;
        expect(file.get('content')).to.equal(content + '\n');
      })

      it('does not trim EOL whitespace', function() {
        var content = 'line with EOL space     \nanother line\n';
        var file = mockFile(content, filedata);
        file.fetch(callbacks);
        server.respond();
        expect(callbacks.success).to.have.been.calledOnce;
        expect(file.get('content')).to.equal(content);
      })
    }

    // run the tests both with and without yaml, since parsing code is different
    // for those two cases.
    describe('with frontmatter', whitespaceTests.bind(this, true));
    describe('without frontmatter', whitespaceTests.bind(this, false));

    describe('formatting urls', function () {
      it('properly formats urls', function () {
        var file = mockFile('', filedata);
        file.set('path', '///this-is-crazy///');
        file.collection.repo.url = function () { return 'https://www.test.com'; };
        expect(file.url()).to.equal('https://www.test.com/contents/this-is-crazy/?ref=master');
      })
    })
  })


});
