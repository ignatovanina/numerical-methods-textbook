
function buildLagrangeInputs() {
    const n = parseInt(document.getElementById('lag-nodes').value) || 5;
    const m = parseInt(document.getElementById('lag-points').value) || 2;

    if (window._lagNodesData)  window._lagNodesData  = window._lagNodesData.slice(0, n);
    if (window._lagPointsData) window._lagPointsData = window._lagPointsData.slice(0, m);

    const nodesContainer = document.getElementById('lag-nodes-container');
    const pointsContainer = document.getElementById('lag-points-container');

    // Сохраняем старые значения
    const oldNodes = window._lagNodesData || [];
    const oldPoints = window._lagPointsData || [];

    // Генерируем узлы
    let nodesHtml = `<table class="lab-table" style="border: none;">
        <thead><tr><th style="border: none; background: transparent;">i</th><th>x_i</th><th>y_i</th></tr></thead><tbody>`;
    for (let i = 0; i < n; i++) {
        const xVal = (oldNodes[i] && oldNodes[i].x !== undefined) ? oldNodes[i].x : 0;
        const yVal = (oldNodes[i] && oldNodes[i].y !== undefined) ? oldNodes[i].y : 0;
        nodesHtml += `<tr>
            <td style="border: none; color: var(--text-muted);">${i}</td>
            <td style="border: none;"><input id="lag-x-${i}" type="number" step="any" value="${xVal}" style="width: 70px; padding: 5px; background: var(--bg-main); color: var(--text-main); border: 1px solid var(--border-color); border-radius: 4px;"></td>
            <td style="border: none;"><input id="lag-y-${i}" type="number" step="any" value="${yVal}" style="width: 70px; padding: 5px; background: var(--bg-main); color: var(--text-main); border: 1px solid var(--border-color); border-radius: 4px;"></td>
        </tr>`;
    }
    nodesHtml += `</tbody></table>`;
    nodesContainer.innerHTML = nodesHtml;

    // Генерируем точки
    let pointsHtml = `<table class="lab-table" style="border: none;">
        <thead><tr><th style="border: none; background: transparent;">j</th><th>x_j</th></tr></thead><tbody>`;
    for (let j = 0; j < m; j++) {
        const xVal = oldPoints[j] !== undefined ? oldPoints[j] : 0;
        pointsHtml += `<tr>
            <td style="border: none; color: var(--text-muted);">${j}</td>
            <td style="border: none;"><input id="lag-pt-${j}" type="number" step="any" value="${xVal}" style="width: 70px; padding: 5px; background: var(--bg-main); color: var(--text-main); border: 1px solid var(--border-color); border-radius: 4px;"></td>
        </tr>`;
    }
    pointsHtml += `</tbody></table>`;
    pointsContainer.innerHTML = pointsHtml;
}

document.addEventListener('DOMContentLoaded', () => {
    buildLagrangeInputs();
});
function calcLagrange() {
    const n = parseInt(document.getElementById('lag-nodes').value);
    const m = parseInt(document.getElementById('lag-points').value);

    // 1. Считываем узлы
    const nodes = [];
    for (let i = 0; i < n; i++) {
        const x = parseFloat(document.getElementById(`lag-x-${i}`).value) || 0;
        const y = parseFloat(document.getElementById(`lag-y-${i}`).value) || 0;
        nodes.push({ x, y });
    }
    window._lagNodesData = nodes;

    // 2. Считываем точки x_j
    const points = [];
    for (let j = 0; j < m; j++) {
        const x = parseFloat(document.getElementById(`lag-pt-${j}`).value) || 0;
        points.push(x);
    }
    window._lagPointsData = points;

    // 3. Вычисляем P(x) для каждой точки x_j
    const results = [];
    for (let j = 0; j < m; j++) {
        const xj = points[j];
        let sum = 0;

        for (let i = 0; i < n; i++) {
            let term = nodes[i].y;
            for (let k = 0; k < n; k++) {
                if (i !== k) {
                    // Защита от деления на ноль (если узлы совпадают)
                    if (nodes[i].x === nodes[k].x) {
                        document.getElementById('lag-out').innerHTML = errBox('Ошибка: узлы x_i не должны совпадать.');
                        return;
                    }
                    term *= (xj - nodes[k].x) / (nodes[i].x - nodes[k].x);
                }
            }
            sum += term;
        }
        results.push({ xj, yj: sum });
    }

    // 4. Вывод таблицы
    let tableHtml = `<table class="lab-table">
        <thead>
            <tr>
                <th>j</th>
                <th>x_j</th>
                <th>P_n(x_j)</th>
            </tr>
        </thead>
        <tbody>`;

    for (let j = 0; j < results.length; j++) {
        tableHtml += `<tr>
            <td>${j}</td>
            <td>${fmt(results[j].xj, 4)}</td>
            <td><span class="calc-root" style="font-size: 0.9rem; padding: 2px 8px;">${fmt(results[j].yj, 6)}</span></td>
        </tr>`;
    }
    tableHtml += `</tbody></table>`;

    document.getElementById('lag-out').innerHTML = `
        <h4 style="color: var(--text-main); margin-bottom: 10px;">Результаты интерполяции:</h4>
        ${tableHtml}
    `;

    // 5. Отрисовка графика
    drawLagrangeChart(nodes, results);
}
function drawLagrangeChart(nodes, results) {
    const cv = document.getElementById('lag-canvas');

    // Функция для передачи в график: считает P(x) для любого x
    const f_lagrange = (x, t) => {
        let sum = 0;
        const n = nodes.length;
        for (let i = 0; i < n; i++) {
            let term = nodes[i].y;
            for (let k = 0; k < n; k++) {
                if (i !== k) {
                    term *= (x - nodes[k].x) / (nodes[i].x - nodes[k].x);
                }
            }
            sum += term;
        }
        return sum;
    };

    // Определяем границы графика по узлам и точкам
    const allX = [...nodes.map(n => n.x), ...results.map(r => r.xj)];
    const minX = Math.min(...allX);
    const maxX = Math.max(...allX);
    const padX = (maxX - minX) * 0.1 || 1; // Отступ 10%

    // Готовим точки для отрисовки (узлы + вычисленные)
    const rootMarkers = [
        ...nodes.map(n => ({ x: n.x, y: n.y })),
        ...results.map(r => ({ x: r.xj, y: r.yj }))
    ];

    Graph.draw(cv, f_lagrange, 0, minX - padX, maxX + padX, {
        title: 'Многочлен Лагранжа',
        roots: rootMarkers
    });
}