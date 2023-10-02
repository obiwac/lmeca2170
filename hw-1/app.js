function main(canvas1){
	var A = [100, 200];
	var B = [400, 400];

	draw_edge(A, B, canvas1);

	var data_el = mesh["Elements"];
	var tri = [];
	for(let i=0; i<data_el.length; i++){
		if(data_el[i]["Type"]==2){
			tri = data_el[i]["NodalConnectivity"];
			break;
		}
	}

	for(let i=0; i<tri.length; ++i){
		console.log(tri[i]);
	}

	nodes = [];
	canvas1.addEventListener('mousedown', function(e){
		click_point(canvas1, e, nodes);
	});
}

function click_point(canvas, event, nodes){
	//click position
	const rect = canvas.getBoundingClientRect();
	const x = event.clientX - rect.left;
	const y = event.clientY - rect.top;

	pos = [x, y];

	console.log(pos);

}

function draw_edge(A, B, canvas){
	context = canvas.getContext('2d');
	context.strokeStyle = "black";
	context.beginPath();
	context.moveTo(A[0], A[1]);
	context.lineTo(B[0], B[1]);
	context.stroke();
}
