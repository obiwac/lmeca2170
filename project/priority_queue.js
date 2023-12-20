class PriorityQueue {
	constructor() {
		this.lazy_tree = []
		this.length = 0;
	}

	heapify(index) {
		let left = null
		let right = null
		let higher_node = null

		const half_size = Math.floor(this.length)
		const our_node = this.lazy_tree[index]

		while (index < half_size) {
			left = 2 * index + 1
			right = 2 * index + 2

			higher_node = this.lazy_tree[left]

			if (right < this.length && this.lazy_tree[right][0].y > higher_node[0].y) {
				left = right
				higher_node = this.lazy_tree[right]
			}

			if (higher_node[0].y <= our_node[0].y) {
				break
			}

			this.lazy_tree[index] = higher_node
			index = left
		}

		this.lazy_tree[index] = our_node
		return
	}

	/** @function
	  * @param {any} data - the data to enqueue
	  */
	enqueue(data) {
		let current_index = this.length
		this.lazy_tree.push(data)
		this.length++

		while (current_index > 0) {
			const parent_index = Math.floor(current_index - 1)
			const temp = this.lazy_tree[parent_index]

			if (data[0].y <= temp[0].y) {
				break
			}

			this.lazy_tree[current_index] = temp
			current_index = parent_index
		}

		this.lazy_tree[current_index] = data
	}

	/** @function
	  * @returns {any} the data dequeued
	  */
	dequeue() {
		if (this.length <= 0) {
			return null
		}

		const res = this.lazy_tree[0]

		if (this.length > 1) {
			this.length -= 1
			this.lazy_tree[0] = this.lazy_tree[this.length]
			this.heapify(0)
		}

		else {
			this.length -= 1
		}

		return res
	}
}
