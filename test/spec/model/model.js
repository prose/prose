describe('Array', function() {
  var tree;
  var path;
  var searchstr;

  describe('getFiles', function() {
    before(function() {
    });

    beforeEach(function() {
    });

    it('should be a function', function() {
      expect(getFiles).to.be.a('function');
    })

    it.skip('should return tree', function() {
      expect(getFiles(tree, path, searchstr)).to.be.true;
    });
  });
});
