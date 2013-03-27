(function (config, models, views, routers, utils, templates) {

    views.Posts = Backbone.View.extend({
        events: {
            'click a.link': '_loading',
            'keyup #search_str': '_search'
        },

        render: function () {
            var that = this;
            $(this.el).html(templates.posts(_.extend(this.model, app.state, {
                current_path: app.state.path
            })));

            _.delay(function () {
                that.renderResults();
                $('#search_str').focus();

                // Branch Switching
                $('.chzn-select').chosen().change(function() {
                    router.navigate($(this).val());
                });
            }, 1);
            return this;
        },

        _loading: function (e) {
            $(e.currentTarget).addClass('loading');
        },

        _search: function () {
            _.delay(_.bind(function () {
                var searchstr = this.$('#search_str').val();
                this.model = getFiles(this.model.tree, app.state.path, searchstr);
                this.renderResults();
            }, this), 10);
        },

        // Creates human readable versions of _posts/paths
        semantifyPaths: function (paths) {
            return _.map(paths, function (path) {
                return {
                    path: path,
                    name: path
                }
            });
        },

        renderResults: function () {
            this.$('#files').html(templates.files(_.extend(this.model, app.state, {
                current_path: app.state.path
            })));

            var caption = this.model.files.length + '';
            var searchstr = this.$('#search_str').val();
            if (searchstr) {
                // for "'+searchstr+'"'; // within "'+app.state.path+'/*"';
                caption += ' matches';
            } else {
                // within "'+ (app.state.path ? app.state.path : '/') +'"';
                caption += ' files';
            }
            this.$('.results').html(caption);
        }
    });

}).apply(this, window.args);
