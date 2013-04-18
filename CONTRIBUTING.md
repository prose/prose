# Contributing to prose

Thanks for thinking of contributing to prose! Whether you are here to report
issues or develop on the project the sections below provide
outlines on how to get started.

## Reporting Issues

Here's a quick list of things to consider before submitting an issue:

* Please [search for your issue before filing it: many bugs and improvements have already been reported](https://github.com/prose/prose/issues/search?q=)
* Write specifically what browser this is reported to be found in
* Write out the steps to replicate the error: when did it happen? What did you expect to happen? What happened instead?
* Please keep bug reports professional and straightforward: trust us, we share your dismay at software breaking.
* For bonus points, [enable web developer extensions](http://macwright.org/enable-web-developer-extensions/) and report the
  Javascript error message.

And when in doubt, be over-descriptive of the bug and how you discovered it.


## Building / Installing

prose uses [Browserify](browserify.org) with [Make](http://www.gnu.org/software/make/)
to manage dependencies and build. Development also requires you
have [node.js](http://nodejs.org) installed.

To get started:

- [Install node.js](http://nodejs.org/). 'Install' will download a package for
your OS.
- Go to the directory where you have checked out `prose`
- Run `npm install`
- Run `make`
- To run prose with authentication you'll need to add an `oauth.json` file
to the root directory with the following contents:

``` js
{
  "clientId": "c602a8bd54b1e774f864",
  "gatekeeperUrl": "http://prose-gatekeeper.herokuapp.com"
}
```

Note that you should not commit this file to a remote repo or along with a pull
request.
- If you have python handy, from the project root run `python -m SimpleHTTPServer`
to start a server and run the site locally. By default prose will be set up 
on [http://localhost:8000](http://localhost:8000).

For any changes you make to the codebase, you'll need to run `make` to package
code into a minified `prose.min.js` and see changes.

__ProTip:__ You may want to install `watch` so you can run `watch make` without
needing to execute `make` on every change.
