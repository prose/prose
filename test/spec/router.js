var _ = require('underscore');
var Router = require('../../app/router');
var Users = require('../../app/collections/users');
var User = require('../../app/models/user');
var Repos = require('../../app/collections/repos');
var Repo = require('../../app/models/repo');
var AppView = require('../../app/views/app');


describe('router', function() {

  // We're going to play with fetch, so fix it after the test
  var fetch = _.extend({}, {
    fetch: Repo.prototype.fetch
  });
  after(function () {
    _.extend(Repo.prototype, fetch);
  });

  it('Uses the owner repo when there is a fork', function () {

    var expectedName = '';
    _.extend(Repo.prototype, {
      fetch: function (options) {
        expect(this.get('owner').login).eql(expectedName);
      }
    });

    var dracula = 'dracula';
    var piggy = 'misspiggy';
    var repos = new Repos([], {user: new User()});
    repos.add(new Repo({
      name: 'prose',
      owner: { login: dracula }
    }));
    repos.add(new Repo({
      name: 'prose',
      owner: { login: piggy }
    }));
    var thirdname = 'thirdname';

    var users = new Users([
      new User({login: piggy}),
      new User({login: dracula}),
      new User({login: thirdname})
    ]);
    users.forEach(function (user) {
      user.repos = repos;
    });
    var router = new Router({user: new User()});
    router.users = users;
    expect(router.users.length).eql(3);

    expectedName = piggy;
    router.repo(piggy, 'prose');

    expectedName = dracula;
    router.repo(dracula, 'prose');

    // no repo for thirdname, but Prose will query it anyway.
    expectedName = thirdname;
    router.repo(thirdname, 'prose');
  });
});
