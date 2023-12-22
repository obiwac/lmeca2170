import { Node, Triangle, Line } from "./primitives.js"
import { FLOAT32_SIZE, TAU } from "./utils.js"
import { Fortune } from "./fortune.js"

// TODO find a better name for this

export class Nodes {
	constructor(gl, nodeData) {
		this.gl = gl
		this.nodes = []

		for (const [x, y] of nodeData) {
			this.nodes.push(new Node(x, y, this.nodes.length))
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

	/** @function
	  * @param {number} x
	  * @param {number} y
	  */
	add(x, y) {
		this.nodes.push(new Node(x, y, this.nodes.length))
	}

	update_mesh() {
		// create mesh data

		const RADIUS = 0.02
		const DETAIL = 32

		let vertices = []
		let indices = []

		for (const node of this.nodes) {
			const off = vertices.length / 2

			// centre vertex all triangles will fan out from

			vertices.push(node.x, node.y)

			// generate surrounding vertices

			for (let i = 0; i < DETAIL; i++) {
				const angle = (i / DETAIL) * TAU
				vertices.push(Math.cos(angle) * RADIUS + node.x, Math.sin(angle) * RADIUS + node.y)
			}

			// generate indices for all triangles

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

		this.gl.bindVertexArray(this.vao)

		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo)
		this.gl.bufferData(this.gl.ARRAY_BUFFER, vbo_data, this.gl.STATIC_DRAW)

		this.gl.enableVertexAttribArray(0)
		this.gl.vertexAttribPointer(0, 2, this.gl.FLOAT, false, FLOAT32_SIZE * 2, 0)

		this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.ibo)
		this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, ibo_data, this.gl.STATIC_DRAW)
	}

	draw() {
		this.gl.bindVertexArray(this.vao)
		this.gl.drawElements(this.gl.TRIANGLES, this.indices_length, this.gl.UNSIGNED_INT, 0)
	}

	fortune() {
		this.fortune_obj = new Fortune(this.nodes)
		return this.fortune_obj.fortune()
	}
}

export class Triangles {
	/** @constructor
	  * @param {WebGLRenderingContext | WebGL2RenderingContext} gl
	  * @param {Triangle[]} triangles
	  */
	constructor(gl, triangles) {
		this.gl = gl
		this.triangles = triangles

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

		let vertices = []
		let indices = []

		// TODO what I should really be doing is shifting the edges across their normals

		function shifted_coord(main_node, other_node_1, other_node_2) {
			const dx_1 = main_node.x - other_node_1.x
			const dy_1 = main_node.y - other_node_1.y

			const norm_1 = Math.sqrt(dx_1 * dx_1 + dy_1 * dy_1)

			const dx_2 = main_node.x - other_node_2.x
			const dy_2 = main_node.y - other_node_2.y

			const norm_2 = Math.sqrt(dx_2 * dx_2 + dy_2 * dy_2)

			const nx = (dx_1 / norm_1 + dx_2 / norm_2) / 2 * -0.01
			const ny = (dy_1 / norm_1 + dy_2 / norm_2) / 2 * -0.01

			return [main_node.x + nx, main_node.y + ny]
		}

		for (const triangle of this.triangles) {
			const off = vertices.length / 2

			// generate vertices

			vertices.push(...shifted_coord(triangle.a, triangle.b, triangle.c))
			vertices.push(...shifted_coord(triangle.b, triangle.a, triangle.c))
			vertices.push(...shifted_coord(triangle.c, triangle.a, triangle.b))

			// generate indices

			indices.push(off, off + 1, off + 2)
		}

		this.indices_length = indices.length

		/** @type: Float32Array */
		const vbo_data = new Float32Array(vertices)

		/** @type: Uint32Array */
		const ibo_data = new Uint32Array(indices)

		// upload mesh data to GPU

		this.gl.bindVertexArray(this.vao)

		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo)
		this.gl.bufferData(this.gl.ARRAY_BUFFER, vbo_data, this.gl.STATIC_DRAW)

		this.gl.enableVertexAttribArray(0)
		this.gl.vertexAttribPointer(0, 2, this.gl.FLOAT, false, FLOAT32_SIZE * 2, 0)

		this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.ibo)
		this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, ibo_data, this.gl.STATIC_DRAW)
	}

	draw() {
		this.gl.bindVertexArray(this.vao)
		this.gl.drawElements(this.gl.TRIANGLES, this.indices_length, this.gl.UNSIGNED_INT, 0)
	}
}

export class Lines {
	/** @constructor
	  * @param {WebGLRenderingContext | WebGL2RenderingContext} gl
	  * @param {Line[]} lines
	  */
	constructor(gl, lines) {
		this.gl = gl
		this.lines = lines

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

		let vertices = []
		let indices = []

		for (const line of this.lines) {
			const off = vertices.length / 2
			vertices.push(line.x1, line.y1, line.x2, line.y2)
			indices.push(off, off + 1)
		}

		this.indices_length = indices.length

		/** @type: Float32Array */
		const vbo_data = new Float32Array(vertices)

		/** @type: Uint32Array */
		const ibo_data = new Uint32Array(indices)

		// upload mesh data to GPU

		this.gl.bindVertexArray(this.vao)

		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo)
		this.gl.bufferData(this.gl.ARRAY_BUFFER, vbo_data, this.gl.STATIC_DRAW)

		this.gl.enableVertexAttribArray(0)
		this.gl.vertexAttribPointer(0, 2, this.gl.FLOAT, false, FLOAT32_SIZE * 2, 0)

		this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.ibo)
		this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, ibo_data, this.gl.STATIC_DRAW)
	}

	draw() {
		this.gl.bindVertexArray(this.vao)
		this.gl.drawElements(this.gl.LINES, this.indices_length, this.gl.UNSIGNED_INT, 0)
	}
}
