---
layout: help
title: Prose for writers
descr: How to use Prose as a writing workspace.
image: http://prose.io/images/help/prose-for-writers.png
author_twitter: _mql
author: Michael Aufreiter
prose_link: http://prose.io/#prose/prose/edit/gh-pages/_posts/help/2012-06-20-prose-for-writers.md
published: true
categories:
- help
---

[Prose](http://prose.io) is not only suitable for managing website content. You can use it as a full-featured writing environment too. It provides you a distraction-free writing experience, with a focus on content and structure. Also, you can share your work at any time or invite other people to collaborate on your document. 

Here's what you need to get started.

## Create a new GitHub Repository

This will be the home of your documents. Make sure there is at least one branch available. The easiest way to do it, is by creating a new GitHub Repository and initializing it with an empty README. 

![Create a repository on GitHub](http://prose.io/images/screenshots/prose-for-writers/create-repository.png)

Keep in mind, this is a plain old GitHub repository, no Jekyll involved here.


## Start writing

Open your fresh repository in prose and start writing your first document. To do so, click on "New File" enter some text in markdown and finally hit save.

![Start writing](http://prose.io/images/screenshots/prose-for-writers/start-writing.png)


## Remember every change

A full changeset is stored on every save. Thanks to git you can access older versions of your document using [GitHub](https://github.com/prose/documents/commits/master). You can access the full commit history ...

![Revisions](http://prose.io/images/screenshots/prose-for-writers/revisions.png)

or look at particular changesets.

![Changeset](http://prose.io/images/screenshots/prose-for-writers/changeset.png)

In future we'll allow you to access revisions and changesets right from Prose. Just give us some more time please. :)


## Invite collaborators

If your co-workers or friends haven't created a Github Account yet, this might be a good occasion to get started. Write permissions are totally transparent, and managed on GitHub. To invite collaborators you need to give them permission to your repository and send them the link to the document on Prose.

![Invite collaborators](http://prose.io/images/screenshots/prose-for-writers/add-collaborators.png)

## Share your work

Make sure your repository is public and just share the URL of the [post](http://prose.io/#prose/documents/blob/master/articles/hello-world.md). Readers will always see the most up to date version.

![Invite collaborators](http://prose.io/images/screenshots/prose-for-writers/share.png)

So if you or some of your collaborators make a change, it will immediately be visible. Just point them to the appropriate URL for either editing, or viewing the document.

- `http://prose.io/#prose/documents/blob/master/articles/hello-world.md`
- `http://prose.io/#prose/documents/edit/master/articles/hello-world.md`


## Organize your posts in folders

You might want to structure your document repository, once you get more and more files. All you have to do is prefixing an arbitary folder structure to the filename. Make sure you don't have a slash in front.

![Subfolders](http://prose.io/images/screenshots/prose-for-writers/subfolders.png)


## Turn it into a website

Remember that you always have the option to turn your document repository in a Jekyll website, featuring your own design. You can use our [template](http://bootstrap.prose.io/) to get started with Jekyll.

However, before creating a website, you should have some content ready and with Prose it is easy to safely create and share that potential website content.


## Background

Prose is closely tied to Git and GitHub. We intentionally made the process transparent, and expose git concepts such as branches, folders and files. You can access every file either with Prose or the Github User interface. You can also switch to editing in your local text editor and use the regular git commit/push workflow, if you prefer that. E.g. when you're on the road, and offline.


## Future outlook

- Accessing revision history through the interface
- Invite collaborators right from the interface, and see who has access to the documents.