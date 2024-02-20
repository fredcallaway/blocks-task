
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
        XXXXXX
      `,
    },
  ],
  main: [
    {
      name: 'diamond',
      library: LIBRARIES.easy,
      target: `
      ...XX...
      ..XXXX..
      .XXXXXX.
      XXXXXXXX
      .XXXXXX.
      ..XXXX..
      ...XX...
      `
    }, {
      name: 'spaceship',
      library: LIBRARIES.easy,
      target: `
      ..XX..XX..
      ..XX..XX..
      ..XX..XX..
      .XXXXXXXX.
      XXXXXXXXXX
      ....XX....
      `
    }, {
      name: 'weird_x',
      library: LIBRARIES.easy,
      target: `
      XXX....XX
      .XXXXXXX.
      .XXXXXXX.
      XX....XXX
      `
    }, {
      name: 'ingot',
      library: LIBRARIES.easy,
      target: `
      ..XXX.
      .XXXXX
      .XXXX
      XXXXX.
      .XXX..
      `
    }, {
      name: 'mushroom',
      library: LIBRARIES.easy,
      target: `
      .XX.
      XXXX
      XXXX
      .XX.
      XXXX
      `
    }, {
      name: 'hat',
      library: LIBRARIES.easy,
      target: `
      ..XX..
      .XXXX.
      .XXXX.
      .XXXX.
      XXXXXX
      `
    }, {
      name: 'wishbone',
      library: LIBRARIES.easy,
      target: `
      ...XX...
      ...XX...
      ..XXXX..
      .XXXXXX.
      XXXXXXXX
      XXX..XXX
      XX....XX
      `
    }, {
      name: 'slope',
      library: LIBRARIES.easy,
      target: `
      ....XXX
      ..XXXXX
      ..XXXXX
      .XXXXXX
      .XXXXXX
      XXXXXXX
      `
    }, {
      name: 'paris',
      library: LIBRARIES.easy,
      target: `
      ...XX...
      ...XX...
      ...XX...
      ...XX...
      ..XXXX..
      ..XXXX..
      ..XXXX..
      ..XXXX..
      ..XXXX..
      .XXXXXX.
      .XXXXXX.
      XXX..XXX
      X......X
      `
    }, {
      name: 'wheel',
      library: LIBRARIES.easy,
      target: `
      ..XX...
      .XXXXX.
      .XXXXXX
      XXX.XXX
      XXXXXX.
      .XXXXX.
      ...XX..
      `
    }, {
      name: 'legs',
      library: LIBRARIES.easy,
      target: `
      ........X
      .XXXXXXXX
      .XXXXXXXX
      XXX......
      XXX......
      .XXXXXXXX
      .XXXXXXXX
      ........X
      `
    },
    {
      library: LIBRARIES.hard,
      target: `
        XXXXXX
        XXXXXX
        XXXXXX
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
        ..XXX
        XXXXX
        XXXXX
        XXX..
      `,
    },
    {
      library: LIBRARIES.hard,
      target: `
        XXXXXX.
        XXXXXX.
        XXXXXXX
        XXXXXX.
        XXXXXX.
        XXXXXX.
        XXXXXX.
      `,
    },
    {
      library: LIBRARIES.hard,
      target: `
        ..X..
        .XXX.
        XXXXX
        .XXX.
        .XXX.
        .XXX.
      `,
    }
  ]
}