const Graph = (() => {
    // 1. Хранилище состояний для каждого canvas (границы, масштаб)
    const states = new Map();

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

    function draw(canvas, f, t, xmin, xmax, opts = {}) {
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const W = canvas.clientWidth || 640;
        const H = canvas.clientHeight || 280;

        // Инициализация состояния при первом вызове
        if (!states.has(canvas) || states.get(canvas).f !== f || states.get(canvas).t !== t) {
            opts._initialXmin = xmin;
            opts._initialXmax = xmax;
            states.set(canvas, { xmin, xmax, f, t, opts });
        }

        // Получаем текущие границы из состояния (если зум уже был)
        const st = states.get(canvas);
        xmin = st.xmin; xmax = st.xmax;

        // Настраиваем размер canvas с учетом Retina
        if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
            canvas.width = W * dpr;
            canvas.height = H * dpr;
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // Фон
        ctx.fillStyle = '#14161a';
        ctx.fillRect(0, 0, W, H);

        const pad = { l: 46, r: 16, t: 26, b: 30 };
        const pw = W - pad.l - pad.r;
        const ph = H - pad.t - pad.b;

        // Сэмплируем точки
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

        // Сохраняем вычисленные Y-границы (для мыши)
        st.ymin = ymin; st.ymax = ymax;

        const X = x => pad.l + (x - xmin) / (xmax - xmin) * pw;
        const Y = y => pad.t + ph - (y - ymin) / (ymax - ymin) * ph;

        // Сетка и тики
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

        // Оси
        ctx.strokeStyle = 'rgba(244,241,222,0.35)';
        ctx.lineWidth = 1.2;
        if (ymin <= 0 && ymax >= 0) {
            ctx.beginPath(); ctx.moveTo(pad.l, Y(0)); ctx.lineTo(pad.l + pw, Y(0)); ctx.stroke();
        }
        if (xmin <= 0 && xmax >= 0) {
            ctx.beginPath(); ctx.moveTo(X(0), pad.t); ctx.lineTo(X(0), pad.t + ph); ctx.stroke();
        }

        // Кривая
        ctx.strokeStyle = '#00A896';
        ctx.lineWidth = 2;
        ctx.beginPath();
        let started = false;
        pts.forEach(p => {
            if (!isFinite(p.y)) { started = false; return; }
            const py = Y(p.y);
            if (py < pad.t - 3000 || py > pad.t + ph + 3000) { started = false; return; }
            if (!started) { ctx.moveTo(X(p.x), py); started = true; }
            else ctx.lineTo(X(p.x), py);
        });
        ctx.stroke();

        // Отрезок изоляции
        if (opts.segment) {
            const [a, b] = opts.segment;
            ctx.fillStyle = 'rgba(0,168,150,0.12)';
            ctx.fillRect(X(a), pad.t, X(b) - X(a), ph);
            ctx.strokeStyle = 'rgba(0,168,150,0.6)';
            ctx.setLineDash([4, 3]);
            ctx.beginPath();
            ctx.moveTo(X(a), pad.t); ctx.lineTo(X(a), pad.t + ph);
            ctx.moveTo(X(b), pad.t); ctx.lineTo(X(b), pad.t + ph);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Маркеры корней
        (opts.roots || []).forEach(r => {
            if (!isFinite(r.y)) r.y = f(r.x, t);
            const px = X(r.x), py = Y(r.y);
            ctx.fillStyle = '#F4F1DE';
            ctx.strokeStyle = '#00A896';
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            if (!opts.hideLabels) {
                ctx.fillStyle = '#00A896';
                ctx.font = 'bold 11px "Courier New", monospace';
                ctx.fillText('x* ≈ ' + r.x.toFixed(5), px + 8, py - 8);
            }
        });

        // Заголовок
        if (opts.title) {
            ctx.fillStyle = 'rgba(244,241,222,0.85)';
            ctx.font = '12px "Inter", sans-serif';
            ctx.fillText(opts.title, pad.l, 16);
        }

        // Навешиваем обработчик зума (только один раз)
        if (!canvas.hasAttribute('data-zoom-initialized')) {
            canvas.setAttribute('data-zoom-initialized', 'true');

            canvas.addEventListener('wheel', (e) => {
                e.preventDefault(); // Отключаем скролл страницы

                const s = states.get(canvas);
                if (!s) return;

                // Находим позицию мыши
                const rect = canvas.getBoundingClientRect();
                const mx = e.clientX - rect.left;
                const my = e.clientY - rect.top;

                // Переводим пиксели в координаты графика
                const x_ratio = (mx - pad.l) / pw;
                const y_ratio = (my - pad.t) / ph;

                const mouseX = s.xmin + x_ratio * (s.xmax - s.xmin);
                // (Y перевернута)

                // Коэффициент зума
                const zoomFactor = e.deltaY > 0 ? 1.15 : 0.85;

                // Применяем зум относительно мыши
                s.xmin = mouseX + (s.xmin - mouseX) * zoomFactor;
                s.xmax = mouseX + (s.xmax - mouseX) * zoomFactor;

                // Перерисовываем
                draw(canvas, s.f, s.t, s.xmin, s.xmax, s.opts);
            });
            // --- Панорамирование (Drag) ---
            let isDragging = false;
            let lastMouseX = 0, lastMouseY = 0;

            canvas.addEventListener('mousedown', (e) => {
                isDragging = true;
                lastMouseX = e.clientX;
                lastMouseY = e.clientY;
                canvas.style.cursor = 'grabbing';
            });

            canvas.addEventListener('mousemove', (e) => {
                if (!isDragging) return;

                const s = states.get(canvas);
                if (!s) return;

                const dx = e.clientX - lastMouseX;
                const dy = e.clientY - lastMouseY;

                lastMouseX = e.clientX;
                lastMouseY = e.clientY;

                // Переводим пиксели в координаты
                const xRange = s.xmax - s.xmin;
                const yRange = s.ymax - s.ymin;

                const shiftX = -dx / pw * xRange;
                const shiftY = dy / ph * yRange;

                s.xmin += shiftX;
                s.xmax += shiftX;
                s.ymin += shiftY;
                s.ymax += shiftY;

                draw(canvas, s.f, s.t, s.xmin, s.xmax, s.opts);
            });

            const stopDrag = () => {
                isDragging = false;
                canvas.style.cursor = 'grab';
            };
            canvas.addEventListener('mouseup', stopDrag);
            canvas.addEventListener('mouseleave', stopDrag);

            // Устанавливаем курсор по умолчанию
            canvas.style.cursor = 'grab';
            // --- Тултип ---
            let tooltip = document.createElement('div');
            tooltip.style.cssText = 'position: absolute; background: rgba(20,22,26,0.9); color: #00A896; padding: 4px 8px; border-radius: 4px; font-family: monospace; font-size: 12px; pointer-events: none; border: 1px solid #00A896; display: none; z-index: 20;';
            if (!canvas.parentElement.querySelector('.graph-tooltip')) {
                canvas.parentElement.style.position = 'relative';
                canvas.parentElement.appendChild(tooltip);
                tooltip.className = 'graph-tooltip';
            } else {
                tooltip = canvas.parentElement.querySelector('.graph-tooltip');
            }

            canvas.addEventListener('mousemove', (e) => {
                const s = states.get(canvas);
                if (!s) return;

                const rect = canvas.getBoundingClientRect();
                const mx = e.clientX - rect.left;
                const my = e.clientY - rect.top;

                // Проверяем, что мышь внутри области графика
                if (mx < pad.l || mx > W - pad.r || my < pad.t || my > H - pad.b) {
                    tooltip.style.display = 'none';
                    return;
                }

                // Переводим в координаты
                const x_ratio = (mx - pad.l) / pw;
                const y_ratio = (my - pad.t) / ph;

                const x_val = s.xmin + x_ratio * (s.xmax - s.xmin);
                const y_val = s.ymax - y_ratio * (s.ymax - s.ymin); // Y инвертирована

                tooltip.textContent = `x: ${x_val.toFixed(3)}, y: ${y_val.toFixed(3)}`;
                tooltip.style.left = (mx + 15) + 'px';
                tooltip.style.top = (my - 30) + 'px';
                tooltip.style.display = 'block';
            });

            canvas.addEventListener('mouseleave', () => {
                tooltip.style.display = 'none';
            });
        }
    }

    return { ticks, fmtTick, draw };
})();