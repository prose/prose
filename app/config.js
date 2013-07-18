var cookie = require('./cookie');
var oauth = require('../oauth.json');

module.exports = {
  api: oauth.api || 'https://api.github.com',
  apiStatus: oauth.status || 'https://status.github.com/api/status.json',
  site: oauth.site || 'https://github.com',
  id: oauth.clientId,
  url: oauth.gatekeeperUrl,
  username: cookie.get('username'),
  auth: 'oauth'
};
