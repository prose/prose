
window.github = new Github({
  username: "{{ site.github.username }}",
  password: "{{ site.github.password }}"
});

// Load everything that's needed for the app + header

function loadApplication(username, password, cb) {
  var user = github.getUser('{{ site.github.username }}');
  user.repos(function(err, repos) {
    // TODO: filter and just show Jekyll repositories
    cb(null, {
      "username": "{{ site.github.username }}",
      "password": "{{ site.github.password }}",
      "site": "{{ site.github.default-repo }}",
      "available_sites": repos
    });
  });
}

// List all postings for a given repository
// Looks into _posts/blog

function loadPosts(reponame, cb) {
  var repo = github.getRepo(reponame, "{{ site.github.branch }}");
  repo.list(function(err, tree) {
    var posts = _.map(tree, function(file) {
      var regex = new RegExp("^" + "{{ site.github.posts-dir }}" + "/(\\w|-)*.md$");
      return regex.test(file.path) ? {path: file.path, title: file.path} : null;
    });
    cb(null, {"posts": _.compact(posts)});
  });
}

function savePost(reponame, path, content, cb) {
  var repo = github.getRepo(reponame, "{{ site.github.branch }}");
  repo.write(path, content, cb);
}

function loadPost(reponame, path, cb) {
  var repo = github.getRepo(reponame, "{{ site.github.branch }}");

  repo.read(path, function(err, data) {
    cb(err, {"content": data, "repo": reponame, "path": path});
  });
}

