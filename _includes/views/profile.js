(function (config, models, views, routers, utils, templates) {

    views.Profile = Backbone.View.extend({
        id: 'profile',

        render: function () {
            $(this.el).html(templates.profile(_.extend(this.model)));
            $('#drawer')
                .empty()
                .append(templates.sidebarOrganizations(this.model));
            return this;
        }
    });

}).apply(this, window.args);
