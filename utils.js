import { Vector } from "./vector.js";

// Compute the intersection point of two lines or segments
// https://en.wikipedia.org/wiki/Line–line_intersection#Given_two_points_on_each_line_segment
export function getIntersection(l1, l2, segments=false) {
    const d = (l1.p1.x - l1.p2.x) * (l2.p1.y - l2.p2.y) - (l1.p1.y - l1.p2.y) * (l2.p1.x - l2.p2.x);
    if (d === 0) return null; // Parallel lines

    const t = ((l1.p1.x - l2.p1.x) * (l2.p1.y - l2.p2.y) - (l1.p1.y - l2.p1.y) * (l2.p1.x - l2.p2.x)) / d;
    const u = -((l1.p1.x - l1.p2.x) * (l1.p1.y - l2.p1.y) - (l1.p1.y - l1.p2.y) * (l1.p1.x - l2.p1.x)) / d;

    // Check if the intersection is outside the bounds of both line segments
    if (segments && (t < 0 || t > 1 || u < 0 || u > 1)) {
        return null
    }

    return Vector.lerp(l1.p1, l1.p2, t); // return intersection point
}

// Compute the intersection and reflection of a ray wrt an obstacle
// http://www.sunshine2k.de/articles/coding/vectorreflection/vectorreflection.html
export function getReflection(raySegment, obstacle) {
    // Calculate the intersection point
    const intersection = getIntersection(raySegment, obstacle, true);
    if (intersection == null) return [null, null]; // No intersection

    // Compute incidence vector
    const incid = raySegment.p2.subtract(raySegment.p1);

    // Compute normal wrt segment 2
    const normalObs = obstacle.p2.subtract(obstacle.p1).normal;
    
    // Compute reflected direction
    const refDir = incid.subtract(normalObs.multiply(2 * incid.dot(normalObs))).normalize();

    return [intersection, refDir];
}

// Compute mirror image of a given source
export function getImage(source, obstacle) {
    // Unit vector along the obstacle
    const v = obstacle.p2.subtract(obstacle.p1).normalize();

    // Vector from obstacle to source
    const w = source.p.subtract(obstacle.p1) 

    // Projection of source onto obstacle
    const proj = v.multiply(w.dot(v)).add(obstacle.p1);

    // Mirror image of source
    const image = {
        p: source.p.add(proj.subtract(source.p).multiply(2)),
        source: source,
        obstacle: obstacle,
    }
      
    return image;
  }

// Find the index of the minimum value in an array
export function argmin(array) {
    if (!Array.isArray(array) || array.length == 0) return null;
    return array.reduce((iMin, x, i, a) => x!=null && x < a[iMin] ? i : iMin, 0);
}