# Line intersection and triangle detection.

## How to use
open the index.html in your browser.

## Commands
| `scroll` | used to zoom in & out. |
|---|----|
| `shift + left click` | used to move around the scene. |
| `left click ` | used to interact with the scene. |

## How it works
The wole project use WebGL2.

### Line intersection
For each line created, we check every other lines and check for their intersections. Eeach intersections apears in red.

### Triangle detection
When a point is placed on the plane, we check every triangle et check if the point is inside the triangle by Barycentric Coordinates. When the point is located inside a triangle, this one turn purple.