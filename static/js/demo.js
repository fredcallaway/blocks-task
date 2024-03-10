// code for demonstration widgets, not part of the actual experiment



async function puzzleViewer(name) {
  let showSolution = false
  if (name == 'alt') return altPuzzleViewer()
  let width = 240
  let all_stimuli = await $.getJSON(`static/json/all_stimuli.json`)
  makeGlobal({all_stimuli})
  let stimuli = _.mapValues(all_stimuli, Object.values)

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

async function altPuzzleViewer() {
  let stimData = await $.getJSON(`static/json/stimuli-alt.json`)
  let cv = new CycleViewer(DISPLAY, stimData, function(stims) {
    let div = this.content
    this.setTitle(`border = ${stims.target_border}`)

    async function showPuzzle(trial) {
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

async function genDataViewer() {
  DISPLAY.empty()
  let allData = await $.getJSON(`static/json/solutions2.json`)

  let cv = new CycleViewer(DISPLAY, allData, function(grp) {
    this.content.empty()
    this.setTitle(`generation = ${grp.generation}`)

    for (let pdata of grp.data) {
      let col = $('<div>').css({
        width: 180,
        height: 290,
        float: 'left',
        border: 'medium black solid',
        margin: 5
      }).appendTo(this.content)
      $('<p>').text(pdata.uid).css({'font-size': 12, 'font-weight': 'bold'}).appendTo(col)
      col.click(() => {
        this.listener.clear()
        dataViewer(pdata.uid)
      })
      for (let trial of pdata.solutions) {
        let div = $('<div>').appendTo(col)
        trial = {...trial, grid: 7}
        new BlockDisplayOnly(trial).attach(div)
      }
    }
  })
  cv.showItem(0)

}

async function dataViewer(which) {
  let listen = new EventListeners()

  DISPLAY.empty()
  let wrapper = $('<div>').css({
    'position': 'relative',
    'margin': 'auto',
    'width': '1200px',
    'text-align': 'center',
    // 'border': 'thin red solid'
  }).appendTo(DISPLAY)

  $('<button>')
  .appendTo(wrapper)
  .css({
    'position': 'absolute',
    'left': '50px',
    'top': '10px'
  })
  .addClass('btn')
  .html('← generations')
  .css('font-size', 18)
  .click(() => {
    listen.clear()
    genDataViewer()

  })

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

  // let [version, uid] = which.split('-');
  let allData = await $.getJSON(`static/json/solutions.json`)
  makeGlobal({allData})
  var queryParams = new URLSearchParams(window.location.search);

  async function show(i) {
    let data = allData[i]
    queryParams.set("data", `${data.uid}`);
    history.pushState(null, null, "?"+queryParams.toString());

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
    for (let trial of data.examples) {
      let div = $('<div>').css('display', 'inline-block').appendTo(row1)
      trial = {...trial, grid: 20, configuration: trial.solution}
      new BlockDisplayOnly(trial).attach(div)
    }

    let row2 = $('<div>').appendTo(content)
    $('<h1>').text("Solutions").css('margin-top', '40px').appendTo(row2)
    for (let trial of data.solutions) {
      let div = $('<div>').css('display', 'inline-block').appendTo(row2)
      trial = {...trial, grid: 20}
      new BlockDisplayOnly(trial).attach(div)
    }
  }
  await show(Math.max(0,_.findIndex(allData, {uid: which})))
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
  let busy = make_promise()

  if (urlParams.basic) {
    await solveBasic()
  }

  if (urlParams.puzzle != undefined) {
    await puzzleViewer(urlParams.puzzle)
  }
  else if (urlParams.data != undefined) {
    if (urlParams.data == 'generations') {
      await genDataViewer()
    } else {
        await dataViewer(urlParams.data)
    }
  }
  else if (urlParams.dev != undefined) {
    await new BlockPuzzle({
      library: urlParams.dev || undefined,
      target: urlParams.target?.replaceAll("\\n", "\n"),
      dev: true
    }).attach(DISPLAY).run()
  }
  else {
    busy.resolve()
  }

  await busy
}
