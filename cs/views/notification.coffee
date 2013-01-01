class app.views.Notification extends Backbone.View

  id: "notification"
  
  initialize: (type, message) ->
    @model = {}
    @model.type = type
    @model.message = message

  render: ->
    $(@el).html app.templates.notification(@model)
    this
