const GRID = 30
const WIDTH = 30
const HEIGHT = 15

const TRAY_HEIGHT = 5

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

function hex2rgb(hex) {
  // Convert hex color to rgb
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

class Block {
  constructor(x, y, parts, color) {
    this.x = x;
    this.y = y;
    this.parts = parts; // Array of {x, y} parts relative to the block's position
    this.color = color;
    this.colliding = false;
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
      const partX = this.x + part.x * GRID;
      const partY = this.y + part.y * GRID;
      ctx.fillRect(partX, partY, GRID, GRID);
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.lineWidth = 2;
      ctx.strokeRect(partX, partY, GRID, GRID);
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
      const partX = this.x + part.x * GRID;
      const partY = this.y + part.y * GRID;

      // For each side of the part, draw a line if there is no adjacent part
      if (!hasAdjacentPart(part.x, part.y - 1)) {
        // No part above, draw top line
        ctx.beginPath();
        ctx.moveTo(partX, partY);
        ctx.lineTo(partX + GRID, partY);
        ctx.stroke();
      }
      if (!hasAdjacentPart(part.x + 1, part.y)) {
        // No part to the right, draw right line
        ctx.beginPath();
        ctx.moveTo(partX + GRID, partY);
        ctx.lineTo(partX + GRID, partY + GRID);
        ctx.stroke();
      }
      if (!hasAdjacentPart(part.x, part.y + 1)) {
        // No part below, draw bottom line
        ctx.beginPath();
        ctx.moveTo(partX, partY + GRID);
        ctx.lineTo(partX + GRID, partY + GRID);
        ctx.stroke();
      }
      if (!hasAdjacentPart(part.x - 1, part.y)) {
        // No part to the left, draw left line
        ctx.beginPath();
        ctx.moveTo(partX, partY);
        ctx.lineTo(partX, partY + GRID);
        ctx.stroke();
      }
    });
  }

  partContains(part, x, y) {
    const partX = this.x + part.x * GRID;
    const partY = this.y + part.y * GRID;
    return x >= partX && x < partX + GRID && y >= partY && y < partY + GRID;

  }

  contains(x, y) {
    return this.parts.some(part => {
      return this.partContains(part, x, y)
    });
  }

  isWithinBoundary(canvas) {
    return this.parts.every(part => {
      const partX = this.x + part.x * GRID;
      const partY = this.y + part.y * GRID;

      return partX >= 0 && partX + GRID <= canvas.width &&
           partY >= 0 && partY + GRID <= canvas.height;
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

function buildLibrary(blocks) {
    let xPos = 1
    return blocks.map((s, i) => {
        let block = string2block(s, GRID * xPos, 0, i)
        block.y = GRID * (HEIGHT + TRAY_HEIGHT - block.height() - 1)
        xPos += block.width() + 1
        return block
    })
}

async function runBlockTrial(div, trial) {
  // console.log('trial.target', trial.target)
  logEvent('blocks.start', trial)

  $(div).empty()
  $('<div>')
  .css({
    'width': '100%',
    'text-align': 'center',
    'margin-bottom': '10px'
  })
  .html(`
    Fill in all the white squares. Press <b>space</b> to rotate a piece
  `).appendTo($(div))

  const canvas = $('<canvas>')
  .prop({
    width: WIDTH*GRID,
    height: (HEIGHT + TRAY_HEIGHT) *GRID
  }).css({
    'margin-left': 'auto',
    'margin-right': 'auto',
    'display': 'block',
  })
  .appendTo($(div))[0]

  let buttons = $("<div>")
  .css({
    'margin': 'auto',
    'margin-top': '20px',
    'width': '600px'
  }).appendTo(div)

  $('<button>').addClass('btn').css('margin', '10pt').text('clear').appendTo(buttons).click(() => {
      activeBlocks.clear()
      drawCanvas()
  })

  $('<button>').addClass('btn').css('margin', '10pt').text('copy').appendTo(buttons).click(() => {
      navigator.clipboard.writeText(captureState())
      drawCanvas()
  })

  $('<button>').addClass('btn').css('margin', '10pt').text('set target').appendTo(buttons).click(() => {
      navigator.clipboard.writeText(captureState())
      let prev = target
      target = string2block(captureState(), 0, 0, 'white')
      activeBlocks.clear()
      target.x = prev.x
      target.y = prev.y
      drawCanvas()
  })

  const ctx = canvas.getContext('2d');

  let isDragging = false;
  let isSpacePressed = false;
  let dragOffsetX, dragOffsetY;
  let currentBlock = null; // To keep track of the block being dragged
  let mouseX = null;
  let mouseY = null;

  // Define blocks, including an L-shaped block
  const activeBlocks = new Set();

  const library = buildLibrary(trial.blocks)
  let target = string2block(trial.target, 0, 0, 'white')
  target.x = GRID * Math.floor((WIDTH - target.width()) / 2)
  target.y = GRID * Math.ceil(1+(HEIGHT - target.height()) / 2)

  window.activeBlocks = activeBlocks
  window.target = target

  function drawCanvas() {
    // ctx.clearRect(0, 0, canvas.width, canvas.height)

    ctx.fillStyle = '#BBBBBB'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    target.draw(ctx)
    // ctx.fillRect(0, (HEIGHT) * GRID, WIDTH*GRID, (HEIGHT)*GRID);

    drawTray()
    drawBlocks()
  }

  function drawTray() {
    // ctx.fillStyle = '#BBBBBB'
    // ctx.fillRect(0, (HEIGHT) * GRID, WIDTH*GRID, (HEIGHT)*GRID);

    library.forEach((block, i, x) => {
      // block.x = GRID * (1 + 4*i)
      // block.y = GRID * (HEIGHT - TRAY_HEIGHT + 1)
      block.draw(ctx)
    })
    // ctx.fillRect(0, 0, GRID, canvas.height);
    // ctx.fillRect(canvas.width - GRID, 0, GRID, canvas.height);
    // ctx.fillRect(0, 0, canvas.width, GRID);

  }

  function drawBlocks() {
    // Draw all blocks except the currentBlock
    activeBlocks.forEach(block => {
      if (block !== currentBlock) {
        block.draw(ctx);
      }
    });

    // Now draw the currentBlock, if it exists, so it's on top
    if (currentBlock) {
      currentBlock.draw(ctx);
    }
  }

  function checkVictory() {
    for (let part of target.parts) {
      const partX = target.x + part.x * GRID;
      const partY = target.y + part.y * GRID;
      if (!isCovered(partX, partY)) return false;
    }
    return true;
  }

  function captureState() {
    // let width = target.width()
    return _.range(HEIGHT).map(y => {
      return _.range(WIDTH).map(x => {
        return isCovered(target.x + GRID*x, target.y + GRID*y) ? 'X' : '.'
      }).join('')
    }).join('\n')
  }

  function isCovered(x, y) {
    for (let block of activeBlocks) {
      if (block.contains(x + GRID / 2, y + GRID / 2)) {
        return true; // Collision detected
      }
    }
    return false;
  }

  function checkCollision(movingBlock) {
    if (!movingBlock.isWithinBoundary(canvas)) return true;

    for (let part of movingBlock.parts) {
      const partX = movingBlock.x + part.x * GRID;
      const partY = movingBlock.y + part.y * GRID;

      // if (partY >= canvas.height - TRAY_HEIGHT * GRID) return true;
      if (!target.contains(partX + GRID / 2, partY + GRID / 2)) return true;

      for (let block of activeBlocks) {
        if (block === movingBlock) continue; // Skip the moving block itself

        if (block.contains(partX + GRID / 2, partY + GRID / 2)) {
          // We add GRID / 2 to check the center of each part for a more accurate collision detection
          return true; // Collision detected
        }
      }
    }
    return false; // No collision detected
  }

  function clearColliding() {
    for (let block of activeBlocks) {
      if (block != currentBlock && block.colliding) {
        activeBlocks.delete(block)
      }
    }

  }

  function tryUpdatePosition(block, x, y) {
    oldX = block.x
    oldY = block.y
    block.x = x;
    block.y = y;

    if (!block.isWithinBoundary(canvas)) {
      block.x = oldX;
      block.y = oldY;
      return false
    };
    return true
  }

  // Event listener for keydown to detect if the spacebar is pressed
  document.addEventListener('keydown', (e) => {
    logEvent('blocks.keydown', e)
    if ((e.code === 'Space' || e.code == 'KeyR') && isDragging) {
      e.preventDefault(); // Prevent default to avoid scrolling the page
      logEvent('blocks.rotate')
      if (currentBlock) {
        currentBlock.rotate(mouseX, mouseY);
        currentBlock.colliding = checkCollision(currentBlock);
        drawCanvas(); // Redraw all blocks
      }
    }
  });

  canvas.addEventListener('mousedown', (e) => {
    logEvent('blocks.mousedown', e)
    mouseX = e.offsetX;
    mouseY = e.offsetY;
    for (let block of activeBlocks) {
      if (block.contains(mouseX, mouseY)) {
        isDragging = true;
        currentBlock = block;
        dragOffsetX = mouseX - block.x;
        dragOffsetY = mouseY - block.y;
        logEvent('blocks.pickup.active', {block})
      }
    };
    for (let block of library) {
      if (block.contains(mouseX, mouseY)) {
        block = _.cloneDeep(block)
        activeBlocks.add(block)
        isDragging = true;
        currentBlock = block;
        dragOffsetX = mouseX - block.x;
        dragOffsetY = mouseY - block.y;
        logEvent('blocks.pickup.library', {block})
      }
    };
  });

  // canvas.addEventListener("mouseout", (e) => {
  //     isDragging = false
  //     currentBlock = null
  // });

  canvas.addEventListener('mousemove', (e) => {
    logEvent('blocks.mousemove', e)
    if (isDragging && currentBlock) {
      mouseX = e.offsetX
      mouseY = e.offsetY
      const newX = e.offsetX - dragOffsetX;
      const newY = e.offsetY - dragOffsetY;

      // Snap to GRID
      const snappedX = Math.round(newX / GRID) * GRID;
      const snappedY = Math.round(newY / GRID) * GRID;


      const updated = tryUpdatePosition(currentBlock, snappedX, snappedY)
      if (updated) {
        currentBlock.colliding = checkCollision(currentBlock);
        clearColliding()
        drawCanvas(); // Redraw all blocks
      }
    }
  });

  let trialDone = make_promise()
  window.addEventListener('mouseup', async (e) => {
    logEvent('blocks.mouseup', e)
    if (isDragging) {

      logEvent(currentBlock.colliding ? 'blocks.drop.erase' : 'blocks.drop.place',
               {block: currentBlock, state: captureState()})
      isDragging = false;
      currentBlock = null;
      clearColliding()
      drawCanvas()
      if (checkVictory()) {
        logEvent('blocks.victory')
        await alert_success()
        trialDone.resolve();
      }
    }
  });

  drawCanvas();
  await trialDone;
};
