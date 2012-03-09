
window.github = new Github({
  username: "github-api-test",
  password: "api-test-12"
});

// Load everything that's needed for the app + header

function loadApplication(username, password, cb) {
  var user = github.getUser('github-api-test');
  user.repos(function(err, repos) {
    // TODO: filter and just show Jekyll repositories
    cb(null, {
      "username": "github-api-test",
      "password": "api-test-12",
      "site": "github-api-test.github.com",
      "available_sites": repos
    });
  });
}

// List all postings for a given repository
// Looks into _posts/blog

function loadPosts(repo, cb) {
  var repo = github.getRepo('github-api-test');
  repo.list(function(err, tree) {
    var posts = _.map(tree, function(file) {
      // TODO: change to -> _posts/blog
      return file.path.match(/^path\/to\/\w*.md/) ? {name: file.path, title: file.path} : null;
    });
    cb(null, {"posts": _.compact(posts)});
  });
}

function savePost(reponame, path, content, cb) {
  var repo = github.getRepo(reponame);
  repo.write(path, content, cb);
}

function loadPost(reponame, path, cb) {
  var repo = github.getRepo(reponame);

  repo.read(path, function(err, data) {
    cb(err, {"content": data, "repo": reponame, "path": path});
  });
}

