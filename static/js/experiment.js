const PARAMS = {

}

updateExisting(PARAMS, urlParams)
psiturk.recordUnstructuredData('params', PARAMS);

const DISPLAY = $('#display')
const PROLIFIC_CODE = 'CHDRYEDZ'
var BONUS = 0
var STIMULI = null
var N_TRIAL = null

async function runExperiment() {
  STIMULI = await $.getJSON(`static/json/stimuli.json`)
  await handleSpecialMode() // never returns if in special mode

  enforceScreenSize(1200, 750)

  let seen = new Set()
  let main_trials = _.shuffle(STIMULI.compositions).filter(stim => {
    let alt = stim.name.split("-").reverse().join("-")
    if (seen.has(alt)) {
      return false
    } else {
      seen.add(stim.name)
      return true
    }
  })
  N_TRIAL = main_trials.length

  async function instructions(stage=1) {
    logEvent('experiment.instructions')
    let trials = [
      {'name': 'easyrect', 'target': 'XXXXX\nXXXXX\nXXXXX'},
      _.sample(STIMULI.basic)
    ]
    console.log('DISPLAY', DISPLAY)
    await new BlockInstructions(trials).run(DISPLAY, stage)
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
    }).prependTo(DISPLAY)

    let content = $('<div>').appendTo(DISPLAY)

    for (let trial of _.shuffle(main_trials)) {
      await new BlockPuzzle(trial).run(content)
      top.incrementCounter()
      saveData()
    }
  }

  async function debrief() {
    logEvent('experiment.debrief')
    DISPLAY.empty()
    $('<p>').appendTo(DISPLAY).html(markdown(`
      # You're done!

      Thanks for participating! We have a few quick questions before you go.
    `))

    let noticed = radio_buttons(DISPLAY, `
      Did you notice that some shapes showed up multiple times?
    `, ['yes', 'no'])

    let difficulty = radio_buttons(DISPLAY, `
      How difficult were the problems, overall?
    `, ['too easy', 'just right', 'too hard'])

    let feedback = text_box(DISPLAY, `
      Do you have any other feedback? (optional)
    `)

    await button(DISPLAY, 'submit').clicked
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

  await runTimeline(
    instructions,
    main,
    debrief
  )
};
