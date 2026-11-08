function buildMatrixInputs() {
    const m = parseInt(document.getElementById('gauss-m').value) || 3;
    const container = document.getElementById('gauss-inputs-container');

    let html = `<table class="lab-table" style="font-family: 'Courier New', monospace;">
        <thead>
            <tr>
                <th style="width: 40px; border-right: 1px solid var(--border-color);">i \\ j</th>
                ${Array.from({length: m}, (_, j) => `<th>${j+1}</th>`).join('')}
                <th style="border-left: 2px solid var(--accent);">b</th>
            </tr>
        </thead>
        <tbody>`;

    // Сохраняем старые значения при изменении размерности
    const oldVals = window._gaussMatrixData || [];

    for (let i = 0; i < m; i++) {
        html += `<tr><td style="color: var(--text-muted); border-right: 1px solid var(--border-color);">${i+1}</td>`;
        for (let j = 0; j < m; j++) {
            const val = (oldVals[i] && oldVals[i][j] !== undefined) ? oldVals[i][j] : 0;
            html += `<td><input id="gauss-a-${i}-${j}" type="number" step="any" value="${val}" style="width: 60px; padding: 5px; background: var(--bg-main); color: var(--text-main); border: 1px solid var(--border-color); border-radius: 4px;"></td>`;
        }
        const bVal = (oldVals[i] && oldVals[i][m] !== undefined) ? oldVals[i][m] : 0;
        html += `<td style="border-left: 2px solid var(--accent);"><input id="gauss-b-${i}" type="number" step="any" value="${bVal}" style="width: 60px; padding: 5px; background: var(--bg-main); color: var(--text-main); border: 1px solid var(--border-color); border-radius: 4px;"></td>`;
        html += `</tr>`;
    }
    html += `</tbody></table>`;
    container.innerHTML = html;
}

// Генерируем поля при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    buildMatrixInputs();
});
function calcGauss() {
    const m = parseInt(document.getElementById('gauss-m').value);

    // 1. Считываем данные из полей ввода
    const A = [];
    const b = [];
    for (let i = 0; i < m; i++) {
        const row = [];
        for (let j = 0; j < m; j++) {
            row.push(parseFloat(document.getElementById(`gauss-a-${i}-${j}`).value) || 0);
        }
        A.push(row);
        b.push(parseFloat(document.getElementById(`gauss-b-${i}`).value) || 0);
    }

    // Сохраняем введенные данные (чтобы не потерять при изменении m)
    window._gaussMatrixData = A.map((row, i) => [...row, b[i]]);

    // 2. Метод Гаусса (с выбором главного элемента по столбцу)
    const n = m;
    let mat = A.map((row, i) => [...row, b[i]]); // Расширенная матрица

    for (let col = 0; col < n; col++) {
        // Ищем максимальный элемент в текущем столбце
        let maxRow = col;
        let maxVal = Math.abs(mat[col][col]);
        for (let i = col + 1; i < n; i++) {
            if (Math.abs(mat[i][col]) > maxVal) {
                maxVal = Math.abs(mat[i][col]);
                maxRow = i;
            }
        }

        // Если максимум близок к нулю — система вырождена
        if (maxVal < 1e-12) {
            document.getElementById('gauss-out').innerHTML = errBox('Система вырождена (нулевой главный элемент).');
            return;
        }

        // Меняем строки местами
        if (maxRow !== col) {
            [mat[col], mat[maxRow]] = [mat[maxRow], mat[col]];
        }

        // Прямой ход: обнуляем элементы под диагональю
        for (let i = col + 1; i < n; i++) {
            const factor = mat[i][col] / mat[col][col];
            for (let j = col; j <= n; j++) {
                mat[i][j] -= factor * mat[col][j];
            }
        }
    }

    // 3. Обратный ход
    const x = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
        let sum = mat[i][n];
        for (let j = i + 1; j < n; j++) {
            sum -= mat[i][j] * x[j];
        }
        x[i] = sum / mat[i][i];
    }

    // 4. Вычисление вектора невязки r = Ax - b
    const r = [];
    for (let i = 0; i < n; i++) {
        let sum = 0;
        for (let j = 0; j < n; j++) {
            sum += A[i][j] * x[j];
        }
        r.push(sum - b[i]);
    }

    // 5. Формируем HTML для вывода
    let xHtml = '';
    for (let i = 0; i < n; i++) {
        xHtml += `<div style="margin-bottom: 8px;">
            <span style="color: var(--text-muted);">x<sub>${i+1}</sub> = </span>
            <span class="calc-root">${fmt(x[i], 6)}</span>
        </div>`;
    }

    let rHtml = '';
    for (let i = 0; i < n; i++) {
        const isSmall = Math.abs(r[i]) < 1e-6;
        const color = isSmall ? 'var(--accent)' : '#ff4d4d';
        rHtml += `<div style="margin-bottom: 5px;">
            <span style="color: var(--text-muted);">r<sub>${i+1}</sub> = </span>
            <span style="color: ${color}; font-family: 'Courier New', monospace;">${fmt(r[i], 10)}</span>
        </div>`;
    }

    // Выводим результат
    document.getElementById('gauss-out').innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 15px;">
            <div>
                <h4 style="color: var(--text-main); margin-bottom: 10px;">Вектор решения x:</h4>
                ${xHtml}
            </div>
            <div>
                <h4 style="color: var(--text-main); margin-bottom: 10px;">Вектор невязки r:</h4>
                ${rHtml}
                <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 10px;">
                    * Значения невязки, близкие к нулю, подтверждают правильность решения.
                </p>
            </div>
        </div>
    `;
}