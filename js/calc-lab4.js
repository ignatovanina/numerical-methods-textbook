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