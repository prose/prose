var _ = require('underscore');
var jsyaml = require('js-yaml');
var queue = require('queue-async');
var marked = require('marked');
var Backbone = require('backbone');

module.exports = Backbone.View.extend({
  render: function() {
    this.eventRegister = app.eventRegister;

    var pathTitle = (app.state.path) ? app.state.path : '';
    // util.documentTitle(t('docheader.preview') + pathTitle + '/' + app.state.file + ' at ' + app.state.branch);

    this.stashApply();
    this.preview();

    // Needs access to marked, so it's registered here.
    Liquid.Template.registerFilter({
      'markdownify': function(input) {
        return marked(input || '');
      }
    });

    return this;
  },

  stashApply: function() {
    if (!window.sessionStorage) return false;

    var storage = window.sessionStorage;
    var filepath = window.location.hash.split('/').slice(4).join('/');
    var stash = JSON.parse(storage.getItem(filepath));

    if (stash) {
      this.model.content = stash.content;
      this.model.metadata = stash.metadata;
    }
  },

  preview: function() {
    var model = this.model,
        q = queue(1),
        p = {
          site: app.state.config,
          post: model.metadata,
          page: model.metadata,
          content: Liquid.parse(marked(model.content)).render({
            site: app.state.config,
            post: model.metadata,
            page: model.metadata
          }) || ''
        };

    if (p.site.prose && p.site.prose.site) {
      _(p.site.prose.site).each(function(file, key) {
        q.defer(function(cb){
          var next = false;
          $.ajax({
            cache: true,
            dataType: 'jsonp',
            jsonp: false,
            jsonpCallback: 'callback',
            timeout: 5000,
            url: file,
            success: function(d) {
              p.site[key] = d;
              next = true;
              cb();
            },
            error: function(msg, b, c) {
              if (!next) cb();
            }
          });
        });
      });
    }

    q.defer(getLayout);
    q.await(function() {
      var content = p.content;

      // Set base URL to public site
      if (app.state.config.prose && app.state.config.prose.siteurl) {
        content = content.replace(/(<head(?:.*)>)/, function() {
          return arguments[1] + '<base href="' + app.state.config.prose.siteurl + '">';
        });
      }

      document.write(content);
      document.close();
    });

    function getLayout(cb) {
      var file = p.page.layout;

      model.repo.read(app.state.branch, '_layouts/' + file + '.html', function(err, d) {
        if (err) return cb(err);
        var meta = (d.split('---')[1]) ? jsyaml.load(d.split('---')[1]) : {},
          content = (d.split('---')[2]) ? d.split('---')[2] : d,
          template = Liquid.parse(content);
        p.page = _(p.page).extend(meta);
        p.content = template.render({
          site: p.site,
          post: p.post,
          page: p.page,
          content: p.content
        });

        if (meta && meta.layout) q.defer(getLayout);
        cb();
      });
    }
  }
});
