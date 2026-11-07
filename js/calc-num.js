const Num = (() => {
    const makeF = expr => new Function('x', 't', 'return ' + expr);
    const d1 = (f, x, t) => { const h = 1e-6; return (f(x + h, t) - f(x - h, t)) / (2 * h); };
    const d2 = (f, x, t) => { const h = 1e-4; return (f(x + h, t) - 2 * f(x, t) + f(x - h, t)) / (h * h); };

    function bisection(f, a, b, t, eps, maxIter = 1000) {
        let fa = f(a, t), fb = f(b, t);
        if (fa * fb > 0) return { error: 'f(a) and f(b) have the same sign' };
        const rows = [];
        let iter = 0, c = (a + b) / 2, fc = f(c, t);
        while ((b - a) / 2 > eps && iter < maxIter) {
            c = (a + b) / 2; fc = f(c, t);
            rows.push({ i: iter, a, b, c, fc });
            if (Math.abs(fc) < 1e-15) break;
            if (fa * fc < 0) { b = c; fb = fc; } else { a = c; fa = fc; }
            iter++;
        }
        return { root: (a + b) / 2, iter, rows };
    }

    function chord(f, a, b, t, eps, maxIter = 1000) {
        let fa = f(a, t), fb = f(b, t);
        if (fa * fb > 0) return { error: 'f(a) and f(b) have the same sign' };
        const fixed = (fa * d2(f, a, t) > 0) ? a : b;
        let x = (fixed === a) ? b : a;
        const rows = [];
        let iter = 0, prev;
        do {
            prev = x;
            const fx = f(x, t), ff = f(fixed, t);
            if (Math.abs(fx - ff) < 1e-15) break;
            x = x - fx * (x - fixed) / (fx - ff);
            rows.push({ i: iter, x, fx: f(x, t) });
            iter++;
        } while (Math.abs(x - prev) > eps && iter < maxIter);
        return { root: x, iter, rows };
    }
    function newton(f, x0, t, eps, maxIter = 1000) {
        let x = x0, iter = 0, prev;
        const rows = [];
        do {
            const d = d1(f, x, t);
            if (Math.abs(d) < 1e-14) return { error: 'Derivative near zero' };
            prev = x;
            x = x - f(x, t) / d;
            rows.push({ i: iter, x, fx: f(x, t), dx: Math.abs(x - prev) });
            iter++;
        } while (Math.abs(x - prev) > eps && iter < maxIter);
        return { root: x, iter, rows };
    }
    function combined(f, a, b, t, eps, maxIter = 1000) {
        let fa = f(a, t), fb = f(b, t);
        if (fa * fb > 0) return { error: 'f(a) and f(b) have the same sign' };
        const s2 = d2(f, (a + b) / 2, t);
        let xl = (s2 < 0) ? a : b;
        let xr = (s2 < 0) ? b : a;
        const rows = [];
        let iter = 0;
        while (Math.abs(xr - xl) > eps && iter < maxIter) {
            const fl = f(xl, t), fr = f(xr, t);
            let xln, xrn;
            if (s2 < 0) {
                xln = xl - fl / d1(f, xl, t);
                xrn = xl - fl * (xr - xl) / (fr - fl);
            } else {
                xln = xl - fl * (xr - xl) / (fr - fl);
                xrn = xr - fr / d1(f, xr, t);
            }
            xl = xln; xr = xrn;
            rows.push({ i: iter, xl, xr, gap: Math.abs(xr - xl) });
            iter++;
        }
        return { root: (xl + xr) / 2, iter, rows };
    }
    function secant(f, x0, x1, t, eps, maxIter = 1000) {
        const rows = [];
        let iter = 0;
        while (Math.abs(x1 - x0) > eps && iter < maxIter) {
            const f0 = f(x0, t), f1 = f(x1, t);
            if (Math.abs(f1 - f0) < 1e-14) break;
            const x2 = x1 - f1 * (x1 - x0) / (f1 - f0);
            rows.push({ i: iter, x: x2, fx: f(x2, t) });
            x0 = x1; x1 = x2; iter++;
        }
        return { root: x1, iter, rows };
    }
    function modNewton(f, x0, t, eps, maxIter = 1000) {
        const d0 = d1(f, x0, t);
        if (Math.abs(d0) < 1e-14) return { error: "f'(x0) is near zero" };
        let x = x0, iter = 0, prev;
        const rows = [];
        do {
            prev = x;
            x = x - f(x, t) / d0;
            rows.push({ i: iter, x, fx: f(x, t) });
            iter++;
        } while (Math.abs(x - prev) > eps && iter < maxIter);
        return { root: x, iter, rows };
    }
    function simpleIter(g, x0, t, eps, maxIter = 1000) {
        const dg = d1((x, tt) => g(x, tt), x0, t);
        const q = Math.abs(dg);
        const tol = (q < 1) ? (1 - q) / q * eps : eps;
        let x = x0, iter = 0, prev;
        const rows = [];
        do {
            prev = x;
            x = g(x, t);
            rows.push({ i: iter, x, dx: Math.abs(x - prev) });
            iter++;
        } while (Math.abs(x - prev) > tol && iter < maxIter);
        return { root: x, iter, rows, q, tol };
    }

    function isolate(f, xmin, xmax, t, step) {
        const pts = [], roots = [];
        for (let x = xmin; x <= xmax + 1e-12; x += step)
            pts.push({ x, y: f(x, t) });
        for (let i = 0; i < pts.length - 1; i++)
            if (isFinite(pts[i].y) && isFinite(pts[i + 1].y) && pts[i].y * pts[i + 1].y < 0)
                roots.push({ a: pts[i].x, b: pts[i + 1].x });
        return { pts, roots };
    }
    return { makeF, d1, d2, bisection, chord, newton, combined, secant, modNewton, simpleIter, isolate };
})();