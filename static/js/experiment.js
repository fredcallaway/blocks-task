
const PARAMS = conditionParameters(CONDITION, {
  social: [true, false],
  allowQuitSeconds: 120,
  // generation: 5
})

updateExisting(PARAMS, urlParams)
psiturk.recordUnstructuredData('params', PARAMS);

const DISPLAY = $('#display')
const PROLIFIC_CODE = 'CHDRYEDZ'
var BONUS = 0
var N_TRIAL = 6

function makeGlobal(obj) {
  Object.assign(window, obj)

}

function findTrial(name) {
  return STIMULI.compositions[name] ?? STIMULI.basic[name]
}


async function buildStimuli() {
  let all_stimuli = await $.getJSON(`static/json/all_stimuli.json`)
  let primitives = Object.keys(all_stimuli.basic)
  let compositions = cartesian(primitives, primitives)
  .filter(([x, y]) => x != y)
  .map(x => x.join('-'))

  let examples = _.shuffle(primitives.map(
    (name, i) => name + "-" + primitives[(i+1) % primitives.length]
  ))

  let used = new Set(examples)
  let main = _.shuffle(compositions).filter(name => {
    if (!used.has(name) && !used.has(name.split("-").reverse().join("-"))) {
      used.add(name)
      return true
    }
  })
  main.splice(3, 0, examples[3])

  if (!PARAMS.social) {
    examples = []
  }

  let stimuli = {primitives, examples, main}
  logEvent('experiment.buildStimuli', {stimuli})
  N_TRIAL = stimuli.main.length
  return _.mapValues(stimuli, names => names.map(name => all_stimuli.compositions[name]))
}


async function runExperiment() {
  // let stimuli = await $.getJSON(`static/json/gen${PARAMS.generation}/${CONDITION}.json`)
  let stimuli = await buildStimuli()
  console.log('stimuli', stimuli)


  logEvent('experiment.initialize', {CONDITION, PARAMS, stimuli})
  await handleSpecialMode() // never returns if in special mode

  enforceScreenSize(1200, 750)

  async function instructions() {
    logEvent('experiment.instructions')
    let trials = [
      {'name': 'easyrect', 'target': 'XXXXX\nXXXXX\nXXXXX'},
      {'name': 'easycross', 'target': '..XX..\n..XX..\nXXXXXX\nXXXXXX\n..XX..\n..XX..'},
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
      width: 1200,
      help: `
        Drag the blocks from the bottom of the screen to fill in all the white squares.
        You can rotate the block you're currently holding by pressing space.
        You can remove blocks by dragging them into the gray area.
      `
    }).prependTo(DISPLAY)

    let workspace = $('<div>').appendTo(DISPLAY)

    if (stimuli.examples.length) {
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
        'width': '450px'
      })
      .appendTo(DISPLAY)
      $('<h2>').text("Examples").appendTo(sidebar).css('margin-top', '-40px')
      let exampleDiv = $('<div>').appendTo(sidebar)

      // let solutions = (await $.getJSON(`static/json/solutions/fred-v2.json`)).solutions
      for (let trial of stimuli.examples) {
        let eDiv = $('<div>').css({display: 'inline-block', margin: 10}).appendTo(exampleDiv)
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
    let json = await $.getJSON('static/json/survey.json')
    await new SurveyTrial(json).run(DISPLAY)
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
