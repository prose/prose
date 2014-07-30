module.exports = {
  dragEnter: function(e) {
    $(e.currentTarget).addClass('drag-over');
    e.stopPropagation();
    e.preventDefault();
    return false;
  },

  dragOver: function(e) {
    e.originalEvent.dataTransfer.dropEffect = 'copy';
    e.stopPropagation();
    e.preventDefault();
    return false;
  },

  dragLeave: function($el, e) {
    $el.removeClass('drag-over');
    e.stopPropagation();
    e.preventDefault();
    return false;
  },

  dragDrop: function($el, cb) {
    $el.on('dragenter', (function(e) {
      this.dragEnter(e);
    }).bind(this))
    .on('dragover', this.dragOver);

    $el.find('#drop').on('dragleave', (function(e) {
      this.dragLeave($el, e);
    }).bind(this))
    .on('drop', (function(e) {
      this.drop($el, e, cb);
    }).bind(this));
  },

  fileSelect: function(e, cb) {
    var files = e.target.files;
    this.compileResult(files, cb);
  },

  drop: function($el, e, cb) {
    e.preventDefault();
    $el.removeClass('drag-over');

    e = e.originalEvent
    var files = e.dataTransfer.files;
    this.compileResult(files, cb);
  },

  compileResult: function(files, cb) {
    for (var i = 0, f; f = files[i]; i++) {
      // TODO: add size validation, warn > 50MB, reject > 100MB
      // https://help.github.com/articles/working-with-large-files

      // Only upload images
      // TODO: remove this filter, allow uploading any binary file?
      if (/image/.test(f.type)) {
        var reader = new FileReader();

        reader.onload = (function(currentFile) {
          return function(e) {
            cb(e, currentFile, e.target.result);
          };
        })(f);

        reader.readAsBinaryString(f);
      }
    };
  }
}
