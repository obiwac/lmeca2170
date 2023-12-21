// TODO find a better name for this

class Nodes {
	constructor(nodeData) {
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

		this.fortune_obj = new Fortune(this.nodes)
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

	fortune() {
		const start_time = performance.now()
		const res = this.fortune_obj.fortune()
		const end_time = performance.now()

		console.log(`Call to fortune took ${end_time - start_time} milliseconds`)

		return res
	}
}

class Triangles {
	/** @function
	  * @param {Triangle[]} triangles
	  */
	constructor(triangles) {
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

		function shifted_coord(main_node, other_node_1, other_node_2) {
			const dx = main_node.x - (other_node_1.x + other_node_2.x) / 2
			const dy = main_node.y - (other_node_1.y + other_node_2.y) / 2

			const norm = Math.sqrt(dx * dx + dy * dy)

			const nx = dx / norm * -0.01
			const ny = dy / norm * -0.01

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

class Lines {
	/** @function
	  * @param {Line[]} lines
	  */
	constructor(lines) {
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
		gl.drawElements(gl.LINES, this.indices_length, gl.UNSIGNED_INT, 0)
	}
}
