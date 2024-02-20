
class Instructions {
  constructor(display) {
    this.div = $('<div>')
    .css({
      height: 800,
      width: 1000,
      // border: 'thick black solid',
      position: 'relative',
      margin: 'auto',
      padding: '30px'
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
      'height': 120,
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

  async run() {
    this.runStage(1)
    await this.completed
    console.log("END RUN")
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
    this.prompt.empty()
    this.content.empty()
    logEvent(`instructions.runStage.${n}`)
    this.maxStage = Math.max(this.maxStage, n)
    this.stage = n
    this.btnNext.prop('disabled', this.stage >= this.maxStage)
    this.btnPrev.prop('disabled', this.stage <= 1)
    await this.stages[n-1].bind(this)()
    this.enableNext()
  }

  runNext() {
    logEvent('instructions.runNext')
    this.btnNext.removeClass('btn-pulse')
    if (this.stage == this.stages.length) {
      logEvent('instructions.completed')
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

  async stage_welcome() {
    // this.instruct(`
    //   Thanks for participating! We'll start with some quick instructions.
    // `)

    this.instruct(`
      In this experiment, you will be asked to solve challenging puzzles
      that push the limits of the human mind.
    `)
    await this.button()

    this.instruct(` Specifically, you're going to be playing with blocks. `)
  }

  async stage_basics() {
    let blank = new BlockPuzzle({...trials[0], target: 'blank', prompt: false, practice: true}).attach(this.content)
    blank.run()

    this.instruct(` Click and drag a block to pick it up... `)
    await eventPromise('blocks.pickup.library')

    this.instruct(` Click and drag a block to pick it up... Then let go to place it! `)
    let erase = eventPromise('blocks.drop.erase')
    erase.then(() => {
      this.instruct(`
        If you try to place a block outside of the white area or on top of another block,
        it will dissapear. Try to place a block in the white area.
      `)
    })

    await eventPromise('blocks.drop.place')
    erase.reject()
    // await sleep()

    this.instruct(`
      Nice! You can also rotate blocks. Pick up a block and press <code>space</code>.
    `)
    await eventPromise('blocks.rotate')

    this.instruct(` You can erase blocks by dragging them on top of another block or into the gray area. `)
    await eventPromise('blocks.drop.erase')

    this.instruct(`You can also click the button at the bottom to clear the screen.`)
    await eventPromise('blocks.clear')

    this.instruct(`Yup, just like that.`)
  }

  async stage_practice1() {

    this.instruct(`You seem to have gotten the hang of this. Let's make things more interesting.`)
    await this.button()
    this.instruct(`Try to fill in the white area.`)

    let puzzle = new BlockPuzzle({...trials[0], prompt: false, practice: true}).attach(this.content)
    this.content.animate({opacity: 1}, 200)
    await puzzle.run()
  }

  async stage_practice2() {
    this.instruct(`Well done! Let's try a harder one.`)
    await new BlockPuzzle({...trials[1], prompt: false, practice: true}).attach(this.content).run()

    await this.content.animate({opacity: 0}, 500).promise()
    this.content.empty()
    await sleep(500)

    this.instruct(`That's it! Simple stuff right?`)
  }

  async stage_final() {
    this.instruct(`
      In the rest of the experiment, you'll solve TODO more puzzles.
      There's no better or worse way to solve them. Just try to do them
      as quickly as you can, so that you can get on with your day!
    `)
    await this.button()

    this.instruct(`
      Feel free to play around with the board as long as you like. Click the next
      button when you're ready to continue.
    `)

    new BlockPuzzle({...trials[0], target: 'blank', prompt: false, practice: true}).attach(this.content).run()
    this.content.animate({opacity: 1}, 200)
  }
}

