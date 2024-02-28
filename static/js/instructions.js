
class Instructions {
  constructor(display) {
    this.div = $('<div>')
    .css({
      height: 800,
      width: 1000,
      // border: 'thick black solid',
      position: 'relative',
      margin: 'auto',
      padding: '10px',
      'user-select': 'none',
    })

    let help = $('<button>')
    .appendTo(this.div)
    .css({
      'position': 'absolute',
      'right': '-50px',
      'top': '10px'
    })
    .addClass('btn-help')
    .text('?')
    .click(async () => {
      await Swal.fire({
          title: 'Help',
          html: `
            Use the << and >> buttons to flip through the sections. You have
            to follow all the instructions on a page before you can advance to the next one.
            If you get stuck, try clicking << and then >> to start the section over.
          `,
          icon: 'info',
          confirmButtonText: 'Got it!',
        })
    })

    this.btnPrev = $('<button>')
    .addClass('btn')
    .text('<<')
    .css({
      position: 'absolute',
      top: '30px',
      left: '30px',
    })
    .click(() => this.runPrev())
    .prop('disabled', true)
    .appendTo(this.div)

    this.btnNext = $('<button>')
    .addClass('btn')
    .text('>>')
    .css({
      position: 'absolute',
      top: '30px',
      right: '30px',
    })
    .click(() => this.runNext())
    .prop('disabled', true)
    .appendTo(this.div)

    this.prompt = $('<div>').css({
      'max-width': 700,
      'height': 100,
      'margin': 'auto',
    }).appendTo(this.div)

    this.content = $('<div>').appendTo(this.div)

    this.stage = null
    this.maxStage = 0
    this.stages = Object.getOwnPropertyNames(Object.getPrototypeOf(this))
    .filter(f => f.startsWith('stage_'))
    .map(f => this[f])

    this.completed = make_promise()

  }

  attach(display) {
    display.empty()
    this.div.appendTo(display)
    return this
  }

  async run(display, stage) {
    if (display) this.attach(display)
    if (stage == undefined && urlParams.instruct) {
      stage = parseInt(urlParams.instruct)
    }
    this.runStage(stage)
    await this.completed
  }

  sleep(ms) {
    // this allows us to cancel sleeps when the user flips to a new page
    this._sleep = make_promise()
    sleep(ms).then(() => this._sleep.resolve())
    return this._sleep
  }

  message(md) {
    this.prompt.html(markdown(md))
  }

  async button(text='continue', opts={}) {
    _.defaults(opts, {delay: 0})
    let btn = button(this.prompt, text, opts)
    await btn.clicked
    btn.remove()
  }

  instruct(md) {
    let prog = this.stage ? `(${this.stage}/${this.stages.length})` : ''
    this.message(`# Instructions ${prog}\n\n` + md)
  }

  async runStage(n) {
    this._sleep?.reject()
    this.prompt.empty()
    this.content.empty()
    this.content.css({opacity: 1}) // just to be safe
    logEvent(`instructions.runStage.${n}`)
    this.maxStage = Math.max(this.maxStage, n)
    this.stage = n
    this.btnNext.prop('disabled', this.stage >= this.maxStage)
    this.btnPrev.prop('disabled', this.stage <= 1)
    await this.stages[n-1].bind(this)()
    if (this.stage == n) {
      // check to make sure we didn't already move forward
      this.enableNext()
    }
  }

  runNext() {
    saveData()
    logEvent('instructions.runNext')
    this.btnNext.removeClass('btn-pulse')
    if (this.stage == this.stages.length) {
      logEvent('instructions.completed')
      psiturk.finishInstructions();
      this.completed.resolve()
      this.div.remove()
    } else {
      this.runStage(this.stage + 1)
    }
  }

  runPrev() {
    logEvent('instructions.runPrev')
    this.runStage(this.stage - 1)
  }

  enableNext() {
    this.btnNext.addClass('btn-pulse')
    this.maxStage = this.stage + 1
    this.btnNext.prop('disabled', false)
  }
}

class BlockInstructions extends Instructions {
  constructor(trials) {
    super()
    this.trials = trials
    window.instruct = this
  }

  async stage_welcome() {
    // this.instruct(`
    //   Thanks for participating! We'll start with some quick instructions.
    // `)

    this.instruct(`
      In this experiment, you will be asked to solve challenging puzzles
      that push the limits of the human mind.
    `)
  }

  async stage_basics() {
    new BlockPuzzle({
      ...this.trials[0], target: 'blank', practice: true, allowQuitSeconds: null,
    }).run(this.content)
    this.instruct(`Specifically, you're going to be playing with blocks. Try picking one up...`)

    // this.instruct(` Click and drag a block to pick it up... `)
    await eventPromise('blocks.pickup.library')

    this.instruct(`...then let go to place it! `)
    let erase = eventPromise('blocks.drop.erase')
    erase.then(() => {
      this.instruct(`
        If you try to place a block outside of the white area or on top of another block,
        it will dissapear. Try to place a block in the white area.
      `)
    })

    await eventPromise('blocks.drop.place')
    erase.reject()

    this.instruct(`
      Nice! You can also rotate blocks. Pick up a block and press <code>space</code>.
    `)
    await eventPromise('blocks.rotate')

    this.instruct(`You can erase blocks by dragging them on top of another block or into the gray area. `)
    await eventPromise('blocks.drop.erase')

    // this.instruct(`You can also click the button at the bottom to clear the screen.`)
    // $('#blocks-btn-clear').addClass('btn-pulse')
    // await eventPromise('blocks.clear')
    // $('#blocks-btn-clear').removeClass('btn-pulse')
    this.instruct(`You seem to have gotten the hang of this. Let's make things more interesting...`)
  }

  async stage_practice1() {
    this.instruct(`Try to fill in the white area.`)

    await new BlockPuzzle({
      ...this.trials[0], practice: true, allowQuitSeconds: null}
    ).run(this.content)
    this.runNext()
  }

  async stage_practice2() {
    this.instruct(`Let's try another one.`)
    await new BlockPuzzle({...this.trials[1], practice: true}).run(this.content)
    this.runNext()
  }

  async stage_giveup() {
    this.instruct(`How about this one?`)

    let target = `
      XXX
      XXX
      XXX
    `
    let resolved = new BlockPuzzle(
      {name: 'impossible', target, practice: true, allowQuitSeconds: 3}
    ).run(this.content)

    await this.sleep(5000)

    this.instruct('If you get stuck, you can use the "give up" button at the bottom.')
    $('#blocks-btn-give_up').addClass('btn-pulse')
    await resolved
    $('#blocks-btn-give_up').removeClass('btn-pulse')

    await this.content.animate({opacity: 0}, 500).promise()
    this.content.empty()
    await this.sleep(500)

    this.instruct(`
      That one was impossible, but all the remaining puzzles can be solved
      (pinky promise). Still, if you get really stuck, you can skip.
    `)
  }

  async stage_final() {
    this.instruct(`
      In the rest of the experiment, you'll solve ${N_TRIAL} more puzzles.
      There's no better or worse way to solve them. Just try to do them
      as quickly as you can, so that you can get on with your day!
      Feel free to review the instructions with the arrows before you move on.
      <br><br>
      <div class="alert alert-danger">
        <b>Warning!</b><br>
        Once you complete the instructions, <strong>you cannot refresh the page</strong>.
        If you do, you will get an error message and you won't be able to complete the
        study.
      </div>
    `)
    let question = 'Are you going to refresh the page after completing the instructions?'
    let radio = radio_buttons(this.prompt, question, ['yes', 'no'])
    let post = $('<div>').appendTo(this.prompt)
    let no = make_promise()
    let done = false
    radio.click((val) => {
      if (val == 'yes') {
        post.html("Haha... But seriously.")
      } else {
        no.resolve()
      }
    })
    await no
    radio.buttons().off()
    radio.buttons().prop('disabled', true)
    post.html('Good. No refreshing!')
    await this.button('finish instructions')
    this.runNext()
  }
}