
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

    `,
      .X
      XXX
      .X
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
      XXX
      X
      X
    `
  ]
}

var PUZZLES = [
  {
    name: 'bigshroom',
    library: LIBRARIES.easy,
    target: `
    ..XXXX..
    .XXXXXX.
    XXXXXXXX
    .XXXXXX.
    ..XXXX..
    ..XXXX..
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
    name: 'smallshroom',
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
    name: 'hat-ingot',
    library: LIBRARIES.easy,
    target: `
    ..XXX.
    .XXXXX
    .XXXX
    XXXXX.
    .XXX..
    ..XX..
    .XXXX.
    .XXXX.
    .XXXX.
    XXXXXX
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
    name: 'slope-bigshroom',
    library: LIBRARIES.easy,
    target: `
    .......XXXX..
    ......XXXXXX.
    .....XXXXXXXX
    ......XXXXXX.
    ....XXXXXXX..
    ..XXXXXXXXX..
    ..XXXXX..........
    .XXXXXX..........
    .XXXXXX..........
    XXXXXXX..........
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
    name: 'tree',
    library: LIBRARIES.easy,
    target: `
    ....XXX...
    ..XXXXXX..
    .XXXXXXXX.
    .XXXXXXXX.
    XXXXXXXXXX
    ...XXXX...
    ...XXX....
    ....XX....
    ...XXXX...
    `
  }, {
    name: 'wheel-tree',
    library: LIBRARIES.easy,
    target: `
    ..XX......XXX...
    .XXXXX..XXXXXX..
    .XXXXXXXXXXXXXX.
    XXX.XXXXXXXXXXX.
    XXXXXXXXXXXXXXXX
    .XXXXX...XXXX...
    ...XX....XXX....
    ..........XX....
    .........XXXX...
    `
  },
  {
    name: 'rect36',
    library: LIBRARIES.hard,
    target: `
      XXXXXX
      XXXXXX
      XXXXXX
    `,
  }, {
    name: 'igloo',
    library: LIBRARIES.hard,
    target: `
      XXXXX...
      XXXXX...
      XXXXXXXX
      XXXXXXXX
    `,
  }, {
    name: 'igloo-slug',
    library: LIBRARIES.hard,
    target: `
    .......XXX....
    .......XXX....
    XXXXX...XX....
    XXXXX...XXXX..
    XXXXXXXXXXXXXX
    XXXXXXXXXXXXXX
    `,
  }, {
    name: 'squares',
    library: LIBRARIES.hard,
    target: `
      ..XXX
      XXXXX
      XXXXX
      XXX..
    `,
  }, {
    name: 'squares-rect36',
    library: LIBRARIES.hard,
    target: `
      ..XXXXXXXXX
      XXXXXXXXXXX
      XXXXXXXXXXX
      XXX..
    `,
  }, {
    name: 'nubbin',
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
  }, {
    name: 'arrow',
    library: LIBRARIES.hard,
    target: `
      ..X..
      .XXX.
      XXXXX
      .XXX.
      .XXX.
      .XXX.
    `,
  }, {
    name: 'slug',
    library: LIBRARIES.hard,
    target: `
      XXX....
      XXX....
      .XX....
      .XXXX..
      .XXXXXX
      .XXXXXX
    `,
  }, {
    name: 'wideshroom',
    library: LIBRARIES.hard,
    target: `
    ...XXX...
    ..XXXXX..
    .XXXXXXX.
    XXXXXXXXX
    ..XXXXX..
    ..XXXXX..
    `,
  }, {
    name: 'wideshroom-arrow',
    library: LIBRARIES.hard,
    target: `
    ....X..
    ...XXX.
    ..XXXXX
    ...XXX.
    ...XXX.
    ...XXX.
    ...XXX...
    ..XXXXX..
    .XXXXXXX.
    XXXXXXXXX
    ..XXXXX..
    ..XXXXX..
    `,
  }
]

var TRIALS = {
  practice: ['smallshroom', 'hat'],
  main: [
    ['ingot', 'bigshroom', 'hat', 'slope', 'wheel', 'tree'],
    ['hat-ingot', 'wheel-tree', 'slope-bigshroom'],
    ['rect36', 'igloo', 'squares', 'arrow', 'slug', 'wideshroom'],
    ['wideshroom-arrow', 'squares-rect36', 'igloo-slug'],
  ]
}