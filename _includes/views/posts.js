(function (config, models, views, routers, utils, templates) {

    views.Posts = Backbone.View.extend({

        id: 'posts',

        events: {
            'click a.link': 'loading',
            'keyup #filter': 'search'
        },

        render: function () {
            var that = this;
            var h = this.model;

            var isPrivate = app.state.isPrivate ? 'private' : '';

            $(this.el).empty().append(templates.posts(_.extend(this.model, app.state, {
                currentPath: app.state.path
            })));

            $('#drawer').empty().append(templates.sidebarProject(_.extend(this.model, app.state, {
                currentPath: app.state.path
            })));

            $('#heading')
                .empty()
                .append(templates.heading({
                    avatar: '<span class="icon round repo ' + isPrivate + '"></span>',
                    parent: h.user,
                    parentUrl: h.user,
                    title: h.repo,
                    titleUrl: h.user + '/' + h.repo
                }));

            _.delay(function () {
                that.renderResults();
                $('#filter').focus();

                shadowScroll($('#files'), $('.breadcrumb'));

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
