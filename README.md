# Prose

[Prose](http://prose.io) is a web-based interface for managing text-based content in your GitHub repositories. Use it to create, edit, and delete files, and save your changes directly to GitHub.

Prose is great for making quick updates to your code or managing your blog. Prose pays special attention to [Jekyll sites](https://github.com/mojombo/jekyll) [hosted on GitHub Pages](http://pages.github.com) with Markdown text preview and syntax reference. It's [configurable](http://prose.io/help/handbook.html) to restrict users to files that live within the `_posts` directory so you can use it to manage the content on your blog without fear of changing other critical files. Using Jekyll in conjunction with Prose is a smart way of maintaining websites for developers and editors alike by allowing them to use a visual, web-based tool to manage the content.

[Get started now](http://prose.io/help/getting-started.html) or learn more about [using Jekyll to design flexible static websites](http://developmentseed.org/blog/2011/09/09/jekyll-github-pages/).

![Screen shot of the Prose interface](https://github.com/prose/prose/raw/gh-pages/images/screenshots/edit.png)


## Future plans

This is a first release dedicated to developers at this early stage. It will be buggy as we work out the kinks, but we plan to make this rock solid and extend the feature set (while keeping the UI as minimal as possible). We hope Prose + Jekyll will provide a simple, efficient alternative to traditional CMSs that require web and database servers to host content.


## Contributors

- [Saman Bemel Benrud](https://github.com/samanpwbb) - Design
- [Michael Aufreiter](https://github.com/michael) - Code

Now that you're here, why not start contributing as well? :)


## Change Log

**0.4.0** -  *July 30 2012*

- Submit patches with suggestions for repositories you don't have write access to.

**0.3.0** -  *July 23 2012*

- Implemented commit messages + review changes workflow.
- Search for files within a repository as you type.
- After selecting a repo default branch is loaded and you can switch using the breadcrumbs.
- Better editing expierence
- Fixes dozens of issues

**0.2.0** -  *July 6 2012*

Added support for organizations and user profiles. Users can manipulate the full filepath now, allowing them to organize their files in subfolders. Fixes ~ 40 reported issues. Also, updated CodeMirror and added syntax highlighting for some popular programming languages.

**0.1.1** -  *June 27 2012*

Improved error handling. Upgraded CodeMirror to version 2.3 and added basic support for [Github Flavored Markdown](http://github.github.com/github-flavored-markdown/).

**0.1.0** - *June 25 2012*

Initial release.
