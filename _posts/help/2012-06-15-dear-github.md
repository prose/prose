---
published: true
---

Dear Github,

we're working on [Prose](http://prose.io), a visual interface to manage the contents of Jekyll websites (or regular repositories). We're using the Github APIv3 for doing that. So first off, thanks for providing Jekyll and Github Pages as well as the Github API.

![Prose](http://f.cl.ly/items/2b1x3N2j2v1T0M3M291H/Screen%20Shot%202012-06-12%20at%203.10.19%20PM.png)


Here's a list of issues we're experiencing in conjunction with our app:

- Listing Repositories
  
  When listing the repositories, we can't determine which of them are actual Jekyll sites. Theoretically we could, by issuing a separate request that fetches repository information (such as branches) and looks for a `_config.yml` file. However this is way to slow, so we have to do it on-demand as you click on a repository.

- Subsequent Writes

  When doing subsequent saves within a couple of seconds.. the github API responds with an error when trying to write out the new head. See this [ticket](https://github.com/prose/prose/issues/91).


- Organizations
  
  Repositories that live within your organizations can only be accessed by entering the url (`/:organization/:repo/:branch`) manually.

- Deleting and renaming files
  
  This requires a full tree to be written involving a new commit that points to that tree. In fact this is not a big problem with small repositories, but once they get bigger it's not only a performance issue, you'll get errors.
  
  
# Github File API

Well we'd like to ask, if it would be possible to introduce a higher level API for reading and writing files to Github, without messing with blobs and trees.

We'd be glad to help with designing that API, and I'm sure we're not the only one who would appreciate such a higher level interface. Here's an early draft of the API.

## Read file


    GET /repos/:user/:repo/files/:ref/:path

**Response**

    {
      "contents": "File contents as UTF8-string",
      "message": "Latest commit message"
    }



## Create files

    POST /repos/:user/:repo/files

Ideally, this allows you to write multiple files.

**Parameters**

- `message` - String of the commit message
- `files` - An object describing the files to be written (see example input)
- `head` - The head (branch) you want to write to
  

**Optional Parameters**

- `author` - Specifying author data


**Example Input**

    {
      "message": "my commit message",
      "author": {
        "name": "Scott Chacon",
        "email": "schacon@gmail.com",
        "date": "2008-07-09T16:13:30+12:00"
      },
      "head": "master",
      "files": {
        "_posts/2012-06-17-hello-world.md": "File contents as UTF8 string",
        "README.md": "Here comes Kurt."
      }
    }


## Update file

    PUT  /repos/:user/:repo/files/:ref/:path


**Parameters**

- `message` - String of the commit message
- `path` - New path (in order to move a file to a new location)
- `contents` - New file contents as an UTF8 string


**Optional Parameters**

- `author` - Specifying author data
  
  
**Example Input**

    {
      "message": "my commit message",
      "author": {
        "name": "Scott Chacon",
        "email": "schacon@gmail.com",
        "date": "2008-07-09T16:13:30+12:00"
      },
      "head": "master",
      "files": {
        "_posts/2012-06-17-hello-world.md": "File contents as UTF8 string",
        "README.md": "Here comes Kurt."
      }
    }


## Delete a file

    DELETE  /repos/:user/:repo/files/:ref/:path
    
**Parameters**

- `message` - String of the commit message