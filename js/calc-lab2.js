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