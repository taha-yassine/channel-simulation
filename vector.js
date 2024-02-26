export class Vector {
    constructor(x, y) {
        this.x = x || 0;
        this.y = y || 0;
    }

    negative() {
        return new Vector(-this.x, -this.y);
    }

    add(v) {
        if (v instanceof Vector) return new Vector(this.x + v.x, this.y + v.y);
        else return new Vector(this.x + v, this.y + v);
    }

    subtract(v) {
        if (v instanceof Vector) return new Vector(this.x - v.x, this.y - v.y);
        else return new Vector(this.x - v, this.y - v);
    }

    multiply(v) {
        if (v instanceof Vector) return new Vector(this.x * v.x, this.y * v.y);
        else return new Vector(this.x * v, this.y * v);
    }

    divide(v) {
        if (v instanceof Vector) return new Vector(this.x / v.x, this.y / v.y);
        else return new Vector(this.x / v, this.y / v);
    }

    equals(v) {
        return this.x == v.x && this.y == v.y;
    }

    dot(v) {
        return v.x * this.x + v.y * this.y;
    }

    get norm() {
        return Math.sqrt(this.dot(this));
    }

    normalize() {
        return this.divide(this.norm);
    }

    rotate(angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return new Vector(cos * this.x - sin * this.y, sin * this.x + cos * this.y);
    }

    get angle() {
        return Math.atan2(this.y, this.x);
    }

    angleTo(v) {
        return Math.acos(this.dot(v) / (this.norm * v.norm));
    }

    distance(v) {
        return this.subtract(v).norm;
    }

    get normal() {
        return new Vector(-this.y, this.x).normalize();
    }

    static add(v1, v2) {
        if (v2 instanceof Vector) return new Vector(v1.x + v2.x, v1.y + v2.y);
        else return new Vector(v1.x + v2, v1.y + v2);
    }

    static subtract(v1, v2) {
        if (v2 instanceof Vector) return new Vector(v1.x - v2.x, v1.y - v2.y);
        else return new Vector(v1.x - v2, v1.y - v2);
    }

    static multiply(v1, v2) {
        if (v2 instanceof Vector) return new Vector(v1.x * v2.x, v1.y * v2.y);
        else return new Vector(v1.x * v2, v1.y * v2);
    }

    static divide(v1, v2) {
        if (v2 instanceof Vector) return new Vector(v1.x / v2.x, v1.y / v2.y);
        else return new Vector(v1.x / v2, v1.y / v2);
    }


    static equals(v1, v2) {
        return v1.x === v2.x && v1.y === v2.y; 
    }

    static dot(v1, v2) {
        return v1.x * v2.x + v1.y * v2.y;
    }
    
    static angleTo(v1, v2) {
        return Math.acos(Vector.dot(v1, v2) / (v1.norm * v2.norm));
    }
    
    static distanceBetween(v1, v2) {
        return v1.subtract(v2).norm;
    }

    static angleBetween(v1, v2) {
        return v1.angleTo(v2);
    }

    static lerp(v1, v2, t) {
        return v1.add(v2.subtract(v1).multiply(t));
    }
}

