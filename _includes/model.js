window.github = new Github({
  username: "{{ site.github.username }}",
  password: "{{ site.github.password }}"
});

// Load Application
// -------
// 
// Load everything that's needed for the app + header

function loadApplication(username, password, cb) {
  var user = github.getUser('{{ site.github.username }}');
  user.repos(function(err, repos) {
    // TODO: filter and just show Jekyll repositories
    cb(null, {
      "username": "{{ site.github.username }}",
      "password": "{{ site.github.password }}",
      "available_repos": repos
    });
  });
}

// Load Site
// -------
// 
// List all postings for a given site plus load _config.yml

function loadSite(username, reponame, branch, path, cb) {

  var repo = github.getRepo(reponame, branch);

  function loadConfig(cb) {
    repo.read("_config.yml", function(err, data) {
      if (err) return cb(err);
      cb(null, jsyaml.load(data));
    });
  }

  repo.list(function(err, tree) {
    // if (err && branch !== "master") return loadSite(reponame, "master", path, cb);
    if (err) cb("Not a Jekyll repository.");

    // Load Jekyll config file (_config.yml)
    loadConfig(function(err, config) {
      if (err) return cb(err);
      if (!config.columnist || !config.columnist.paths) return cb("not a valid jekyll repository");
      app.state.config = config;

      app.state.path = path ? path : config.columnist.paths[0];
      // app.state.branch = branch;

      var posts = _.map(tree, function(file) {
        var regex = new RegExp("^" + app.state.path + "/(\\w|-)*.md$");
        return regex.test(file.path) ? {path: file.path, title: file.path} : null;
      });

      cb(null, {"posts": _.compact(posts)});
    });
  });
}


// Save Post
// -------
// 
// List all postings for a given repository
// Looks into _posts/blog

function savePost(username, reponame, branch, path, metadata, content, cb) {

  var repo = github.getRepo(reponame, branch);
  function serialize(data) {
    return "---\n" + _.toYAML(data) + "\n---\n\n";
  }
  repo.write(path, serialize(metadata)+content, cb);
}


// Save Post
// -------
// 
// List all postings for a given repository
// Looks into _posts/blog

function loadPost(username, reponame, branch, path, file, cb) {
  var repo = github.getRepo(reponame, branch);

  repo.read(path + "/" + file, function(err, data) {

    function parse(content) {
      var res = {};
      var chunked = (content+'\n').split('---\n');
      if (chunked[0] === '' && chunked.length > 2) {
        res.metadata = jsyaml.load(chunked[1]);
        res.content = chunked.slice(2).join('---\n');
      } else {
        res.metadata = {};
        res.content = content;
      }
      return res;
    }

    // Extract metadata
    var post = parse(data);

    // We're done. Can you hear me?!
    cb(err, _.extend(post, {"repo": reponame, "path": path}));
  });
}
