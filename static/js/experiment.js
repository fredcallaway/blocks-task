const PARAMS = {

}

updateExisting(PARAMS, urlParams)
psiturk.recordUnstructuredData('params', PARAMS);

const PROLIFIC_CODE = 'TODO'
var BONUS = 0

const display = $('#display')

async function instructions(start=1) {
  await new BlockInstructions(TRIALS.practice).attach(display).run(start)
}

async function main() {
  console.log('running main')
  for (let trial of TRIALS.main) {
    await new BlockPuzzle(trial).attach(display).run()
  }
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
  if (urlParams.dev) {
    await new BlockPuzzle({
      target: 'blank',
      library: LIBRARIES[urlParams.dev] ?? LIBRARIES.easy,
      dev: true
    }).attach(display).run()
    return
  }
  if (urlParams.trial) {
    trials = trials.slice(parseInt(urlParams.trial) - 1)
    await main()
    return
  }
  if (urlParams.instruct) {
    await instructions(parseInt(urlParams.instruct))
    await main()
  }

  // const stimuli = await $.getJSON('static/stimuli/stimuli.json')
  await runTimeline(
    instructions,
    main
  )

};


