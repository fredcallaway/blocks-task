const PARAMS = {

}

updateExisting(PARAMS, urlParams)
psiturk.recordUnstructuredData('params', PARAMS);

const PROLIFIC_CODE = 'CHDRYEDZ'
var BONUS = 0

// var N_TRIAL = _(TRIALS.main).map(block => block.length).sum()
var stimuli
var main_trials
var N_TRIAL

const display = $('#display')

function findTrial(name) {
  return _.find(stimuli.basic.concat(stimuli.compositions), {name})
}

async function instructions(start=1) {
  logEvent('experiment.instructions')
  let trials = [
    {'name': 'easyrect', 'target': 'XXXXX\nXXXXX\nXXXXX'},
    _.sample(stimuli.basic)
  ]
  await new BlockInstructions(trials).attach(display).run(start)
}

async function main() {
  logEvent('experiment.main')

  let top = $('<div>')
  .css({
    // 'border': 'thin red solid',
    'margin-bottom': '10px'
  })
  .appendTo(display)

  let counter = $('<div>')
  .addClass('left')
  .appendTo(top)
  .css({
    'font-weight': 'bold',
    'font-size': '16pt'
  })

  let help = $('<button>')
  .appendTo(top)
  .addClass('btn-help right')
  .text('?')
  .click(async () => {
    await Swal.fire({
        title: 'Instructions',
        html: `
          Drag the blocks from the bottom of the screen to fill in all the white squares.
          You can rotate the block you're currently holding by pressing space.
          You can remove blocks by dragging them into the gray area.
        `,
        icon: 'info',
        confirmButtonText: 'Got it!',
      })
  })

  let content = $('<div>')
  .appendTo(display)

  let trial_number = 1

  for (let trial of _.shuffle(main_trials)) {
    counter.text(`Round ${trial_number++} / ${N_TRIAL}`)
    await new BlockPuzzle(trial).attach(content).run()
    saveData()
  }
}

async function debrief() {
  logEvent('experiment.debrief')
  display.empty()
  $('<p>').appendTo(display).html(markdown(`
    # You're done!

    Thanks for participating! We have a few quick questions before you go.
  `))

  let noticed = radio_buttons(display, `
    Did you notice that some shapes showed up multiple times?
  `, ['yes', 'no'])

  let difficulty = radio_buttons(display, `
    How difficult were the problems, overall?
  `, ['too easy', 'just right', 'too hard'])

  let feedback = text_box(display, `
    Do you have any other feedback? (optional)
  `)

  await button(display, 'submit').clicked
  logEvent('debrief.submitted', {
    noticed: noticed.val(),
    difficulty: difficulty.val(),
    feedback: feedback.val(),
  })
}

async function runTimeline(...blocks) {
  let blockLookup = Object.fromEntries(blocks.map(b => [b.name, b]))
  let block = blockLookup[urlParams.block]
  if (block) {
    await block()
  } else {
    for (const block of blocks) {
      await block()
    }
  }
}

async function problemViewer() {
  let wrapper = $('<div>').css({
    'position': 'relative',
    'margin': 'auto',
    'width': '1200px',
    'text-align': 'center',
    // 'border': 'thin red solid'
  }).appendTo(display)

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
        div.click(async () => {
          await new BlockPuzzle({...trial, allowQuit: true, prompt: trial.name}).attach(wrapper).run()
          showSelector()
        })
      }
    }
  }
  showSelector()
  await make_promise()
}

async function dataViewer(uid='fred') {
  let wrapper = $('<div>').css({
    'position': 'relative',
    'margin': 'auto',
    'width': '1200px',
    'text-align': 'center',
    // 'border': 'thin red solid'
  }).appendTo(display)

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
    queryParams.set("show", uid);
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
    for (let block of [stimuli.basic, stimuli.compositions]) {
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

  await make_promise()
}

async function handleSpecialMode() {
  if (urlParams.try) {
    await problemViewer(urlParams.try)
  }

  else if (urlParams.show) {
    await dataViewer(urlParams.show)
  }

  else if (urlParams.dev) {
    await new BlockPuzzle({
      library: LIBRARIES[urlParams.dev] ?? LIBRARIES.easy,
      dev: true
    }).attach(display).run()
  }

  else if (urlParams.puzzle) {
    for (let name of urlParams.puzzle.split("_")) {
      let trial = findTrial(name)
      await new BlockPuzzle(trial).attach(display).run()
    }
  }

  else if (urlParams.instruct) {
    await instructions(parseInt(urlParams.instruct))
    await main()
  }

  else {
    return 'normal'
  }
}


async function runExperiment() {
  stimuli = await $.getJSON(`static/json/stimuli.json`)

  let seen = new Set()
  main_trials = _.shuffle(stimuli.compositions).filter(stim => {
    let alt = stim.name.split("-").reverse().join("-")
    if (seen.has(alt)) {
      return false
    } else {
      seen.add(stim.name)
      return true
    }
  })
  console.log('main_trials', main_trials)

  N_TRIAL = main_trials.length
  if (await handleSpecialMode() == 'normal') {
    await runTimeline(
      instructions,
      main,
      debrief
    )
  }
};
