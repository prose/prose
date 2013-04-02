(function (config, models, views, routers, utils, templates) {

    views.Posts = Backbone.View.extend({
        events: {
            'click a.link': 'loading',
            'keyup #filter': 'search'
        },

        render: function () {
            var that = this;
            $(this.el).html(templates.posts(_.extend(this.model, app.state, {
                current_path: app.state.path
            })));

            $('#drawer').empty().html(templates.sidebarProject(_.extend(this.model, app.state, {
                current_path: app.state.path
            })));

            _.delay(function () {
                that.renderResults();
                $('#filter').focus();

                // Branch Switching
                $('.chzn-select').chosen().change(function() {
                    router.navigate($(this).val(), false);
                });
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
