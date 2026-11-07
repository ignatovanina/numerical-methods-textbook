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

    function draw(canvas, f, t, xmin, xmax, opts = {}) {
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const W = canvas.clientWidth || 640;
        const H = canvas.clientHeight || 280;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        ctx.fillStyle = '#14161a';
        ctx.fillRect(0, 0, W, H);

        const pad = { l: 46, r: 16, t: 26, b: 30 };
        const pw = W - pad.l - pad.r;
        const ph = H - pad.t - pad.b;

        const N = 400, pts = [];
        for (let i = 0; i <= N; i++) {
            const x = xmin + (xmax - xmin) * i / N;
            let y;
            try { y = f(x, t); } catch (_) { y = NaN; }
            pts.push({ x, y });
        }
        const fin = pts.filter(p => isFinite(p.y)).map(p => p.y);
        if (!fin.length) return;

        let ymin = Math.min(...fin, 0), ymax = Math.max(...fin, 0);
        if (ymin === ymax) { ymin -= 1; ymax += 1; }
        const yPad = (ymax - ymin) * 0.08;
        ymin -= yPad; ymax += yPad;

        const X = x => pad.l + (x - xmin) / (xmax - xmin) * pw;
        const Y = y => pad.t + ph - (y - ymin) / (ymax - ymin) * ph;

        ctx.strokeStyle = 'rgba(244,241,222,0.06)';
        ctx.lineWidth = 1;
        ctx.font = '11px "Courier New", monospace';
        ticks(xmin, xmax, 8).forEach(v => {
            const px = X(v);
            ctx.beginPath(); ctx.moveTo(px, pad.t); ctx.lineTo(px, pad.t + ph); ctx.stroke();
            ctx.fillStyle = 'rgba(244,241,222,0.55)';
            ctx.fillText(fmtTick(v), px - 12, H - 10);
        });
        ticks(ymin, ymax, 6).forEach(v => {
            const py = Y(v);
            ctx.beginPath(); ctx.moveTo(pad.l, py); ctx.lineTo(pad.l + pw, py); ctx.stroke();
            ctx.fillStyle = 'rgba(244,241,222,0.55)';
            ctx.fillText(fmtTick(v), 6, py + 4);
        });

        ctx.strokeStyle = 'rgba(244,241,222,0.35)';
        ctx.lineWidth = 1.2;
        if (ymin <= 0 && ymax >= 0) {
            ctx.beginPath(); ctx.moveTo(pad.l, Y(0)); ctx.lineTo(pad.l + pw, Y(0)); ctx.stroke();
        }
        if (xmin <= 0 && xmax >= 0) {
            ctx.beginPath(); ctx.moveTo(X(0), pad.t); ctx.lineTo(X(0), pad.t + ph); ctx.stroke();
        }
    }
    return { ticks, fmtTick, draw };
})();

