---
published: true
---

Dear Github,

we're working on [Prose](http://prose.io), a visual interface to manage the contents of Jekyll websites (or regular repositories). We're using the Github APIv3 to do that.

![Prose](http://f.cl.ly/items/2b1x3N2j2v1T0M3M291H/Screen%20Shot%202012-06-12%20at%203.10.19%20PM.png)


Here's a list of issues we're seeing:

- Listing Repositories
  
  When listing the repositories, we can't determine which of them are actual Jekyll sites. Theoretically we could, by issuing a separate request that fetches repository information (such as branches) and looks for a `_config.yml` file. However this is way to slow, so we have to do it on-demand as you click on a repository.

- Subsequent Writes

  When doing subsequent saves within a couple of seconds.. the github API responds with an error when trying to write out the new head. See this [ticket](https://github.com/prose/prose/issues/91).


- Organizations
  
  Repositories that live within your organizations can only be accessed by entering the url (`/:organization/:repo/:branch`) manually.

- Deleting and renaming files
  
  This requires a full tree to be written involving a new commit that points to that tree. In fact this is not a big problem with small repositories, but once they get bigger it's not only a performance issue, you'll get errors. Be aware that you may not (yet) be able to rename or delete files when working with bigger repositories.
  
  
# Github File API

Well we'd like to ask, if it would be possible to introduce a higher level API for reading and writing files to Github, without messing with blobs and trees.

We'd be glad to help with designing that API, and I'm sure we're not the only one who would appreciate such a higher level interface.

## Write files

