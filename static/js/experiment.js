
const PARAMS = conditionParameters(CONDITION, {
  social: false,
  allowQuitSeconds: 120,
  generation: 3
})

updateExisting(PARAMS, urlParams)
psiturk.recordUnstructuredData('params', PARAMS);

const DISPLAY = $('#display')
const PROLIFIC_CODE = 'CHDRYEDZ'
var BONUS = 0
var STIMULI = null
var N_TRIAL = 5

function findTrial(name) {
  return STIMULI.compositions[name] ?? STIMULI.basic[name]
  // return _.find(STIMULI.basic.concat(STIMULI.compositions), {name})
}


function makeGlobal(obj) {
  Object.assign(window, obj)

}


async function runExperiment() {
  stimuli = await $.getJSON(`static/json/gen${PARAMS.generation}/${CONDITION}.json`)

  logEvent('experiment.initialize', {CONDITION, PARAMS, stimuli})
  await handleSpecialMode() // never returns if in special mode

  enforceScreenSize(1200, 750)

  async function instructions() {
    logEvent('experiment.instructions')
    let trials = [
      {'name': 'easyrect', 'target': 'XXXXX\nXXXXX\nXXXXX'},
      {'name': 'easycross', 'target': '..XX..\n..XX..\nXXXXXX\nXXXXXX\n..XX..\n..XX..'},
      // _.sample(STIMULI.basic)
    ]
    await new BlockInstructions(trials).run(DISPLAY)
  }

  async function social() {
    if (!stimuli.examples.length) return
    logEvent('experiment.social')
    DISPLAY.empty()
    $('<div>').html(markdown(`
      # Examples

      The remaining puzzles are a lot harder than ones you've seen so far. To help
      out, here are some examples of solutions that other people came up with. They
      will be on the screen the whole time, so no need to try to memorize them.
    `)).addClass('text').appendTo(DISPLAY)

    let exampleDiv = $('<div>').css({
      width: 1000,
      'text-align': 'center',
      'margin': 'auto',
      'margin-top': '10px',
      'margin-bottom': '30px'
    }).appendTo(DISPLAY)

    for (let trial of stimuli.examples) {
      let eDiv = $('<div>').css({
        'display': 'inline-block',
        'margin': '10px'

      }).appendTo(exampleDiv)
      let eTrial = {
        ...trial,
        configuration: trial.solution,
        grid: 20,
      }
      new BlockDisplayOnly(eTrial).attach(eDiv)
    }
    await button(DISPLAY, 'continue').clicked
  }

  async function main() {
    logEvent('experiment.main')
    DISPLAY.empty()
    let top = new TopBar({
      nTrial: stimuli.main.length,
      height: 70,
      width: 1150,
      help: `
        Drag the blocks from the bottom of the screen to fill in all the white squares.
        You can rotate the block you're currently holding by pressing space.
        You can remove blocks by dragging them into the gray area.
      `
    }).prependTo(DISPLAY)

    let workspace = $('<div>').appendTo(DISPLAY)

    if (PARAMS.generation > 1) {
      workspace.css({
        // 'border': 'thick black solid',
        'float': 'left',
        'width': '750px'
      })

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
    }

    let prm = _.pick(PARAMS, ['allowQuitSeconds'])
    for (let trial of stimuli.main) {
      // trial.configuration = trial.solution
      await new BlockPuzzle({...prm, ...trial}).run(workspace)
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
      Did you notice that some parts of the puzzles showed up multiple times?
    `, ['yes', 'no'])

    let reuse = radio_buttons(DISPLAY,
      PARAMS.social ?
        `Did you try to copy from the examples?` :
        `Did you try to reuse parts from your previous solutions?`,
      ['yes', 'no'])

    let difficulty = radio_buttons(DISPLAY, `
      How difficult were the problems, overall?
    `, ['too easy', 'just right', 'too hard'])

    let feedback = text_box(DISPLAY, `
      Do you have any other feedback? (optional)
    `)

    await button(DISPLAY, 'submit').clicked
    logEvent('debrief.submitted', {
      noticed: noticed.val(),
      reuse: reuse?.val(),
      difficulty: difficulty.val(),
      feedback: feedback.val(),
    })
  }

  async function runTimeline(...blocks) {
    let start = _.map(blocks, 'name').indexOf(urlParams.block)
    if (start != -1) {
      blocks = blocks.slice(start)
    }
    for (const block of blocks) {
      await block()
    }
  }

  await runTimeline(
    instructions,
    social,
    main,
    debrief
  )
};
