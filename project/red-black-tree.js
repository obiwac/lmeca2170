/*
* Pour alexis: Breakpoint = edge = le point d'intersection de deux paraboles
* Quand on trouve un nouveau point P, alors on cherche la parabole qui est au dessus de P
*/


/*
* Structure un peu spéciale, c'est un binary search tree mais les leafs sont les arcs
* et les noeuds internes sont les edges.
* https://blog.ivank.net/fortunes-algorithm-and-implementation.html
*/
class BeachNode {
	constructor(site) {
		this.site = site

		this.left = null
		this.right = null

		this.parent = null
		this.edge = null

		this.circle_event = null
		this.is_leaf = true
	}

	/** @function set the left child of the current node to node
	  * @param {BeachNode} node
	  */
	set_left(node) {
		this.left = node
		this.is_leaf = false
		node.parent = this
	}

	/** @function set the right child of the current node to node
	  * @param {BeachNode} node
	  */
	set_right(node) {
		this.right = node
		this.is_leaf = false
		node.parent = this
	}

	/** @function
	  * @param {BeachNode} node the parent node
	  */
	set_parent(node) {
		console.log("set parent called with: ", node, " to ", this)

		// Ça arrive quand c'est la première feuille dans l'abre (quand la feuille est la racine)
		if(node.parent == null ) {
			this.parent = null
			return
		}

		if(node.parent.left == node) {
			node.parent.set_left(this)
		}

		else {
			node.parent.set_right(this)
		}
	}

}

class Edge extends BeachNode {
	constructor(start, left, right) {
		super(null)

		this.start = start
		this.left = left
		this.right = right

		this.end = null
		this.neighbour = null // this is an edge
		this.is_leaf = true

		this.slope = (left.x - right.x) / (right.y - left.y)
		this.offset = start.y - this.slope * start.x
		this.direction = new Node(right.y - left.y, left.x - right.x)
	}
}

class BeachTree {
	constructor() {
		this.root = null
	}

	get_first_parent_on_left(node) {
		let current_node = node

		while (current_node.parent != null && current_node.parent.left == current_node) {
			current_node = current_node.parent
		}

		return current_node.parent
	}

	get_first_parent_on_right(node) {
		let current_node = node

		while (current_node.parent != null && current_node.parent.right == current_node) {
			current_node = current_node.parent
		}

		return current_node.parent
	}

	get_first_leaf_on_left(node) {
		if (node.left == null) {
			return null
		}

		let current_node = node.left

		while (current_node.is_leaf == false) {
			current_node = current_node.right
		}

		return current_node
	}

	get_first_leaf_on_right(node) {
		if (node.right == null) {
			return null
		}

		let current_node = node.right

		while (current_node.is_leaf == false) {
			current_node = current_node.left
		}

		return current_node
	}

	/** @function
	 * @returns {number} x - x coordinate of the intersection of the two parabolas
	  */
	get_x_of_edge(node, directrix) {
		const left = this.get_first_leaf_on_left(node)
		const right = this.get_first_leaf_on_right(node)

		const p = left.site
		const r = right.site

		console.log(left, right)

		let dp = 2 * (p.y - directrix)
		const a1 = 1 / dp
		const b1 = -2 * p.x / dp
		const c1 = directrix + dp / 4 + p.x * p.x / dp

		dp = 2 * (r.y - directrix)
		const a2 = 1 / dp
		const b2 = -2 * r.x / dp
		const c2 = directrix + dp / 4 + r.x * r.x / dp

		const a = a1 - a2
		const b = b1 - b2
		const c = c1 - c2

		const disc = b * b - 4 * a * c
		const x1 = (-b + Math.sqrt(disc)) / (2 * a)
		const x2 = (-b - Math.sqrt(disc)) / (2 * a)

		if (p.y < r.y) {
			return Math.max(x1, x2)
		}

		else {
			return Math.min(x1, x2)
		}
	}

	find_arc_above(site) {
		let current_node = this.root

		while (current_node.is_leaf == false) {
			const x = this.get_x_of_edge(current_node, site.y)

			if (x > site.x) {
				current_node = current_node.left
			}

			else {
				current_node = current_node.right
			}
		}

		return current_node
	}
}
