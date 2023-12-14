class QueueNode {
	constructor(data) {
		this.data = data;
		this.next = null;
		this.prev = null;
	}
}

class PriorityQueue {
	constructor() {
		this.lazy_tree = []
		this.length = 0;
	}

	heapify(index) {
		let largest = index
		let left = index * 2 + 1
		let right = index * 2 + 2

		// on recherche le plus grand
		
		if (left < this.length && this.lazy_tree[left][0].y > this.lazy_tree[largest][0].y) {
			largest = left
		} else if (right < this.length && this.lazy_tree[right][0].y > this.lazy_tree[largest][0].y) {
			largest = right
		}

		if (largest != index) { // Si on a trouvé un plus grand alors on swap
			let temp = this.lazy_tree[index]
			this.lazy_tree[index] = this.lazy_tree[largest]
			this.lazy_tree[largest] = temp
			this.heapify(largest)
		}
	}

	/**@function
	 * @param {any} data - the data to enqueue
	 */
	enqueue(data) {

		if (this.length == 0) {
			this.lazy_tree.push(data)
			this.length++
			return
		}

		this.lazy_tree.push(data)

		this.length++

		for (let i = Math.floor(this.length / 2) - 1; i >= 0; i--) {
			this.heapify(i)
		}

	}

	/**@function
		* @returns {any} the data dequeued
		*/
	dequeue() {

		if (this.length == 0) {
			return null
		}

		//swap O and last element of the array
		let temp = this.lazy_tree[0]
		this.lazy_tree[0] = this.lazy_tree[this.length - 1]
		this.lazy_tree[this.length - 1] = temp
		
		const data = this.lazy_tree.pop()

		this.length--

		for (let i = Math.floor(this.length / 2) - 1; i >= 0; i--) {
			this.heapify(i)
		}
		return data
	}
}