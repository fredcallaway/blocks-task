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

  draw(ctx) {
    // Draw individual parts with a thin outline
    ctx.fillStyle = this.colliding ? `rgba(${hex2rgb(this.color)},0.2)` : this.color; // Set transparency on collision
    this.parts.forEach(part => {
      const partX = this.x + part.x * this.grid;
      const partY = this.y + part.y * this.grid;
      ctx.fillRect(partX, partY, this.grid, this.grid);
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.lineWidth = 2;
      ctx.strokeRect(partX, partY, this.grid, this.grid);
    });

    // Now, draw the thick border around the shape
    this.drawShapeOutline(ctx);
  }

  // Other methods remain unchanged
  rotate(x, y) {
    // Rotate the block 90 degrees clockwise around the first part
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

  drawShapeOutline(ctx) {
    ctx.strokeStyle = this.colliding ? 'rgba(0,0,0,0.2)' : 'black';
    ctx.lineWidth = 2;
    // Helper function to check if there is an adjacent part
    const hasAdjacentPart = (dx, dy) => {
      return this.parts.some(part => part.x === dx && part.y === dy);
    };

    this.parts.forEach(part => {
      const partX = this.x + part.x * this.grid;
      const partY = this.y + part.y * this.grid;

      // For each side of the part, draw a line if there is no adjacent part
      if (!hasAdjacentPart(part.x, part.y - 1)) {
        // No part above, draw top line
        ctx.beginPath();
        ctx.moveTo(partX, partY);
        ctx.lineTo(partX + this.grid, partY);
        ctx.stroke();
      }
      if (!hasAdjacentPart(part.x + 1, part.y)) {
        // No part to the right, draw right line
        ctx.beginPath();
        ctx.moveTo(partX + this.grid, partY);
        ctx.lineTo(partX + this.grid, partY + this.grid);
        ctx.stroke();
      }
      if (!hasAdjacentPart(part.x, part.y + 1)) {
        // No part below, draw bottom line
        ctx.beginPath();
        ctx.moveTo(partX, partY + this.grid);
        ctx.lineTo(partX + this.grid, partY + this.grid);
        ctx.stroke();
      }
      if (!hasAdjacentPart(part.x - 1, part.y)) {
        // No part to the left, draw left line
        ctx.beginPath();
        ctx.moveTo(partX, partY);
        ctx.lineTo(partX, partY + this.grid);
        ctx.stroke();
      }
    });
  }

  partContains(part, x, y) {
    const partX = this.x + part.x * this.grid;
    const partY = this.y + part.y * this.grid;
    return x >= partX && x < partX + this.grid && y >= partY && y < partY + this.grid;

  }

  contains(x, y) {
    return this.parts.some(part => {
      return this.partContains(part, x, y)
    });
  }

  isWithinBoundary(canvas) {
    return this.parts.every(part => {
      const partX = this.x + part.x * this.grid;
      const partY = this.y + part.y * this.grid;

      return partX >= 0 && partX + this.grid <= canvas.width &&
           partY >= 0 && partY + this.grid <= canvas.height;
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


function string2block(s, x, y, color, grid) {
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
    return new Block(x, y, parts, color, grid)
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
      prompt: `Fill in all the white squares. Press <code>space</code> to rotate a piece`
    })
    logEvent('blocks.construct', options)
    Object.assign(this, options)
    window.puzzle = this

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
      let block = string2block(s, this.grid * xPos, 0, i, this.grid);
      block.y = this.grid * (this.height + this.tray_height - block.height() - 1);
      xPos += block.width() + 1;
      return block;
    });
  }

  buildTarget(block) {
    let target = string2block(block, 0, 0, 'white', this.grid)
    target.x = this.grid * Math.floor((this.width - target.width()) / 2)
    target.y = this.grid * Math.ceil(1+(this.height - target.height()) / 2)
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
      width: this.width*this.grid,
      height: (this.height + this.tray_height) *this.grid
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

    $('<button>').addClass('btn').css('margin', '10px').text('clear').appendTo(buttons).click(() => {
      logEvent('blocks.clear')
      this.activeBlocks.clear()
      this.drawCanvas()
    })

    $('<button>').addClass('btn').css('margin', '10px').text('copy').appendTo(buttons).click(() => {
      navigator.clipboard.writeText(this.captureState())
      this.drawCanvas()
    })

    $('<button>').addClass('btn').css('margin', '10px').text('set target').appendTo(buttons).click(() => {
      navigator.clipboard.writeText(this.captureState())
      let prev = this.target
      this.target = string2block(this.captureState(), 0, 0, 'white', this.grid)
      this.activeBlocks.clear()
      this.target.x = prev.x
      this.target.y = prev.y
      this.drawCanvas()
    })
  }

  drawCanvas() {
    this.ctx.fillStyle = BACKGROUND;
    this.ctx.fillRect(0, 0, this.width * this.grid, (this.height + this.tray_height) * this.grid);
    this.target.draw(this.ctx);
    this.library.forEach(block => {
      block.draw(this.ctx);
    });
    this.activeBlocks.forEach(block => {
      if (block !== this.currentBlock) {
        block.draw(this.ctx);
      }
    });
    if (this.currentBlock) {
      this.currentBlock.draw(this.ctx);
    }
  }

  checkVictory() {
    for (let part of this.target.parts) {
      const partX = this.target.x + part.x * this.grid;
      const partY = this.target.y + part.y * this.grid;
      if (!this.isCovered(partX, partY)) return false;
    }
    return true;
  }

  isCovered(x, y) {
    for (let block of this.activeBlocks) {
      if (block.contains(x + this.grid / 2, y + this.grid / 2)) {
        return true;
      }
    }
    return false;
  }

  captureState() {
    // let width = target.width()
    return _.range(this.height).map(y => {
      return _.range(this.width).map(x => {
        return this.isCovered(this.target.x + this.grid*x, this.target.y + this.grid*y) ? 'X' : '.'
      }).join('')
    }).join('\n')
  }

  checkCollision(movingBlock) {
    if (!movingBlock.isWithinBoundary(this.canvas)) return true;

    for (let part of movingBlock.parts) {
      const partX = movingBlock.x + part.x * this.grid;
      const partY = movingBlock.y + part.y * this.grid;

      // if (partY >= canvas.height - TRAY_HEIGHT * this.grid) return true;
      if (!this.target.contains(partX + this.grid / 2, partY + this.grid / 2)) return true;

      for (let block of this.activeBlocks) {
        if (block === movingBlock) continue; // Skip the moving block itself

        if (block.contains(partX + this.grid / 2, partY + this.grid / 2)) {
          // We add this.grid / 2 to check the center of each part for a more accurate collision detection
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

    if (!block.isWithinBoundary(this.canvas)) {
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
      this.mouseX = e.offsetX;
      this.mouseY = e.offsetY;
      for (let block of this.activeBlocks) {
        if (block.contains(this.mouseX, this.mouseY)) {
          this.isDragging = true;
          this.currentBlock = block;
          this.dragOffsetX = this.mouseX - block.x;
          this.dragOffsetY = this.mouseY - block.y;
          logEvent('blocks.pickup.active', {block})
        }
      };
      for (let block of this.library) {
        if (block.contains(this.mouseX, this.mouseY)) {
          block = _.cloneDeep(block)
          this.activeBlocks.add(block)
          this.isDragging = true;
          this.currentBlock = block;
          this.dragOffsetX = this.mouseX - block.x;
          this.dragOffsetY = this.mouseY - block.y;
          logEvent('blocks.pickup.library', {block})
        }
      };
    });

    this.canvas.addEventListener('mousemove', (e) => {
      logEvent('blocks.mousemove', e)
      if (this.isDragging && this.currentBlock) {
        this.mouseX = e.offsetX
        this.mouseY = e.offsetY
        const newX = e.offsetX - this.dragOffsetX;
        const newY = e.offsetY - this.dragOffsetY;

        // Snap to this.grid
        const snappedX = Math.round(newX / this.grid) * this.grid;
        const snappedY = Math.round(newY / this.grid) * this.grid;


        const updated = this.tryUpdatePosition(this.currentBlock, snappedX, snappedY)
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
        console.log('isDragging mouseup')

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

