(function (config, models, views, routers, utils, templates) {

  views.App = Backbone.View.extend({
    id: 'app',

    events: {
      'click .post-views a': 'postViews',
      'click a.logout': 'logout'
    },

    initialize: function(options) {
      this.eventRegister = options.eventRegister;
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

      // When the sidebar should be open.
      if (this.model.mode === 'edit') {
        $('#prose').toggleClass('open', false);
      } else {
        $('#prose').toggleClass('open', true);
      }

      _.delay(function () {
        dropdown();
      }, 1);

      return this;
    },

    postViews: function(e) {
      this.eventRegister.trigger('postViews', e);
      return false; 
    },

    logout: function () {
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
