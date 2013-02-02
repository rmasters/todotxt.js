if (typeof jasmine == "undefined") {
    jasmine = require('jasmine-node');
}
if (typeof todotxt == "undefined") {
    todotxt = require('../index.js');
}

describe("TodoList", function() {
    var list;
    var item;

    beforeEach(function() {
        list = new todotxt.TodoList();
        item = new todotxt.TodoItem("Task");
    });

    it("should be able to add an item", function() {
        expect(list.items.length).toEqual(0);
        list.add(item);
        expect(list.items.length).toEqual(1);
    });

    it ("should assign ids to items", function() {
        var itemA = list.add(new todotxt.TodoItem("Task"));
        expect(itemA.id).toEqual(1);

        var itemB = list.add(new todotxt.TodoItem("Task"));
        expect(itemB.id).toEqual(2);

    });

    it("should have the default filename as 'in memory'", function() {
        expect(list.filename).toBeFalsy();
        expect(list.source()).toEqual('memory');
    });

    it ("should index items by id", function() {
        var itemA = list.add(new todotxt.TodoItem()),
            itemB = list.add(new todotxt.TodoItem()),
            itemC = list.add(new todotxt.TodoItem());

        expect(list.findById(1)).toEqual(itemA);
        expect(list.findById(2)).toEqual(itemB);
        expect(list.findById(3)).toEqual(itemC);
        expect(list.findById(4)).toBeFalsy();
    });

    it ("should update item-id-index while sorting", function() {
        var itemA = list.add(new todotxt.TodoItem("Item A"));
        var itemB = list.add(new todotxt.TodoItem("(B) Item B"));
        var itemC = list.add(new todotxt.TodoItem("(A) Item C"));

        expect(list.items.length).toEqual(3);
        list.sort();

        expect(list.findById(1).id).toEqual(itemA.id);
        expect(list.findById(2).id).toEqual(itemB.id);
        expect(list.findById(3).id).toEqual(itemC.id);
    });

    it ("should parse multiple lines of tasks", function() {
        var file = "2013-01-01 Make New Year Resolutions +NYRs\n" +
            "2013-01-02 Attempt to stick to +NYRs\n";
        list.parse(file)
        expect(list.items.length).toEqual(2);
    });

    it ("should append text to items", function() {
        list.add("Hello");

        item = list.append(1, "World");
        expect(item).not.toBeFalsy();
        expect(item.text).toEqual("Hello World");

        expect(list.append(0, "Test")).toBeFalsy();
    });

    it ("should prepend text to items", function() {
        list.add("World");

        item = list.prepend(1, "Hello");
        expect(item).not.toBeFalsy();
        expect(item.text).toEqual("Hello World");

        expect(list.prepend(0, "Test")).toBeFalsy();
    });

    it ("should deprioritise items", function() {
        list.add("(A) Important stuff");

        item = list.deprioritise(1);
        expect(item).not.toBeFalsy();
        expect(item.priority).toBeNull();

        expect(list.deprioritise(0)).toBeFalsy();
    });

    it ("should remove items from the list by id", function() {
        list.add("Arf arf");

        expect(list.items.length).toEqual(1);
        item = list.remove(1);
        expect(item).not.toBeFalsy();
        expect(item.text).toEqual("Arf arf");
        expect(list.items.length).toEqual(0);

        // Non-ids should give a false
        expect(list.remove(0)).toBeFalsy();
    });

    it ("should clean up the index after removing items from the list", function() {
        item = list.add("Arf arf +learnwalrus @talktotheanimals");
        expect(list.items.length).toEqual(1);
        // id->index
        expect(list.indexes.id[item.id]).toEqual(0);
        // project->index[]
        expect(list.indexes.project.hasOwnProperty('learnwalrus')).toBeTruthy();
        expect(list.indexes.project['learnwalrus'][0]).toEqual(1);
        // context->index[]
        expect(list.indexes.context.hasOwnProperty('talktotheanimals')).toBeTruthy();
        expect(list.indexes.context['talktotheanimals'][0]).toEqual(1);

        // Add a second item
        // Removing this item should only remove the first item's project and
        // context indexes (not the whole index for the project/context).
        var item2 = list.add("Arf arf arf +learnwalrus @talktotheanimals");
        expect(list.indexes.id[item2.id]).toEqual(1);
        expect(list.indexes.project['learnwalrus'][1]).toEqual(2);
        expect(list.indexes.context['talktotheanimals'][1]).toEqual(2);
        // Remove item2
        var item2_id = item2.id;
        item2 = list.remove(item2.id);
        expect(item2.id).toBeNull();
        expect(list.indexes.project.hasOwnProperty('learnwalrus')).toBeTruthy();
        expect(list.indexes.project['learnwalrus'].length).toEqual(1);
        expect(list.indexes.context.hasOwnProperty('talktotheanimals')).toBeTruthy();
        expect(list.indexes.context['talktotheanimals'].length).toEqual(1);

        // Now remove the other item, which should clean up the indexes
        list.remove(item.id);
        expect(list.indexes.id.hasOwnProperty(item.id)).toBeFalsy();
        expect(list.indexes.project.hasOwnProperty('learnwalrus')).toBeFalsy();
        expect(list.indexes.context.hasOwnProperty('talktotheanimals')).toBeFalsy();
    });

    it ("should complete tasks", function() {
        item = list.add("Command hearts and minds");
        
        list.do(1);
        expect(list.findById(1).isCompleted()).toBeTruthy();
    });

    it ("should be able to chain task completions", function() {
        list.add("Command hearts and minds");
        list.add("Inspire a generation");

        list.do(1).do(2);
        expect(list.findById(1).isCompleted()).toBeTruthy();
        expect(list.findById(2).isCompleted()).toBeTruthy();
    });

    it ("should complete multiple tasks", function() {
        list.add("Command hearts and minds");
        list.add("Inspire a generation");

        list.do(1, 2);
        expect(list.findById(1).isCompleted()).toBeTruthy();
        expect(list.findById(2).isCompleted()).toBeTruthy();
    });
});
