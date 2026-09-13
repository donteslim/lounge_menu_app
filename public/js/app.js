(function () {
  const tabsEl = document.getElementById('tabs');
  const mainEl = document.getElementById('main');

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str == null ? '' : String(str);
    return div.innerHTML;
  }

  function formatPrice(value) {
    return '$' + Number(value).toFixed(2);
  }

  function renderProductCard(product) {
    const hasDiscount =
      product.discountPrice !== null &&
      product.discountPrice !== undefined &&
      Number(product.discountPrice) < Number(product.mainPrice);

    const priceHtml = hasDiscount
      ? `<span class="price-main struck">${formatPrice(product.mainPrice)}</span><br/>
         <span class="price-discount">${formatPrice(product.discountPrice)}</span>`
      : `<span class="price-main">${formatPrice(product.mainPrice)}</span>`;

    return `
      <div class="product-card">
        <div class="product-top">
          <h3>${escapeHtml(product.name)}</h3>
          <div class="price-block">${priceHtml}</div>
        </div>
        ${product.description ? `<p class="description">${escapeHtml(product.description)}</p>` : ''}
      </div>
    `;
  }

  function renderSectionPanel(section, index) {
    const productsHtml = section.products.length
      ? `<div class="product-grid">${section.products.map(renderProductCard).join('')}</div>`
      : `<p class="empty-state">No items in this section yet.</p>`;

    return `
      <div class="section-panel ${index === 0 ? 'active' : ''}" data-panel="${section.id}">
        <div class="section-heading">
          <h2>${escapeHtml(section.name)}</h2>
          ${section.description ? `<p>${escapeHtml(section.description)}</p>` : ''}
        </div>
        ${productsHtml}
      </div>
    `;
  }

  function renderTabs(sections) {
    tabsEl.innerHTML = sections
      .map(
        (s, i) =>
          `<button class="tab-btn ${i === 0 ? 'active' : ''}" data-tab="${s.id}">${escapeHtml(
            s.name
          )}</button>`
      )
      .join('');

    tabsEl.querySelectorAll('.tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-tab');
        tabsEl.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        mainEl.querySelectorAll('.section-panel').forEach((panel) => {
          panel.classList.toggle('active', panel.getAttribute('data-panel') === targetId);
        });
      });
    });
  }

  async function loadMenu() {
    try {
      const res = await fetch('/api/sections');
      if (!res.ok) throw new Error('Failed to load menu');
      const sections = await res.json();

      if (!sections.length) {
        mainEl.innerHTML = '<p class="empty-state">No menu sections available yet.</p>';
        return;
      }

      renderTabs(sections);
      mainEl.innerHTML = sections.map(renderSectionPanel).join('');
    } catch (err) {
      mainEl.innerHTML = `<p class="empty-state">Could not load the menu. Please try again later.</p>`;
      console.error(err);
    }
  }

  loadMenu();
})();
