const BACKGROUND = "#ADADAD"

const COLORS = [
  "#e41a1c",
  "#377eb8",
  "#4daf4a",
  "#984ea3",
  "#ff7f00",
  "#FFEF33",
  "#f781bf",
  "#a65628",
]


class Block {
  constructor(x, y, parts, color, grid) {
    this.x = x;
    this.y = y;
    this.parts = parts; // Array of {x, y} parts relative to the block's position
    this.color = color;
    this.colliding = false;
    this.grid = grid
  }

  width() {
    return _(this.parts).map((part) => part.x).max() + 1
  }

  height() {
    return _(this.parts).map((part) => part.y).max() + 1
  }

  draw(ctx, grid) {
    // Draw individual parts with a thin outline
    ctx.fillStyle = this.colliding ? `rgba(${hex2rgb(this.color)},0.2)` : this.color; // Set transparency on collision
    this.parts.forEach(part => {
      const partX = (this.x + part.x) * grid;
      const partY = (this.y + part.y) * grid;
      ctx.fillRect(partX, partY, grid, grid);
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.lineWidth = 2;
      ctx.strokeRect(partX, partY, grid, grid);
    });

    // Now, draw the thick border around the shape
    ctx.strokeStyle = this.colliding ? 'rgba(0,0,0,0.2)' : 'black';
    ctx.lineWidth = 2;
    // Helper function to check if there is an adjacent part
    const hasAdjacentPart = (dx, dy) => {
      return this.parts.some(part => part.x === dx && part.y === dy);
    };

    this.parts.forEach(part => {
      const partX = (this.x + part.x) * grid;
      const partY = (this.y + part.y) * grid;

      // For each side of the part, draw a line if there is no adjacent part
      if (!hasAdjacentPart(part.x, part.y - 1)) {
        // No part above, draw top line
        ctx.beginPath();
        ctx.moveTo(partX, partY);
        ctx.lineTo(partX + grid, partY);
        ctx.stroke();
      }
      if (!hasAdjacentPart(part.x + 1, part.y)) {
        // No part to the right, draw right line
        ctx.beginPath();
        ctx.moveTo(partX + grid, partY);
        ctx.lineTo(partX + grid, partY + grid);
        ctx.stroke();
      }
      if (!hasAdjacentPart(part.x, part.y + 1)) {
        // No part below, draw bottom line
        ctx.beginPath();
        ctx.moveTo(partX, partY + grid);
        ctx.lineTo(partX + grid, partY + grid);
        ctx.stroke();
      }
      if (!hasAdjacentPart(part.x - 1, part.y)) {
        // No part to the left, draw left line
        ctx.beginPath();
        ctx.moveTo(partX, partY);
        ctx.lineTo(partX, partY + grid);
        ctx.stroke();
      }
    });
  }

  rotate(x, y) {
    // Rotate the block 90 degrees clockwise around a pivot
    // Try to pivot around the block the mouse is on
    let pivot = this.parts[0];
    for (let part of this.parts) {
      if (this.partContains(part, x, y)) {
        pivot = part
        break
      }
    }

    this.parts.forEach(part => {
      const x = part.x - pivot.x;
      const y = part.y - pivot.y;
      part.x = -y + pivot.x;
      part.y = x + pivot.y;
    });
  }

  partContains(part, x, y) {
    const partX = (this.x + part.x);
    const partY = (this.y + part.y);
    return x >= partX && x < partX + 1 && y >= partY && y < partY + 1;

  }

  contains(x, y) {
    return this.parts.some(part => {
      return this.partContains(part, x, y)
    });
  }

  isWithinBoundary(width, height) {
    return this.parts.every(part => {
      const partX = (this.x + part.x);
      const partY = (this.y + part.y);

      return partX >= 0 && partX <= width &&
           partY >= 0 && partY <= height;
    });
  }

}

const BLANK = `
  XXXXXXXXXXXXXXXXXXXXXXXXXX
  XXXXXXXXXXXXXXXXXXXXXXXXXX
  XXXXXXXXXXXXXXXXXXXXXXXXXX
  XXXXXXXXXXXXXXXXXXXXXXXXXX
  XXXXXXXXXXXXXXXXXXXXXXXXXX
  XXXXXXXXXXXXXXXXXXXXXXXXXX
  XXXXXXXXXXXXXXXXXXXXXXXXXX
  XXXXXXXXXXXXXXXXXXXXXXXXXX
  XXXXXXXXXXXXXXXXXXXXXXXXXX
  XXXXXXXXXXXXXXXXXXXXXXXXXX
  XXXXXXXXXXXXXXXXXXXXXXXXXX
  XXXXXXXXXXXXXXXXXXXXXXXXXX
  XXXXXXXXXXXXXXXXXXXXXXXXXX
`

const TETRIS_BLOCKS = [
  `
    XX
    XX
  `, `
    .XX
    XX.
  `, `
    XX.
    .XX
  `, `
    .X
    .X
    XX
  `, `
    X
    X
    XX
  `, `
   X
   X
   X
   X
  `
]


function string2block(s, x, y, color) {
    if (s == 'blank') {
      s = BLANK
    }
    if (typeof(color) == 'number') {
      color = COLORS[color]
    }
    let rows = s.trim().split('\n')
    let parts = []
    rows.forEach((row, y) => {
      row.trim().split('').forEach((v, x) => {
        if (v == "X") {
          parts.push({x, y})
        }
      })
    })
    return new Block(x, y, parts, color)
}




class BlockPuzzle {
  constructor(options = {}) {
    _.defaults(options, {
      grid: 30,
      width: 30,
      height: 15,
      tray_height: 5,
      library: TETRIS_BLOCKS,
      target: BLANK,
      prompt: `Fill in all the white squares. Press <code>space</code> to rotate a piece`,
      dev: false,
    })
    logEvent('blocks.construct', options)
    Object.assign(this, options)
    window.puzzle = this

    if (this.dev) {
      this.prompt = `
      <b>Developer Mode</b>&nbsp;&nbsp;
      Use this interface to design problems. Construct a shape with the blocks, then
      press the "copy" button to copy a plain text definition of that shape. You can
      also use "set target" to input a shape in the same format (useful for testing yourself).
      `
    }

    this.library = this.buildLibrary(this.library);
    this.target = this.buildTarget(this.target)
    this.buildDisplay()
    this.solved = make_promise()

    this.activeBlocks = new Set();
    this.isDragging = false;
    this.currentBlock = null; // The block currently being dragged
    this.dragOffsetX = null;
    this.dragOffsetY = null;
    this.mouseX = null;
    this.mouseY = null;

    this.drawCanvas()
  }

  attach(display) {
    display.empty()
    this.div.appendTo(display)
    return this
  }

  buildLibrary(blocks) {
    let xPos = 1;
    return blocks.map((s, i) => {
      let block = string2block(s, xPos, 0, i);
      block.y = (this.height + this.tray_height - block.height() - 1);
      xPos += block.width() + 1;
      return block;
    });
  }

  buildTarget(block) {
    let target = string2block(block, 0, 0, 'white')
    target.x = Math.floor((this.width - target.width()) / 2)
    target.y = Math.ceil(1+(this.height - target.height()) / 2)
    return target
  }

  buildDisplay() {
    this.div = $("<div>")
    .css('text-align', 'center')

    if (this.prompt) {
      this.prompt = $('<div>')
      .css({
        'width': '100%',
        'text-align': 'center',
        'margin-bottom': '10px'
      })
      .html(this.prompt).appendTo(this.div)
    }

    this.canvas = $('<canvas>')
    .prop({
      width: this.width * this.grid,
      height: (this.height + this.tray_height) * this.grid
    }).css({
      'margin-left': 'auto',
      'margin-right': 'auto',
      'display': 'block',
    })
    .appendTo(this.div)[0]
    this.ctx = this.canvas.getContext('2d');

    let buttons = $("<div>")
    .css({
      'margin': 'auto',
      'margin-top': '10px',
      'display': 'inline-block'
    }).appendTo(this.div)

    let quickDisable = async (event) => {
      $(event.target).prop('disabled', true)
      await sleep(300)
      $(event.target).prop('disabled', false)
    }

    $('<button>').addClass('btn').css('margin', '10px').text('clear').appendTo(buttons)
    .click((e) => {
      quickDisable(e)
      logEvent('blocks.clear')
      this.activeBlocks.clear()
      this.drawCanvas()
    })

    if (this.dev) {
      $('<button>').addClass('btn').css('margin', '10px').text('copy').appendTo(buttons)
      .click((e) => {
        quickDisable(e)
        navigator.clipboard.writeText(this.captureState())
        // toast
        this.drawCanvas()
      })

      $('<button>').addClass('btn').css('margin', '10px').text('set target').appendTo(buttons)
      .click(async (e) => {
        quickDisable(e)
        let res = await Swal.fire({
            title: "Input Problem",
            text: "The current shape is used by default.",
            input: 'textarea',
            customClass: {input: 'mono-text'},
            width: 400,
            inputValue: this.captureState(),
            showCancelButton: true
        })
        if (res.value) {
          let prev = this.target
          this.target = string2block(res.value, 0, 0, 'white')
          this.activeBlocks.clear()
          this.target.x = prev.x
          this.target.y = prev.y
          this.drawCanvas()
        }
      })
    }
  }

  drawCanvas() {
    this.ctx.fillStyle = BACKGROUND;
    this.ctx.fillRect(0, 0, this.width * this.grid, (this.height + this.tray_height) * this.grid);
    this.target.draw(this.ctx, this.grid);
    this.library.forEach(block => {
      block.draw(this.ctx, this.grid);
    });
    this.activeBlocks.forEach(block => {
      if (block !== this.currentBlock) {
        block.draw(this.ctx, this.grid);
      }
    });
    if (this.currentBlock) {
      this.currentBlock.draw(this.ctx, this.grid);
    }
  }

  checkVictory() {
    for (let part of this.target.parts) {
      const partX = (this.target.x + part.x);
      const partY = (this.target.y + part.y);
      if (!this.isCovered(partX, partY)) return false;
    }
    return true;
  }

  isCovered(x, y) {
    for (let block of this.activeBlocks) {
      if (block.contains(x + .5, y + .5)) {
        return true;
      }
    }
    return false;
  }

  captureState() {
    return _.range(this.height).map(y => {
      return _.range(this.width).map(x => {
        return this.isCovered(this.target.x + x, this.target.y + y) ? 'X' : '.'
      }).join('')
    }).join('\n')
  }

  checkCollision(movingBlock) {
    if (!movingBlock.isWithinBoundary(this.width, this.height)) return true;

    for (let part of movingBlock.parts) {
      const partX = movingBlock.x + part.x;
      const partY = movingBlock.y + part.y;

      // Check if within target
      if (!this.target.contains(partX + .5, partY + .5)) return true;

      // Check if within another active block
      for (let block of this.activeBlocks) {
        if (block === movingBlock) continue;

        if (block.contains(partX + .5, partY + .5)) {
          return true; // Collision detected
        }
      }
    }
    return false; // No collision detected
  }

  clearColliding() {
    for (let block of this.activeBlocks) {
      if (block != this.currentBlock && block.colliding) {
        this.activeBlocks.delete(block)
      }
    }
  }

  tryUpdatePosition(block, x, y) {
    if (block.x == x && block.y == y) return false;
    let oldX = block.x
    let oldY = block.y
    block.x = x;
    block.y = y;

    if (!block.isWithinBoundary(this.width, this.height)) {
      block.x = oldX;
      block.y = oldY;
      return false
    };
    return true
  }

  startListeners() {
    // Event listener for keydown to detect if the spacebar is pressed
    document.addEventListener('keydown', (e) => {
      logEvent('blocks.keydown', e)
      if ((e.code === 'Space' || e.code == 'KeyR') && this.isDragging) {
        e.preventDefault(); // Prevent default to avoid scrolling the page
        logEvent('blocks.rotate')
        if (this.currentBlock) {
          this.currentBlock.rotate(this.mouseX, this.mouseY);
          this.currentBlock.colliding = this.checkCollision(this.currentBlock);
          this.drawCanvas(); // Redraw all blocks
        }
      }
    });

    this.canvas.addEventListener('mousedown', (e) => {
      logEvent('blocks.mousedown', e)
      this.mouseX = e.offsetX / this.grid;
      this.mouseY = e.offsetY / this.grid;
      for (let block of this.activeBlocks) {
        if (block.contains(this.mouseX, this.mouseY)) {
          logEvent('blocks.pickup.active', {block})
          this.isDragging = true;
          this.currentBlock = block;
          this.dragOffsetX = this.mouseX - block.x;
          this.dragOffsetY = this.mouseY - block.y;
        }
      };
      for (let block of this.library) {
        if (block.contains(this.mouseX, this.mouseY)) {
          block = _.cloneDeep(block)
          logEvent('blocks.pickup.library', {block})
          this.activeBlocks.add(block)
          this.isDragging = true;
          this.currentBlock = block;
          this.dragOffsetX = this.mouseX - block.x;
          this.dragOffsetY = this.mouseY - block.y;
        }
      };
    });

    this.canvas.addEventListener('mousemove', (e) => {
      logEvent('blocks.mousemove', e)
      if (this.isDragging && this.currentBlock) {
        this.mouseX = e.offsetX / this.grid
        this.mouseY = e.offsetY / this.grid
        const newX = Math.round(this.mouseX - this.dragOffsetX);
        const newY = Math.round(this.mouseY - this.dragOffsetY);

        const updated = this.tryUpdatePosition(this.currentBlock, newX, newY)
        if (updated) {
          this.currentBlock.colliding = this.checkCollision(this.currentBlock);
          this.clearColliding()
          this.drawCanvas(); // Redraw all blocks
        }
      }
    });

    window.addEventListener('mouseup', async (e) => {
      logEvent('blocks.mouseup', e)
      if (this.isDragging) {
        logEvent(this.currentBlock.colliding ? 'blocks.drop.erase' : 'blocks.drop.place',
                 {block: this.currentBlock, state: this.captureState()})
        this.isDragging = false;
        this.currentBlock = null;
        this.clearColliding()
        this.drawCanvas()
        if (this.checkVictory()) {
          logEvent('blocks.victory')
          await alert_success()
          this.solved.resolve();
        }
      }
    });
  }

  async run() {
    this.drawCanvas();
    this.startListeners()
    await this.solved
  }
}

