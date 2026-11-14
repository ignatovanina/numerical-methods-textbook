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

function parseMathExpr(expr) {
    if (!expr) return expr;
    let s = expr;
    
    let match;
    // Базовый regex для простых случаев (x^2, t^3, 2^10)
    const simplePow = /([a-zA-Z0-9_\.]+)\s*\^\s*([a-zA-Z0-9_\.\-]+)/;
    while ((match = simplePow.exec(s)) !== null) {
        s = s.replace(match[0], `Math.pow(${match[1]}, ${match[2]})`);
    }

    // Для скобок (пока упрощенно, только один уровень)
    // Например: (x+1)^2 -> Math.pow((x+1), 2)
    const bracketPow = /(\([^\(\)]+\))\s*\^\s*([a-zA-Z0-9_\.\-]+)/;
    while ((match = bracketPow.exec(s)) !== null) {
        s = s.replace(match[0], `Math.pow(${match[1]}, ${match[2]})`);
    }

    // 2. Функции: sin(x) -> Math.sin(x)
    const mathFuncs = ['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'sqrt', 'exp', 'log', 'abs'];
    mathFuncs.forEach(fn => {
        // \b - граница слова, чтобы не заменить Math.sin, если уже есть
        const regex = new RegExp(`(?<!Math\\.)\\b${fn}\\s*\\(`, 'g');
        s = s.replace(regex, `Math.${fn}(`);
    });

    // 3. Специальные функции
    s = s.replace(/(?<!Math\.)\bln\s*\(/g, 'Math.log(');       // ln(x) -> Math.log(x)
    s = s.replace(/(?<!Math\.)\blg\s*\(/g, 'Math.log10(');     // lg(x) -> Math.log10(x)
    s = s.replace(/(?<!Math\.)\btg\s*\(/g, 'Math.tan(');       // tg(x) -> Math.tan(x)
    s = s.replace(/(?<!Math\.)\bctg\s*\(/g, '1/Math.tan(');    // ctg(x) -> 1/Math.tan(x)

    // 4. Константы
    s = s.replace(/\bpi\b/gi, 'Math.PI');
    return s;
}
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
/* ============================================================
   UX: Навигация по полям ввода с помощью стрелок
   ============================================================ */
document.addEventListener('keydown', (e) => {
    const input = e.target;
    if (input.tagName !== 'INPUT') return;

    // Ищем ближайший контейнер калькулятора, чтобы не улететь на другие поля сайта
    const card = input.closest('.calc-card');
    if (!card) return;

    // Собираем все поля ввода внутри этого калькулятора в порядке их следования в HTML
    const inputs = Array.from(card.querySelectorAll('input'));
    const index = inputs.indexOf(input);
    if (index === -1) return;

    let nextInput = null;

    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        // Для матриц (ЛР 2, ЛР 3) лучше скакать по строкам (следующее поле в таблице)
        // Это работает и для обычных полей, просто переключает их по порядку.
        e.preventDefault();
        if (e.key === 'ArrowDown') {
            nextInput = inputs[index + 1];
        } else {
            nextInput = inputs[index - 1];
        }
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        // Влево/Вправо переключаем только если курсор в крайней позиции
        // (чтобы не мешать редактировать само число)
        if (e.key === 'ArrowRight' && input.selectionStart === input.value.length) {
            e.preventDefault();
            nextInput = inputs[index + 1];
        } else if (e.key === 'ArrowLeft' && input.selectionStart === 0) {
            e.preventDefault();
            nextInput = inputs[index - 1];
        }
    }

    if (nextInput) {
        nextInput.focus();
        // Выделяем текст в поле, чтобы его можно было сразу заменить при вводе
        nextInput.select();
    }
});
/* ============================================================
   Интерактивные подсказки для полей ввода формул
   ============================================================ */

const FORMULA_HINTS = [
    { symbol: 'x^2',  desc: 'Степень' },
    { symbol: 'sin(x)', desc: 'Синус' },
    { symbol: 'cos(x)', desc: 'Косинус' },
    { symbol: 'tg(x)',  desc: 'Тангенс' },
    { symbol: 'ln(x)',  desc: 'Натуральный логарифм' },
    { symbol: 'lg(x)',  desc: 'Десятичный логарифм' },
    { symbol: 'exp(x)', desc: 'Экспонента (e^x)' },
    { symbol: 'sqrt(x)', desc: 'Корень' },
    { symbol: 'pi',     desc: 'Число π' },
    { symbol: 'e',      desc: 'Число e' },
    { symbol: 'abs(x)', desc: 'Модуль' }
];

function initFormulaHints() {
    // Находим все поля, в которых ожидается формула
    // (по id или по паттерну: is-f, bi-f, ch-f, nt-f, sc-f, mn-f, cb-f, it-g, ode-f, lag-f, int-f1, int-phi, int-psi)
    const formulaInputs = document.querySelectorAll(
        'input[id$="-f"], input[id$="-g"], input[id^="int-f"], input[id^="int-phi"], input[id^="int-psi"]'
    );

    formulaInputs.forEach(input => {
        // Создаём панель подсказок
        const hint = document.createElement('div');
        hint.className = 'formula-hint';
        hint.innerHTML = `
            <h4>Как писать формулы</h4>
            <ul>
                ${FORMULA_HINTS.map(h =>
            `<li><code data-insert="${h.symbol}">${h.symbol}</code> — ${h.desc}</li>`
        ).join('')}
            </ul>
        `;

        // Вставляем панель рядом с input
        input.parentElement.style.position = 'relative';
        input.parentElement.appendChild(hint);

        // Показываем при фокусе
        input.addEventListener('focus', () => {
            hint.classList.add('visible');
            // Позиционируем под полем
            const rect = input.getBoundingClientRect();
            const parentRect = input.parentElement.getBoundingClientRect();
            hint.style.top = (rect.bottom - parentRect.top + 5) + 'px';
            hint.style.left = '0';
        });

        // Скрываем при клике вне
        document.addEventListener('click', (e) => {
            if (!input.parentElement.contains(e.target)) {
                hint.classList.remove('visible');
            }
        });

        // Вставляем пример при клике на code
        hint.querySelectorAll('code[data-insert]').forEach(code => {
            code.addEventListener('click', (e) => {
                e.preventDefault();
                const text = code.dataset.insert;
                const start = input.selectionStart;
                const end = input.selectionEnd;
                const val = input.value;
                input.value = val.slice(0, start) + text + val.slice(end);
                input.focus();
                input.setSelectionRange(start + text.length, start + text.length);
            });
        });
    });
}

// Автоматически инициализируем при загрузке
document.addEventListener('DOMContentLoaded', initFormulaHints);
document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.remove('not-loaded');
});