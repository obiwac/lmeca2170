# Line intersection and triangle detection

## How to use

Open the `index.html` in your browser.

## Controls

|Control|Description|
|-|-|
|Scroll wheel|Zooms the camera in and out.|
|Shift + left click and drag|Move the camera around the scene.|

## How it works

The project uses WebGL 2 which is vanilla.

### Half-edge data structure (part 1)

Here is the following structure:\
mesh.nodes: an array of nodes\
[-] node.id: a unique integer identifying the node (use the indices given in the JSON file).\
[-] node.pos: a pair of coordinates representing the position of the node.
mesh.faces: an array of faces\
[-] face.id: a unique integer identifying the face.\
[-] face.incidentEdge: one (!) edge that is incident to face.\
mesh.edges: an array of (half-)edges; an edge has structure\
[-] edge.orig: the origin node of the half-edge.\
[-] edge.dest: the destination node of the half-edge.\
[-] edge.incidentFace: the face to the left of the half-edge.\
[-] edge.next: the next half-edge on the boundary of the incident face.\
[-] edge.oppo: the opposite half-edge.\

### Point location (part 2)

There is a function called `marching_triangle`.
For point locations you can pass `undefined` to `origin` and if you want to visualize the triangle you have to pass true to `find_triangle`, e.g.

```
marching_triangle([0.11404410041538215, 0.931412313029647], undefined, true)
```

### Intersection segment-mesh (part 3)

It is the same as part 2, except you need to pass the `origin` argument which is the second point of the segment.
