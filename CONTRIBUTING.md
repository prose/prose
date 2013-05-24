# Contributing to prose

Thanks for thinking of contributing to prose! Whether you are here to report
issues or develop on the project the sections below provide
outlines on how to get started.

## Reporting Issues

Here's a quick list of things to consider before submitting an issue:

* Please [search for your issue before filing it: many bugs and improvements have already been reported](https://github.com/prose/prose/issues/search?q=)
* Write specifically what browser this is reported to be found in
* Write out the steps to replicate the error: when did it happen? What did you expect to happen? What happened instead?
* Please keep bug reports professional and straightforward: trust us, we share your dismay of software breaking.
* For bonus points, [enable web developer extensions](http://macwright.org/enable-web-developer-extensions/) and report the
  Javascript error message.

And when in doubt, be over-descriptive of the bug and how you discovered it.

## Submitting Pull Requests

All pull requests should be proposed to the [master](https://github.com/prose/prose/tree/master) branch. the `gh-pages` branch manages rebuilds to the server.


## Building / Installing

prose uses [Browserify](http://browserify.org) with [Make](http://www.gnu.org/software/make/)
to manage dependencies and build. Development also requires you
have [node.js](http://nodejs.org) installed.

To get started:

1. [Install node.js](http://nodejs.org/). 'Install' will download a package for
your OS.
2. Go to the directory where you have checked out `prose`
3. Run `npm install`
4. Run `make`
5. To run prose with authentication locally, a `oauth.json` file is required to the
to the root directory. when you run `make` this file is created automatically. 

__Note__ You should not commit the `oauth.json` file to a remote repo or along with a pull
request.

Finally, If you have python handy, from the project root run `python -m SimpleHTTPServer`
to start a server and run the site locally. By default prose will be set up 
on [http://localhost:8000](http://localhost:8000).

For any changes you make to the codebase, you'll need to run `make` to package
code into a minified `prose.min.js` and see changes.

__ProTip:__ You may want to install `watch` so you can run `watch make` without
needing to execute `make` on every change.

## Code Style

### Javascript

We use the [Airbnb style for Javascript](https://github.com/airbnb/javascript) with a few differences:

No aligned `=`, no aligned arguments, spaces are either indents or the 1
space between expressions. No hard tabs, ever. Javascript code should pass
through [JSHint](http://www.jshint.com/) with no warnings.

### CSS & Markup
- Single Quotes
- 2 spaces soft tabs

for CSS, use classes to target elements

