class Node {
	/** @function
	  * @param {number} x
	  * @param {number} y
	  */
	constructor(x, y) {
		this.x = x
		this.y = y
	}

	/** @function compare two nodes
	  * @param {Node} other
	  * @returns {boolean} true if the nodes are equal false otherwise
	  */
	compare(other) {
		if (other == null) {
			return false
		}
		return (this.x == other.x && this.y == other.y)
	}
}

// TODO make this a HalfEdge thingy

class Edge {
	/** @function
	  * @param {Node} start
	  * @param {Node} end
	  */
	constructor(start, end) {
		this.start = start
		this.end = end
	}
}

class Triangle {
	/** @function
	  * @param {Node} a
	  * @param {Node} b
	  * @param {Node} c
	  */
	constructor(a, b, c) {
		this.a = a
		this.b = b
		this.c = c
	}
}

class Line {
	/** @function
	  * @param {number} x1
	  * @param {number} y1
	  * @param {number} x2
	  * @param {number} y2
	  */
	constructor(x1, y1, x2, y2) {
		this.x1 = x1
		this.y1 = y1
		this.x2 = x2
		this.y2 = y2
	}
}
