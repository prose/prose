---
layout: help
title: Getting Started
descr: A brief introduction on how to use Prose, what it can do for you and what not.
image: http://prose.io/images/help/getting-started.png
author_twitter: _mql
author: Michael Aufreiter
prose_link: http://prose.io/#prose/prose/edit/gh-pages/_posts/help/2012-06-20-getting-started.md
categories:
- help
published: true
---

This little guide walks you through the process of using Prose to manage your website.

# Create your first Jekyll webpage

We've created a simple template that you can use as a starting point, [Prose Bootstrap](http://bootstrap.prose.io). All you have to do is create a fork of the [repository](http://github.com/prose/bootstrap) and give it a suitable new name. Please follow the steps described on the Bootstrap homepage. If you are already maintaining a Jekyll page you can skip this step.

gest

# Open Prose

Navigate to [Prose.io](http://prose.io). Now you can sign in to [GitHub](http://github.com) by using OAuth.

![Start](https://github.com/prose/prose/raw/gh-pages/images/screenshots/start.png)


# Browse Repositories

The landing page gives you all the repositories you have access to. If a Jekyll site has multiple branches, you are prompted to select your desired branch, otherwise you jump into the repo directly. We're going to pick our fresh bootstraped site here.

![Repositories](https://github.com/prose/prose/raw/gh-pages/images/screenshots/browse-repos.png)


# Browsing Posts

Once you have selected a repository, you can browse your posts and sub-folders in a traditional file-browser-ish manner. You can create new files as well, which immediately opens an empty document for you, which you can save after populating it with some text.

![Posts](https://github.com/prose/prose/raw/gh-pages/images/screenshots/browse-files.png)


# Edit Posts

Once the file has been loaded, all you have to do is pointing your cursor to the text and start typing. We're providing basic syntax highlighting for Markdown to assist you during the writing process.

![Edit](https://github.com/prose/prose/raw/gh-pages/images/screenshots/edit.png)


# Preview

You can instantly preview your writing by either clicking the preview icon at the document menu bar, or `ctrl+shift+right` to toggle it.

![Preview](https://github.com/prose/prose/raw/gh-pages/images/screenshots/preview.png)


# Cheatsheet

If you don't write on a daily basis (like me) you might have difficulties to remember the Markdown syntax so we also included a cheatsheet that you can use for reference. You reach it by pressing `ctrl+shift+left`.

![Preview](https://github.com/prose/prose/raw/gh-pages/images/screenshots/cheatsheet.png)


# Publish

Once you are ready, you can easily publish your article, which lets it show up on the actual webpage/blog. Try it.

![Publish](http://f.cl.ly/items/302m2R2l0x090h0k0s21/Screen%20Shot%202012-05-23%20at%205.03.43%20PM.png)


# Metadata

Take full control about your post, and edit Metadata aka the YAML frontmatter. No limitations.

![Repositories](https://github.com/prose/prose/raw/gh-pages/images/screenshots/metadata.png)


# Not just for Jekyll

The editor not only supports Jekyll websites but can be used to edit any github repository (respectively any contained text file). You can use it to edit `server.js` of your Node.js application for instance. 

However, if you navigate to a Jekyll repository, the editor is smart enough to expose everything below `_posts` and provide the metadata editor along with the markdown preview panel.

# Suitable for writers

Prose is also suitable as a full-featured writing environment, covering authoring and sharing articles. That's how you can do it:

1. Create a new GitHub repository. And call it... `documents`.
2. Open the editor and create `hello-world.md`.
3. Save it.
4. Share it (we support deep linking to the rendered version)

Prose is similiar to [iAWriter](http://www.iawriter.com/) as it is also using a minimal interface for editing Markdown, but it's web-based and uses [GitHub](http://github.com) for storing your text so your writings are more than safe and GitHub keeps a history of every saved version. So Prose can potentially be seen as a whole new way of sharing documents online, while utilizing the usual suspects Markdown and GitHub. Oh and it's free and open source.