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
      "repo": "{{ site.github.default-repo }}",
      "available_repos": repos
    });
  });
}


// Load Posts
// -------
// 
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


// Save Post
// -------
// 
// List all postings for a given repository
// Looks into _posts/blog

function savePost(reponame, path, metadata, content, cb) {
  var repo = github.getRepo(reponame, "{{ site.github.branch }}");
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

function loadPost(reponame, path, cb) {
  var repo = github.getRepo(reponame, "{{ site.github.branch }}");

  repo.read(path, function(err, data) {

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
