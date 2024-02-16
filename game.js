const GRID = 30

class Block {
    constructor(x, y, parts, color) {
        this.x = x;
        this.y = y;
        this.parts = parts; // Array of {x, y} parts relative to the block's position
        this.color = color;
    }

    draw(ctx) {
        // Draw individual parts with a thin outline
        ctx.fillStyle = this.color;
        this.parts.forEach(part => {
            const partX = this.x + part.x * GRID;
            const partY = this.y + part.y * GRID;
            ctx.fillRect(partX, partY, GRID, GRID);
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(partX, partY, GRID, GRID);
        });

        // Now, draw the thick border around the shape
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        this.drawShapeOutline(ctx);
    }

    drawShapeOutline(ctx) {
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
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    let isDragging = false;
    let dragOffsetX, dragOffsetY;
    let currentBlock = null; // To keep track of the block being dragged

    // Define blocks, including an L-shaped block
    const blocks = [
        new Block(60, 60, [{x: 0, y: 0}], 'cyan'),
        new Block(120, 60, [{x: 0, y: 0}, {x: 0, y: 1}, {x: 0, y: 2}, {x: 1, y: 2}], 'orange')
    ];

    // Function to draw all blocks
    function drawBlocks() {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        blocks.forEach(block => block.draw(ctx));
    }

    function checkCollision(movingBlock) {
        if (!movingBlock.isWithinBoundary(canvas)) return true;
        for (let block of blocks) {
            if (block === movingBlock) continue; // Skip the moving block itself

            // Check each part of the moving block against all parts of the current block
            for (let part of movingBlock.parts) {
                const partX = movingBlock.x + part.x * GRID;
                const partY = movingBlock.y + part.y * GRID;

                if (block.contains(partX + GRID / 2, partY + GRID / 2)) {
                    // We add GRID / 2 to check the center of each part for a more accurate collision detection
                    return true; // Collision detected
                }
            }
        }
        return false; // No collision detected
    }

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

    canvas.addEventListener('mousemove', (e) => {
        if (isDragging && currentBlock) {
            const newX = e.offsetX - dragOffsetX;
            const newY = e.offsetY - dragOffsetY;

            // Snap to GRID
            const snappedX = Math.round(newX / GRID) * GRID;
            const snappedY = Math.round(newY / GRID) * GRID;

            // Boundary check
            if (snappedX < 0 || snappedY < 0 || snappedX + GRID > canvas.width || snappedY + GRID > canvas.height) {
                return; // Block would move outside the canvas, so ignore this move
            }

            // Collision detection for detailed shapes
            oldX = currentBlock.x
            oldY = currentBlock.y
            // Apply new position
            currentBlock.x = snappedX;
            currentBlock.y = snappedY;
            if (checkCollision(currentBlock)) {
                currentBlock.x = oldX
                currentBlock.y = oldY
                return; // Collision detected, so ignore this move
            }

            // Clear the previous position
            drawBlocks(); // Redraw all blocks
        }
    });

    canvas.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            currentBlock = null;
        }
    });

    drawBlocks();
});
