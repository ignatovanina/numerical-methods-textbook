function toggleModule(element) {
    const content = element.nextElementSibling;
    const arrow = element.querySelector('span:last-child');

    if (content.classList.contains('open')) {
        content.classList.remove('open');
        arrow.textContent = '›';
        element.classList.remove('active');
    } else {
        content.classList.add('open');
        arrow.textContent = '⌄';
        element.classList.add('active');
    }
}
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const modules = document.querySelectorAll('.module');

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();

        modules.forEach(module => {
            const moduleContent = module.querySelector('.module-content');
            const moduleHeader = module.querySelector('.module-header');
            const moduleHeaderText = moduleHeader.textContent.toLowerCase();
            const lessons = module.querySelectorAll('.lesson');

            // 1. Проверяем, есть ли совпадение в заголовке модуля
            const headerMatches = moduleHeaderText.includes(query);

            // 2. Проверяем каждую тему внутри модуля
            let anyLessonMatches = false;
            lessons.forEach(lesson => {
                const lessonText = lesson.textContent.toLowerCase();
                const lessonMatches = lessonText.includes(query);

                if (lessonMatches || query === '') {
                    lesson.style.display = 'flex';
                    if (lessonMatches) anyLessonMatches = true;
                } else {
                    lesson.style.display = 'none';
                }
            });

            // 3. Определяем, показывать ли весь модуль
            const moduleMatches = headerMatches || anyLessonMatches;

            if (query === '') {
                // Пустой запрос — вернуть исходное состояние
                module.style.display = 'block';
                moduleContent.classList.remove('open');
                moduleHeader.classList.remove('active');
                // Раскрываем только первый модуль (как было изначально)
                if (module === modules[0]) {
                    moduleContent.classList.add('open');
                    moduleHeader.classList.add('active');
                }
            } else if (moduleMatches) {
                // Есть совпадение — показываем модуль и раскрываем
                module.style.display = 'block';
                moduleContent.classList.add('open');
                moduleHeader.classList.add('active');
            } else {
                // Нет совпадения — скрываем модуль
                module.style.display = 'none';
                moduleContent.classList.remove('open');
                moduleHeader.classList.remove('active');
            }
        });
    });
});