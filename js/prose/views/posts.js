(function (config, models, views, routers, utils, templates) {

    views.Posts = Backbone.View.extend({

        id: 'posts',

        events: {
            'click a.link': 'loading',
            'keyup #filter': 'search'
        },

        render: function () {
            var that = this;
            var data = _.extend(this.model, app.state, {
              currentPath: app.state.path
            });

            // Ping `views/app.js` to let know we should swap out the sidebar
            this.eventRegister = app.eventRegister;
            this.eventRegister.trigger('sidebarContext', data, 'posts');
            var isPrivate = app.state.isPrivate ? 'private' : '';

            var header = {
              avatar: '<span class="icon round repo ' + isPrivate + '"></span>',
              parent: data.user,
              parentUrl: data.user,
              title: data.repo,
              titleUrl: data.user + '/' + data.repo,
              alterable: false
            }

            this.eventRegister.trigger('headerContext', header);
            $(this.el).empty().append(templates.posts(data));

            _.delay(function () {
                that.renderResults();
                $('#filter').focus();

                shadowScroll($('#files'), $('.breadcrumb'));
            }, 1);

            return this;
        },

        loading: function (e) {
            $(e.currentTarget).addClass('loading');
        },

        search: function () {
            _.delay(_.bind(function() {
                var searchstr = this.$('#filter').val();
                this.model = getFiles(this.model.tree, app.state.path, searchstr);
                this.renderResults();
            }, this), 10);
        },

        renderResults: function () {
            this.$('#files').html(templates.files(_.extend(this.model, app.state, {
                currentPath: app.state.path
            })));
        },

        // Creates human readable versions of _posts/paths
        semantifyPaths: function (paths) {
            return _.map(paths, function (path) {
                return {
                    path: path,
                    name: path
                }
            });
        }

    });

}).apply(this, window.args);
