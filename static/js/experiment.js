const PARAMS = {

}

updateExisting(PARAMS, urlParams)
psiturk.recordUnstructuredData('params', PARAMS);

const DISPLAY = $('#display')
const PROLIFIC_CODE = 'CHDRYEDZ'
var BONUS = 0
var STIMULI = null
var N_TRIAL = null

function findTrial(name) {
  return _.find(STIMULI.basic.concat(STIMULI.compositions), {name})
}


function makeGlobal(obj) {
  Object.assign(window, obj)

}

function buildStimuli() {
  let basic = _.map(_.shuffle(STIMULI.basic), 'name')
  let compositions = _.map(_.shuffle(STIMULI.compositions), 'name')

  let examples = basic.map((name, i) => name + "-" + basic[(i+1) % basic.length])

  let used = new Set(examples)
  console.log('used', used)
  let main = _.shuffle(compositions).filter(name => {
    if (!used.has(name) && !used.has(name.split("-").reverse().join("-"))) {
      used.add(name)
      return true
    }
  })
  N_TRIAL = main.length
  return {
    examples: _.shuffle(examples).map(findTrial),
    main: main.map(findTrial)
  }
}

async function runExperiment() {
  STIMULI = await $.getJSON(`static/json/stimuli.json`)
  await handleSpecialMode() // never returns if in special mode

  enforceScreenSize(1200, 750)
  let stimuli = buildStimuli()

  async function instructions(stage=1) {
    logEvent('experiment.instructions')
    let trials = [
      {'name': 'easyrect', 'target': 'XXXXX\nXXXXX\nXXXXX'},
      _.sample(STIMULI.basic)
    ]
    await new BlockInstructions(trials).run(DISPLAY, stage)
  }

  async function main() {
    logEvent('experiment.main')
    let top = new TopBar({
      nTrial: stimuli.main.length,
      height: 70,
      width: 1000,
      help: `
        Drag the blocks from the bottom of the screen to fill in all the white squares.
        You can rotate the block you're currently holding by pressing space.
        You can remove blocks by dragging them into the gray area.
      `
    }).prependTo(DISPLAY)

    let workspace = $('<div>')
    .css({
      // 'border': 'thick black solid',
      'float': 'left',
      'width': '750px'
    })
    .appendTo(DISPLAY)

    let sidebar = $('<div>')
    .css({
      // 'border': 'thick red solid',
      'user-select': 'none',
      'float': 'left',
      'width': '300px'
    })
    .appendTo(DISPLAY)
    $('<h2>').text("Examples").appendTo(sidebar).css('margin-top', '-40px')
    let exampleDiv = $('<div>').appendTo(sidebar)


    // let solutions = (await $.getJSON(`static/json/solutions/fred-v2.json`)).solutions
    for (let trial of stimuli.examples) {
      let eDiv = $('<div>').css('display', 'inline-block').appendTo(exampleDiv)
      let eTrial = {
        ...trial,
        configuration: trial.solution,
        grid: 15,
      }
      new BlockDisplayOnly(eTrial).attach(eDiv)
    }

    for (let trial of stimuli.main) {
      // trial.configuration = trial.solution
      await new BlockPuzzle(trial).run(workspace)
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
