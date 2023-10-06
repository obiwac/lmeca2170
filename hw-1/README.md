# Line intersection and triangle detection

## How to use

Open the `index.html` in your browser.

## Controls

|Control|Description|
|-|-|
|Scroll wheel|Zooms the camera in and out.|
|Left click|Interact with the scene (add line in part 1, select triangle in part 2).|
|Shift + left click and drag|Move the camera around the scene.|
|Click button|Toggle between parts 1 and 2.

## How it works

The project uses WebGL 2.

### Line intersection (part 1)

For each line created, we check every other lines and check for their intersections.
Intersection points are shown in red.

### Triangle detection (part 2)

When the plane is clicked, we check for every triangle if the point where the user clicked is inside the triangle with barycentric coordinates.
When the point is located inside a triangle, it turns pink.
