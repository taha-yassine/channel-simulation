// Dot product of two vectors
export function dot(v1, v2) {
    return v1.x * v2.x + v1.y * v2.y;
}

// Compute the normalized vector
export function normalize(v) {
    const norm = Math.sqrt(dot(v, v));
    return { x: v.x / norm, y: v.y / norm };
}

// Compute the distance between two points
export function distanceBetween(p1, p2) {
    if (p1 == null || p2 == null) return null;
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
}

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
        const intersectionX = s1.p1.x + t * (s1.p2.x - s1.p1.x);
        const intersectionY = s1.p1.y + t * (s1.p2.y - s1.p1.y);

        // Compute incidence vector
        const incid = { x: s1.p2.x - s1.p1.x, y: s1.p2.y - s1.p1.y };

        // Compute normal wrt segment 2
        const normalS2 = normalize({ x: s2.p2.y - s2.p1.y, y: s2.p1.x - s2.p2.x });
        
        // Compute reflected direction
        const refDir = normalize({x:incid.x-2*dot(normalS2,incid)*normalS2.x,y:incid.y-2*dot(normalS2,incid)*normalS2.y});


        return [{ x: intersectionX, y: intersectionY }, refDir];
    }

    return [null, null]; // No intersection
}

// Find the index of the minimum value in an array
export function argmin(array) {    
    return array.reduce((iMin, x, i, a) => x!=null && x < a[iMin] ? i : iMin, 0);
}