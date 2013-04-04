(function (config, models, views, routers, utils, templates) {

    views.App = Backbone.View.extend({
        id: 'app',

        events: {
            'click a.logout': '_logout',
            'click .navigation a': 'navigate'
        },

        buildMeta: function() {
          var $metadata = $('#metadata');
              $metadata.empty();

          /*
          _(schema.metadata).each(function(data) {
              switch(data.field.element) {
                  case 'input':
                      $metadata.append(templates.text({
                          label: data.field.label,
                          placeholder: data.field.placeholder
                      }));
                  break;
                  case 'select':
                      $metadata.append(templates.select({
                          label: data.field.label,
                          placeholder: data.field.placeholder,
                          options: data.field.options
                      }));
                  break;
                  case 'multiselect':
                      $metadata.append(templates.multiselect({
                          label: data.field.label,
                          placeholder: data.field.placeholder,
                          options: data.field.options
                      }));
                  break;
              }
          });
          */

          $('.chzn-select').chosen();
        },

        navigate: function() {
            event.preventDefault();

            var $icon = $(event.target);
            var target = $icon.attr('href').split('#')[1];
            var drawer = $icon.data('drawer');

            if (!$icon.hasClass('active')) {
                $('#navigation a').removeClass('active');

                if (drawer) {
                    $('#drawer').empty().append(templates[target](
                      _.extend(this.model, app.state)
                    ));

                    $('body').addClass('open-drawer');

                    // TODO $defer until the meta data block is populated?
                    if (target === 'metadata') this.buildMeta();
                }

                // $(this, target).addClass('active');
            } else {
                // $(this, target).removeClass('active');
                $('body').removeClass('open-drawer');
            }
        },

        render: function () {
            $(this.el).empty().append(templates.app(_.extend(this.model, app.state, {
                state: app.state
            })));

            _.delay(function () {
                dropdown();
            }, 1);

            return this;
        },

        _logout: function () {
            logout();
            app.instance.render();
            if ($('#start').length > 0) {
                app.instance.start();
            } else {
                window.location.reload();
            }
            return false;
        }

    });

}).apply(this, window.args);
