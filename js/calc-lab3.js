
function buildLagrangeInputs() {
    const n = parseInt(document.getElementById('lag-nodes').value) || 5;
    const m = parseInt(document.getElementById('lag-points').value) || 2;

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