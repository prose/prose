(function (config, models, views, routers, utils, templates) {

    // This is the top-level piece of UI.

    views.Application = Backbone.View.extend({

        // Events
        // ------

        events: {
            'click .toggle-view': 'toggleView',
            'click #notification .create': 'createPost'
        },

        toggleView: function(e) {
            var link = $(e.currentTarget),
                route = link.attr('href').replace(/^\//, '');

            $('.toggle-view.active').removeClass('active');
            link.addClass('active');
            router.navigate(route, true);

            return false;
        },

        createPost: function(e) {
          var hash = window.location.hash.split('/');
          hash[2] = 'new';
          hash[hash.length - 1] = '?file=' + hash[hash.length - 1];

          router.navigate(_(hash).compact().join('/'), true);
          return false;
        },

        // Initialize
        // ----------

        initialize: function() {
            _.bindAll(this);
            var that = this;
            this.app = new views.App({
                model: this.model
            });

            function calculateLayout() {
                if (that.mainView && that.mainView.refreshCodeMirror)  {
                    that.mainView.refreshCodeMirror();
                }
            }

            var lazyLayout = _.debounce(calculateLayout, 300);
            $(window).resize(lazyLayout);
        },


        renderApp: function() {
            $(this.app.render().el).prependTo(this.el);
        },

        // Helpers
        // -------

        replaceMainView: function(name, view) {
            $('body').removeClass().addClass(name);

            // Make sure the header get's shown
            if (name !== 'start') $('#app').show();

            if (this.mainView) {
                this.mainView.remove();
            } else {
                $('#content').empty();
            }
            this.mainView = view;
            $(view.el).appendTo(this.$('#content'));
        },


        // Main Views
        // ----------

        start: function(username) {
            var that = this;
            app.state.title = '';

            // Render out the application view
            $(that.app.render().el).prependTo(that.el);

            this.replaceMainView('start', new views.Start({
                model: _.extend(this.model, {
                    authenticated: !! window.authenticated
                })
            }).render());
        },

        profile: function(username) {
            var that = this;
            app.state.title = username;
            this.loading('Loading profile ...');

            loadRepos(username, function (err, data) {

                // Render out the application view
                $(that.app.render().el).prependTo(that.el);

                that.loaded();
                data.authenticated = !! window.authenticated;
                that.replaceMainView('profile', new views.Profile({
                    model: _.extend(that.model, data)
                }).render());
            });
        },

        staticView: function() {
            // Render out the application view
            $(this.app.render().el).prependTo(this.el);
        },

        posts: function(user, repo, branch, path) {
            var that = this;
            this.loading('Loading posts ...');
            loadPosts(user, repo, branch, path, _.bind(function (err, data) {
                this.loaded();

                if (err) return this.notify('error', 'The requested resource could not be found.');
                // Render out the application view
                $(that.app.render().el).prependTo(that.el);
                this.replaceMainView('posts', new views.Posts({
                    model: data
                }).render());
            }, this));
        },

        post: function(user, repo, branch, path, file, mode) {
            var that = this;
            this.loading('Loading post ...');
            loadPosts(user, repo, branch, path, _.bind(function (err, data) {
                if (err) return this.notify('error', 'The requested resource could not be found.');
                loadPost(user, repo, branch, path, file, _.bind(function (err, data) {
                    this.loaded();

                    app.state.markdown = data.markdown;
                    // Render out the application view
                    $(that.app.render().el).prependTo(that.el);

                    if (err) return this.notify('error', 'The requested resource could not be found.');
                    data.preview = (mode !== 'edit');
                    data.lang = _.mode(file);
                    this.replaceMainView(window.authenticated ? 'post' : 'read-post', new views.Post({
                        model: data
                    }).render());
                }, this));

                // Render out the application view
                $(that.app.render().el).prependTo(that.el);

            }, this));
        },

        preview: function(user, repo, branch, path, file, mode) {
            this.loading('Preview post ...');
            loadConfig(user, repo, branch, _.bind(function() {
                loadPost(user, repo, branch, path, file, _.bind(function (err, data) {
                    if (err) return this.notify('error', 'The requested resource could not be found.');
                    new views.Preview({
                        model: data
                    }).render();
                }, this));
            }, this));
        },

        newPost: function(user, repo, branch, path) {
            var that = this;
            this.loading('Creating file ...');
            loadPosts(user, repo, branch, path, _.bind(function (err, data) {
                emptyPost(user, repo, branch, path, _.bind(function (err, data) {
                    this.loaded();

                    // Render out the application view
                    $(that.app.render().el).prependTo(that.el);

                    data.jekyll = _.jekyll(path, data.file);
                    data.preview = false;
                    data.markdown = _.markdown(data.file);
                    data.lang = _.mode(data.file);

                    this.replaceMainView('post', new views.Post({
                        model: data
                    }).render());

                    this.mainView._makeDirty();
                    app.state.file = data.file;

                }, this));
            }, this));
        },

        notify: function(type, message) {
            // Render out the application view
            $(this.app.render().el).prependTo(this.el);

            this.replaceMainView('notification', new views.Notification(type, message).render());
        },

        loading: function(msg) {
            $('body').append('<div class="loading"><span>' + msg || 'Loading ...' + '</span></div>');
        },

        loaded: function()  {
            $('.loading').remove();
        }

    });

}).apply(this, window.args);
