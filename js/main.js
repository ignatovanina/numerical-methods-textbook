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