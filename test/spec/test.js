var chai = chai || require('chai');
chai.should();

describe('Array', function() {
  var array;

  before(function() {
    array = [1,2,3];
  });

  describe('.indexOf()', function() {
    // pending
    it('should skip this test');

    // sync
    it('should return -1 when the value is not present', function() {
      array.indexOf(5).should.equal(-1);
    });

    // async
    it('should return -1 when the value is not present (async)', function(done) {
      array.indexOf(5).should.equal(-1);
      done();
    })
  });

  describe('.length', function() {
    it('should return 3', function() {
      array.length.should.equal(3);
    });
  });
});
