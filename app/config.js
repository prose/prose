var cookie = require('../cookie');
var oauth = require('../oauth.json');

module.exports = {
  api: oauth.api || 'https://api.github.com',
  site: oauth.site || 'https://github.com',
  id: oauth.clientId,
  url: oauth.gatekeeperUrl,
  token: cookie.get('oauth-token'),
  username: cookie.get('username'),
  auth: 'oauth'
};
