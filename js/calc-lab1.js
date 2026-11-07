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
    const tableHtml = `<table class="lab-table"><thead><tr><th>x</th><th>f(x,t)</th></tr></thead><tbody>${rows}</tbody></table>`;
    document.getElementById('is-out').innerHTML =
        `<p><b>Найдено отрезков:</b> ${roots.length}</p>${rootsHtml}
         ${hiddenTable(tableHtml)}`;
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
    const tableHtml = `<table class="lab-table"><thead><tr><th>i</th><th>a</th><th>b</th><th>c</th><th>f(c)</th></tr></thead><tbody>${rows}</tbody></table>`;

    document.getElementById('bi-out').innerHTML =
        `${rootBox(res.root)}<p><b>Итераций:</b> ${res.iter}</p>
         ${hiddenTable(tableHtml)}`;
    // --- Отрисовка графика метода половинного деления ---
    const cv = document.getElementById('bi-canvas');
    const ctx = cv.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const W = cv.clientWidth, H = cv.clientHeight;
    cv.width = W * dpr;
    cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Фон
    ctx.fillStyle = '#14161a';
    ctx.fillRect(0, 0, W, H);

    const pad = { l: 46, r: 16, t: 26, b: 30 };
    const pw = W - pad.l - pad.r;
    const ph = H - pad.t - pad.b;

    // Диапазон X: чуть больше исходного [a, b]
    const xa = val('bi-a'), xb = val('bi-b');
    const lo = xa - 0.5;
    const hi = xb + 0.5;

    // Считаем Y-диапазон
    const fin = [];
    for (let i = 0; i <= 200; i++) {
        const x = lo + (hi - lo) * i / 200;
        try { const y = f(x, t); if (isFinite(y)) fin.push(y); } catch (_) {}
    }
    let ymin = Math.min(...fin, 0);
    let ymax = Math.max(...fin, 0);
    const yPad = (ymax - ymin) * 0.1;
    ymin -= yPad; ymax += yPad;

    const X = x => pad.l + (x - lo) / (hi - lo) * pw;
    const Y = y => pad.t + ph - (y - ymin) / (ymax - ymin) * ph;

    // 1. Сетка
    ctx.strokeStyle = 'rgba(244,241,222,0.1)';
    ctx.lineWidth = 1;
    ctx.font = '11px "Courier New", monospace';
    Graph.ticks(lo, hi, 8).forEach(v => {
        if (v === 0) return;
        ctx.beginPath(); ctx.moveTo(X(v), pad.t); ctx.lineTo(X(v), pad.t + ph); ctx.stroke();
        ctx.fillStyle = 'rgba(244,241,222,0.5)';
        ctx.fillText(v.toFixed(2), X(v) - 10, H - 10);
    });
    Graph.ticks(ymin, ymax, 6).forEach(v => {
        if (v === 0) return;
        ctx.beginPath(); ctx.moveTo(pad.l, Y(v)); ctx.lineTo(pad.l + pw, Y(v)); ctx.stroke();
        ctx.fillStyle = 'rgba(244,241,222,0.5)';
        ctx.fillText(v.toFixed(2), 6, Y(v) + 4);
    });

    // 2. Оси
    ctx.strokeStyle = 'rgba(244,241,222,0.5)';
    ctx.beginPath(); ctx.moveTo(pad.l, Y(0)); ctx.lineTo(pad.l + pw, Y(0)); ctx.stroke(); // X
    ctx.beginPath(); ctx.moveTo(X(0), pad.t); ctx.lineTo(X(0), pad.t + ph); ctx.stroke(); // Y

    // 3. Кривая
    ctx.strokeStyle = '#00A896';
    ctx.lineWidth = 2;
    ctx.beginPath();
    let started = false;
    for (let i = 0; i <= 200; i++) {
        const x = lo + (hi - lo) * i / 200;
        let y;
        try { y = f(x, t); } catch (_) { y = NaN; }
        if (!isFinite(y)) { started = false; continue; }
        if (!started) { ctx.moveTo(X(x), Y(y)); started = true; }
        else ctx.lineTo(X(x), Y(y));
    }
    ctx.stroke();

    // 4. Точка корня
    ctx.fillStyle = '#F4F1DE';
    ctx.strokeStyle = '#00A896';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(X(res.root), Y(0), 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    // 5. Итерации (рисунок сужения отрезков)
    ctx.font = '12px "Courier New", monospace';
    ctx.textAlign = 'center';

    // Покажем только первые 3 итерации, чтобы не было визуального шума
    const maxDrawIter = Math.min(res.rows.length, 3);

    for (let k = 0; k < maxDrawIter; k++) {
        const row = res.rows[k];
        const a_k = row.a;
        const b_k = row.b;
        const c_k = row.c;

        let ya = f(a_k, t); if (!isFinite(ya)) ya = 0;
        let yb = f(b_k, t); if (!isFinite(yb)) yb = 0;
        let yc = f(c_k, t); if (!isFinite(yc)) yc = 0;

        // Настраиваем стиль линий
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1.5;

        // --- Линия a_k ---
        ctx.strokeStyle = 'rgba(244, 241, 222, 0.4)'; // Светло-серый
        ctx.beginPath(); ctx.moveTo(X(a_k), Y(0)); ctx.lineTo(X(a_k), Y(ya)); ctx.stroke();

        // --- Линия b_k ---
        ctx.beginPath(); ctx.moveTo(X(b_k), Y(0)); ctx.lineTo(X(b_k), Y(yb)); ctx.stroke();

        // --- Линия c_k ---
        ctx.strokeStyle = 'rgba(0, 168, 150, 0.8)'; // Бирюзовый
        ctx.beginPath(); ctx.moveTo(X(c_k), Y(0)); ctx.lineTo(X(c_k), Y(yc)); ctx.stroke();
        ctx.setLineDash([]);

        // Ставим точки на кривой
        ctx.fillStyle = '#F4F1DE';
        ctx.beginPath(); ctx.arc(X(a_k), Y(ya), 3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(X(b_k), Y(yb), 3, 0, Math.PI * 2); ctx.fill();

        ctx.strokeStyle = '#00A896';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(X(c_k), Y(yc), 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

        // --- Подписи (умное размещение, чтобы не наслаивались) ---
        if (k < 2) { // Подписываем только 1-ю и 2-ю итерации
            ctx.fillStyle = 'rgba(244, 241, 222, 0.8)';

            // Для 'a' сдвигаем текст влево, для 'b' — вправо
            ctx.textAlign = 'right';
            ctx.fillText(`a${k}`, X(a_k) - 5, Y(0) + 20 + k * 15);

            ctx.textAlign = 'left';
            ctx.fillText(`b${k}`, X(b_k) + 5, Y(0) + 20 + k * 15);

            // Для 'c' ставим по центру, но ниже, чтобы не мешать
            ctx.textAlign = 'center';
            ctx.fillStyle = '#00A896';
            ctx.fillText(`c${k}`, X(c_k), Y(0) + 25 + (k === 1 ? 15 : 0));
        }
    }
    ctx.textAlign = 'start'; // Сбрасываем

    // 6. Заголовок
    ctx.fillStyle = 'rgba(244,241,222,0.85)';
    ctx.font = '12px "Inter", sans-serif';
    ctx.fillText(`Половинное деление, t = ${t}`, pad.l, 16);
}
function calcChord() {
    const f = makeF('ch-f', 'ch-out'); if (!f) return;
    const a = val('ch-a'), b = val('ch-b'), t = val('ch-t'), eps = val('ch-eps');
    const res = Num.chord(f, a, b, t, eps);
    if (res.error) { document.getElementById('ch-out').innerHTML = errBox(res.error); return; }
    const rows = res.rows.map(r =>
        `<tr><td>${r.i}</td><td>${fmt(r.x, 8)}</td><td>${fmt(r.fx, 3)}</td></tr>`
    ).join('');
    const tableHtml = `<table class="lab-table"><thead><tr><th>i</th><th>xᵢ</th><th>f(xᵢ)</th></tr></thead><tbody>${rows}</tbody></table>`;
    document.getElementById('ch-out').innerHTML =
        `${rootBox(res.root)}<p><b>Итераций:</b> ${res.iter}</p>
         ${hiddenTable(tableHtml)}`;
    // --- Отрисовка графика метода хорд ---
    const cv = document.getElementById('ch-canvas');
    const ctx = cv.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const W = cv.clientWidth, H = cv.clientHeight;
    cv.width = W * dpr;
    cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.fillStyle = '#14161a';
    ctx.fillRect(0, 0, W, H);

    const pad = { l: 46, r: 16, t: 26, b: 30 };
    const pw = W - pad.l - pad.r;
    const ph = H - pad.t - pad.b;

    const lo = a - 0.5;
    const hi = b + 0.5;

    // Считаем Y-диапазон
    const fin = [];
    for (let i = 0; i <= 200; i++) {
        const x = lo + (hi - lo) * i / 200;
        try { const y = f(x, t); if (isFinite(y)) fin.push(y); } catch (_) {}
    }
    let ymin = Math.min(...fin, 0);
    let ymax = Math.max(...fin, 0);
    const yPad = (ymax - ymin) * 0.1;
    ymin -= yPad; ymax += yPad;

    const X = x => pad.l + (x - lo) / (hi - lo) * pw;
    const Y = y => pad.t + ph - (y - ymin) / (ymax - ymin) * ph;

    // 1. Сетка
    ctx.strokeStyle = 'rgba(244,241,222,0.1)';
    ctx.lineWidth = 1;
    ctx.font = '11px "Courier New", monospace';
    Graph.ticks(lo, hi, 8).forEach(v => {
        if (v === 0) return;
        ctx.beginPath(); ctx.moveTo(X(v), pad.t); ctx.lineTo(X(v), pad.t + ph); ctx.stroke();
        ctx.fillStyle = 'rgba(244,241,222,0.5)';
        ctx.fillText(v.toFixed(2), X(v) - 10, H - 10);
    });
    Graph.ticks(ymin, ymax, 6).forEach(v => {
        if (v === 0) return;
        ctx.beginPath(); ctx.moveTo(pad.l, Y(v)); ctx.lineTo(pad.l + pw, Y(v)); ctx.stroke();
        ctx.fillStyle = 'rgba(244,241,222,0.5)';
        ctx.fillText(v.toFixed(2), 6, Y(v) + 4);
    });

    // 2. Оси
    ctx.strokeStyle = 'rgba(244,241,222,0.5)';
    ctx.beginPath(); ctx.moveTo(pad.l, Y(0)); ctx.lineTo(pad.l + pw, Y(0)); ctx.stroke(); // X
    ctx.beginPath(); ctx.moveTo(X(0), pad.t); ctx.lineTo(X(0), pad.t + ph); ctx.stroke(); // Y

    // 3. Кривая
    ctx.strokeStyle = '#00A896';
    ctx.lineWidth = 2;
    ctx.beginPath();
    let started = false;
    for (let i = 0; i <= 200; i++) {
        const x = lo + (hi - lo) * i / 200;
        let y;
        try { y = f(x, t); } catch (_) { y = NaN; }
        if (!isFinite(y)) { started = false; continue; }
        if (!started) { ctx.moveTo(X(x), Y(y)); started = true; }
        else ctx.lineTo(X(x), Y(y));
    }
    ctx.stroke();

    // 4. Начальные точки A и B
    const ya = f(a, t);
    const yb = f(b, t);
    ctx.fillStyle = '#F4F1DE';
    ctx.strokeStyle = '#00A896';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(X(a), Y(ya), 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(X(b), Y(yb), 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    ctx.fillStyle = 'rgba(244,241,222,0.9)';
    ctx.font = 'italic 13px "Inter", sans-serif';
    ctx.fillText('A', X(a) - 15, Y(ya) + 15);
    ctx.fillText('B', X(b) + 5, Y(yb) - 5);

    // 5. Хорды (итерации)
    // Находим "неподвижную" точку (где f(x) * f''(x) > 0)
    const s2 = Num.d2(f, (a + b) / 2, t);
    const isAFixed = (f(a, t) * s2 > 0);

    // Неподвижная точка (от неё всегда идёт хорда)
    const fixedX = isAFixed ? a : b;
    const fixedY = f(fixedX, t);

    // Текущая подвижная точка (начинаем с противоположного конца)
    let currX = isAFixed ? b : a;
    let currY = f(currX, t);

    const maxDrawIter = Math.min(res.rows.length, 4);

    ctx.font = '11px "Courier New", monospace';
    ctx.textAlign = 'center';

    for (let k = 0; k < maxDrawIter; k++) {
        // Находим, куда хорда пересечёт ось X
        // Уравнение прямой через (fixedX, fixedY) и (currX, currY)
        // y - fixedY = (currY - fixedY)/(currX - fixedX) * (x - fixedX)
        // При y = 0: x = fixedX - fixedY * (currX - fixedX) / (currY - fixedY)
        const nextX = fixedX - fixedY * (currX - fixedX) / (currY - fixedY);

        // Рисуем хорду от неподвижной точки к текущей
        ctx.strokeStyle = k === 0 ? 'rgba(0, 168, 150, 0.9)' : 'rgba(0, 168, 150, 0.4)';
        ctx.setLineDash(k === 0 ? [] : [4, 4]);
        ctx.lineWidth = k === 0 ? 2 : 1.5;
        ctx.beginPath();
        ctx.moveTo(X(fixedX), Y(fixedY));
        ctx.lineTo(X(currX), Y(currY));
        ctx.stroke();

        // Рисуем вертикальную линию от новой точки на оси X до кривой
        ctx.strokeStyle = 'rgba(244, 241, 222, 0.3)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(X(nextX), Y(0));
        ctx.lineTo(X(nextX), Y(f(nextX, t)));
        ctx.stroke();

        // Точка пересечения с осью X
        ctx.setLineDash([]);
        ctx.fillStyle = '#00A896';
        ctx.beginPath(); ctx.arc(X(nextX), Y(0), 3, 0, Math.PI * 2); ctx.fill();

        // Точка на кривой (следующий шаг)
        const nextY = f(nextX, t);
        ctx.fillStyle = '#F4F1DE';
        ctx.strokeStyle = '#00A896';
        ctx.beginPath(); ctx.arc(X(nextX), Y(nextY), 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

        // Подпись
        ctx.fillStyle = 'rgba(244,241,222,0.8)';
        ctx.fillText(`c${k+1}`, X(nextX), Y(0) - 10 - (k * 15));

        // Обновляем текущую точку для следующей итерации
        currX = nextX;
        currY = nextY;
    }

    // 6. Истинный корень
    ctx.fillStyle = '#00A896';
    ctx.font = 'italic 14px "Inter", sans-serif';
    ctx.fillText('x*', X(res.root) + 10, Y(0) - 10);

    // 7. Заголовок
    ctx.fillStyle = 'rgba(244,241,222,0.85)';
    ctx.font = '12px "Inter", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Метод хорд, t = ${t}`, pad.l, 16);
}
function calcNewton() {
    const f = makeF('nt-f', 'nt-out'); if (!f) return;
    const x0 = val('nt-x0'), t = val('nt-t'), eps = val('nt-eps');
    const res = Num.newton(f, x0, t, eps);
    if (res.error) { document.getElementById('nt-out').innerHTML = errBox(res.error); return; }
    const rows = res.rows.map(r =>
        `<tr><td>${r.i}</td><td>${fmt(r.x, 8)}</td><td>${fmt(r.fx, 3)}</td><td>${fmt(r.dx, 3)}</td></tr>`
    ).join('');
    const tableHtml = `<table class="lab-table"><thead><tr><th>i</th><th>xᵢ</th><th>f(xᵢ)</th><th>|Δx|</th></tr></thead><tbody>${rows}</tbody></table>`;
    document.getElementById('nt-out').innerHTML =
        `${rootBox(res.root)}<p><b>Итераций:</b> ${res.iter}</p>
         ${hiddenTable(tableHtml)}`;
    // --- Отрисовка графика метода касательных (Ньютона) ---
    const cv = document.getElementById('nt-canvas');
    const ctx = cv.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const W = cv.clientWidth, H = cv.clientHeight;
    cv.width = W * dpr;
    cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.fillStyle = '#14161a';
    ctx.fillRect(0, 0, W, H);

    const pad = { l: 46, r: 16, t: 26, b: 30 };
    const pw = W - pad.l - pad.r;
    const ph = H - pad.t - pad.b;

    // Диапазон X: берем от x0 до корня, добавляем отступы
    const lo = Math.min(x0, res.root) - 1;
    const hi = Math.max(x0, res.root) + 1;

    // Считаем Y-диапазон
    const fin = [];
    for (let i = 0; i <= 200; i++) {
        const x = lo + (hi - lo) * i / 200;
        try { const y = f(x, t); if (isFinite(y)) fin.push(y); } catch (_) {}
    }
    let ymin = Math.min(...fin, 0);
    let ymax = Math.max(...fin, 0);
    const yPad = (ymax - ymin) * 0.1;
    ymin -= yPad; ymax += yPad;

    const X = x => pad.l + (x - lo) / (hi - lo) * pw;
    const Y = y => pad.t + ph - (y - ymin) / (ymax - ymin) * ph;

    // 1. Сетка
    ctx.strokeStyle = 'rgba(244,241,222,0.1)';
    ctx.lineWidth = 1;
    ctx.font = '11px "Courier New", monospace';
    Graph.ticks(lo, hi, 8).forEach(v => {
        if (v === 0) return;
        ctx.beginPath(); ctx.moveTo(X(v), pad.t); ctx.lineTo(X(v), pad.t + ph); ctx.stroke();
        ctx.fillStyle = 'rgba(244,241,222,0.5)';
        ctx.fillText(v.toFixed(2), X(v) - 10, H - 10);
    });
    Graph.ticks(ymin, ymax, 6).forEach(v => {
        if (v === 0) return;
        ctx.beginPath(); ctx.moveTo(pad.l, Y(v)); ctx.lineTo(pad.l + pw, Y(v)); ctx.stroke();
        ctx.fillStyle = 'rgba(244,241,222,0.5)';
        ctx.fillText(v.toFixed(2), 6, Y(v) + 4);
    });

    // 2. Оси
    ctx.strokeStyle = 'rgba(244,241,222,0.5)';
    ctx.beginPath(); ctx.moveTo(pad.l, Y(0)); ctx.lineTo(pad.l + pw, Y(0)); ctx.stroke(); // X
    ctx.beginPath(); ctx.moveTo(X(0), pad.t); ctx.lineTo(X(0), pad.t + ph); ctx.stroke(); // Y

    // 3. Кривая
    ctx.strokeStyle = '#00A896';
    ctx.lineWidth = 2;
    ctx.beginPath();
    let started = false;
    for (let i = 0; i <= 200; i++) {
        const x = lo + (hi - lo) * i / 200;
        let y;
        try { y = f(x, t); } catch (_) { y = NaN; }
        if (!isFinite(y)) { started = false; continue; }
        if (!started) { ctx.moveTo(X(x), Y(y)); started = true; }
        else ctx.lineTo(X(x), Y(y));
    }
    ctx.stroke();

    // 4. Итерации (касательные)
    ctx.font = '11px "Courier New", monospace';
    const maxDrawIter = Math.min(res.rows.length, 3); // Покажем первые 3 шага

    let currX = x0;
    let currY = f(currX, t);

    // Отрисовываем начальную точку x0 и вертикальную линию от нее
    ctx.fillStyle = '#F4F1DE';
    ctx.strokeStyle = '#00A896';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(X(currX), Y(currY), 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    // Пунктирная вертикаль от x0 до оси X
    ctx.strokeStyle = 'rgba(244, 241, 222, 0.3)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(X(currX), Y(0));
    ctx.lineTo(X(currX), Y(currY));
    ctx.stroke();
    ctx.setLineDash([]);

    // Подпись x0
    ctx.fillStyle = 'rgba(244,241,222,0.8)';
    ctx.textAlign = 'center';
    ctx.fillText(`x0`, X(currX), Y(0) - 10);

    for (let k = 0; k < maxDrawIter; k++) {
        const nextX = res.rows[k].x; // Следующее приближение (из метода)
        const slope = Num.d1(f, currX, t); // Производная в текущей точке

        // Уравнение касательной: y - currY = slope * (x - currX)
        // Берем точки для отрисовки линии (продлеваем её, чтобы точно пересечь ось)
        const x_top = currX + (ymax - currY) / slope;
        const x_bottom = currX + (ymin - currY) / slope;

        const lineX1 = Math.max(lo, Math.min(x_top, x_bottom));
        const lineX2 = Math.min(hi, Math.max(x_top, x_bottom));

        // Рисуем касательную (пунктиром)
        ctx.strokeStyle = 'rgba(0, 168, 150, 0.7)';
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1.5;
        ctx.beginPath();

        const lineY1 = currY + slope * (lineX1 - currX);
        const lineY2 = currY + slope * (lineX2 - currX);

        ctx.moveTo(X(lineX1), Y(lineY1));
        ctx.lineTo(X(lineX2), Y(lineY2));
        ctx.stroke();
        ctx.setLineDash([]);

        // Точка на кривой (где строим касательную)
        ctx.fillStyle = '#F4F1DE';
        ctx.strokeStyle = '#00A896';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(X(currX), Y(currY), 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

        // Точка пересечения касательной с осью X
        ctx.fillStyle = '#00A896';
        ctx.beginPath(); ctx.arc(X(nextX), Y(0), 3, 0, Math.PI * 2); ctx.fill();

        // Переходим к следующей точке
        currX = nextX;
        currY = f(currX, t);

        // Подпись следующей точки (x1, x2...)
        ctx.fillStyle = 'rgba(244,241,222,0.8)';
        ctx.fillText(`x${k+1}`, X(currX), Y(0) - 10);

        // Вертикальная пунктирная линия от следующей точки на оси X до кривой
        // (нужна для следующего шага, чтобы было видно, откуда берется касательная)
        if (k < maxDrawIter - 1) {
            ctx.strokeStyle = 'rgba(244, 241, 222, 0.3)';
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(X(currX), Y(0));
            ctx.lineTo(X(currX), Y(currY));
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }

    // 5. Истинный корень
    ctx.fillStyle = '#00A896';
    ctx.font = 'italic 14px "Inter", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('x*', X(res.root) + 10, Y(0) - 10);

    // 6. Заголовок
    ctx.fillStyle = 'rgba(244,241,222,0.85)';
    ctx.font = '12px "Inter", sans-serif';
    ctx.fillText(`Метод Ньютона, t = ${t}`, pad.l, 16);
}
function calcCombo() {
    const f = makeF('cb-f', 'cb-out'); if (!f) return;
    const a = val('cb-a'), b = val('cb-b'), t = val('cb-t'), eps = val('cb-eps');
    const res = Num.combined(f, a, b, t, eps);
    if (res.error) { document.getElementById('cb-out').innerHTML = errBox(res.error); return; }
    const rows = res.rows.map(r =>
        `<tr><td>${r.i}</td><td>${fmt(r.xl, 8)}</td><td>${fmt(r.xr, 8)}</td><td>${fmt(r.gap, 3)}</td></tr>`
    ).join('');
    const tableHtml = `<table class="lab-table"><thead><tr><th>i</th><th>x (касат.)</th><th>x̄ (хорда)</th><th>|x̄−x|</th></tr></thead><tbody>${rows}</tbody></table>`;
    document.getElementById('cb-out').innerHTML =
        `${rootBox(res.root)}<p><b>Итераций:</b> ${res.iter}</p>
         ${hiddenTable(tableHtml)}`;
    Graph.draw(document.getElementById('cb-canvas'), f, t, a - 0.3, b + 0.3, {
        title: `Комбинированный, корень ≈ ${fmt(res.root, 5)}`,
        segment: [a, b], roots: [{ x: res.root, y: 0 }]
    });
}
function calcSecant() {
    const f = makeF('sc-f', 'sc-out'); if (!f) return;
    const x0 = val('sc-x0'), x1 = val('sc-x1'), t = val('sc-t'), eps = val('sc-eps');
    const res = Num.secant(f, x0, x1, t, eps);
    const rows = res.rows.map(r =>
        `<tr><td>${r.i}</td><td>${fmt(r.x, 8)}</td><td>${fmt(r.fx, 3)}</td></tr>`
    ).join('');
    const tableHtml = `<table class="lab-table"><thead><tr><th>i</th><th>xᵢ</th><th>f(xᵢ)</th></tr></thead><tbody>${rows}</tbody></table>`;
    document.getElementById('sc-out').innerHTML =
        `${rootBox(res.root)}<p><b>Итераций:</b> ${res.iter}</p>
         ${hiddenTable(tableHtml)}`;
    const lo = Math.min(x0, x1, res.root) - 0.6;
    const hi = Math.max(x0, x1, res.root) + 0.6;
    Graph.draw(document.getElementById('sc-canvas'), f, t, lo, hi, {
        title: `Секущие, x₀=${fmt(x0, 3)}, x₁=${fmt(x1, 3)}`,
        roots: [{ x: res.root, y: 0 }]
    });
}
function calcMNewton() {
    const f = makeF('mn-f', 'mn-out'); if (!f) return;
    const x0 = val('mn-x0'), t = val('mn-t'), eps = val('mn-eps');
    const res = Num.modNewton(f, x0, t, eps);
    if (res.error) { document.getElementById('mn-out').innerHTML = errBox(res.error); return; }
    const rows = res.rows.map(r =>
        `<tr><td>${r.i}</td><td>${fmt(r.x, 8)}</td><td>${fmt(r.fx, 3)}</td></tr>`
    ).join('');
    const tableHtml = `<table class="lab-table"><thead><tr><th>i</th><th>xᵢ</th><th>f(xᵢ)</th></tr></thead><tbody>${rows}</tbody></table>`;
    document.getElementById('mn-out').innerHTML =
        `${rootBox(res.root)}<p><b>Итераций:</b> ${res.iter}</p>
         ${hiddenTable(tableHtml)}`;
    const half = Math.max(1, Math.abs(res.root - x0)) * 1.4;
    Graph.draw(document.getElementById('mn-canvas'), f, t, res.root - half, res.root + half, {
        title: `Модифицированный Ньютон, x₀ = ${fmt(x0, 4)}`,
        roots: [{ x: res.root, y: 0 }]
    });
}
function calcIter() {
    const g = makeF('it-g', 'it-out'); if (!g) return;
    const x0 = val('it-x0'), t = val('it-t'), eps = val('it-eps');
    const res = Num.simpleIter(g, x0, t, eps);

    const rows = res.rows.map(r =>
        `<tr><td>${r.i}</td><td>${fmt(r.x, 8)}</td><td>${fmt(r.dx, 3)}</td></tr>`
    ).join('');
    const warn = res.q >= 1
        ? `<p class="calc-warn">Внимание: |g'(x₀)| ≈ ${fmt(res.q, 4)} ≥ 1 — процесс может расходиться.</p>`
        : '';

    const tableHtml = `<table class="lab-table"><thead><tr><th>i</th><th>xᵢ</th><th>|Δx|</th></tr></thead><tbody>${rows}</tbody></table>`;
    document.getElementById('it-out').innerHTML =
        `${rootBox(res.root)}
         ${warn}
         <p><b>q ≈</b> ${fmt(res.q, 4)}, <b>критерий остановки</b> |Δx| ≤ ${res.tol.toExponential(3)}</p>
         <p><b>Итераций:</b> ${res.iter}</p>
         ${hiddenTable(tableHtml)}`;
    
    // --- Отрисовка графика "паутинка" ---
    const cv = document.getElementById('it-canvas');
    const ctx = cv.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const W = cv.clientWidth, H = cv.clientHeight;
    cv.width = W * dpr;
    cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.fillStyle = '#14161a';
    ctx.fillRect(0, 0, W, H);

    const pad = { l: 46, r: 16, t: 26, b: 30 };
    const pw = W - pad.l - pad.r;
    const ph = H - pad.t - pad.b;

    // Диапазон для X: чуть больше, чем от x0 до корня
    const lo = Math.min(x0, res.root) - 0.5;
    const hi = Math.max(x0, res.root) + 0.5;

    // Считаем Y-диапазон
    const fin = [];
    for (let i = 0; i <= 200; i++) {
        const x = lo + (hi - lo) * i / 200;
        try { const y = g(x, t); if (isFinite(y)) fin.push(y); } catch (_) {}
    }
    let ymin = Math.min(...fin, lo, 0);
    let ymax = Math.max(...fin, hi, 0);
    const yPad = (ymax - ymin) * 0.1;
    ymin -= yPad; ymax += yPad;

    const X = x => pad.l + (x - lo) / (hi - lo) * pw;
    const Y = y => pad.t + ph - (y - ymin) / (ymax - ymin) * ph;

    // 1. Рисуем оси и сетку (вручную, т.к. Graph.draw тут не подходит из-за специфики)
    ctx.strokeStyle = 'rgba(244,241,222,0.1)';
    ctx.lineWidth = 1;
    ctx.font = '11px "Courier New", monospace';

    Graph.ticks(lo, hi, 8).forEach(v => {
        if (v === 0) return;
        ctx.beginPath(); ctx.moveTo(X(v), pad.t); ctx.lineTo(X(v), pad.t + ph); ctx.stroke();
        ctx.fillStyle = 'rgba(244,241,222,0.5)';
        ctx.fillText(v.toFixed(2), X(v) - 10, H - 10);
    });
    Graph.ticks(ymin, ymax, 6).forEach(v => {
        if (v === 0) return;
        ctx.beginPath(); ctx.moveTo(pad.l, Y(v)); ctx.lineTo(pad.l + pw, Y(v)); ctx.stroke();
        ctx.fillStyle = 'rgba(244,241,222,0.5)';
        ctx.fillText(v.toFixed(2), 6, Y(v) + 4);
    });

    // Оси X и Y
    ctx.strokeStyle = 'rgba(244,241,222,0.5)';
    ctx.beginPath(); ctx.moveTo(pad.l, Y(0)); ctx.lineTo(pad.l + pw, Y(0)); ctx.stroke(); // ось X
    ctx.beginPath(); ctx.moveTo(X(0), pad.t); ctx.lineTo(X(0), pad.t + ph); ctx.stroke(); // ось Y

    // 2. Рисуем прямую y = x
    ctx.strokeStyle = '#00A896';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(X(lo), Y(lo));
    ctx.lineTo(X(hi), Y(hi));
    ctx.stroke();

    // Подпись y = x
    ctx.fillStyle = '#00A896';
    ctx.font = 'italic 12px "Inter"';
    ctx.fillText('y = x', X(hi) - 40, Y(hi) + 15);

    // 3. Рисуем кривую g(x)
    ctx.strokeStyle = '#00A896';
    ctx.lineWidth = 2;
    ctx.beginPath();
    let started = false;
    for (let i = 0; i <= 200; i++) {
        const x = lo + (hi - lo) * i / 200;
        let y;
        try { y = g(x, t); } catch (_) { y = NaN; }
        if (!isFinite(y)) { started = false; continue; }
        if (!started) { ctx.moveTo(X(x), Y(y)); started = true; }
        else ctx.lineTo(X(x), Y(y));
    }
    ctx.stroke();

    // Подпись y = g(x)
    ctx.fillStyle = '#00A896';
    ctx.fillText('y = g(x)', X(hi) - 80, Y(g(hi - 0.2, t)) - 15);

    // 4. Рисуем паутинку
    ctx.strokeStyle = 'rgba(0, 168, 150, 0.7)';
    ctx.fillStyle = 'rgba(0, 168, 150, 0.7)';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.5;

    let currX = x0;
    // Начинаем с оси X (вертикальная линия до кривой)
    drawArrow(ctx, X(currX), Y(0), X(currX), Y(g(currX, t)));
    let currY = g(currX, t);

    // Ограничим количество шагов, чтобы не рисовать 1000 линий
    const maxDrawIter = Math.min(res.rows.length, 15);

    for (let k = 0; k < maxDrawIter; k++) {
        // Горизонтальная линия от кривой до y=x
        drawArrow(ctx, X(currX), Y(currY), X(currY), Y(currY));
        // Вертикальная линия от y=x до кривой
        drawArrow(ctx, X(currY), Y(currY), X(currY), Y(g(currY, t)));

        currX = currY;
        currY = g(currX, t);
    }
    ctx.setLineDash([]);

    // 5. Отмечаем корень
    ctx.fillStyle = '#F4F1DE';
    ctx.strokeStyle = '#00A896';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(X(res.root), Y(res.root), 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 6. Заголовок
    ctx.fillStyle = 'rgba(244,241,222,0.85)';
    ctx.font = '12px "Inter", sans-serif';
    ctx.fillText(`Метод простой итерации. t=${t}, x₀=${fmt(x0,3)}`, pad.l, 16);
}
// Вспомогательная функция: рисует пунктирную линию со стрелочкой на конце
function drawArrow(ctx, fromX, fromY, toX, toY) {
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    // Рисуем стрелочку на конце
    const angle = Math.atan2(toY - fromY, toX - fromX);
    const headLen = 7;
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLen * Math.cos(angle - Math.PI / 6), toY - headLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headLen * Math.cos(angle + Math.PI / 6), toY - headLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
}
// Универсальный генератор скрываемой таблицы
let _tableIdCounter = 0;
function hiddenTable(html) {
    const id = 'iter-table-' + (++_tableIdCounter);
    return `
        <button class="iter-toggle-btn" onclick="document.getElementById('${id}').classList.toggle('visible'); this.textContent = document.getElementById('${id}').classList.contains('visible') ? 'Скрыть итерации' : 'Показать итерации'">
            Показать итерации
        </button>
        <div id="${id}" class="iter-table-wrap">
            ${html}
        </div>
    `;
}