// Simplex Noise in JavaScript (2D and 3D)
// Based on example code by Stefan Gustavson (stegu@itn.liu.se).
// Optimisations by Peter Eastman (peastman@drizzle.stanford.edu).
// Better rank ordering method by Stefan Gustavson in 2012.
// Converted to JavaScript by Joseph Gentle.

// This code is in the public domain.

export default class SimplexNoise {
  constructor(seed = Math.random()) {
    this.grad3 = [
      [1, 1, 0],
      [-1, 1, 0],
      [1, -1, 0],
      [-1, -1, 0],
      [1, 0, 1],
      [-1, 0, 1],
      [1, 0, -1],
      [-1, 0, -1],
      [0, 1, 1],
      [0, -1, 1],
      [0, 1, -1],
      [0, -1, -1],
    ];
    this.grad4 = [
      [0, 1, 1, 1],
      [0, 1, 1, -1],
      [0, 1, -1, 1],
      [0, 1, -1, -1],
      [0, -1, 1, 1],
      [0, -1, 1, -1],
      [0, -1, -1, 1],
      [0, -1, -1, -1],
      [1, 0, 1, 1],
      [1, 0, 1, -1],
      [1, 0, -1, 1],
      [1, 0, -1, -1],
      [-1, 0, 1, 1],
      [-1, 0, 1, -1],
      [-1, 0, -1, 1],
      [-1, 0, -1, -1],
      [1, 1, 0, 1],
      [1, 1, 0, -1],
      [1, -1, 0, 1],
      [1, -1, 0, -1],
      [-1, 1, 0, 1],
      [-1, 1, 0, -1],
      [-1, -1, 0, 1],
      [-1, -1, 0, -1],
      [1, 1, 1, 0],
      [1, 1, -1, 0],
      [1, -1, 1, 0],
      [1, -1, -1, 0],
      [-1, 1, 1, 0],
      [-1, 1, -1, 0],
      [-1, -1, 1, 0],
      [-1, -1, -1, 0],
    ];

    this.p = [];
    for (let i = 0; i < 256; i++) {
      this.p[i] = i;
    }

    // Shuffle the array using the seed
    let seedRandom = this.seedRandom(seed);
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(seedRandom() * (i + 1));
      [this.p[i], this.p[j]] = [this.p[j], this.p[i]];
    }

    // To remove the need for index wrapping, double the permutation table length
    this.perm = new Array(512);
    this.permMod12 = new Array(512);
    for (let i = 0; i < 512; i++) {
      this.perm[i] = this.p[i & 255];
      this.permMod12[i] = this.perm[i] % 12;
    }
  }

  // Seedable random number generator (similar to what استخدمنا سابقًا)
  seedRandom(seed) {
    return function () {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
  }

  dot2(g, x, y) {
    return g[0] * x + g[1] * y;
  }

  dot3(g, x, y, z) {
    return g[0] * x + g[1] * y + g[2] * z;
  }

  dot4(g, x, y, z, w) {
    return g[0] * x + g[1] * y + g[2] * z + g[3] * w;
  }

  // 2D Simplex Noise
  noise2D(xin, yin) {
    const F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
    const G2 = (3.0 - Math.sqrt(3.0)) / 6.0;

    let s = (xin + yin) * F2;
    let i = Math.floor(xin + s);
    let j = Math.floor(yin + s);

    let t = (i + j) * G2;
    let X0 = i - t;
    let Y0 = j - t;
    let x0 = xin - X0;
    let y0 = yin - Y0;

    let i1, j1;
    if (x0 > y0) {
      i1 = 1;
      j1 = 0;
    } else {
      i1 = 0;
      j1 = 1;
    }

    let x1 = x0 - i1 + G2;
    let y1 = y0 - j1 + G2;
    let x2 = x0 - 1.0 + 2.0 * G2;
    let y2 = y0 - 1.0 + 2.0 * G2;

    let ii = i & 255;
    let jj = j & 255;
    let gi0 = this.permMod12[ii + this.perm[jj]];
    let gi1 = this.permMod12[ii + i1 + this.perm[jj + j1]];
    let gi2 = this.permMod12[ii + 1 + this.perm[jj + 1]];

    let n0, n1, n2;

    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 < 0) n0 = 0.0;
    else {
      t0 *= t0;
      n0 = t0 * t0 * this.dot2(this.grad3[gi0], x0, y0);
    }

    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 < 0) n1 = 0.0;
    else {
      t1 *= t1;
      n1 = t1 * t1 * this.dot2(this.grad3[gi1], x1, y1);
    }

    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 < 0) n2 = 0.0;
    else {
      t2 *= t2;
      n2 = t2 * t2 * this.dot2(this.grad3[gi2], x2, y2);
    }

    return 70.0 * (n0 + n1 + n2);
  }

  // 3D Simplex Noise
  noise3D(xin, yin, zin) {
    const F3 = 1.0 / 3.0;
    const G3 = 1.0 / 6.0;

    let s = (xin + yin + zin) * F3;
    let i = Math.floor(xin + s);
    let j = Math.floor(yin + s);
    let k = Math.floor(zin + s);

    let t = (i + j + k) * G3;
    let X0 = i - t;
    let Y0 = j - t;
    let Z0 = k - t;
    let x0 = xin - X0;
    let y0 = yin - Y0;
    let z0 = zin - Z0;

    let i1, j1, k1;
    let i2, j2, k2;

    if (x0 >= y0) {
      if (y0 >= z0) {
        i1 = 1;
        j1 = 0;
        k1 = 0;
        i2 = 1;
        j2 = 1;
        k2 = 0;
      } else if (x0 >= z0) {
        i1 = 1;
        j1 = 0;
        k1 = 0;
        i2 = 1;
        j2 = 0;
        k2 = 1;
      } else {
        i1 = 0;
        j1 = 0;
        k1 = 1;
        i2 = 1;
        j2 = 0;
        k2 = 1;
      }
    } else {
      if (y0 < z0) {
        i1 = 0;
        j1 = 0;
        k1 = 1;
        i2 = 0;
        j2 = 1;
        k2 = 1;
      } else if (x0 < z0) {
        i1 = 0;
        j1 = 1;
        k1 = 0;
        i2 = 0;
        j2 = 1;
        k2 = 1;
      } else {
        i1 = 0;
        j1 = 1;
        k1 = 0;
        i2 = 1;
        j2 = 1;
        k2 = 0;
      }
    }

    let x1 = x0 - i1 + G3;
    let y1 = y0 - j1 + G3;
    let z1 = z0 - k1 + G3;
    let x2 = x0 - i2 + 2.0 * G3;
    let y2 = y0 - j2 + 2.0 * G3;
    let z2 = z0 - k2 + 2.0 * G3;
    let x3 = x0 - 1.0 + 3.0 * G3;
    let y3 = y0 - 1.0 + 3.0 * G3;
    let z3 = z0 - 1.0 + 3.0 * G3;

    let ii = i & 255;
    let jj = j & 255;
    let kk = k & 255;
    let gi0 = this.permMod12[ii + this.perm[jj + this.perm[kk]]];
    let gi1 = this.permMod12[ii + i1 + this.perm[jj + j1 + this.perm[kk + k1]]];
    let gi2 = this.permMod12[ii + i2 + this.perm[jj + j2 + this.perm[kk + k2]]];
    let gi3 = this.permMod12[ii + 1 + this.perm[jj + 1 + this.perm[kk + 1]]];

    let n0, n1, n2, n3;

    let t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
    if (t0 < 0) n0 = 0.0;
    else {
      t0 *= t0;
      n0 = t0 * t0 * this.dot3(this.grad3[gi0], x0, y0, z0);
    }

    let t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
    if (t1 < 0) n1 = 0.0;
    else {
      t1 *= t1;
      n1 = t1 * t1 * this.dot3(this.grad3[gi1], x1, y1, z1);
    }

    let t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
    if (t2 < 0) n2 = 0.0;
    else {
      t2 *= t2;
      n2 = t2 * t2 * this.dot3(this.grad3[gi2], x2, y2, z2);
    }

    let t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
    if (t3 < 0) n3 = 0.0;
    else {
      t3 *= t3;
      n3 = t3 * t3 * this.dot3(this.grad3[gi3], x3, y3, z3);
    }

    return 32.0 * (n0 + n1 + n2 + n3);
  }

  // 4D Simplex Noise (optional, not used in our project but included for completeness)
  noise4D(x, y, z, w) {
    // ... (يمكن تنفيذها لاحقًا إذا لزم الأمر)
    // لن أقوم بتنفيذها الآن لأننا لا نحتاجها.
    return 0;
  }
}
