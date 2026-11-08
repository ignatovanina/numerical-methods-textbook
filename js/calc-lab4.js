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