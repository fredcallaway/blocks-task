const PARAMS = {

}
updateExisting(PARAMS, mapObject(Object.fromEntries(searchParams), maybeJson))
psiturk.recordUnstructuredData('params', PARAMS);

const PROLIFIC_CODE = 'TODO'

var BONUS = 0


function button_trial(html, opts={}) {
  return {
    stimulus: markdown(html),
    type: "html-button-response",
    is_html: true,
    choices: ['Continue'],
    button_html: '<button class="btn btn-primary btn-lg">%choice%</button>',
    ...opts
  }
}

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

async function initializeExperiment() {
  LOG_DEBUG('initializeExperiment');

  // const stimuli = await $.getJSON('static/stimuli/stimuli.json')

  if (searchParams.get('blank')) {
    targets = ['blank']
  } else if (searchParams.get('trial')) {
    targets = targets.slice(parseInt(searchParams.get('trial')) - 1)
  }

  let main_block = {
    type: 'blocks',
    timeline: targets.map(t => ({target: t}))
  }

  let display = $('#jspsych-target')

  text_box(display, "What's up doc?")
  radio_buttons(display, "Is it good?")
  await button(display, 'continue', {delay: 1000}).clicked

  for (let target of targets) {
    console.log('hello')
    await runBlockTrial(display, {target})
  }
};


