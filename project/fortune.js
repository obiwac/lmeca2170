
class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

class IncompleteEdge {
    constructor(p1, p2, startx) {
        
        this.slope = (p1.y - p2.y) / (p1.x - p2.x)

        this.end = null
        this.start = null
    }
}


function get_y(p, x, directrix) {
    const dp = 2 * (p.y - directrix);
    const a1 = 1 / dp;
    const b1 = -2 * p.x / dp;
    const c1 = directrix + dp / 4 + p.x * p.x / dp;

    return a1 * x * x + b1 * x + c1;
}

// Desc: Implementation of the fortune algorithm for generating voronoi diagrams
function fortune(points) {
    const events = {
        "site": 0,
        "circle": 1,
        "parabola": 2,
        "skip": 3,
    }

    let queue = []
    for (const p of points) {
        queue.push([new Point(p[0], p[1]), events.site])
    }

    let head = queue.length - 1

    queue.sort((a, b) => { return a[0].y - b[0].y })
    const beachline = new BeachTree();

    while (head >= 0) {
        current_event = queue[head--];

        if (current_event[1] == events.site) {            
            
            if(beachline.root == null) {
                beachline.root = new BeachNode(current_event[0])
                continue
            }

            /*if (beachline.root.is_leaf && beachline.root.site.y - current_event[0].y < 1) {
                // On a deux sites qui ont des y très proches
                // On va donc créer un arc de cercle
                console.log("ici")
                let arc = beachline.root
                let p1 = arc.site
                let p2 = current_event[0]
                let startx = (p1.x + p2.x) / 2
                let starty = (p1.y + p2.y) / 2

                let edge = new Edge(new Point(startx, starty), p1, p2)
                arc.edge = edge
                arc.is_leaf = false

                let new_arc = new BeachNode(current_event[0])
                let new_arc2 = new BeachNode(arc.site)

                arc.left = new_arc
                arc.right = new_arc2

                new_arc.parent = arc
                new_arc2.parent = arc

                new_arc.edge = edge
                new_arc2.edge = edge

                continue
            }*/

            console.log(current_event[0])

            // On cherche l'arc qui est au dessus du point

            //TODO FIX THIS
            let above_arc = beachline.find_arc_above(current_event[0])
            console.log("above arc", above_arc)

            let left_arc = new BeachNode(above_arc.site);
            let middle_arc = new BeachNode(current_event[0]);
            let right_arc = new BeachNode(above_arc.site);

            let start_point = new Point(current_event[0], get_y(current_event[0], above_arc.site.x, current_event[0].y))
            
            let edge_left = new Edge(start_point, above_arc.site, current_event[0])
            let edge_right = new Edge(start_point, current_event[0], above_arc.site)

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


        } else if (current_event.type == events.circle) {
            // TODO
        }
    }
}