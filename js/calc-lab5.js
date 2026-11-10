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