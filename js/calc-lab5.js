// Один шаг модифицированного метода Эйлера
function eulerModStep(f, x, y, h) {
    // 1. Вычисляем наклон в начале шага
    const k1 = f(x, y);

    // 2. Находим середину шага
    const x_half = x + h / 2;
    const y_half = y + (h / 2) * k1;

    // 3. Вычисляем наклон в середине
    const k2 = f(x_half, y_half);

    // 4. Делаем полный шаг с новым наклоном
    return y + h * k2;
}
function solveODE(autoStep) {
    const fExpr = document.getElementById('ode-f').value;
    const x0 = parseFloat(document.getElementById('ode-x0').value);
    const y0 = parseFloat(document.getElementById('ode-y0').value);
    const b = parseFloat(document.getElementById('ode-b').value);
    const h0 = parseFloat(document.getElementById('ode-h0').value);
    const eps = parseFloat(document.getElementById('ode-eps').value);

    try {
        const f = new Function('x', 'y', 'return ' + fExpr);
        let points = [];
        let stepsCount = 0;

        if (autoStep) {
            // --- Режим А: Автоматический шаг ---
            let x = x0, y = y0, h = h0;
            points.push({ x, y });
            let safetyCounter = 0;

            while (x < b - 1e-10 && safetyCounter < 10000) {
                safetyCounter++;

                const y_full = eulerModStep(f, x, y, h);
                const y_half1 = eulerModStep(f, x, y, h/2);
                const y_half2 = eulerModStep(f, x + h/2, y_half1, h/2);

                // Правило Рунге для 2-го порядка: delta = |y_half - y_full| / 3
                const delta = Math.abs(y_half2 - y_full) / 3;

                if (delta <= eps || h < 1e-6) {
                    x += h;
                    y = y_half2;
                    points.push({ x, y });
                    stepsCount++;
                    if (delta < eps / 4) h *= 2;
                } else {
                    h /= 2;
                }
                if (x + h > b) h = b - x;
            }
        } else {
            // --- Режим Б: Постоянный шаг ---
            const N = Math.ceil((b - x0) / h0);
            const h = (b - x0) / N;

            let x = x0, y = y0;
            points.push({ x, y });

            for (let i = 0; i < N; i++) {
                y = eulerModStep(f, x, y, h);
                x += h;
                points.push({ x, y });
                stepsCount++;
            }
        }

        // Вывод таблицы
        let tableHtml = `<table class="lab-table">
            <thead><tr><th>i</th><th>x_i</th><th>y_i</th></tr></thead><tbody>`;
        points.forEach((p, i) => {
            tableHtml += `<tr><td>${i}</td><td>${fmt(p.x, 4)}</td><td>${fmt(p.y, 6)}</td></tr>`;
        });
        tableHtml += `</tbody></table>`;

        document.getElementById('ode-out').innerHTML = `
            <p><b>Режим:</b> ${autoStep ? 'Автоматический шаг' : 'Постоянный шаг'}</p>
            <p><b>Количество шагов:</b> ${stepsCount}</p>
            ${hiddenTable(tableHtml)}
        `;

    } catch (e) {
        document.getElementById('ode-out').innerHTML = errBox('Ошибка в функции: ' + e.message);
    }
}
