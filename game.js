const GRID = 30
const WIDTH = 30
const HEIGHT = 20

const TRAY_HEIGHT = 5

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

    draw(ctx) {
        ctx.fillStyle = this.colliding ? `rgba(${this.getRgb(this.color)},0.2)` : this.color; // Set transparency on collision
        this.parts.forEach(part => {
            const partX = this.x + part.x * GRID;
            const partY = this.y + part.y * GRID;
            ctx.fillRect(partX, partY, GRID, GRID);
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 1;
            ctx.strokeRect(partX, partY, GRID, GRID);
        });
        this.drawShapeOutline(ctx); // Only draw the outline if not colliding
    }

    draw(ctx) {
        // Draw individual parts with a thin outline
        ctx.fillStyle = this.colliding ? `rgba(${hex2rgb(this.color)},0.2)` : this.color; // Set transparency on collision
        this.parts.forEach(part => {
            const partX = this.x + part.x * GRID;
            const partY = this.y + part.y * GRID;
            ctx.fillRect(partX, partY, GRID, GRID);
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(partX, partY, GRID, GRID);
        });

        // Now, draw the thick border around the shape
        this.drawShapeOutline(ctx);
    }



    // Other methods remain unchanged
    rotate() {
        // Rotate the block 90 degrees clockwise around the first part
        const pivot = this.parts[0];
        this.parts.forEach(part => {
            const x = part.x - pivot.x;
            const y = part.y - pivot.y;
            part.x = -y + pivot.x;
            part.y = x + pivot.y;
        });
    }

    drawShapeOutline(ctx) {
        ctx.strokeStyle = 'black';
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

    contains(x, y) {
        return this.parts.some(part => {
            const partX = this.x + part.x * GRID;
            const partY = this.y + part.y * GRID;
            return x >= partX && x < partX + GRID && y >= partY && y < partY + GRID;
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

document.addEventListener('DOMContentLoaded', () => {
    const canvas = $('<canvas>')
    .prop({
        width: WIDTH*GRID,
        height: HEIGHT*GRID
    }).css({
        'margin-left': 'auto',
        'margin-right': 'auto',
        'display': 'block',
    })
    .appendTo($('#blocksCanvasContainer'))[0]
    // const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    let isDragging = false;
    let isSpacePressed = false;
    let dragOffsetX, dragOffsetY;
    let currentBlock = null; // To keep track of the block being dragged

    // Define blocks, including an L-shaped block
    const blocks = new Set([
        new Block(60, 60, [{x: 0, y: 0}], '#4292FA'),
        new Block(120, 60, [{x: 0, y: 0}, {x: 0, y: 1}, {x: 0, y: 2}, {x: 1, y: 2}], '#D4609A')
    ]);



    function drawCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        drawTray()
        drawBlocks()
    }

    function drawTray() {
        ctx.fillStyle = '#BBBBBB'
        ctx.fillRect(0, (HEIGHT-TRAY_HEIGHT) * GRID, WIDTH*GRID, (HEIGHT-TRAY_HEIGHT)*GRID);
        // ctx.fillRect(0, 0, GRID, canvas.height);
        // ctx.fillRect(canvas.width - GRID, 0, GRID, canvas.height);
        // ctx.fillRect(0, 0, canvas.width, GRID);

    }

    function drawBlocks() {
        // Draw all blocks except the currentBlock
        blocks.forEach(block => {
            if (block !== currentBlock) {
                block.draw(ctx);
            }
        });

        // Now draw the currentBlock, if it exists, so it's on top
        if (currentBlock) {
            currentBlock.draw(ctx);
        }
    }

    function checkCollision(movingBlock) {
        if (!movingBlock.isWithinBoundary(canvas)) return true;

        for (let part of movingBlock.parts) {
            const partX = movingBlock.x + part.x * GRID;
            const partY = movingBlock.y + part.y * GRID;

            if (partY >= canvas.height - TRAY_HEIGHT * GRID) return true;

            for (let block of blocks) {
                if (block === movingBlock) continue; // Skip the moving block itself

                if (block.contains(partX + GRID / 2, partY + GRID / 2)) {
                    // We add GRID / 2 to check the center of each part for a more accurate collision detection
                    return true; // Collision detected
                }
            }
        }
        return false; // No collision detected
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
        if (e.code === 'Space' && isDragging) {
            e.preventDefault(); // Prevent default to avoid scrolling the page
            if (currentBlock) {
                currentBlock.rotate();
                drawCanvas(); // Redraw all blocks
            }
        }
    });

    canvas.addEventListener('mousedown', (e) => {
        const mouseX = e.offsetX;
        const mouseY = e.offsetY;
        blocks.forEach(block => {
            if (block.contains(mouseX, mouseY)) {
                isDragging = true;
                currentBlock = block;
                dragOffsetX = mouseX - block.x;
                dragOffsetY = mouseY - block.y;
            }
        });
    });

    canvas.addEventListener("mouseout", (e) => {
        isDragging = false
        currentBlock = null
    });

    canvas.addEventListener('mousemove', (e) => {
        if (isDragging && currentBlock) {
            const newX = e.offsetX - dragOffsetX;
            const newY = e.offsetY - dragOffsetY;

            // Snap to GRID
            const snappedX = Math.round(newX / GRID) * GRID;
            const snappedY = Math.round(newY / GRID) * GRID;


            const updated = tryUpdatePosition(currentBlock, snappedX, snappedY)
            if (updated) {
                currentBlock.colliding = checkCollision(currentBlock);
                drawCanvas(); // Redraw all blocks
            }
        }
    });

    canvas.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            if (currentBlock.colliding) {
                blocks.delete(currentBlock)
                currentBlock = null;
                drawCanvas()
            }
            currentBlock = null;
        }
    });

    drawCanvas();
});
