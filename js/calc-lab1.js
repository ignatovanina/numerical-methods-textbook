function fmt(x, n = 6) {
    if (!isFinite(x)) return '—';
    if (Math.abs(x) >= 1e5 || (Math.abs(x) < 1e-4 && x !== 0)) return x.toExponential(3);
    return (+x.toFixed(n)).toString();
}
const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const rootBox = r => `<div class="calc-root">x* ≈ ${fmt(r, 8)}</div>`;
const errBox = m => `<div class="calc-error">${esc(m)}</div>`;
const val = id => parseFloat(document.getElementById(id).value);

function makeF(inputId, outId) {
    const expr = document.getElementById(inputId).value;
    try { return Num.makeF(expr); }
    catch (e) {
        document.getElementById(outId).innerHTML = errBox('Expression error: ' + e.message);
        return null;
    }
}

function calcIsolate() {
    const f = makeF('is-f', 'is-out'); if (!f) return;
    const t = val('is-t'), xmin = val('is-min'), xmax = val('is-max'), step = val('is-step');
    if (!(xmax > xmin) || !(step > 0)) {
        document.getElementById('is-out').innerHTML = errBox('Check xmin < xmax and step > 0');
        return;
    }
    const { pts, roots } = Num.isolate(f, xmin, xmax, t, step);
    const rows = pts.map(p =>
        `<tr><td>${fmt(p.x, 4)}</td><td>${isFinite(p.y) ? fmt(p.y, 6) : 'NaN'}</td></tr>`
    ).join('');
    const rootsHtml = roots.length
        ? roots.map((r, i) => `<p>Отрезок ${i + 1}: <b>[${fmt(r.a, 4)}; ${fmt(r.b, 4)}]</b></p>`).join('')
        : '<p class="calc-warn">Смены знака не найдено — уменьшите шаг или расширьте диапазон.</p>';
    document.getElementById('is-out').innerHTML =
        `<p><b>Найдено отрезков:</b> ${roots.length}</p>${rootsHtml}
         <table class="lab-table"><thead><tr><th>x</th><th>f(x,t)</th></tr></thead><tbody>${rows}</tbody></table>`;
    Graph.draw(document.getElementById('is-canvas'), f, t, xmin, xmax, {
        title: `f(x, t=${t})`,
        segment: roots[0] ? [roots[0].a, roots[0].b] : null
    });
}
function calcBisection() {
    const f = makeF('bi-f', 'bi-out'); if (!f) return;
    const a = val('bi-a'), b = val('bi-b'), t = val('bi-t'), eps = val('bi-eps');
    const res = Num.bisection(f, a, b, t, eps);
    if (res.error) { document.getElementById('bi-out').innerHTML = errBox(res.error); return; }
    const rows = res.rows.map(r =>
        `<tr><td>${r.i}</td><td>${fmt(r.a, 6)}</td><td>${fmt(r.b, 6)}</td><td>${fmt(r.c, 8)}</td><td>${fmt(r.fc, 3)}</td></tr>`
    ).join('');
    document.getElementById('bi-out').innerHTML =
        `${rootBox(res.root)}<p><b>Итераций:</b> ${res.iter}</p>
         <table class="lab-table"><thead><tr><th>i</th><th>a</th><th>b</th><th>c</th><th>f(c)</th></tr></thead><tbody>${rows}</tbody></table>`;
    Graph.draw(document.getElementById('bi-canvas'), f, t, a - 0.3, b + 0.3, {
        title: `Половинное деление, корень ≈ ${fmt(res.root, 5)}`,
        segment: [a, b], roots: [{ x: res.root, y: 0 }]
    });
}