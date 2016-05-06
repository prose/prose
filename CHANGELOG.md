## 1.1.21

- No longer include unset metadata fields in frontmatter https://github.com/prose/prose/pull/958
- Refactor build scripts, start using travis-ci.org to deploy https://github.com/prose/prose/pull/949
- Fix bug where select elements could accept multiple values, where multiselects would show `null` when there was no value, and placeholders in select elements https://github.com/prose/prose/pull/954
- Fix bug where hidden metadata fields with no defaults would crash https://github.com/prose/prose/pull/955
- Fix session storage bug where save would not properly get called https://github.com/prose/prose/pull/956
- Started a deployment doc that currently includes Gatekeeper https://github.com/prose/prose/pull/957

## 1.1.20

- Upgrade CodeMirror version to v5.11, include it using NPM https://github.com/prose/prose/pull/943
- Use node 4.2 https://github.com/prose/prose/pull/943
- Upgrade Mocha, Mocha-phantomjs, and phantomjs versions https://github.com/prose/prose/pull/943
- Fix how list button works when inserting new markdown https://github.com/prose/prose/pull/926

## 1.1.19

- Improve `npm start` script https://github.com/prose/prose/pull/920
- Fixes issue where yaml parser would keep inserting extra lines at the top of the document https://github.com/prose/prose/pull/919
- Toggle preview and edit modes with CTRL-Enter https://github.com/prose/prose/pull/875
- Increase width of editor https://github.com/prose/prose/pull/927
- Increase width of metadata editor https://github.com/prose/prose/pull/933
- Use SASS to decouple CSS assets https://github.com/prose/prose/pull/942
- Stop textarea meta elements from endlessly escaping characters https://github.com/prose/prose/pull/941

## 1.1.18

- Implement CSV editing https://github.com/prose/prose/pull/911

*Note, due to many reasons we didn't record changelogs for many versions. If you have a specific question and can't find the answer from the commit history, please open an issue. Thanks!*

## 1.1.5

- Adds basic testing and fixes includes with more than one argument.
Generates source maps for prose.js and test/index.js
https://github.com/prose/prose/pull/692

## 1.1.4

- Update to use jekyll style includes for live previews
https://github.com/prose/prose/pull/651

## 1.1.3

- Fixes live previews https://github.com/prose/prose/pull/648

## 1.1.0

- Add support for ignore in YAML config
https://github.com/prose/prose/pull/632
