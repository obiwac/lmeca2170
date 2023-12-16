const events = {
	"site": 0,
	"circle": 1,
	"parabola": 2,
	"skip": 3,
}

let arc_count = 0

function get_y(p, x, directrix) {
	const dp = 2 * (p.y - directrix)
	const a1 = 1 / dp
	const b1 = -2 * p.x / dp
	const c1 = directrix + dp / 4 + p.x * p.x / dp

	return a1 * x * x + b1 * x + c1
}

//* https://blog.ivank.net/fortunes-algorithm-and-implementation.html
/** @function
 * @param {BreakPoint} edge1 - The first edge
 * @param {BreakPoint} edge2 - The second edge
 * @returns {Node} - The intersection of the two edges
 */
function edge_intersection(edge1, edge2) {

	let dx = edge2.start.x - edge1.start.x
    let dy = edge2.start.y - edge1.start.y
    let det = edge2.direction.x* edge1.direction.y - edge2.direction.y* edge1.direction.x
    let u = (dy*edge2.direction.x - dx*edge2.direction.y)/det
    let v = (dy*edge1.direction.x - dx*edge1.direction.y)/det

	if(u < 0.0 || v < 0.0) {
		return null
	}
    if((u == 0.0) && (v == 0.0) ){
		return null
	}

    return new Node(edge1.start.x + edge1.direction.x*u, edge1.start.y + edge1.direction.y*u)
}

/** @function
 * @param {BeachNode} arc - The arc to check for circle event
 */
function search_for_circle_event(arc, beachline, queue) {

	edge_left = beachline.get_first_parent_on_left(arc)
	edge_right = beachline.get_first_parent_on_right(arc)

	if(edge_left == null || edge_right == null ) {
		return null
	}

	let intersection = edge_intersection(edge_left, edge_right)
	//console.log("intersection", intersection)
	if (intersection == null) {
		return
	}

	queue.enqueue([new CircleEvent(intersection, arc), events.circle])
}

/** @function
  * @param {Node[]} nodes
  * @returns {Edge[]}
  */
function fortune(nodes) {

	let queue = new PriorityQueue()

	for (const node of nodes) {
		queue.enqueue([node, events.site])
	}

	const beachline = new BeachTree()

	while (queue.length > 0) {
		current_event = queue.dequeue()
		console.log (structuredClone(beachline.root))

		if (current_event[1] === events.site) {
			if (beachline.root == null) {
				beachline.root = new BeachNode(current_event[0])
				arc_count++;
				continue
			}

			// On cherche l'arc qui est au dessus du point

			const above_arc = beachline.find_arc_above(current_event[0])

			const left_arc = new BeachNode(above_arc.site)
			const middle_arc = new BeachNode(current_event[0])
			const right_arc = new BeachNode(above_arc.site)

			// it is the same parabola so we need to set the same id
			left_arc.id = above_arc.id
			right_arc.id = above_arc.id

			const start_point = new Node(current_event[0].x, get_y(above_arc.site, current_event[0].x, current_event[0].y))

			const edge_left = new BreakPoint(start_point, above_arc.site, current_event[0])
			const edge_right = new BreakPoint(start_point, current_event[0], above_arc.site)

			//lines.add_line(edge_left.start.x, edge_left.start.y, edge_left.slope * -1000 + edge_left.offset, -1000)
			//lines.add_line(edge_right.start.x, edge_right.start.y, edge_right.slope * 1000 + edge_right.offset, 1000)

			edge_left.set_parent(above_arc)
			edge_left.set_left(left_arc)
			edge_left.set_right(edge_right)
			edge_left.set_id(above_arc.id, arc_count)

			edge_right.set_left(middle_arc)
			edge_right.set_right(right_arc)
			edge_right.set_id(arc_count, above_arc.id)

			// Check if the root was the above arc, this souls occurs only once because after all arcs are leafs.
			if (beachline.root.compare(above_arc)) {
				beachline.root = edge_left
			}

			// Check for circle events (when at least 2 arcs join together)
			// On ne check pas pour le middle arc car on aimerais vérifier pour les arcs à gauche et à droite.

			search_for_circle_event(left_arc, beachline, queue)
			search_for_circle_event(right_arc, beachline, queue)
			arc_count++; // Only once for the "new" arc other arcs arent new they are just split
		}

		else if (current_event[1] === events.circle) {
			// C'est le moment de l'intersecrtion, on doit supprimer les arcs pour éviter d'avoirs des arcs en trop

			console.log("root: ", structuredClone(beachline.root))
			let current_arc = current_event[0].arc

			let left_edge = beachline.get_first_parent_on_left(current_arc)
			let right_edge = beachline.get_first_parent_on_right(current_arc)

			let left_arc = beachline.get_first_leaf_on_left(left_edge)
			let right_arc = beachline.get_first_leaf_on_right(right_edge)

			let higer_edge = null
			let current_node = current_arc

			while (current_node.parent != null) {
				current_node = current_node.parent
				if (current_node.compare(left_edge)) {
					higer_edge = left_edge
				}

				if (current_node.compare(right_edge)) {
					higer_edge = right_edge
				}
			}

			console.log("higher edge", higer_edge)
			if (higer_edge == null) {
				console.log("ERROR : higher edge is null")
				continue
			}

			// Add a new breakpoint at intersection point which will be the bisector of the two arcs
			let new_edge = new BreakPoint(current_event[0].point, left_arc.site, right_arc.site)
			new_edge.set_id(left_arc.id, right_arc.id)

			// Create our "complete edges" (here it is lines for debugging)
			lines.add_line(current_event[0].point.x, current_event[0].point.y, left_edge.start.x, left_edge.start.y)
			lines.add_line(right_edge.start.x, right_edge.start.y, current_event[0].point.x, current_event[0].point.y)

			new_edge.set_parent(higer_edge)
			new_edge.set_left(higer_edge.left)
			new_edge.set_right(higer_edge.right)

			// Reorganize the tree
			let remaining_edge = null
			if (current_arc.parent.left.compare(current_arc)){
				remaining_edge = current_arc.parent.right
			} else {
				remaining_edge = current_arc.parent.left
			}

			remaining_edge.set_parent(current_arc.parent)

			if (beachline.root.compare(left_edge) || beachline.root.compare(right_edge)) {
				beachline.root = new_edge
			}

			search_for_circle_event(left_arc, beachline, queue)
			search_for_circle_event(right_arc, beachline, queue)
		}
	}

	console.log (structuredClone(beachline.root))

	return [
		new Edge(nodes[0], nodes[1]),
	]
}
