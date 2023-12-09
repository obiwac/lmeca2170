// initialize WebGL context

const canvas = document.getElementById("canvas")
console.log(canvas)

/** @type {WebGLRenderingContext | WebGL2RenderingContext} */
const gl = canvas.getContext("webgl2") || canvas.getContext("experimental-webgl2") || canvas.getContext("webgl") || canvas.getContext("experimental-webgl")

if (!gl || (!(gl instanceof WebGLRenderingContext) && !(gl instanceof WebGL2RenderingContext))) {
	canvas.hidden = true
	throw Error("Browser doesn't support WebGL")
}

const x_res = gl.drawingBufferWidth
const y_res = gl.drawingBufferHeight

gl.viewport(0, 0, x_res, y_res)

// rendering

let prev = 0
let time = 0

/** @function
  * @param {number} now
  */
function render(now) {
	const dt = (now - prev) / 1000
	prev = now
	time += dt

	// clear screen

	gl.clearColor(1, 0, 1, 1)
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

	// continue render loop

	requestAnimationFrame(render)
}

requestAnimationFrame(render)
