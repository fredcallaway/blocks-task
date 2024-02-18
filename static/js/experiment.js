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

  
  let welcome_block = button_trial(`
    # Instructions

    In this experiment, you will ...
  `)

  if (searchParams.get('blank')) {
    targets = ['blank']
  } else if (searchParams.get('trial')) {
    targets = targets.slice(parseInt(searchParams.get('trial')) - 1)
  }

  let main_block = {
    type: 'blocks',
    timeline: targets.map(t => ({target: t}))
  }
  console.log('main_block', main_block)

  let debrief = {
    type: 'survey-text',
    preamble: () => {
      psiturk.recordUnstructuredData('bonus', BONUS / 100);
      return markdown(`
        # Study complete

        Thanks for participating! You earned a bonus of $${(BONUS / 100).toFixed(2)}.
        Please provide feedback on the study below.
        You can leave a box blank if you have no relevant comments.
      `)
    },
    questions: [
      'Were the instructions confusing, hard to understand, or too long?',
      'Was the interface at all difficult to use?',
      'Did you experience any technical problems (e.g., images not displaying)?',
      'Any other comments?',
    ].map(prompt => ({prompt, rows: 2, columns: 70}))
  }

  /////////////////////////
  // Experiment timeline //
  /////////////////////////

  let timeline = [
    // welcome_block,
    main_block,
    debrief,
  ];

  let skip = searchParams.get('skip');
  if (skip != null) {
    timeline = timeline.slice(skip);
  }

  return startExperiment({
    timeline,
    exclusions: {
      min_width: 800,
      min_height: 600
    },
  });
};


