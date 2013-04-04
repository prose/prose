(function (config, models, views, routers, utils, templates) {

    views.Profile = Backbone.View.extend({
        id: 'profile',

        events: {
            'keyup #filter': 'filterFiles'
        },

        render: function() {
            var u = this.model.user;
            $(this.el).empty().append(templates.profile(this.model));
            this.renderResults();

            $('#heading')
                .empty()
                .append(templates.heading({
                    avatar: '<img src="' + u.avatar_url + '" width="40" height="40" alt="Avatar" />',
                    parent: u.name || u.login,
                    parentUrl: u.login,
                    title: 'Your Projects',
                    titleUrl: u.login
                }));

            $('#drawer')
                .empty()
                .append(templates.sidebarOrganizations(this.model));

            _.delay(function () {
                shadowScroll($('#projects'), $('.content-search'));
                $('#filter').focus();
            }, 1);

            return this;
        },

        filterFiles: function() {
            _.delay(_.bind(function() {
                var searchstr = this.$('#filter').val();
                this.model = filterProjects(this.model, searchstr);
                this.renderResults();

                // console.log(this.model);
            }, this), 10);
        },

        renderResults: function () {
            $('#projects', this.el).empty().append(templates.projects(this.model));
        }

    });

}).apply(this, window.args);
