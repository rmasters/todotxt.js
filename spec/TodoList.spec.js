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
});