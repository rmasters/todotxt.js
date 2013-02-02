/**
 * todotxt.js 0.0.1
 * @overview A parser/generator for the todo.txt format
 * @project todotxt
 * @author Ross Masters <ross@rossmasters.com>
 * @version 0.0.1
 * @license todotxt.js may be freely distributed under the MIT license
 * @copyright Ross Masters 2013
 */

var todotxt = (function () {
    "use strict";

    /**
     * @class
     * @classdesc An individual task
     * @constructor
     * @param {String} [item=undefined] - The task as a line of text
     */
    function TodoItem(item) {
        // Core TaskLine regex parsing (completed, priority, created and task)
        var completed_ptn = /x ([1-2][0-9]{3}\-[0-1][0-9]\-[0-3][0-9])/,
            priority_ptn = /\(([A-Z])\)/,
            created_ptn = /([1-2][0-9]{3}\-[0-1][0-9]\-[0-3][0-9])/;
        this.core_ptn = new RegExp('^(' + completed_ptn.source + '\\s|' + priority_ptn.source + '\\s)?(' + created_ptn.source + '\\s)?(.+)');

        // Embedded task metadata parsing
        this.project_ptn = /\+(\S+[_A-Za-z0-9])(\s|$)/g;
        this.context_ptn = /@(\S+[_A-Za-z0-9])(\s|$)/g;
        this.metadata_ptn = /(\S+[_A-Za-z0-9]):(\S+)(\s|$)/g;

        this.reset();
        if (undefined !== item) {
            return this.parse(item);
        }
    }
    /**
     * Reset the item's properties
     * @private
     * @return {TodoItem}
     */
    TodoItem.prototype.reset = function () {
        this.id = null;
        this.text = null;
        this.priority = null;
        this.completedAt = false;
        this.createdAt = new Date();
        this.contexts = [];
        this.projects = [];
        this.metadata = {};

        return this;
    };

    /**
     * Parse a line into it's parts
     * @param {String} line
     * @return {TodoItem}
     */
    TodoItem.prototype.parse = function (line) {
        var res,
            projects,
            contexts,
            metadata,
            prj,
            ctx,
            md;

        this.reset();

        line = line.trim();
        if (line.length === 0) {
            return this;
        }

        res = this.core_ptn.exec(line);
        this.completedAt = (undefined !== res[2]) ? new Date(res[2]) : this.completedAt;
        this.priority = (undefined !== res[3]) ? res[3] : this.priority;
        this.createdAt = (undefined !== res[5]) ? new Date(res[5]) : this.createdAt;
        this.text = res[6].trim();

        function getMatches(regex, input) {
            var match,
                matches = [],
                m,
                i;

            while ((match = regex.exec(input)) !== null) {
                m = [];
                for (i = 0; i < match.length; i += 1) {
                    if (parseInt(i, 10) === i) {
                        m.push(match[i]);
                    }
                }
                matches.push(m);
            }
            return matches;
        }

        // Capture projects
        projects = getMatches(this.project_ptn, this.text);
        for (prj = 0; prj < projects.length; prj += 1) {
            if (this.projects.indexOf(projects[prj][1]) === -1) {
                this.projects.push(projects[prj][1]);
            }
        }

        // Capture contexts
        contexts = getMatches(this.context_ptn, this.text);
        for (ctx = 0; ctx < contexts.length; ctx += 1) {
            if (this.contexts.indexOf(contexts[ctx][1]) === -1) {
                this.contexts.push(contexts[ctx][1]);
            }
        }

        // Capture metadata
        // Subsequent metadata overwrites the previous value
        metadata = getMatches(this.metadata_ptn, this.text);
        for (md = 0; md < metadata.length; md += 1) {
            this.metadata[metadata[md][1]] = metadata[md][2];
        }

        return this;
    };

    /**
     * Complete a task
     * @return {TodoItem}
     */
    TodoItem.prototype.complete = function () {
        this.completedAt = new Date();
        return this;
    };

    /**
     * Is the task complete?
     * @return {Boolean} - True if a completion date is set.
     */
    TodoItem.prototype.isCompleted = function () {
        return this.completedAt instanceof Date;
    };

    /**
     * Get the task line
     * @param {Boolean} [with_id=false] Include the task id in output
     * @return {String} Task as a string
     */
    TodoItem.prototype.toString = function (with_id) {
        var date_str = function (date) {
            var month = date.getMonth() + 1;
            return date.getFullYear() + '-' + (month < 10 ? '0' : '') + month + '-' + date.getDate();
        };

        return (with_id ? this.id + ': ' : '') +
            (this.completedAt ? 'x ' + date_str(this.completedAt) + ' ' : '') +
            (this.priority ? '(' + this.priority + ') ' : '') +
            (this.createdAt ? date_str(this.createdAt) + ' ' : '') +
            this.text;
    };

    /**
     * Append to the .text of the item with a preceding space
     * @param {String} text - Text to append
     * @return {TodoItem}
     */
    TodoItem.prototype.append = function (text) {
        this.text += " " + text;
        return this;
    };

    /**
     * Prepend to the .text of the item with a preceding space
     * @param {String} text - Text to prepend
     * @return {TodoItem}
     */
    TodoItem.prototype.prepend = function (text) {
        this.text = text + " " + this.text;
        return this;
    };

    /**
     * Deprioritise the item
     * @return {TodoItem}
     */
    TodoItem.prototype.deprioritise = function () {
        this.priority = null;
        return this;
    };

    /**
     * @class
     * @classdesc A list of task items
     * @constructor
     */
    function TodoList() {
        // Task items
        this.items = [];
        // Mappings of task IDs, projects and contexts to array indexes of this.items
        this.indexes = {
            'id': {},
            'project': {},
            'context': {}
        };
        // Filename, or false for in-memory
        this.filename = false;
    }

    /**
     * Add an item to the list
     * If the item already has an ID it will be overwritten.
     * @param {TodoItem|String} item - A task to add to the list
     * @return {TodoItem|Boolean} - False if the item was empty
     */
    TodoList.prototype.add = function (item) {
        if (!(item instanceof TodoItem)) {
            item = new TodoItem(item);
        }

        if (null === item.text || item.text.length === 0) {
            return false;
        }

        var id = this.items.push(item);
        this.items[id - 1].id = id;
        this.indexes.id[id] = id - 1;
        this.index(this.items[id - 1]);

        this.sort();

        return this.items[this.indexes.id[id]];
    };
    
    /**
     * Append to an item
     * @param {Integer} id - Task item id to append to
     * @param {String} text - Text to append to the task
     * @return {TodoItem|Boolean} - Task or false if not found
     */
    TodoList.prototype.append = function (id, text) {
        var item = this.findById(id);

        if (false !== item) {
            return item.append(text);
        } else {
            return false;
        }
    };
    
    /**
     * Prepend text to a task (with a trailing space)
     * @param {Integer} id - Task id
     * @param {String} text - Text to prepend
     * @return {TodoItem|Boolean} - Task or false if not found
     */
    TodoList.prototype.prepend = function (id, text) {
        var item = this.findById(id);

        if (false !== item) {
            return item.prepend(text);
        } else {
            return false;
        }
    };    
    
    /**
     * Deduplicate a list
     * @return {TodoList}
     */
    TodoList.prototype.deduplicate = function () {
        var i_text,
            changed = false;

        do {
            changed = false;
            // For each item, check if the lowercase .text matches another
            for (var i = 0; i < this.items.length; i++) {
                // Lowercased
                i_text = this.items[i].text.toLocaleLowerCase();

                // For each item, if it matches, remove it
                for (var j = 0; j < this.items.length; j++) {
                    // Skip if it's the same item
                    if (this.items[i].id === this.items[j].id) {
                        continue;
                    }

                    // Remove if it matches (and restart as the list will be
                    // altered)
                    if (i_text === this.items[j].text.toLocaleLowerCase()) {
                        this.remove(this.items[j].id);
                        changed = true;
                        break;
                    }
                }

                if (changed) {
                    break;
                }
            }
        } while(changed);

        return this;
    };
   
    /**
     * Remove an item from the list
     * @param {Integer} id - Task item id to remove
     * @return {TodoItem|Boolean} - Task or false if not found
     */
    TodoList.prototype.remove = function (id) {
        var item = this.findById(id);
        if (item) {
            // Remove from items array (and re-index by ID)
            this.items.splice(this.indexes.id[id], 1);
            this.reindex()
            // De-index
            this.deindex(item);
            item.id = null;
            return item;
        } else {
            return false;
        }
    };
    
    /**
     * Complete one or more items
     * @param {Integer} [...] - Task item id(s) to complete
     * @return {TodoList}
     */
    TodoList.prototype.complete = function () {
        var item;

        for (var i = 0; i < arguments.length; i++) {
            item = this.findById(arguments[i]);
            if (false !== item) {
                item.complete();
            }
        }

        return this;
    };
    
    /**
     * List all incomplete items in the list
     * @param {String|Array} [term=[]] - Terms to match against
     * @param {String|Array} [priority=[]] - Priorities the items should have
     * @param {Boolean} [case_sensitive=false] - If terms are case sensitive
     * @param {Boolean} [completed=false] - Include completed tasks
     * @return {Array} - Item list
     */
    TodoList.prototype.list = function (term, priority, case_sensitive, completed) {
        var terms,
            priorities,
            match,
            p,
            start,
            end,
            c,
            items,
            i,
            matchTerms,
            t,
            hasPriority;

        // Term-search case sensitivity (default insensitive)
        case_sensitive = (case_sensitive !== undefined) ? !!case_sensitive : false;

        // Whether completed tasks are included
        completed = (completed !== undefined) ? !!completed : false;

        // Build a list of terms to check against
        terms = [];
        if (undefined !== term) {
            if (typeof term === 'string') {
                terms.push(term);
            } else if (term instanceof Array) {
                terms.concat(term);
            }
        }

        // Build a list of matching priorities to check against
        priorities = [];
        if (undefined !== priority) {
            if (priority instanceof Array) {
                // A list of valid priorities (priority=[A,B,C])
                for (p = 0; p < priority.length; p += 1) {
                    if (null !== /^[A-Za-z]$/.exec(priority[p])) {
                        priorities.push(priority[p].toLocaleUpperCase());
                    } else {
                        throw "Invalid property " + priority[p];
                    }
                }
            } else if (null !== (match = /^([A-Za-z])$/.exec(priority))) {
                // Check for single priority match (priority=A)
                priorities.push(match[1]);
            } else if (null !== (match = /^([A-Z])-([A-Z])$/.exec(priority))) {
                // A range of valid priorities (priority=A-D)
                start = match[1].toLocaleUpperCase();
                end = match[2].toLocaleUpperCase();
                // Flip if we have something like C-A
                if (start.localeCompare(end) === 1) {
                    start = match[2].toLocaleUpperCase();
                    end = match[1].toLocaleUpperCase();
                }

                for (c = start.charCodeAt(0); c <= end.charCodeAt(0); c += 1) {
                    priorities.push(String.fromCharCode(i));
                }
            }
        }

        // Find matching items
        items = [];
        for (i = 0; i < this.items.length; i += 1) {
            if (!this.items[i].completedAt || completed) {
                // Require a match against all terms
                matchTerms = true;
                for (t = 0; t < terms.length; t += 1) {
                    if (!this.checkTerm(terms[t], this.items[i], case_sensitive)) {
                        matchTerms = false;
                        break;
                    }
                }

                // Require at least one priority match
                hasPriority = true;
                if (matchTerms && priorities.length > 0) {
                    hasPriority = false;
                    for (p = 0; i < priorities.length; p += 1) {
                        if (this.items[i].priority === p) {
                            hasPriority = true;
                            break;
                        }
                    }
                }

                if (hasPriority && matchTerms) {
                    items.push(this.items[i]);
                }
            }
        }

        this.sort(items);

        return items;
    };
    
    /**
     * List all tasks (including completed tasks)
     * @param {String|Array} [term=[]] - Terms to match against
     * @param {String|Array} [priority=[]] - Priorities the items should have
     * @param {Boolean} [case_sensitive=false] - If terms are case sensitive
     */
    TodoList.prototype.listAll = function (term, priority, case_sensitive) {
        return this.list(term, priority, case_sensitive, true);
    };
    
    /**
     * List contexts of task items
     * @return {Array}
     */
    TodoList.prototype.contexts = function () {
        return Object.keys(this.indexes.context);
    };
    
    /**
     * List projects of task items
     * @return {Array}
     */
    TodoList.prototype.projects = function () {
        return Object.keys(this.indexes.project);
    };
    
    /**
     * Deprioritise an item
     * @param {Integer} id - Task item id to deprioritise
     * @return {TodoItem|Boolean} - Task or false if not found
     */
    TodoList.prototype.deprioritise = function (id) {
        var item = this.findById(id);
        if (false !== item) {
            return item.deprioritise();
        } else {
            return item;
        }
    };
    
    /**
     * Prioritise a task
     * @param {Integer} id - Task id
     * @param {String} priority - Priority to set
     * @return {TodoItem|Boolean} - Task or false if not found
     */
    TodoList.prototype.prioritise = function (id, priority) {
        var item = this.findById(id);
        if (false !== item) {
            return item.priority = priority;
        } else {
            return item;
        }
    };
    
    /**
     * Replace the text of an item
     * @param {Integer} id - Task id
     * @param {String} text - New task text
     * @return {TodoItem|Boolean} - Task or false if not found
     */
    TodoList.prototype.replace = function (id, task) {
        var item = this.findById(id);

        if (false !== item) {
            return item.parse(task);
        } else {
            return item;
        }
    };
    
    /**
     * Generate a report on tasks
     * @todo
     */
    TodoList.prototype.report = function () {
    };
    
    /**
     * Ensure an item's id, context and project are indexed
     * @private
     * @property {TodoItem} item - Item to index
     */
    TodoList.prototype.index = function (item) {
        var prj,
            p,
            ctx,
            c;

        // Check item has an id
        if (null === item.id) {
            item.id = this.items.length;
        }

        // Check item id is in id->{items[idx]} index
        if (!this.indexes.id.hasOwnProperty(item.id)) {
            this.indexes.id[item.id] = this.items.indexOf(item);
        }

        // Check item's projects are in project->{items[idx]} index
        for (p = 0; p < item.projects.length; p += 1) {
            prj = item.projects[p];
            if (!this.indexes.project.hasOwnProperty(prj)) {
                this.indexes.project[prj] = [];
            }
            if (this.indexes.project[prj].indexOf(item.id) === -1) {
                this.indexes.project[prj].push(item.id);
            }
        }

        // Check item's contexts are in context->{items[idx]} index
        for (c = 0; c < item.contexts.length; c += 1) {
            ctx = item.contexts[c];
            if (!this.indexes.context.hasOwnProperty(ctx)) {
                this.indexes.context[ctx] = [];
            }
            if (this.indexes.context[ctx].indexOf(item.id) === -1) {
                this.indexes.context[ctx].push(item.id);
            }
        }
    };

    /**
     * Re-index the list by ID
     * @return {TodoList}
     */
    TodoList.prototype.reindex = function() {
        this.indexes.id = {};
        for (var i = 0; i < this.items.length; i++) {
            this.indexes.id[this.items[i].id] = i;
        }

        return this;
    };

    /**
     * De-index an item
     * @param {TodoItem} item - Item to de-index
     * @return {TodoList}
     */
    TodoList.prototype.deindex = function(item) {
        var prj,
            prj_idx,
            ctx,
            ctx_idx;

        // Remove the id->list_index entry
        if (this.indexes.id.hasOwnProperty(item.id)) {
            delete this.indexes.id[item.id];
        }

        // Remove project->id[] indexes for this item
        for (prj = 0; prj < item.projects.length; prj += 1) {
            prj_idx = this.indexes.project[item.projects[prj]].indexOf(item.id);
            if (prj_idx !== -1) {
                this.indexes.project[item.projects[prj]].splice(prj_idx, 1);

                // Remove project index when no tasks left that use it
                if (Object.keys(this.indexes.project[item.projects[prj]]).length === 0) {
                    delete this.indexes.project[item.projects[prj]];
                }
            }
        }

        // Remove context->id[] indexes for this item
        for (ctx = 0; ctx < item.contexts.length; ctx += 1) {
            ctx_idx = this.indexes.context[item.contexts[ctx]].indexOf(item.id);
            if (ctx_idx !== -1) {
                this.indexes.context[item.contexts[ctx]].splice(ctx_idx, 1);

                // Remove context index when no tasks left that use it
                if (Object.keys(this.indexes.context[item.contexts[ctx]]).length === 0) {
                    delete this.indexes.context[item.contexts[ctx]];
                }
            }
        }

        return this;
    };

    /**
     * Check if a term definition matches a task
     * @protected
     * @param {Array|String} term - A list of keywords to match in task.text
     * @param {TodoItem} task - Task to match against
     * @param {Boolean} [case_sensitive=false] - Make a case sensitive check
     * @return {Boolean} Whether the task is matched
     *
     * This is similar to the term matching in todotxt-cli:
     * - Terms prefixed with - (minus, dash) require tasks to not
     *   contain them.
     * - Terms prefixed with @ or + match contexts and projects
     *   respectively. These can also be prefixed with - (minus) to
     *   exclude contexts or projects.
     * - Terms are combined with AND by default.
     * - Terms that are an array of terms are combined with OR. E.g.:
     *   a term `['python', 'java', '@tests']` matches tasks containing
     *   'python' or 'java' or with the context '@tests'.
     */
    TodoList.prototype.checkTerm = function (term, task, case_sensitive) {
        var res,
            t,
            not;

        // Term-search case sensitivity (default insensitive)
        case_sensitive = (case_sensitive !== undefined) ? !!case_sensitive : false;

        if (term instanceof Array) {
            // A list of terms, if one of them returns true, return true overall
            res = false;
            for (t = 0; t < term.length; t += 1) {
                if (this.checkTerm(term[t], task)) {
                    res = true;
                    break;
                }
            }
        } else {
            term = term.trim();

            not = false;
            if (term.length > 0 && term.substring(0, 1) === '-') {
                not = true;
                term = term.substring(1);
            }

            if (term.length === 0) {
                res = true;
            } else {
                // If term is not present return not, otherwise !not
                if (!case_sensitive) {
                    res = (task.text.indexOf(term) === -1) ? not : !not;
                } else {
                    res = (task.text.toLocaleLowerCase().indexOf(term.toLocaleLowerCase()) === -1) ? not : !not;
                }
            }
        }
        return res;
    };

    /**
     * Sort a list of items in-place by priority and then alphabetically
     * @param {Array} [items=this.items]
     * @return {Array}
     */
    TodoList.prototype.sort = function (items) {
        var changed,
            i,
            tmp;

        if (items === undefined) {
            items = this.items;
        }

        changed = false;
        do {
            changed = false;
            for (i = 0; i < items.length - 1; i += 1) {
                // Compare toString output which naturally puts priority items at the top
                if (items[i].toString().toLocaleLowerCase().localeCompare(items[i + 1].toString().toLocaleLowerCase()) > 0) {
                    tmp = items[i + 1];
                    items[i + 1] = items[i];
                    items[i] = tmp;

                    // Update indexes
                    this.indexes.id[items[i].id] = i;
                    this.indexes.id[items[i + 1].id] = i + 1;

                    changed = true;
                }
            }
        } while (changed);

        return items;
    };

    /**
     * Parse a new-line separated list of tasks
     * @param {String} tasks_src - \n-separated list of tasks
     * @return {TodoList}
     */
    TodoList.prototype.parse = function (tasks_src) {
        var tasks = tasks_src.replace("\r", "").split("\n"),
            task;
        for (task = 0; task < tasks.length; task += 1) {
            this.add(tasks[task]);
        }
        return this;
    };

    /**
     * Find an item by id (number added)
     * @param {Integer} id - Item id
     * @return {TodoItem|Boolean} False if item not found
     */
    TodoList.prototype.findById = function (id) {
        if (this.indexes.id.hasOwnProperty(id)) {
            return this.items[this.indexes.id[id]];
        }

        return false;
    };

    /**
     * Get the filename the list was parsed from, or 'memory'.
     * @return {String}
     */
    TodoList.prototype.source = function () {
        return this.filename || 'memory';
    };

    return {
        'TodoList': TodoList,
        'TodoItem': TodoItem
    };
}(this));

if (typeof module !== "undefined" && module.exports) {
    module.exports = exports = todotxt;
} else if (typeof exports !== "undefined") {
    exports = todotxt;
}
