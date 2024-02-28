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

  let top = new TopBar({
    nTrial: 10,
    help: `
      Drag the blocks from the bottom of the screen to fill in all the white squares.
      You can rotate the block you're currently holding by pressing space.
      You can remove blocks by dragging them into the gray area.
    `
  }).prependTo(display)
  window._top = top

  let content = $('<div>')
  .appendTo(display)

  for (let trial of _.shuffle(main_trials)) {
    top.incrementCounter()
    await new BlockPuzzle(trial).run(content)
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

async function runExperiment() {
  enforceScreenSize(1200, 750)
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
  N_TRIAL = main_trials.length

  if (await handleSpecialMode() == 'normal') {
    await runTimeline(
      instructions,
      main,
      debrief
    )
  }
};
