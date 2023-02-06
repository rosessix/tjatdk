const { INT24 } = require("mysql/lib/protocol/constants/types");

// render a canvas
function renderCanvas(canvas, context, width, height, color) {
    context.fillStyle = color;
    context.fillRect(0, 0, width, height);
}
