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
	constructor(x, y) {
		this.x = x
		this.y = y
	}
}

class Nodes {
	constructor(nodeData) {
		this.nodes = []

		for (const [x, y] of nodeData) {
			this.nodes.push(new Node(x, y))
		}

		this.vao = gl.createVertexArray()
		gl.bindVertexArray(this.vao)

		this.vbo = gl.createBuffer()
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo)

		gl.enableVertexAttribArray(0)
		gl.vertexAttribPointer(0, 2, gl.FLOAT, false, FLOAT32_SIZE * 2, 0)

		this.ibo = gl.createBuffer()
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo)
	}

	update_mesh() {
		// create mesh data

		const RADIUS = 0.02
		const DETAIL = 32

		let vertices = []
		let indices = []

		for (const node of this.nodes) {
			// centre vertex all triangles will fan out from

			vertices.push(node.x, node.y)

			// generate surrounding vertices

			for (let i = 0; i < DETAIL; i++) {
				const angle = (i / DETAIL) * TAU
				vertices.push(Math.cos(angle) * RADIUS + node.x, Math.sin(angle) * RADIUS + node.y)
			}

			// generate indices for all triangles

			const off = vertices.length

			for (let i = 0; i < DETAIL; i++) {
				indices.push(off, off + i + 1, off + (i ? i : DETAIL))
			}
		}

		this.indices_length = indices.length

		/** @type: Float32Array */
		const vbo_data = new Float32Array(vertices)

		/** @type: Uint32Array */
		const ibo_data = new Uint32Array(indices)

		// upload mesh data to GPU

		gl.bindVertexArray(this.vao)

		gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo)
		gl.bufferData(gl.ARRAY_BUFFER, vbo_data, gl.STATIC_DRAW)

		gl.enableVertexAttribArray(0)
		gl.vertexAttribPointer(0, 2, gl.FLOAT, false, FLOAT32_SIZE * 2, 0)

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo)
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, ibo_data, gl.STATIC_DRAW)
	}

	draw() {
		gl.bindVertexArray(this.vao)
		gl.drawElements(gl.TRIANGLES, this.indices_length, gl.UNSIGNED_INT, 0)
	}
}

const nodes = new Nodes(nodeData)
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

canvas.addEventListener("mousemove", e => {
	e.preventDefault()

	if (e.buttons & 0b1) {
		target_pos[0] += e.movementX / 400 * -target_pos[2]
		target_pos[1] -= e.movementY / 400 * -target_pos[2]
	}
})

canvas.addEventListener("wheel", e => {
	e.preventDefault()

	target_pos[2] -= e.deltaY / 800
	target_pos[2] = Math.min(target_pos[2], -.2)
})

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

	pos = anim_vec(pos, target_pos, dt * 15)

	// clear screen

	gl.clearColor(0, 0, 0, 1)
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

	// projection stuff

	const proj_mat = new Mat()
	proj_mat.perspective(TAU / 6, x_res / y_res, .1, 200)

	const view_mat = new Mat()
	view_mat.translate(...pos)

	const vp_mat = new Mat(view_mat)
	vp_mat.multiply(proj_mat)

	const model_mat = new Mat()
	const mvp_mat = new Mat(model_mat)
	mvp_mat.multiply(vp_mat)

	// render nodes

	node_shader.use()
	node_shader.mvp(mvp_mat)

	nodes.update_mesh()
	nodes.draw()

	// continue render loop

	requestAnimationFrame(render)
}

requestAnimationFrame(render)
