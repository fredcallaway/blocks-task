const PARAMS = {

}

updateExisting(PARAMS, urlParams)
psiturk.recordUnstructuredData('params', PARAMS);

const PROLIFIC_CODE = 'TODO'
var BONUS = 0

var targets = [
  `
    XXXX
    XXXX
  `,
  `
    .XX.
    XXXX
    XXXX
    XXXX
    XXXX
    .XX.
    XXXX
    XXXX
    XXXX
  `, `
    ..XX..
    .XXXX.
    .XXXX.
    .XXXX.
    XXXXXX
    ..XXX.
    .XXXXX
    .XXXX
    XXXXX.
    .XXX..
  `,
  'blank'
]

const display = $('#display')

async function instructions() {
  let instructions = $('<div>').css({'max-width': 800, 'margin': 'auto'}).appendTo(display)
  text_box(instructions, "What's up doc?")
  radio_buttons(instructions, "Is it good?")
  await button(instructions, 'continue', {delay: 1000}).clicked
}

async function main() {
  if (urlParams.trial) {
    targets = targets.slice(parseInt(urlParams.trial) - 1)
  }

  for (let target of targets) {
    await runBlockTrial(display, {target})
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
    await runBlockTrial(display, {target: 'blank'})
    return
  }

  // const stimuli = await $.getJSON('static/stimuli/stimuli.json')
  // await instructions()
  // await main()
  await runTimeline(
    instructions,
    main
  )

};


