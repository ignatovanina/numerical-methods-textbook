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
// Переключение между секциями контента
function showPage(pageId) {
    // 1. Скрываем все страницы
    const pages = document.querySelectorAll('.content-page');
    pages.forEach(page => page.classList.remove('active'));

    // 2. Показываем нужную
    const targetPage = document.getElementById('page-' + pageId);
    if (targetPage) {
        targetPage.classList.add('active');
    }

    // 3. Прокручиваем main content наверх
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.scrollTop = 0;
    }

    // 4. Обновляем активную ссылку в сайдбаре
    document.querySelectorAll('.lesson').forEach(link => {
        link.classList.remove('active');
    });
    const activeLink = document.querySelector(`.lesson[href="#${pageId.replace('-', '.')}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }

    // 5. Обновляем hash в URL (чтобы работала кнопка "Назад")
    history.pushState(null, '', '#' + pageId);

    // 6. Перерендериваем формулы KaTeX
    if (window.renderMathInElement) {
        renderMathInElement(targetPage, {
            delimiters: [
                {left: '$$', right: '$$', display: true},
                {left: '$', right: '$', display: false}
            ]
        });
    }
}

// При загрузке страницы проверяем hash в URL
document.addEventListener('DOMContentLoaded', () => {
    const hash = window.location.hash.replace('#', '');
    if (hash && document.getElementById('page-' + hash)) {
        showPage(hash);
    }
});

// Обрабатываем кнопку "Назад"
window.addEventListener('popstate', () => {
    const hash = window.location.hash.replace('#', '') || 'home';
    showPage(hash);
});

function showTest(testId) {
    document.querySelectorAll('.test-container').forEach(test => {
        test.style.display = 'none';
    });
    const target = document.getElementById(testId);
    if (target) {
        target.style.display = 'block';
    }
}