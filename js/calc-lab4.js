function integrateSimpson(f, a, b, eps) {
    let n = 4; // Начальное число разбиений (четное)
    let I_old = 0;
    let I_new = 0;
    let iter = 0;

    while (iter < 100) {
        const h = (b - a) / n;
        let sum = f(a) + f(b);

        for (let i = 1; i < n; i++) {
            const x = a + i * h;
            if (i % 2 === 0) sum += 2 * f(x);
            else sum += 4 * f(x);
        }
        I_new = (h / 3) * sum;

        // Проверка на точность (правило Рунге)
        if (iter > 0 && Math.abs(I_new - I_old) < eps * 15) {
            break;
        }
        I_old = I_new;
        n *= 2;
        iter++;
    }
    return { value: I_new, N: n, iter: iter };
}
function calcIntegralU() {
    const expr = document.getElementById('int-f1').value;
    const a = parseFloat(document.getElementById('int-a1').value);
    const b = parseFloat(document.getElementById('int-b1').value);
    const eps = parseFloat(document.getElementById('int-eps1').value);

    try {
        const f = new Function('x', 'return ' + expr);
        // Проверка, что функция работает
        if (!isFinite(f(a)) && !isFinite(f(b))) throw new Error("Функция не определена на границах");

        const res = integrateSimpson(f, a, b, eps);

        document.getElementById('int-u-out').innerHTML = `
            <p><b>Значение интеграла u:</b> <span class="calc-root">${fmt(res.value, 8)}</span></p>
            <p style="font-size: 0.85rem; color: var(--text-muted);">
                Достигнуто при N = ${res.N} разбиениях (итераций: ${res.iter + 1}).
            </p>
        `;
    } catch (e) {
        document.getElementById('int-u-out').innerHTML = errBox('Ошибка в функции f_1: ' + e.message);
    }
}
function calcIntegralFt() {
    const phiExpr = document.getElementById('int-phi').value;
    const psiExpr = document.getElementById('int-psi').value;
    const mu = parseFloat(document.getElementById('int-mu').value);

    const a2 = parseFloat(document.getElementById('int-a2').value);
    const b2 = parseFloat(document.getElementById('int-b2').value);
    const c = parseFloat(document.getElementById('int-c').value);
    const d = parseFloat(document.getElementById('int-d').value);
    const m = parseInt(document.getElementById('int-m').value);
    const eps2 = parseFloat(document.getElementById('int-eps2').value);

    try {
        const phi = new Function('z', 'return ' + phiExpr);
        const psi = new Function('x', 'return ' + psiExpr);

        // Функция f2(x, t) согласно заданию
        const f2 = (x, t) => {
            const z = t / (1 + x * x) + mu * x;
            return phi(z) * psi(x);
        };

        const h = (d - c) / m;
        const results = [];

        // Считаем интеграл для каждого t_i
        for (let i = 0; i <= m; i++) {
            const t = c + i * h;
            const integralFunc = (x) => f2(x, t);
            const res = integrateSimpson(integralFunc, a2, b2, eps2);
            results.push({ t, F: res.value });
        }

        // Таблица
        let tableHtml = `<table class="lab-table">
            <thead><tr><th>i</th><th>t_i</th><th>F(t_i)</th></tr></thead><tbody>`;
        results.forEach((r, i) => {
            tableHtml += `<tr><td>${i}</td><td>${fmt(r.t, 4)}</td><td>${fmt(r.F, 6)}</td></tr>`;
        });
        tableHtml += `</tbody></table>`;

        document.getElementById('int-ft-out').innerHTML = hiddenTable(tableHtml);

        // График F(t)
        const f_graph = (t) => {
            const func = (x) => f2(x, t);
            return integrateSimpson(func, a2, b2, eps2).value;
        };

        Graph.draw(document.getElementById('int-canvas'), f_graph, 0, c, d, {
            title: `Функция F(t) = ∫ f_2(x, t) dx`
        });

    } catch (e) {
        document.getElementById('int-ft-out').innerHTML = errBox('Ошибка в параметрах F(t): ' + e.message);
    }
}