function setup_triangle_location(mesh, canvas) {
	console.log("Hello from setup_triangle_location");
	draw_mesh(mesh, canvas);
	// TODO
}

function setup_segment_location(mesh, canvas) {
	console.log("Hello from setup_segment_location");
	draw_mesh(mesh, canvas);
	// TODO 
}

function create_mesh(mesh_data) {
	mesh = {
		nodes: [],
		edges: [],
		faces: [],
	}

	const node_data = mesh_data.Nodes[0]
	const elem_data = mesh_data.Elements[1]

	for (let i = 0; i < node_data.Indices.length; i++) {
		const node = {
			id: node_data.Indices[i],
			pos: node_data.Coordinates[i],
		}

		mesh.nodes.push(node)
	}

	let node_pair_to_edge = {}

	for (let i = 0; i < elem_data.Indices.length; i++) {
		const face = {
			id: elem_data.Indices[i],
			incident_edge: null,
		}

		const face_nodes = elem_data.NodalConnectivity[i]

		// TODO create the 3 half-edges in this triangle
		// determine the connectivity of the half-edges
	}
}

function draw_mesh(mesh, canvas) {
	size_adapt(canvas, mesh.nodes, offset=5);

	// Draw triangles
	context = canvas.getContext('2d');
	context.strokeStyle = "black";
	for (face of mesh.faces) {
		edge = face.incidentEdge;
		face_nodes = [edge.orig.pos, edge.dest.pos, edge.next.dest.pos];
		context.beginPath();
		context.moveTo(face_nodes[0][0], face_nodes[0][1]);
		context.lineTo(face_nodes[1][0], face_nodes[1][1]);
		context.lineTo(face_nodes[2][0], face_nodes[2][1]);
		context.stroke();
	}
}

function size_adapt(canvas, nodes, offset){
    // bounding box of the mesh
	let xMin = Number.MAX_VALUE;
	let yMin = Number.MAX_VALUE;
	let xMax = Number.MIN_VALUE;
	let yMax = Number.MIN_VALUE;
	for (node of nodes) {
		xMax = Math.max(xMax, node.pos[0]);
		xMin = Math.min(xMin, node.pos[0]);
		yMax = Math.max(yMax, node.pos[1]);
		yMin = Math.min(yMin, node.pos[1]);
	}
	const xRange = xMax - xMin;
	const yRange = yMax - yMin;
	const scale = Math.min(canvas.width/xRange, canvas.height/yRange);
    
    for (node of nodes)
        node.pos = transform(node.pos, scale, xMin, yMin, offset);

    return {scale:scale, xMin:xMin, yMin:yMin};
}

function transform(pos, scale, xMin, yMin, offset) {
    return [offset+(pos[0]-xMin)*scale, offset+(pos[1]-yMin)*scale];
}
