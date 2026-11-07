/* ============================================================
   calc-graph.js — shared canvas chart renderer
   ============================================================ */
const Graph = (() => {
    function ticks(a, b, n) {
        const span = b - a;
        if (span <= 0) return [a];
        const raw = span / n;
        const mag = Math.pow(10, Math.floor(Math.log10(raw)));
        const norm = raw / mag;
        const step = (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * mag;
        const out = [];
        for (let v = Math.ceil(a / step) * step; v <= b + 1e-9; v += step)
            out.push(+v.toFixed(10));
        return out;
    }
    function fmtTick(v) {
        if (Math.abs(v) < 1e-9) return '0';
        if (Math.abs(v) >= 1e4 || Math.abs(v) < 1e-3) return v.toExponential(1);
        return (+v.toFixed(4)).toString();
    }
    return { ticks, fmtTick };
})();