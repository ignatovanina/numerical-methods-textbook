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

    return { makeF, d1, d2, bisection };
})();