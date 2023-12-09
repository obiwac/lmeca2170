const TAU = 2 * Math.PI

// initialize WebGL context

const canvas = document.getElementById("canvas")

/** @type {WebGLRenderingContext | WebGL2RenderingContext} */
const gl = canvas.getContext("webgl2") || canvas.getContext("experimental-webgl2") || canvas.getContext("webgl") || canvas.getContext("experimental-webgl")

if (!gl || (!(gl instanceof WebGLRenderingContext) && !(gl instanceof WebGL2RenderingContext))) {
	canvas.hidden = true
	throw Error("Browser doesn't support WebGL")
}

const x_res = gl.drawingBufferWidth
const y_res = gl.drawingBufferHeight

gl.viewport(0, 0, x_res, y_res)

// nodes

class Node {
	constructor() {
		const RADIUS = 0.5
		const DETAIL = 32

		let vertices = []
		let indices = []

		// centre vertex all triangles will fan out from

		vertices.push(0, 0)

		// generate surrounding vertices

		for (let i = 0; i < DETAIL; i++) {
			const angle = (i / DETAIL) * TAU
			vertices.push(Math.cos(angle) * RADIUS, Math.sin(angle) * RADIUS)
		}

		// generate indices for all triangles

		for (let i = 0; i < DETAIL - 1; i++) {
			indices.push(0, i ? DETAIL : i + 1, i + 2)
		}

		/** @type: Float32Array */
		this.vbo_data = new Float32Array(vertices)

		/** @type: Uint8Array */
		this.indices = new Uint8Array(indices)

		this.vao = gl.createVertexArray()
		gl.bindVertexArray(this.vao)

		this.vbo = gl.createBuffer()
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo)
		gl.bufferData(gl.ARRAY_BUFFER, this.vbo_data, gl.STATIC_DRAW)

		gl.enableVertexAttribArray(0)
		gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)

		this.ibo = gl.createBuffer()
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo)
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW)
	}

	draw() {
		gl.bindVertexArray(this.vao)
		gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_BYTE, 0)
	}
}

const node = new Node()

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
