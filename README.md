# todotxt.js

master: [![Build Status][travisci-img-master]][travisci] develop: [![Build Status][travisci-img-develop]][travisci]

A JavaScript parser and container for the TODO files in the [todo.txt format][format].

## From CLI to JavaScript

A mapping of what to do for each CLI command (and an implementation status).

-   **Multiple lists** - multiple in-memory lists are supported through multiple
    instances of `TodoList`. Todo: Ability to persist and retrieve from a file.
-   `add|a` - Implemented. `TodoList.add(task)`
-   `addm` - Will be implemented as a file reader. Call `TodoList.add` lots.
-   `addto` - Call `TodoList.add` on the correct `TodoList` instance.
-   `append|app` - Implemented: `TodoList.append(id, text)`, `TodoItem.append(text)`.
-   `archive` - Todo with file management.
-   `deduplicate` - Todo
-   `del|rm` - Todo
-   `depri|dp` - Todo
-   `do` - Implemented: `TodoList.findById(id).complete()`. Todo: `TodoList.do(1, 2, 3)`
-   `list|ls` - Implemented: `TodoList.list(term, priority, case_sensitive, completed)`. Todo: helpers/aliases (below)
-   `listall|lsa` - Current: `TodoList.list(null, null, null, true)` Todo: `TodoList.listAll(term, priority, case)` todo
-   `listcon|lsc` - Todo. (Current: `TodoList.indexes.context`)
-   `listproj|lsprj` - Todo. (Current: `TodoList.indexes.project`)
-   `move` - Todo with file management.
-   `prepend|prep` - Implemented: `TodoList.prepend(id, text)`, `TodoItem.prepend(text)`.
-   `pri|p` - `TodoItem.priority = "A"`, `TodoList.findById(1).priority = "A"`
-   `replace` - `TodoList.findById(1).parse("New task text")`. Will alias.
-   `report` - Todo.

## Support

This library aims to be both `<script>` and module compatible (so you can use it
with node/rhino). I *think* it's CommonJS compatible at the moment - if it's not
and you know how to make it so - please send a PR! Finding good information on
this has been difficult.

## Testing

Tested with Jasmine - these can be run using SpecRunner.html which runs them in
the browser, or by node using [node-jasmine][node-jasmine] (`npm test`).

## About

This project does things quite similarly to [jsTodoTxt][jsTodoTxt]; it also:

-   Has a list container that allows for actions on the list (such as add, append, pri, sorting etc.) from the CLI tool.
-   Should be both client and server compatible.
-   Contains an EBNF notation.

> Why not fork? I wanted to have a bash at building a JS lib from scratch :)

Primarily developed for a [todotxt-demo][todotxt-demo] app.

[format]: https://github.com/ginatrapani/todo.txt-cli/wiki/The-Todo.txt-Format
[jsTodoTxt]: https://github.com/jmhobbs/jsTodoTxt
[todotxt-demo]: https://github.com/rmasters/todotxt-demo
[travisci-img-master]: https://travis-ci.org/rmasters/todotxt.js.png?branch=master
[travisci-img-develop]: https://travis-ci.org/rmasters/todotxt.js.png?branch=develop
[travisci]: https://travis-ci.org/rmasters/todotxt.js
[node-jasmine]: https://npmjs.org/package/jasmine-node
