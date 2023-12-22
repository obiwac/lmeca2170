const r1 = [2,51,51,175,203,268,253,276,912,577,665,663,795,923,895,1223,1199,1224,1383,1230]
const r2 = [0,122,61,451,138,1504,450,1803,592,3155,1225,2288,1511,1818,1790,1908,2210,2245,2172,2319,]
const r3 = [0,20,90,103,143,304,317,355,379,567,713,871,635,651,717,741,831,903,1136,1027,]

const avg = r1.map((x, i) => (x + r2[i] + r3[i]) / 3)
const context = document.getElementById("benchmark-canvas").getContext("2d")

const myChart = new Chart(context, {
	type: 'line',
	data: {
		labels: Array.from({ length: avg.length }, (_, i) => i * 500 + 10),
		datasets: [{
		 label: 'Average Time',
		 data: avg,
		 borderColor: 'rgb(255, 20, 80)',
		 borderWidth: 2,
		 fill: false
		}]
	},
	options: {
		scales: {
		 x: {
			type: 'linear',
			position: 'bottom'
		 },
		 y: {
			type: 'linear',
			position: 'left'
		 }
		}
	}
 });
