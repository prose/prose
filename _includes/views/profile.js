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

            console.log(this.model);
            $('#heading')
                .empty()
                .append(templates.heading({
                    avatar: u.avatar_url,
                    parent: u.name || u.login,
                    parentUrl: u.login,
                    title: 'Projects',
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

                // console.log(this.model);
                // this.model = filterProjects(this.model.repos, searchstr);
                // this.renderResults();
            }, this), 10);
        },

        renderResults: function () {
            this.$('#projects').empty().append(templates.projects(this.model));
        }

    });

}).apply(this, window.args);
