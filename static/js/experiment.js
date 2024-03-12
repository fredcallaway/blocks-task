
const PARAMS = conditionParameters(CONDITION, {
  social: [true, false],
  allowQuitSeconds: 90,
})

updateExisting(PARAMS, urlParams)
psiturk.recordUnstructuredData('params', PARAMS);

const DISPLAY = $('#display')

// DISPLAY.css({border: 'thick red dashed', width: 2000, height: 2000})

const PROLIFIC_CODE = 'CHDRYEDZ'
var BONUS = 0
var N_TRIAL = 5

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

  let examples = _.shuffle(_.flatten([1,2].map(offset => primitives.map(
    (name, i) => name + "-" + primitives[(i+offset) % primitives.length]
  ))))
  console.log('examples', examples)

  let used = new Set(examples)
  let main = _.shuffle(compositions).filter(name => {
    if (!used.has(name)) {
    // if (!used.has(name) && !used.has(name.split("-").reverse().join("-"))) {
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
  return _.mapValues(stimuli, names => names.map(name => all_stimuli.compositions[name]))
}


async function runExperiment() {
  let stimuli = await $.getJSON(`static/json/${CONDITION}.json`)
  // let stimuli = await buildStimuli()
  N_TRIAL = stimuli.main.length

  logEvent('experiment.initialize', {CONDITION, PARAMS, stimuli})
  await handleSpecialMode() // never returns if in special mode

  enforceScreenSize(1200, 750)

  async function instructions() {
    let trials = [
      // {'name': 'easy1', 'target': '.XX.\nXXXX\nXXXX\n.XX.'},
      {'name': 'plunger', 'target': 'XXXXX\nXXXXX\n.XXX.\n..X..\n..X..\n..X..'},
      {'name': 'pagoda', 'target': '..XX..\nXXXXXX\n.XXXX.'},

    ]
    await new BlockInstructions(trials).run(DISPLAY)
  }

  function showExample(div, example, size=15) {
    let eDiv = $('<div>').css({
      'display': 'inline-block',
      'margin': '10px'
    }).appendTo(div)
    let eTrial = {
      ...example,
      grid: size,
      showSolution: true
    }
    return new BlockDisplayOnly(eTrial).attach(eDiv)
  }

  async function social() {
    if (!stimuli.examples.length) return
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
      'margin-bottom': '30px'
    }).appendTo(DISPLAY)

    let blockDisplays = stimuli.examples.map(example => showExample(exampleDiv, example))


    let btn = button(DISPLAY, 'continue')
    await btn.clicked
    btn.div.remove()

    let testDiv = $('<div>').addClass('center')
    .html('Please click on the example above that is a 180 degree rotation of the one below:')
    .appendTo(DISPLAY)


    async function mistake() {
      logEvent('social.mistake')
      await alert_failure_delay(1000)
    }

    for (let bd of blockDisplays) {
      bd.div.css({cursor: 'pointer'})
      bd.div.click(mistake)
    }

    let test = $('<div>').addClass('center').appendTo(testDiv)
    if (urlParams.rotate) {
      test.css('transform', 'rotate(180deg)')
    }
    makeGlobal({testDiv, test})

    for (let i of _.shuffle(_.range(stimuli.examples.length))) {
      test.empty()
      showExample(test, stimuli.examples[i])
      let promise = make_promise()
      blockDisplays[i].div.off()
      blockDisplays[i].div.click(() => promise.resolve())
      await promise
      logEvent('social.correct')
      blockDisplays[i].div.click(mistake)

    }
    testDiv.empty()



    await button(DISPLAY, 'continue').clicked
  }

  async function main() {
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
      for (let example of stimuli.examples) {
        showExample(exampleDiv, example)
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
    let json = await $.getJSON('static/json/survey.json')
    await new SurveyTrial(json).run(DISPLAY)
  }

  async function runTimeline(...blocks) {
    let start = _.map(blocks, 'name').indexOf(urlParams.block)
    if (start != -1) {
      blocks = blocks.slice(start)
    }
    for (const block of blocks) {
      logEvent('experiment.timeline.start.' + block.name)
      await block()
      logEvent('experiment.timeline.end.' + block.name)
    }
  }

  await runTimeline(
    instructions,
    social,
    main,
    debrief
  )
};
