import { Vector } from "./vector.js";

// Compute the intersection point of two line segments and the resulting reflection angle
// https://en.wikipedia.org/wiki/Line–line_intersection#Given_two_points_on_each_line_segment
// https://math.stackexchange.com/a/13263
export function getReflection(s1, s2) {
    const d = (s1.p1.x - s1.p2.x) * (s2.p1.y - s2.p2.y) - (s1.p1.y - s1.p2.y) * (s2.p1.x - s2.p2.x);
    if (d === 0) return [null, null]; // Parallel lines

    const t = ((s1.p1.x - s2.p1.x) * (s2.p1.y - s2.p2.y) - (s1.p1.y - s2.p1.y) * (s2.p1.x - s2.p2.x)) / d;
    const u = -((s1.p1.x - s1.p2.x) * (s1.p1.y - s2.p1.y) - (s1.p1.y - s1.p2.y) * (s1.p1.x - s2.p1.x)) / d;

    // Check if the intersection is within the bounds of both line segments
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
        // Calculate the intersection point
        const intersection = Vector.lerp(s1.p1, s1.p2, t);

        // Compute incidence vector
        const incid = s1.p2.subtract(s1.p1);

        // Compute normal wrt segment 2
        // const normalS2 = normalize({ x: s2.p2.y - s2.p1.y, y: s2.p1.x - s2.p2.x });
        // const normalS2 = new Vector(s2.p2.y - s2.p1.y, s2.p1.x - s2.p2.x);
        const normalS2 = s2.p2.subtract(s2.p1).normal;
        
        // Compute reflected direction
        const refDir = incid.subtract(normalS2.multiply(2 * incid.dot(normalS2))).normalize();

        return [intersection, refDir];
    }

    return [null, null]; // No intersection
}

// Find the index of the minimum value in an array
export function argmin(array) {    
    return array.reduce((iMin, x, i, a) => x!=null && x < a[iMin] ? i : iMin, 0);
}