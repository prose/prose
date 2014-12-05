
// boot the app
require('../../app/boot.js');

describe('application bootstrap', function() {

  var server;
  before(function() { server = sinon.fakeServer.create(); });
  after(function() { server.restore(); })

  it('should expose window.app', function() {
    expect(app).to.be.ok;
    expect(router).to.be.ok;
  });
});
