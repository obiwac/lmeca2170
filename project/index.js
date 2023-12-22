import { Demo, TAU } from "./utils.js"
import { Nodes, Lines, Triangles } from "./render.js"
import { Shader } from "./shader.js"
import { Mat } from "./matrix.js"

{
	const demo = new Demo("canvas")

	// nodes

	/*
	let random_nodes = []
	const scale = 10

	for (let i = 0; i < 10000; i++) {
		random_nodes.push([scale * (Math.random() - .5), scale * (Math.random() - .5)])
	}

	const nodes = new Nodes(random_nodes)
	*/

	let nodes = new Nodes(demo.gl, nodeData)
	nodes.update_mesh()

	const node_shader = new Shader(demo.gl, "node")
	const {voronoi_lines: voronoi_lines_raw, delaunay_triangles} = nodes.fortune()

	// voronoi lines

	let voronoi_lines = new Lines(demo.gl, voronoi_lines_raw)
	const voronoi_shader = new Shader(demo.gl, "voronoi")
	voronoi_lines.update_mesh()

	// triangles

	let triangles = new Triangles(demo.gl, delaunay_triangles)
	const triangle_shader = new Shader(demo.gl, "tri")
	triangles.update_mesh()

	demo.start(pos => {
		// projection stuff

		const proj_mat = new Mat()
		proj_mat.perspective(TAU / 6, demo.x_res / demo.y_res, .1, 200)

		const view_mat = new Mat()
		view_mat.translate(...pos)

		const vp_mat = new Mat(view_mat)
		vp_mat.multiply(proj_mat)

		const model_mat = new Mat()
		const mvp_mat = new Mat(model_mat)
		mvp_mat.multiply(vp_mat)

		// render triangles

		triangle_shader.use()
		triangle_shader.mvp(mvp_mat)

		triangles.draw()

		// render nodes

		node_shader.use()
		node_shader.mvp(mvp_mat)

		nodes.draw()

		// render voronoi lines

		voronoi_shader.use()
		voronoi_shader.mvp(mvp_mat)

		voronoi_lines.draw()
	})
}
