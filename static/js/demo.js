// code for demonstration widgets, not part of the actual experiment

async function puzzleViewer(name) {
  if (name == 'alt') return altPuzzleViewer()
  let width = 240
  let stimuli = _.mapValues(STIMULI, Object.values)

  let wrapper = $('<div>').css({
    'position': 'relative',
    'margin': 'auto',
    'width': stimuli.basic.length * width,
    'text-align': 'center',
    // 'border': 'thin red solid'
  }).appendTo(DISPLAY)

  async function showPuzzle(trial) {
    await new BlockPuzzle({...trial, allowQuitSeconds: 0, prompt: trial.name}).run(wrapper)
    showSelector()
  }

  function showSelector() {
    wrapper.empty()

    // let basic = _.map(_.shuffle(), 'name')
    // let compositions = _.map(_.shuffle(stimuli.compositions), 'name')

    let basicDiv = $('<div>').appendTo(wrapper)
    for (let stim of stimuli.basic) {
      let div = $('<div>').css({
        display: 'inline-block',
        cursor: 'pointer',
        width: width,
      }).appendTo(basicDiv)
      new BlockDisplayOnly({...stim, grid: 15}).attach(div)
      div.click(() => showPuzzle(stim))
    }

    let compDiv = $('<div>').css('margin-top', 30).appendTo(wrapper)
    let rows = _.zip(..._.chunk(stimuli.compositions, stimuli.basic.length-1))
    for (let row of rows) {
      let rowDiv = $('<div>').css('margin-top', 10).appendTo(compDiv).css('border', 'thin black')
      for (let stim of row) {
        let div = $('<div>').css({
          display: 'inline-block',
          cursor: 'pointer',
          width: '240px',
        }).appendTo(rowDiv)
        console.log('stim', stim)
        new BlockDisplayOnly({...stim, grid: 15}).attach(div)
        div.click(() => showPuzzle(stim))
      }
    }

    }


  if (name && _.find(PUZZLES, {name})) {
    showPuzzle(_.find(PUZZLES, {name}))
  } else {
    console.log('selector')
    showSelector()
  }
}

async function altPuzzleViewer() {
  let stimData = await $.getJSON(`static/json/stimuli-alt.json`)
  let cv = new CycleViewer(DISPLAY, stimData, function(stims) {
    let div = this.content
    this.setTitle(`border = ${stims.target_border}`)

    async function showPuzzle(trial) {
      console.log('trial', trial)
      await new BlockPuzzle({...trial, allowQuitSeconds: 0, prompt: trial.name}).run(div)
      showSelector()
    }

    function showSelector() {
      div.empty()
      // let basic = _.map(_.shuffle(), 'name')
      // let compositions = _.map(_.shuffle(STIMULI.compositions), 'name')
      let basicDiv = $('<div>').appendTo(div)
      for (let stim of stims.basic) {
        let div = $('<div>').css({
          display: 'inline-block',
          cursor: 'pointer',
          width: '240px',
        }).appendTo(basicDiv)
        new BlockDisplayOnly({...stim, grid: 15}).attach(div)
        div.click(() => showPuzzle(stim))
      }

      let compDiv = $('<div>').css('margin-top', 30).appendTo(div)
      let rows = _.zip(..._.chunk(stims.compositions, stims.basic.length-1))
      for (let row of rows) {
        let rowDiv = $('<div>').css('margin-top', 10).appendTo(compDiv).css('border', 'thin black')
        for (let stim of row) {
          let div = $('<div>').css({
            display: 'inline-block',
            cursor: 'pointer',
            width: '240px',
          }).appendTo(rowDiv)
          new BlockDisplayOnly({...stim, grid: 15}).attach(div)
          div.click(() => showPuzzle(stim))
        }
      }
    }
    showSelector()
  })
  cv.showItem(0)
}

async function dataViewer(which) {
  if (!which) {
    which = 'v3.1'
  }
  console.log('which is', which)
  let wrapper = $('<div>').css({
    'position': 'relative',
    'margin': 'auto',
    'width': '1200px',
    'text-align': 'center',
    // 'border': 'thin red solid'
  }).appendTo(DISPLAY)

  let title = $('<h1>').appendTo(wrapper)

  let content = $('<div>').css({
    'margin-left': '100px',
    'width': '1000px',
    // border: 'thick black solid'
  }).appendTo(wrapper)


  let btnPrev = $('<button>')
  .addClass('btn')
  .text('<<')
  .css({
    position: 'absolute',
    top: '10px',
    left: '370px',
  })
  .appendTo(wrapper)

  let btnNext = $('<button>')
  .addClass('btn')
  .text('>>')
  .css({
    position: 'absolute',
    top: '10px',
    right: '370px',
  })
  .appendTo(wrapper)

  let [version, uid] = which.split('-');
  let allData = await $.getJSON(`static/json/solutions/${version}.json`)
  let listen = new EventListeners()
  var queryParams = new URLSearchParams(window.location.search);

  async function show(i) {
    let data = allData[i]
    queryParams.set("data", `${data.uid}`);
    history.replaceState(null, null, "?"+queryParams.toString());

    btnPrev.unbind('click')
    btnPrev.click(() => {
      show(mod(i - 1, allData.length))
    })
    btnNext.unbind('click')
    btnNext.click(() => {
      show(mod(i + 1, allData.length))
    })
    listen.on('keydown', event => {
      if (event.key === "ArrowRight") {
        listen.clear()
        show(mod(i + 1, allData.length))
      }
      else if (event.key === "ArrowLeft") {
        listen.clear()
        show(mod(i - 1, allData.length))
      }
    })

    content.empty()
    title.text(data.uid)
    let row1 = $('<div>').appendTo(content)
    $('<h1>').text("Examples").css('margin-top', '40px').appendTo(row1)
    for (let name of data.examples) {
      let div = $('<div>').css('display', 'inline-block').appendTo(row1)
      let trial = findTrial(name)
      trial = {...trial, grid: 20, configuration: trial.solution}
      new BlockDisplayOnly(trial).attach(div)
    }

    let row2 = $('<div>').appendTo(content)
    $('<h1>').text("Solutions").css('margin-top', '40px').appendTo(row2)
    for (let trial of data.solutions) {
      let div = $('<div>').css('display', 'inline-block').appendTo(row2)
      trial = {...findTrial(trial.name), ...trial, grid: 20}
      new BlockDisplayOnly(trial).attach(div)
    }
  }
  await show(Math.max(0,_.findIndex(allData, {uid})))
}


async function solveBasic() {
  let solutions = {}
  for (let trial of STIMULI.basic) {
    let puzzle = new BlockPuzzle(trial)
    await puzzle.run(DISPLAY)
    solutions[trial.name] = Array.from(puzzle.activeBlocks)
  }
  navigator.clipboard.writeText(JSON.stringify(solutions))
  alert("Coppied solutions to clipboard")
}

async function handleSpecialMode() {
  let busy = make_promise()

  if (urlParams.basic) {
    await solveBasic()
  }

  if (urlParams.puzzle != undefined) {
    await puzzleViewer(urlParams.puzzle)
  }
  else if (urlParams.data != undefined) {
    await dataViewer(urlParams.data)
  }
  else if (urlParams.dev != undefined) {
    await new BlockPuzzle({
      library: LIBRARIES[urlParams.dev] ?? LIBRARIES.easy,
      dev: true
    }).attach(DISPLAY).run()
  }
  else {
    busy.resolve()
  }

  await busy
}
