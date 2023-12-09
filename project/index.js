// a few constants up top

const TAU = 2 * Math.PI
const FLOAT32_SIZE = 4

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
		const RADIUS = 0.02
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

		for (let i = 0; i < DETAIL; i++) {
			indices.push(0, i + 1, i ? i : DETAIL)
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
		gl.vertexAttribPointer(0, 2, gl.FLOAT, false, FLOAT32_SIZE * 2, 0)

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
const node_shader = new Shader("node")

// camera controls

let pos = [-.5, -.5, 0]
let target_pos = [-.5, -.5, -1]

function anim(x, target, multiplier) {
	if (multiplier > 1) {
		return target
	}

	return x + (target - x) * multiplier
}

function anim_vec(x, target, multiplier) {
	let vec = structuredClone(x)

	for (let i = 0; i < x.length; i++) {
		vec[i] = anim(x[i], target[i], multiplier)
	}

	return vec
}

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

	// update camera parameters

	pos = anim_vec(pos, target_pos, dt * 5)

	// clear screen

	gl.clearColor(0, 0, 0, 0)
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

	// projection stuff

	const proj_mat = new Mat()
	proj_mat.perspective(TAU / 6, x_res / y_res, 0.2, 200)

	const view_mat = new Mat()
	view_mat.translate(...pos)

	const vp_mat = new Mat(view_mat)
	vp_mat.multiply(proj_mat)

	const model_mat = new Mat()
	const mvp_mat = new Mat(model_mat)
	mvp_mat.multiply(vp_mat)

	// render nodes

	node_shader.use()

	for (const [x, y] of nodeData) {
		mvp_mat.translate(x, y, 0)
		node_shader.mvp(mvp_mat)
		node.draw()
		mvp_mat.translate(-x, -y, 0)
	}

	// continue render loop

	requestAnimationFrame(render)
}

requestAnimationFrame(render)
