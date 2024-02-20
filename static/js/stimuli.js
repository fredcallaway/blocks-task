
var LIBRARIES = {
  easy: [
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
  ],
  hard: [
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
}


var TRIALS = {
  practice: [
    {
      library: LIBRARIES.easy,
      target: `
        .XX.
        XXXX
        XXXX
        .XX.
        XXXX
      `,
    },
    {
      library: LIBRARIES.easy,
      target: `
        ..XX..
        .XXXX.
        .XXXX.
        .XXXX.
        .XXXX.
        XXXXXX
      `,
    },
  ],
  main: [
    {
      library: LIBRARIES.easy,
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
      library: LIBRARIES.hard,
      target: `
  .........XXXXXX...............
  .........XXXXXX...............
  .........XXXXXX...............
      `,
    },
    {
      library: LIBRARIES.hard,
      target: `
        XXXXX...
        XXXXX...
        XXXXXXXX
        XXXXXXXX
      `,
    },
    {
      library: LIBRARIES.hard,
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
      library: LIBRARIES.hard,
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
      library: LIBRARIES.hard,
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
}