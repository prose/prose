(function(config, models, views, routers, utils, templates) {

views.Post = Backbone.View.extend({
  id: 'post',

  events: {
    "click .save-post": "save"
  },

  save: function() {
    savePost(this.model.repo, this.model.path, this.editor.getValue(), function(err) {
      console.log('Saved');
    });
    return false;
  },

  initialize: function(options) {
    
  },

  initEditor: function() {
    setTimeout(function() {
      that.editor = CodeMirror.fromTextArea(document.getElementById("code"), {
          mode: 'markdown',
          lineNumbers: true,
          matchBrackets: true,
          theme: "default"
      });
    }, 200);
  },

  render: function() {
    var that = this;
    $(this.el).html(templates.post(this.model));

    this.initEditor();

    return this;
  }
});

}).apply(this, window.args);