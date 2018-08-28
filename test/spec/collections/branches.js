var Branches = require("../../../app/collections/branches");
var branchResponse = require("../../fixtures/get-branch-response.js");

var server;
var branches = new Branches(null, {
  repo: {
    url: function() {
      return "/blah";
    }
  }
});

describe("branches collection", function() {
  beforeEach(function() {
    server = sinon.fakeServer.create();
    server.autoRespond = true;
    server.respondWith("GET", branches.url(), [
      200,
      {
        Link: [
          '</blah/branches?per_page=100&page=2>; rel="next"',
          ' </blah/branches?per_page=100&page=2>; rel="last"'
        ]
      },
      JSON.stringify(branchResponse)
    ]);

    server.respondWith("GET", branches.url() + "&page=2", [
      200,
      {
        "Content-Type": "application/json",
        Link: [' </blah/branches?per_page=100&page=3>; rel="last"']
      },
      JSON.stringify(branchResponse)
    ]);
  });

  afterEach(function() {
    server.restore();
  });

  it("sets repo on each of it's models", function(done) {
    branches.fetch({
      success: function() {
        expect(branches.length).to.equal(200);
        expect(
          branches.models.every(function(m) {
            return !!m.repo;
          })
        ).to.be.true;
        done();
      }
    });
  });
});
