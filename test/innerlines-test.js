var assert = require('assert'),
    api = require("../");

describe('mapshaper-innerlines.js', function () {
  //
  //      b --- d
  //     / \   /
  //    /   \ /
  //   a --- c
  //
  //   cab, bc,   bdc
  //   0,   1/-2, 2

  var arcs = [[[3, 1], [1, 1], [2, 3]],
      [[2, 3], [3, 1]],
      [[2, 3], [4, 3], [3, 1]]];
  arcs = new api.internal.ArcCollection(arcs);
  var lyr = {
        name: 'shape',
        geometry_type: 'polygon',
        data: new api.internal.DataTable([{foo: 'a'}, {foo: 'b'}]),
        shapes: [[[0, 1]], [[-2, 2]]]
      };

  //  a -- b -- c
  //  |    |    |
  //  d -- e -- f
  //  |    |    |
  //  g -- h -- i
  //
  // dab, be, ed, bcf, fe, eh, hgd, fih
  // 0,   1,  2,  3,   4,  5,  6,   7
  //
  var lyrb = {
    geometry_type: 'polygon',
    data: new api.internal.DataTable([{foo: 'a', bar: 1}, {foo: 'a', bar: 1},
        {foo: 'b', bar: 2}, {foo: 'b', bar: 3}]),
    shapes: [[[0, 1, 2]], [[3, 4, ~1]], [[~2, 5, 6]], [[~4, 7, ~5]]]
  }
  var arcsb = [[[1, 2], [1, 3], [2, 3]],
      [[2, 3], [2, 2]],
      [[2, 2], [1, 2]],
      [[2, 3], [3, 3], [3, 2]],
      [[3, 2], [2, 2]],
      [[2, 2], [2, 1]],
      [[2, 1], [1, 1], [1, 2]],
      [[3, 2], [3, 1], [2, 1]]];
  arcsb = new api.internal.ArcCollection(arcsb);

  //  a -- b -- c
  //  |    |    |
  //  d    e    f
  //  |    |    |
  //  g -- h -- i
  //
  // dab, be, bcf, eh, hgd, fih
  // 0,   1,  2,   3,  4,   5
  //
  var lyrc = {
    geometry_type: 'polygon',
    data: new api.internal.DataTable([{foo: 'a'}, {foo: 'b'}]),
    shapes: [[[0, 1, 3, 4]], [[2, 5, ~3, ~1]]]
  }
  var arcsc = new api.internal.ArcCollection([[[1, 2], [1, 3], [2, 3]],
      [[2, 3], [2, 2]],
      [[2, 3], [3, 3], [3, 2]],
      [[2, 2], [2, 1]],
      [[2, 1], [1, 1], [1, 2]],
      [[3, 2], [3, 1], [2, 1]]]);

  describe('innerlines()', function () {
    it('test 1', function () {
      var lyr2 = api.innerlines(lyr, arcs);
      assert.deepEqual(lyr2.shapes, [[[1]]]);
      assert.equal(lyr2.geometry_type, 'polyline');
      assert.equal(lyr2.name, 'shape'); // same as original name
    })

    it('test 2', function () {
      var lyr2 = api.innerlines(lyrb, arcsb);
      assert.deepEqual(lyr2.shapes,
          [[[1]], [[2]], [[4]], [[5]]]);
      assert.equal(lyr2.geometry_type, 'polyline');
    })
  })

  describe('lines()', function() {
    it( 'test with no field', function() {
      var lyr2 = api.lines(lyr, arcs);
      assert.deepEqual(lyr2.shapes, [[[1]], [[0]], [[2]]]);
      assert.equal(lyr2.geometry_type, 'polyline');
      assert.equal(lyr2.name, 'shape'); // same as original name
      assert.deepEqual(lyr2.data.getRecords(), [{RANK: 1, TYPE: "inner"}, {RANK: 0, TYPE: "outer"}, {RANK: 0, TYPE: "outer"}]);
    })

    it('test 2 with no field', function () {
      var lyr2 = api.lines(lyrb, arcsb);
      assert.deepEqual(lyr2.shapes,
          [[[1]], [[2]], [[4]], [[5]], [[0]], [[3]], [[6]], [[7]]]);
      assert.equal(lyr2.geometry_type, 'polyline');
    })

    it( 'test with one field', function() {
      var lyr2 = api.lines(lyr, arcs, ['foo']);
      assert.deepEqual(lyr2.shapes, [[[1]], [[0]], [[2]]]);
      assert.equal(lyr2.geometry_type, 'polyline');
      assert.equal(lyr2.name, 'shape'); // same as original name
      assert.deepEqual(lyr2.data.getRecords(), [{RANK: 1, TYPE: "inner"}, {RANK: 0, TYPE: "outer"}, {RANK: 0, TYPE: "outer"}]);
    })

    it( 'test 2 with one field', function() {
      var lyr2 = api.lines(lyrb, arcsb, {fields:['foo']});
      assert.equal(lyr2.geometry_type, 'polyline');
      assert.deepEqual(lyr2.data.getRecords(),
          [{RANK: 2, TYPE: 'inner'}, {RANK: 2, TYPE: 'inner'}, {RANK: 1, TYPE: "foo"}, {RANK: 1, TYPE: "foo"}, {RANK: 0, TYPE: "outer"}, {RANK: 0, TYPE: "outer"}, {RANK: 0, TYPE: "outer"}, {RANK: 0, TYPE: "outer"}]);
      assert.deepEqual(lyr2.shapes,
          [[[1]], [[5]], [[2]], [[4]], [[0]], [[3]], [[6]], [[7]]]);
    })

    // testing multi-arc parts
    it( 'test 3 with one field', function() {
      var lyr2 = api.lines(lyrc, arcsc, {fields:['foo']});
      assert.equal(lyr2.geometry_type, 'polyline');
      assert.deepEqual(lyr2.data.getRecords(),
          [{RANK: 1, TYPE: "foo"}, {RANK: 0, TYPE: "outer"}, {RANK: 0, TYPE: "outer"}]);
      // Arcs in shapes[1] are rearranged to form a single part
      assert.deepEqual(lyr2.shapes, [[[1, 3]], [[4, 0]], [[2, 5]]]);
    })

    it( 'test with two fields', function() {
      var lyr2 = api.lines(lyrb, arcsb, {fields:['foo', 'bar']});
      assert.deepEqual(lyr2.shapes,
          [[[1]], [[5]], [[2]], [[4]], [[0]], [[3]], [[6]], [[7]]]);
      assert.equal(lyr2.geometry_type, 'polyline');
      assert.deepEqual(lyr2.data.getRecords(),
          [{RANK: 3, TYPE: 'inner'}, {RANK: 2, TYPE: "bar"}, {RANK: 1, TYPE: "foo"}, {RANK: 1, TYPE: "foo"}, {RANK: 0, TYPE: "outer"}, {RANK: 0, TYPE: "outer"}, {RANK: 0, TYPE: "outer"}, {RANK: 0, TYPE: "outer"}]);
    })
  })
})
