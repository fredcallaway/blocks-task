// code for demonstration widgets, not part of the actual experiment

solutionData = undefined

async function puzzleViewer(name) {
  let showSolution = !!urlParams.showSolution
  if (name == 'alt') return altPuzzleViewer()
  let width = 240
  let all_stimuli = await $.getJSON(`static/json/all_stimuli.json`)
  makeGlobal({all_stimuli})
  let stimuli = _.mapValues(all_stimuli, Object.values)

  let wrapper = $('<div>').css({
    'top': '0px',
    // 'position': 'relative',
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

    $('<button>')
    .appendTo(wrapper)
    .css({
      'position': 'absolute',
      'left': '50px',
      'top': '10px'
    })
    .addClass('btn')
    .html('toggle solutions')
    .css('font-size', 18)
    .click(() => {
      showSolution = !showSolution
      showSelector()
    })

    // let basic = _.map(_.shuffle(), 'name')
    // let compositions = _.map(_.shuffle(stimuli.compositions), 'name')

    let basicDiv = $('<div>').css({marginTop: 60}).appendTo(wrapper)
    for (let stim of stimuli.basic) {
      let div = $('<div>').css({
        display: 'inline-block',
        cursor: 'pointer',
        width: width,
      }).appendTo(basicDiv)
      new BlockDisplayOnly({...stim, grid: 15, showSolution}).attach(div)
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
        new BlockDisplayOnly({...stim, grid: 15, showSolution}).attach(div)
        div.click(() => showPuzzle(stim))
      }
    }

    }

  if (name && _.find(PUZZLES, {name})) {
    showPuzzle(_.find(PUZZLES, {name}))
  } else {
    showSelector()
  }
}

var _generation = 1
async function genDataViewer() {
  DISPLAY.empty()
  genData = _.values(_.groupBy(solutionData, 'generation'))

  let cv = new CycleViewer(DISPLAY, genData, function(data) {
    this.content.empty()
    _generation = data[0].generation
    this.setTitle(`generation = ${_generation}`)

    for (let pdata of data) {
      let col = $('<div>').css({
        width: 180,
        height: 290,
        float: 'left',
        border: 'medium black solid',
        margin: 5
      }).appendTo(this.content)
      $('<p>').text(pdata.pid).css({'font-size': 12, 'font-weight': 'bold'}).appendTo(col)
      col.click(() => {
        this.listener.clear()
        dataViewer(pdata.pid)
      })
      for (let trial of pdata.solutions) {
        let div = $('<div>').appendTo(col)
        trial = {...trial, grid: 7}
        new BlockDisplayOnly(trial).attach(div)
      }
    }
  })
  cv.showItem(_generation-1)

}

async function dataViewer(pid) {
  console.log('dataViewer pid', pid)

  DISPLAY.empty()

  let cv = new CycleViewer(DISPLAY, solutionData, function(data) {
    this.content.empty()
    this.setTitle(data.pid)
    _generation = data.generation
    // queryParams.set("data", `${data.uid}`);

    let row1 = $('<div>').appendTo(this.content)
    $('<h1>').text("Examples").css('margin-top', '40px').appendTo(row1)
    for (let trial of data.examples) {
      let div = $('<div>').css('display', 'inline-block').appendTo(row1)
      trial = {...trial, grid: 20, configuration: trial.solution}
      new BlockDisplayOnly(trial).attach(div)
    }

    let row2 = $('<div>').appendTo(this.content)
    $('<h1>').text("Solutions").css('margin-top', '40px').appendTo(row2)
    for (let trial of data.solutions) {
      let div = $('<div>').css('display', 'inline-block').appendTo(row2)
      trial = {...trial, grid: 20}
      new BlockDisplayOnly(trial).attach(div)
    }
  })

  $('<button>')
  .appendTo(cv.top)
  .css({
    'position': 'absolute',
    'left': '50px',
    'top': '10px'
  })
  .addClass('btn')
  .html('← generation')
  .css('font-size', 18)
  .click(() => {
    cv.listener.clear()
    genDataViewer(_generation)
  })

  cv.showItem(Math.max(0, _.findIndex(solutionData, {pid})))
}


async function solveBasic() {
  error("not implemented")
  let solutions = {}
  for (let trial of ALL_STIMULI.basic) {
    let puzzle = new BlockPuzzle(trial)
    await puzzle.run(DISPLAY)
    solutions[trial.name] = Array.from(puzzle.activeBlocks)
  }
  navigator.clipboard.writeText(JSON.stringify(solutions))
  alert("Coppied solutions to clipboard")
}

async function handleSpecialMode() {
  let busy = makePromise()

  if (urlParams.basic) {
    await solveBasic()
  }

  if (urlParams.puzzle != undefined) {
    await puzzleViewer(urlParams.puzzle)
  }
  else if (urlParams.data != undefined) {
    solutionData = await $.getJSON(`static/json/solutions.json`)
    if (urlParams.data) {
        await dataViewer(urlParams.data)
    } else {
      await genDataViewer()
    }
  }
  else if (urlParams.dev != undefined) {
    await new BlockPuzzle({
      library: urlParams.dev || undefined,
      target: urlParams.target?.replaceAll("\\n", "\n").replace('n', '\n'),
      dev: true
    }).attach(DISPLAY).run()
  }
  else {
    busy.resolve()
  }

  await busy
}
