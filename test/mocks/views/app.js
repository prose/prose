var AppView = require('../../../app/views/app'),
  distate = require('../helpers').distate;

module.exports = distate.register(app);

/*
NOTE: don't mock LoaderView, SidebarView, or NavView, as we can just get 
those off the app.
*/
function app() {
  return this._app = this._app ||
    new AppView({
      el: '#prose',
      model: {},
      user: null
    });
}
