var Orgs = require('../../../app/collections/orgs');
var User = require('../../../app/models/user');
var cookie = require('../../../app/cookie');

describe('orgs collection', function () {

  var token;
  before(function () {
    token = cookie.get('oauth-token');
    scope = cookie.get('scope');
    if (!token) {
      cookie.set('oauth-token', '12345');
    }
    if (!scope) {
      cookie.set('scope', 'repo')
    }
  });

  after(function () {
    if (token) {
      cookie.set('oauth-token', token);
    }
    else {
      cookie.unset('oauth-token');
    }
    if (scope) {
      cookie.set('scope', scope);
    }
    else {
      cookie.unset('scope');
    }
  });

  // https://github.com/prose/prose/issues/826#issuecomment-219456842
  // https://developer.github.com/v3/orgs/#list-your-organizations
  // https://developer.github.com/v3/orgs/#list-user-organizations
  it('does not use /users/:username/orgs when authenticated', function () {
    var user = new User({login: 'tom'});
    var orgs = new Orgs([], {user: user});
    expect(/tom/.test(orgs.url())).not.ok;
  });
});
