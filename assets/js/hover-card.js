document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.feed-wrapper').forEach(card => {
        const tooltip = card.querySelector('.article-hover-card');
        if (!tooltip) return;

        // Position setzen, sobald Maus die Karte betritt
        card.addEventListener('mouseenter', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            setTooltipPosition(tooltip, x, y, rect);
        });

        // Und bei Bewegung aktualisieren
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            setTooltipPosition(tooltip, x, y, rect);
        });
    });
});

function setTooltipPosition(tooltip, mouseX, mouseY, cardRect) {
    let left = mouseX + 20;   // 20px rechts vom Cursor
    let top = mouseY - 20;    // 20px oberhalb des Cursors

    // Verhindert, dass das Tooltip rechts aus dem Viewport ragt
    const tooltipRect = tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Globale Koordinaten berechnen
    const cardLeft = cardRect.left;
    const globalLeft = cardLeft + left;
    const globalTop = cardRect.top + top;

    if (globalLeft + tooltipRect.width > viewportWidth) {
        left = mouseX - tooltipRect.width - 20;
    }
    if (globalTop + tooltipRect.height > viewportHeight) {
        top = mouseY + 20;
    }

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
}