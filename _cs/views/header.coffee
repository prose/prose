class app.views.Header extends Backbone.View

  id: "header"
  events:
    "click a.logout": "_logout"
  
  _logout: ->
    logout()
    app.instance.render()
    if $("#start").length > 0
      app.instance.start()
    else
      window.location.reload()
    false
  
  render: ->
    $(@el).html app.templates.header(_.extend(@model,
      state: app.state
    ))
    this
  
