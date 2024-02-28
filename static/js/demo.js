// code for demonstration widgets, not part of the actual experiment

async function puzzleViewer(name) {
  let wrapper = $('<div>').css({
    'position': 'relative',
    'margin': 'auto',
    'width': '1100px',
    'text-align': 'center',
    // 'border': 'thin red solid'
  }).appendTo(DISPLAY)

  async function showPuzzle(trial) {
    console.log('trial', trial)
    await new BlockPuzzle({...trial, allowQuitSeconds: 0, prompt: trial.name}).run(wrapper)
    showSelector()
  }

  function showSelector() {
    wrapper.empty()
    for (let block of TRIALS.main) {
      let row = $('<div>').appendTo(wrapper)
      for (let name of block) {
        let div = $('<div>').css({
          display: 'inline-block',
          cursor: 'pointer'
        }).appendTo(row)
        let trial = _.find(PUZZLES, {name})
        // trial.configuration = data.solutions[name]
        new BlockDisplayOnly({...trial, grid: 15}).attach(div)
        div.click(() => showPuzzle(trial))
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

async function dataViewer(uid='fred') {
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

  async function show(uid, data) {
    var queryParams = new URLSearchParams(window.location.search);
    queryParams.set("data", uid);
    history.replaceState(null, null, "?"+queryParams.toString());

    data = data ?? await $.getJSON(`static/json/solutions/${uid}.json`)

    let dataPrev = $.getJSON(`static/json/solutions/${data.prev}.json`)
    let dataNext = $.getJSON(`static/json/solutions/${data.next}.json`)
    btnPrev.unbind('click')
    btnPrev.click(() => {
      dataPrev.then(d => show(data.prev, d))
    })
    btnNext.unbind('click')
    btnNext.click(() => {
      dataNext.then(d => show(data.next, d))
    })

    content.empty()
    title.text(uid)
    console.log('data.solutions', data.solutions)
    for (let block of [STIMULI.basic, STIMULI.compositions]) {
      let row = $('<div>').appendTo(content)
      for (let trial of block) {
        let div = $('<div>').css('display', 'inline-block').appendTo(row)
        trial.grid = 15
        trial.configuration = data.solutions[trial.name]
        new BlockDisplayOnly(trial).attach(div)
      }
    }
  }
  await show(uid)
}

function findTrial(name) {
  return _.find(STIMULI.basic.concat(STIMULI.compositions), {name})
}

async function handleSpecialMode() {
  let busy = make_promise()

  if (urlParams.puzzle) {
    await puzzleViewer(urlParams.puzzle)
  }
  else if (urlParams.data) {
    await dataViewer(urlParams.data)
  }
  else if (urlParams.dev) {
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
