function makeBranch(i) {
  var sha = "000000000000000000000000000000000000000" + i;
  return {
    name: "commit " + i,
    commit: {
      sha: sha,
      url: "https://api.github.com/repos/test/test/commits/" + sha
    }
  };
}

var branches = [];

var i = 0;

while (i < 100) {
  branches.push(makeBranch(i));
  i++;
}

module.exports = branches;
