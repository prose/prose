describe('model.js', function() {
  describe('getFiles', function() {
    var empty;
    var file;
    var files;
    var directory;
    var subdirectory;

    it('should be a function', function() {
      expect(getFiles).to.be.a('function');
    })

    describe('tree', function() {
      beforeEach(function() {
        empty = getFiles(data.tree.empty);
        file = getFiles(data.tree.file);
        files = getFiles(data.tree.files);
        directory = getFiles(data.tree.directory);
        subdirectory = getFiles(data.tree.subdirectory);
      });

      it('does not return tree if tree is undefined', function() {
        expect(getFiles().tree).to.not.exist;
      });

      it('returns tree, files, and total if tree is NOT undefined', function() {
        expect(getFiles().files).to.exist;
        expect(getFiles().total).to.exist;

        expect(empty.files).to.exist;
        expect(empty.total).to.exist;

        expect(file.files).to.exist;
        expect(file.total).to.exist;

        expect(files.files).to.exist;
        expect(files.total).to.exist;

        expect(directory.files).to.exist;
        expect(directory.total).to.exist;

        expect(subdirectory.files).to.exist;
        expect(subdirectory.total).to.exist;
      });

      it('returns same tree as input if tree is NOT undefined', function() {
        expect(empty.tree).to.eql(data.tree.empty);
        expect(file.tree).to.eql(data.tree.file);
        expect(files.tree).to.eql(data.tree.files);
        expect(directory.tree).to.eql(data.tree.directory);
        expect(subdirectory.tree).to.eql(data.tree.subdirectory);
      });

      it('returns correct number of files (not folders) in files array', function() {
        expect(getFiles().files).to.have.length(0);
        expect(empty.files).to.have.length(0);
        expect(file.files).to.have.length(1);
        expect(files.files).to.have.length(3);
        expect(directory.files).to.have.length(1);
        expect(subdirectory.files).to.have.length(1);
      });

      it('returns correct number of files (not folders) as total', function() {
        expect(getFiles().total).to.equal(0);
        expect(empty.total).to.equal(0);
        expect(file.total).to.equal(1);
        expect(files.total).to.equal(3);
        expect(directory.total).to.equal(1);
        expect(subdirectory.total).to.equal(1);
      });
    });

    describe('matchesPath', function() {
      it('returns all files if path is empty string', function() {
        expect(getFiles(data.tree.empty, '').files).to.have.length(0);
        expect(getFiles(data.tree.file, '').files).to.have.length(1);
        expect(getFiles(data.tree.files, '').files).to.have.length(3);
        expect(getFiles(data.tree.directory, '').files).to.have.length(1);
        expect(getFiles(data.tree.subdirectory, '').files).to.have.length(1);
      });

      it('returns only files in path directory', function() {
        expect(getFiles(data.tree.empty, 'a').files).to.have.length(0);
        expect(getFiles(data.tree.file, 'a').files).to.have.length(0);
        expect(getFiles(data.tree.files, 'a').files).to.have.length(0);

        expect(getFiles(data.tree.directory, 'a').files).to.have.length(1);
        expect(getFiles(data.tree.directory, 'b').files).to.have.length(0);

        expect(getFiles(data.tree.subdirectory, 'a/aa').files).to.have.length(1);
        expect(getFiles(data.tree.subdirectory, 'b').files).to.have.length(0);
      });
    });

    describe('matchesSearch', function() {
      it('returns only files and folders matching searchstr', function() {
        expect(getFiles(data.tree.empty, '', 'a').files).to.have.length(0);
        expect(getFiles(data.tree.file, '', 'a').files).to.have.length(1);
        expect(getFiles(data.tree.files, '', 'a').files).to.have.length(1);
        expect(getFiles(data.tree.directory, '', 'a').files).to.have.length(2);
        expect(getFiles(data.tree.subdirectory, '', 'a').files).to.have.length(3);
      });

      it('returns only files and folders under path matching searchstr', function() {
        expect(getFiles(data.tree.empty, 'a', 'a').files).to.have.length(0);
        expect(getFiles(data.tree.file, 'a', 'a').files).to.have.length(0);
        expect(getFiles(data.tree.files, 'a', 'a').files).to.have.length(0);
        expect(getFiles(data.tree.directory, 'a', 'a').files).to.have.length(1);
        expect(getFiles(data.tree.subdirectory, 'a', 'a').files).to.have.length(2);
      });
    });
  });
});
