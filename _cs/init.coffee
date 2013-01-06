return if not authenticate()

loadApplication (err, data) ->

  window.app.instance = new app.views.Application({ el: '#container', model: data }).render()

  if (err)
    return app.instance.notify 'error', 'Error while loading data from Github. This might be a temporary issue. Please try again later.'

  window.router = new app.routers.Application()
  Backbone.history.start()

confirmExit = (e) ->
  return true unless window.app.instance.mainView?
  return true unless window.app.instance.mainView.dirty

  msg = "You have unsaved changes. Are you sure you want to leave?"

  return msg if e? and e.type? and e.type is "beforeunload"
  confirm msg

# Prevent exit when there are unsaved changes
window.onbeforeunload = (event) ->
  conf = confirmExit e
  return null if c is true

  event = event || window.event
  event.returnValue = conf if event

  conf
