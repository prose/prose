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
      expect(array.indexOf(5)).to.equal(-1);
    });

    // async
    it('should return -1 when the value is not present (async)', function(done) {
      expect(array.indexOf(5)).to.equal(-1);
      done();
    })
  });

  describe('.length', function() {
    it('should return 3', function() {
      expect(array.length).to.equal(3);
    });
  });
});
