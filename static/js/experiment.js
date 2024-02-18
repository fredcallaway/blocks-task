const PARAMS = {

}

updateExisting(PARAMS, urlParams)
psiturk.recordUnstructuredData('params', PARAMS);

const PROLIFIC_CODE = 'TODO'
var BONUS = 0

const display = $('#display')

async function instructions() {
  let instructions = $('<div>').css({'max-width': 800, 'margin': 'auto'}).appendTo(display)
  text_box(instructions, "What's up doc?")
  radio_buttons(instructions, "Is it good?")
  await button(instructions, 'continue', {delay: 1000}).clicked
}

async function main() {
  if (urlParams.trial) {
    trials = trials.slice(parseInt(urlParams.trial) - 1)
  }

  for (let trial of trials) {
    await runBlockTrial(display, trial)
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

  if (urlParams.blank) {
    await runBlockTrial(display, {target: 'blank', blocks: urlParams.blank == 'hard' ? hard_blocks : easy_blocks})
    return
  }

  // const stimuli = await $.getJSON('static/stimuli/stimuli.json')
  // await instructions()
  // await main()
  await runTimeline(
    // instructions,
    main
  )

};


