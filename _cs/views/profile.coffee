class app.views.Profile extends Backbone.View

  id: "start"
    
  render: ->
    $(@el).html app.templates.profile(@model)
    this
