/* ============================================================
   calc-common.js — Общие утилиты для всех калькуляторов
   ============================================================ */

// 1. Форматирование чисел
function fmt(x, n = 6) {
    if (!isFinite(x)) return '—';
    if (Math.abs(x) >= 1e5 || (Math.abs(x) < 1e-4 && x !== 0)) return x.toExponential(3);
    return (+x.toFixed(n)).toString();
}

// 2. Экранирование HTML
const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

// 3. Плашка для корня
const rootBox = r => `<div class="calc-root">x* ≈ ${fmt(r, 8)}</div>`;

// 4. Плашка для ошибки
const errBox = m => `<div class="calc-error">${esc(m)}</div>`;

// 5. Получение значения из input
const val = id => parseFloat(document.getElementById(id).value);

// 6. Безопасное создание функции из строки
function makeF(inputId, outId) {
    const expr = document.getElementById(inputId).value;
    try { return Num.makeF(expr); }
    catch (e) {
        document.getElementById(outId).innerHTML = errBox('Expression error: ' + e.message);
        return null;
    }
}

// 7. Универсальный генератор скрываемой таблицы
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

// 8. Вспомогательная функция для рисования стрелочек
function drawArrow(ctx, fromX, fromY, toX, toY) {
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    const angle = Math.atan2(toY - fromY, toX - fromX);
    const headLen = 7;
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLen * Math.cos(angle - Math.PI / 6), toY - headLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headLen * Math.cos(angle + Math.PI / 6), toY - headLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
}