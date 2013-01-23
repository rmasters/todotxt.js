if (typeof jasmine == "undefined") {
    jasmine = require('jasmine-node');
}
if (typeof todotxt == "undefined") {
    todotxt = require('../index.js');
}

describe("TodoItem", function() {
    var item;

    beforeEach(function() {
        item = new todotxt.TodoItem();
    });

    it ("should have an empty initial state", function() {
        expect(item.id).toBeNull();
        expect(item.text).toBeNull();
        expect(item.priority).toBeNull();
        expect(item.createdAt).toEqual(jasmine.any(Date));
        expect(item.contexts).toEqual(jasmine.any(Array));
        expect(item.contexts.length).toEqual(0);
        expect(item.projects).toEqual(jasmine.any(Array));
        expect(item.projects.length).toEqual(0);
        expect(item.metadata).toEqual(jasmine.any(Object));
    });

    it("should reset tasks on each parse", function() {
        item.id = -1;
        expect(item.id).toEqual(-1);
        item.parse("");
        expect(item.id).toBeNull();
    });

    it ("should accept simple text", function() {
        item.parse("Get milk");
        expect(item.text).toEqual("Get milk");
    });

    it ("should recognise a completed task", function() {
        item.parse("x 2013-01-20 Write a test for completed tasks");
        expect(item.completedAt).toEqual(jasmine.any(Date));
        expect(item.completedAt.getFullYear()).toEqual(2013);
        expect(item.completedAt.getMonth()).toEqual(1-1); // getMonth() is 0-indexed, lol programming
        expect(item.completedAt.getDate()).toEqual(20);
        expect(item.text).toEqual("Write a test for completed tasks");
        expect(item.isCompleted()).toBeTruthy();
    });

    it ("should detect a priority", function() {
        item.parse("(A) Panic-buy 18 litres of milk"); // It's snowing today
        expect(item.priority).toEqual('A');
        expect(item.text).toEqual("Panic-buy 18 litres of milk");
    );

    it ("should not allow both a completion mark and a priority", function() {
        // By happen-stance the regex accepts the completion date first, and sets priority to null
        // as it is a (completed|priority) regex. I think this is a better outcome than rejecting the
        // task completely so we'll check completedAt is set and priority is null.
        item.parse("x 2013-01-20 (A) Urgently complete that task I already completed");

        expect(item.completedAt).toEqual(jasmine.any(Date));
        expect(item.completedAt.getFullYear()).toEqual(2013);
        expect(item.completedAt.getMonth()).toEqual(1-1);
        expect(item.completedAt.getDate()).toEqual(20);
        expect(item.isCompleted()).toBeTruthy();

        expect(item.priority).toBeNull();
    });

    it ("should detect a created date", function() {
        item.parse("2013-01-20 Push this library to github");
        expect(item.createdAt).toEqual(jasmine.any(Date));
        expect(item.createdAt.getFullYear()).toEqual(2013);
        expect(item.createdAt.getMonth()).toEqual(1-1);
        expect(item.createdAt.getDate()).toEqual(20);

        expect(item.text).toEqual("Push this library to github");
    });

    it ("should detect embedded projects", function() {
        item.parse("Finish +jasmine tests for +todotxt.js");
        expect(item.projects.length).toEqual(2);
        expect(item.projects[0]).toEqual("jasmine");
        expect(item.projects[1]).toEqual("todotxt.js");

        item.parse("Work out the answer to 5+3 or 8+9");
        expect(item.projects.length).toEqual(0);

        item.parse("Invalidly named +project- +project'");
        expect(item.projects.length).toEqual(0);

        item.parse("+multiple +consecutive +projects +to +trip +up +regex");
        expect(item.projects.length).toEqual(7);
    });

    it ("should detect embedded contexts", function() {
        item.parse("Work @home this week @plans");
        expect(item.contexts.length).toEqual(2);
        expect(item.contexts[0]).toEqual("home");
        expect(item.contexts[1]).toEqual("plans");

        /**
         *  Debate to be had as to whether to use:
         *   (\s|^)@\S+[A-Za-z0-9_]
         * which allows consecutive contexts/projects but also allows tags to
         * end with non-alphanumeric+underscore (against todotxt spec); or
         *   @\S+[A-Za-z0-9_](\s|$)
         * which doesn't but prevents emails from matching as contexts.
         *
         * @todo Because of this, skip this assertion for now.
        item.parse("Email ross@localhost.com today");
        expect(item.contexts.length).toEqual(0);
         */

        item.parse("Invalidly named @context, and @context$");
        expect(item.contexts.length).toEqual(0);

        item.parse("@multiple @consecutive @contexts @to @trip @up @regex");
        expect(item.contexts.length).toEqual(7);
    });

    it ("should allow for metadata", function() {
        item.parse("Some bug assigned:ross severity:high");
        expect('assigned' in item.metadata).toBeTruthy();
        expect(item.metadata['assigned']).toEqual("ross");

        expect('severity' in item.metadata).toBeTruthy();
        expect(item.metadata['severity']).toEqual("high");
    });

    it ("should be able to cope with many combinations", function() {
        item.parse("(B) 2013-01-20 Move @dev +dependencies to composer.json +cleanup @work");
        expect(item.contexts).toEqual(['dev', 'work']);
        expect(item.projects).toEqual(['dependencies', 'cleanup']);
        expect(item.createdAt.toDateString()).toEqual('Sun Jan 20 2013');
        expect(item.priority).toEqual('B');
        expect(item.text).toEqual('Move @dev +dependencies to composer.json +cleanup @work')
    });

    it ("should be able to reproduce itself as a line of text", function() {
        // Tasks without a creation date will have one on export
        var today = new Date();

        // YYYY-MM-DD
        today = today.getFullYear() + '-' + (today.getMonth() < 9 ? '0' : '') + (today.getMonth()+1) + '-' + today.getDate();

        item = item.parse("Run unit tests");
        expect(item.toString()).toEqual(today + " Run unit tests");

        item = item.parse("(B) 2012-12-11 Push +todotxt.js to @github");
        expect(item.toString()).toEqual("(B) 2012-12-11 Push +todotxt.js to @github");

        item = item.parse("x 2013-01-20 2012-12-11 +Launch release 3.1");
        expect(item.toString()).toEqual("x 2013-01-20 2012-12-11 +Launch release 3.1");
    });

    it ("should be able to append text to itself", function() {
        item = item.parse("Hello");
        item = item.append("World");
        expect(item.text).toEqual("Hello World");
    });

    it ("should be able to prepend text to itself", function() {
        item = item.parse("World");
        item = item.prepend("Hello");
        expect(item.text).toEqual("Hello World");
    });
});
