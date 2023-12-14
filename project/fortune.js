
function get_y(p, x, directrix) {
	console.log("get_y", p, x, directrix)
	const dp = 2 * (p.y - directrix)
	const a1 = 1 / dp
	const b1 = -2 * p.x / dp
	const c1 = directrix + dp / 4 + p.x * p.x / dp

	//console.log("a1", a1, "b1", b1, "c1", c1 )
	return a1 * x * x + b1 * x + c1
}

//* https://blog.ivank.net/fortunes-algorithm-and-implementation.html
/** @function
 * @param {BreakPoint} edge1 - The first edge
 * @param {BreakPoint} edge2 - The second edge
 * @returns {Node} - The intersection of the two edges
 */
function edge_intersection(edge1, edge2) {

	let dx = edge2.start.x - edge1.start.x;
    let dy = edge2.start.y - edge1.start.y;
    let det = edge2.direction.x* edge1.direction.y - edge2.direction.y* edge1.direction.x;
    let u = (dy*edge2.direction.x - dx*edge2.direction.y)/det;
    let v = (dy*edge1.direction.x - dx*edge1.direction.y)/det;

	if(u < 0.0 || v < 0.0) {
		return false
	}
    if((u == 0.0) && (v == 0.0) ){
		return false;
	}

    return new Node(edge1.start.x + edge1.direction.x*u, edge1.start.y + edge1.direction.y*u);
}

/** @function
 * @param {BeachNode} arc - The arc to check for circle event
 */
function search_for_circle_event(arc, beachline) {

	edge_left = beachline.get_first_parent_on_left(arc)
	edge_right = beachline.get_first_parent_on_right(arc)

	if(edge_left == null || edge_right == null ) {
		return null
	}

	console.log("on est arrivé ici !")

	let intersection = edge_intersection(edge_left, edge_right)

	if (intersection == 0) {
		return
	}

	console.log("intersection", intersection)
	nodes.nodes.push(intersection)
	// now that we have the 3 arcs, we can check if there is a circle event
	// if there is, we return the event, else we return null


}
/** @function
  * @param {Node[]} nodes
  * @returns {Edge[]}
  */
function fortune(nodes) {
	const events = {
		"site": 0,
		"circle": 1,
		"parabola": 2,
		"skip": 3,
	}

	let queue = []

	for (const node of nodes) {
		queue.push([node, events.site])
	}

	let head = queue.length - 1

	queue.sort((a, b) => a[0].y - b[0].y)
	const beachline = new BeachTree()

	while (head >= 0) {
		current_event = queue[head--]

		if (current_event[1] == events.site) {
			if(beachline.root == null) {
				beachline.root = new BeachNode(current_event[0])
				continue
			}

			// On cherche l'arc qui est au dessus du point

			const above_arc = beachline.find_arc_above(current_event[0])
			console.log("above arc", above_arc.site)
			console.log("at ", current_event[0])
			const left_arc = new BeachNode(above_arc.site)
			const middle_arc = new BeachNode(current_event[0])
			const right_arc = new BeachNode(above_arc.site)

			const start_point = new Node(current_event[0].x, get_y(above_arc.site, current_event[0].x, current_event[0].y))
			console.log("start point", start_point)
			const edge_left = new BreakPoint(start_point, above_arc.site, current_event[0])
			const edge_right = new BreakPoint(start_point, current_event[0], above_arc.site)

			edge_left.set_parent(above_arc)
			edge_left.set_left(left_arc)
			edge_left.set_right(edge_right)

			edge_right.set_left(middle_arc)
			edge_right.set_right(right_arc)

			// Check if the root was the above arc, this souls occurs only once because after all arcs are leafs.
			if (beachline.root == above_arc) {
				console.log("L'arc au dessu est le root")
				beachline.root = edge_left
			}

			// Check for circle events (when 3 arcs join together)
			// On ne check pas pour le middle arc car on aimerais vérifier pour les arcs à gauche et à droite.

			search_for_circle_event(left_arc, beachline)
			search_for_circle_event(right_arc, beachline)
		}

		else if (current_event.type == events.circle) {
			// TODO
		}
	}

	return [
		new Edge(nodes[0], nodes[1]),
	]
}
