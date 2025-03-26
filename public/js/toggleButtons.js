let toggleButtons = document.getElementsByClassName('toggle');

for (let i = 0; i < toggleButtons.length; i++) {
    let toggleButton = toggleButtons[i];
    toggleButton.innerHTML = '<i class="bi bi-chevron-down"></i>';
    toggleButton.addEventListener('click', () => {
        if (toggleButton.innerHTML === '<i class="bi bi-chevron-down"></i>') {
            toggleButton.innerHTML = '<i class="bi bi-chevron-up"></i>';
        } else {
            toggleButton.innerHTML = '<i class="bi bi-chevron-down"></i>';
        }
    });
}