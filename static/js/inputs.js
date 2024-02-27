class Input {
  constructor() {
    this.div = $('<div>')
  }
  appendTo(div) {
    this.div.appendTo(div)
    return this
  }
  remove() {
    this.div.remove()
  }
}

class Button extends Input {
  click(f) {
    this.button.click(f)
    return this
  }
  constructor({text = 'continue', delay = 100} = {}) {
    super()
    this.div.css('text-align', 'center')

    this.button = $('<button>', {class: 'btn btn-primary'})
    .text(text)
    .appendTo(this.div)

    this.clicked = make_promise()
    // this.clicked.button = this  // for convenience
    this.button.click(() => {
      this.button.prop('disabled', true)
      sleep(delay).then(this.clicked.resolve)
    })
  }
}


class TextBox extends Input {
  constructor({height=100, width='500px', prompt=''} = {}) {
    super()
    this.prompt = $("<p>")
    .css('margin-top', 20)
    .html(prompt)
    .appendTo(this.div)

    this.textarea = $('<textarea>')
    .css({
      // margin: '10px 10%',
      padding: '10px',
      width,
      height
    })
    .appendTo(this.div)
    .focus()
  }
  val() {
    return this.textarea.val()
  }
}


class RadioButtons extends Input {
  constructor({prompt='', choices=['yes', 'no']}) {
    super()
    this.prompt = $("<p>")
    .css('margin-top', 20)
    .html(prompt)
    .appendTo(this.div)

    this._name = ('R' + Math.random()).replace('.', '')
    $('<div>')
    .html(choices.map(choice => `
      <input type="radio" id="${choice}" name="${this._name}" value="${choice}">
      <label for="${choice}">${choice}</label>
    `).join('\n'))
    .appendTo(this.div)

  }
  val() {
    return $(`input[name=${this._name}]:checked`).val()
  }
}

// TODO
// function make_slider(opt) {
//   let slider = $("<div>")
//   .css('margin', '60px')
//   .slider(opt)
//   for (let [lab, val] of Object.entries(opt.labels)) {
//     let pos = (val - opt.min) / (opt.max - opt.min)
//     console.log(`${100 * pos}%`)
//     $(`<label>${lab}</label>`)
//     .css({
//       'position': 'absolute',
//       'left': `${100 * pos}%`,
//       'text-align': 'center',
//       'width': '100px',
//       'transform': 'translate(-50%, 100%)',
//     })
//     .appendTo(slider)
//   }
//   return slider
// }

// async function make_buttons(div, texts, opts={}) {
//   container = $('<div>')
//   .css('text-align', 'center')
//   .appendTo(div)
//   opts.cls = 'btn btn-primary'
//   let buttons = texts.map(t => make_button(container, t, opts))
//   let prom = Promise.any(buttons)
//   if (opts.remove_after) {
//     prom.then(() => container.remove())
//   }
//   return prom
// }

function text_box(div, prompt, opts) {
  return new TextBox({prompt, ...opts}).appendTo(div)
}

function button(div, text, opts) {
  return new Button({text, ...opts}).appendTo(div)
}

function radio_buttons(div, prompt, choices, opts) {
  return new RadioButtons({prompt, choices, ...opts}).appendTo(div)
}


function alert_success(opts = {}) {
  let flavor = _.sample([
    "you're on fire", "top-notch stuff", "absolutely brilliant",
    "out of this world", "phenomenal", "you've outdone yourself", "A+ work",
    "nailed it", "rock star status", "most excellent", "impressive stuff",
    "smashed it", "genius", "spot on", "gold, pure gold",
    "bang-up job", "exceptional", "superb", "you're a natural", "knocked it out of the park"
  ])
  return Swal.fire({
    title: 'Success!',
    html: `<em>${flavor}!</em>`,
    icon: 'success',
    confirmButtonText: 'Continue',
    ...opts
  })
}

function alert_failure(opts = {}) {
  let flavor = _.sample([
    "better luck next time!",
    "shake it off and try again!",
    "failure is the spice that gives success its flavor!",
    "just a little detour on the road to greatness!",
    "everyone likes an underdog, get back in there!"
  ])
  return Swal.fire({
    title: "Let's try the next one",
    html: `<em>${flavor}!</em>`,
    icon: 'error',
    confirmButtonText: 'Continue',
    ...opts
  })

}

