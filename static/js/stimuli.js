
var easy_blocks = [
  `
    X
  `, `
    .XX
    XX.
  `, `
    XX.
    .XX
  `, `
    .X
    .X
    XX
  `, `
    X
    X
    XX
  `
]

var hard_blocks = [
  `
    X
  `, `
    .X
    XX
  `, `
    X
    XX
    X
  `,
   `
    X
    XX
    XX
  `, `
    X
    XX.
    .XX
  `, `
    XX
    .X
    .XX
  `, `
    XX
    X
    XX
  `, `
    XXXX
    X
    X
  `
]

var trials = [

  {
    library: easy_blocks,
    target: `
      XXX
      XXX
      XXX
      XXX
    `,
  },
  {
    library: easy_blocks,
    target: `
      .XX.
      XXXX
      XXXX
      XXXX
      XXXX
      .XX.
      XXXX
      XXXX
      XXXX
    `,
  },
  {
    library: easy_blocks,
    target: `
      ..XX..
      .XXXX.
      .XXXX.
      .XXXX.
      XXXXXX
      ..XXX.
      .XXXXX
      .XXXX
      XXXXX.
      .XXX..
    `,
  },
  {
    library: hard_blocks,
    target: `
.........XXXXXX...............
.........XXXXXX...............
.........XXXXXX...............
    `,
  },
  {
    library: hard_blocks,
    target: `
      XXXXX...
      XXXXX...
      XXXXXXXX
      XXXXXXXX
    `,
  },
  {
    library: hard_blocks,
    target: `
..............................
..............................
..............................
..............................
..............................
............XXX...............
..........XXXXX...............
..........XXXXX...............
..........XXX.................
..............................
..............................
..............................
..............................
..............................
..............................
    `,
  },
  {
    library: hard_blocks,
    target: `
      ........XXXXXX................
      ........XXXXXX................
      ........XXXXXXX...............
      ........XXXXXX................
      ........XXXXXX................
      ........XXXXXX................
      ........XXXXXX................
    `,
  },
  {
    library: hard_blocks,
    target: `
      ............X............
      ...........XXX...........
      ..........XXXXX..........
      ...........XXX...........
      ...........XXX...........
      ...........XXX...........
    `,
  }
]
