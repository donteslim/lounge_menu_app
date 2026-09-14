(function () {
  const TOKEN_KEY = 'lounge_admin_token';

  const loginView = document.getElementById('login-view');
  const dashboardView = document.getElementById('dashboard-view');
  const loginForm = document.getElementById('login-form');
  const loginError = document.getElementById('login-error');
  const logoutBtn = document.getElementById('logout-btn');
  const accordionContainer = document.getElementById('accordion-container');
  const newSectionForm = document.getElementById('new-section-form');
  const nsError = document.getElementById('ns-error');
  const changePwBtn = document.getElementById('change-pw-btn');
  const changePwCard = document.getElementById('change-pw-card');
  const changePwForm = document.getElementById('change-pw-form');
  const cpCancel = document.getElementById('cp-cancel');
  const cpError = document.getElementById('cp-error');
  const cpSuccess = document.getElementById('cp-success');

  const state = {
    sections: [],
    openSections: new Set(),
    editingSectionId: null,
    editingProductId: null,
    addingProductFor: null,
  };

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
  }

  function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str == null ? '' : String(str);
    return div.innerHTML;
  }

  function escapeAttr(str) {
    return escapeHtml(str).replace(/"/g, '&quot;');
  }

  async function apiFetch(url, options = {}) {
    const headers = Object.assign({}, options.headers, {
      'Content-Type': 'application/json',
    });
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(url, { ...options, headers });
    if (res.status === 401) {
      clearToken();
      showLogin();
      throw new Error('Session expired. Please log in again.');
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Request failed');
    }
    return data;
  }

  async function uploadImage(file) {
    const token = getToken();
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (res.status === 401) {
      clearToken();
      showLogin();
      throw new Error('Session expired. Please log in again.');
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Image upload failed');
    }
    return data.url;
  }

  function showLogin() {
    loginView.style.display = 'block';
    dashboardView.style.display = 'none';
  }

  function showDashboard() {
    loginView.style.display = 'none';
    dashboardView.style.display = 'block';
    loadSections();
  }

  async function loadSections() {
    try {
      const sections = await fetch('/api/sections').then((r) => r.json());
      state.sections = sections;
      renderAccordion();
    } catch (err) {
      accordionContainer.innerHTML = '<p class="empty-state">Failed to load sections.</p>';
    }
  }

  function formatPrice(value) {
    return '$' + Number(value).toFixed(2);
  }

  function renderProductRow(product) {
    if (state.editingProductId === product.id) {
      return `
        <div class="product-row" data-product-id="${product.id}">
          <form class="edit-product-form" data-product-id="${product.id}" style="width:100%;">
            <div class="field">
              <label>Name</label>
              <input type="text" name="name" value="${escapeAttr(product.name)}" required />
            </div>
            <div class="two-col">
              <div class="field">
                <label>Main Price</label>
                <input type="number" step="0.01" min="0" name="mainPrice" value="${product.mainPrice}" required />
              </div>
              <div class="field">
                <label>Discount Price (optional)</label>
                <input type="number" step="0.01" min="0" name="discountPrice" value="${
                  product.discountPrice != null ? product.discountPrice : ''
                }" />
              </div>
            </div>
            <div class="field">
              <label>Description</label>
              <textarea name="description">${escapeHtml(product.description)}</textarea>
            </div>
            <div class="field">
              <label>Product Image</label>
              <div class="image-field-row">
                <img class="image-preview" data-role="preview"
                     src="${product.imageUrl ? escapeAttr(product.imageUrl) : ''}"
                     style="${product.imageUrl ? '' : 'display:none;'}" alt="" />
                <div>
                  <input type="file" data-role="file-input" accept="image/png,image/jpeg,image/webp,image/gif" />
                  ${
                    product.imageUrl
                      ? `<button type="button" class="btn btn-secondary btn-small btn-remove-image" data-action="clear-image-field">Remove image</button>`
                      : ''
                  }
                </div>
              </div>
              <input type="hidden" name="imageUrl" value="${escapeAttr(product.imageUrl || '')}" />
            </div>
            <button type="submit" class="btn btn-primary btn-small">Save</button>
            <button type="button" class="btn btn-secondary btn-small" data-action="cancel-edit-product">Cancel</button>
            <p class="error-msg" data-error-for="product-${product.id}"></p>
          </form>
        </div>
      `;
    }

    const hasDiscount = product.discountPrice != null;
    return `
      <div class="product-row" data-product-id="${product.id}">
        <div class="product-row-main">
          ${
            product.imageUrl
              ? `<img src="${escapeAttr(product.imageUrl)}" alt="" class="thumb-img" />`
              : `<div class="thumb-placeholder">&#127866;</div>`
          }
          <div class="info">
            <h4>${escapeHtml(product.name)}</h4>
            <div class="prices">
              ${
                hasDiscount
                  ? `<span style="text-decoration:line-through;">${formatPrice(
                      product.mainPrice
                    )}</span> &rarr; <strong>${formatPrice(product.discountPrice)}</strong>`
                  : formatPrice(product.mainPrice)
              }
            </div>
            ${product.description ? `<div class="desc">${escapeHtml(product.description)}</div>` : ''}
          </div>
        </div>
        <div class="actions">
          <button class="btn btn-secondary btn-small" data-action="edit-product" data-id="${product.id}">Edit</button>
          <button class="btn btn-danger btn-small" data-action="delete-product" data-id="${product.id}">Delete</button>
        </div>
      </div>
    `;
  }

  function renderAddProductForm(sectionId) {
    if (state.addingProductFor !== sectionId) {
      return `<button class="btn btn-secondary btn-small" data-action="show-add-product" data-section-id="${sectionId}">+ Add Product</button>`;
    }
    return `
      <div class="add-form">
        <h4>New Product</h4>
        <form class="add-product-form" data-section-id="${sectionId}">
          <div class="field">
            <label>Name</label>
            <input type="text" name="name" required />
          </div>
          <div class="two-col">
            <div class="field">
              <label>Main Price</label>
              <input type="number" step="0.01" min="0" name="mainPrice" required />
            </div>
            <div class="field">
              <label>Discount Price (optional)</label>
              <input type="number" step="0.01" min="0" name="discountPrice" />
            </div>
          </div>
          <div class="field">
            <label>Description</label>
            <textarea name="description" placeholder="Describe this product"></textarea>
          </div>
          <div class="field">
            <label>Product Image (optional)</label>
            <div class="image-field-row">
              <img class="image-preview" data-role="preview" style="display:none;" alt="" />
              <input type="file" data-role="file-input" accept="image/png,image/jpeg,image/webp,image/gif" />
            </div>
          </div>
          <button type="submit" class="btn btn-primary btn-small">Add Product</button>
          <button type="button" class="btn btn-secondary btn-small" data-action="cancel-add-product">Cancel</button>
          <p class="error-msg" data-error-for="add-product-${sectionId}"></p>
        </form>
      </div>
    `;
  }

  function renderSectionHeader(section) {
    if (state.editingSectionId === section.id) {
      return `
        <div class="accordion-header" style="cursor:default;">
          <form class="edit-section-form" data-section-id="${section.id}" style="width:100%;" onclick="event.stopPropagation()">
            <div class="field">
              <label>Section Name</label>
              <input type="text" name="name" value="${escapeAttr(section.name)}" required />
            </div>
            <div class="field">
              <label>Description</label>
              <textarea name="description">${escapeHtml(section.description)}</textarea>
            </div>
            <div class="field">
              <label>Section Image</label>
              <div class="image-field-row">
                <img class="image-preview" data-role="preview"
                     src="${section.imageUrl ? escapeAttr(section.imageUrl) : ''}"
                     style="${section.imageUrl ? '' : 'display:none;'}" alt="" />
                <div>
                  <input type="file" data-role="file-input" accept="image/png,image/jpeg,image/webp,image/gif" />
                  ${
                    section.imageUrl
                      ? `<button type="button" class="btn btn-secondary btn-small btn-remove-image" data-action="clear-image-field">Remove image</button>`
                      : ''
                  }
                </div>
              </div>
              <input type="hidden" name="imageUrl" value="${escapeAttr(section.imageUrl || '')}" />
            </div>
            <button type="submit" class="btn btn-primary btn-small">Save</button>
            <button type="button" class="btn btn-secondary btn-small" data-action="cancel-edit-section">Cancel</button>
            <p class="error-msg" data-error-for="section-${section.id}"></p>
          </form>
        </div>
      `;
    }

    return `
      <div class="accordion-header" data-action="toggle-section" data-id="${section.id}">
        <div class="accordion-header-main">
          ${
            section.imageUrl
              ? `<img src="${escapeAttr(section.imageUrl)}" alt="" class="thumb-img" />`
              : `<div class="thumb-placeholder">&#127866;</div>`
          }
          <div>
            <h3>${escapeHtml(section.name)}</h3>
            <div class="meta">${escapeHtml(section.description || 'No description')} &middot; ${
      section.products.length
    } item(s)</div>
          </div>
        </div>
        <div class="accordion-actions">
          <button class="btn btn-secondary btn-small" data-action="edit-section" data-id="${section.id}">Edit</button>
          <button class="btn btn-danger btn-small" data-action="delete-section" data-id="${section.id}">Delete</button>
        </div>
      </div>
    `;
  }

  function renderAccordion() {
    if (!state.sections.length) {
      accordionContainer.innerHTML = '<p class="empty-state">No sections yet. Add one above.</p>';
      return;
    }

    accordionContainer.innerHTML = state.sections
      .map((section) => {
        const isOpen = state.openSections.has(section.id);
        const productsHtml = section.products.map(renderProductRow).join('');
        return `
          <div class="accordion">
            ${renderSectionHeader(section)}
            <div class="accordion-body ${isOpen ? 'open' : ''}" data-body-for="${section.id}">
              ${productsHtml || '<p class="empty-state" style="padding:1rem 0;">No products yet.</p>'}
              ${renderAddProductForm(section.id)}
            </div>
          </div>
        `;
      })
      .join('');
  }

  // ---------- Event handling ----------

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.textContent = '';
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    try {
      const data = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      }).then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body.error || 'Login failed');
        return body;
      });
      setToken(data.token);
      showDashboard();
    } catch (err) {
      loginError.textContent = err.message;
    }
  });

  logoutBtn.addEventListener('click', () => {
    clearToken();
    showLogin();
  });

  changePwBtn.addEventListener('click', () => {
    changePwCard.style.display = changePwCard.style.display === 'none' ? 'block' : 'none';
    cpError.textContent = '';
    cpSuccess.textContent = '';
  });

  cpCancel.addEventListener('click', () => {
    changePwCard.style.display = 'none';
  });

  changePwForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    cpError.textContent = '';
    cpSuccess.textContent = '';
    const currentPassword = document.getElementById('cp-current').value;
    const newPassword = document.getElementById('cp-new').value;
    try {
      await apiFetch('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      cpSuccess.textContent = 'Password updated successfully.';
      changePwForm.reset();
    } catch (err) {
      cpError.textContent = err.message;
    }
  });

  document.getElementById('ns-image').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const preview = document.getElementById('ns-image-preview');
    preview.src = URL.createObjectURL(file);
    preview.style.display = 'block';
  });

  newSectionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    nsError.textContent = '';
    const name = document.getElementById('ns-name').value.trim();
    const description = document.getElementById('ns-description').value.trim();
    const file = document.getElementById('ns-image').files[0];
    try {
      let imageUrl;
      if (file) imageUrl = await uploadImage(file);
      await apiFetch('/api/sections', {
        method: 'POST',
        body: JSON.stringify({ name, description, imageUrl }),
      });
      newSectionForm.reset();
      document.getElementById('ns-image-preview').style.display = 'none';
      await loadSections();
    } catch (err) {
      nsError.textContent = err.message;
    }
  });

  accordionContainer.addEventListener('click', async (e) => {
    const target = e.target.closest('[data-action]');
    if (!target) return;
    const action = target.getAttribute('data-action');

    if (action === 'toggle-section') {
      const id = target.getAttribute('data-id');
      if (state.openSections.has(id)) {
        state.openSections.delete(id);
      } else {
        state.openSections.add(id);
      }
      renderAccordion();
    }

    if (action === 'edit-section') {
      const id = target.getAttribute('data-id');
      state.editingSectionId = id;
      state.openSections.add(id);
      renderAccordion();
    }

    if (action === 'cancel-edit-section') {
      state.editingSectionId = null;
      renderAccordion();
    }

    if (action === 'delete-section') {
      const id = target.getAttribute('data-id');
      const section = state.sections.find((s) => s.id === id);
      if (!confirm(`Delete section "${section.name}" and all its products? This cannot be undone.`)) return;
      try {
        await apiFetch(`/api/sections/${id}`, { method: 'DELETE' });
        await loadSections();
      } catch (err) {
        alert(err.message);
      }
    }

    if (action === 'edit-product') {
      const id = target.getAttribute('data-id');
      state.editingProductId = id;
      renderAccordion();
    }

    if (action === 'cancel-edit-product') {
      state.editingProductId = null;
      renderAccordion();
    }

    if (action === 'delete-product') {
      const id = target.getAttribute('data-id');
      if (!confirm('Delete this product? This cannot be undone.')) return;
      try {
        await apiFetch(`/api/products/${id}`, { method: 'DELETE' });
        await loadSections();
      } catch (err) {
        alert(err.message);
      }
    }

    if (action === 'show-add-product') {
      const sectionId = target.getAttribute('data-section-id');
      state.addingProductFor = sectionId;
      state.openSections.add(sectionId);
      renderAccordion();
    }

    if (action === 'cancel-add-product') {
      state.addingProductFor = null;
      renderAccordion();
    }

    if (action === 'clear-image-field') {
      const form = target.closest('form');
      const fileInput = form.querySelector('input[data-role="file-input"]');
      if (fileInput) fileInput.value = '';
      const hiddenInput = form.querySelector('input[name="imageUrl"]');
      if (hiddenInput) hiddenInput.value = '';
      const preview = form.querySelector('[data-role="preview"]');
      if (preview) {
        preview.style.display = 'none';
        preview.src = '';
      }
      target.style.display = 'none';
    }
  });

  accordionContainer.addEventListener('change', (e) => {
    if (e.target.matches('input[data-role="file-input"]')) {
      const file = e.target.files[0];
      if (!file) return;
      const preview = e.target.closest('.image-field-row').querySelector('[data-role="preview"]');
      preview.src = URL.createObjectURL(file);
      preview.style.display = 'block';
    }
  });

  accordionContainer.addEventListener('submit', async (e) => {
    if (e.target.matches('.edit-section-form')) {
      e.preventDefault();
      const form = e.target;
      const sectionId = form.getAttribute('data-section-id');
      const name = form.name.value.trim();
      const description = form.description.value.trim();
      const errorEl = form.querySelector(`[data-error-for="section-${sectionId}"]`);
      const fileInput = form.querySelector('input[data-role="file-input"]');
      const file = fileInput ? fileInput.files[0] : null;
      try {
        let imageUrl = form.imageUrl.value || null;
        if (file) imageUrl = await uploadImage(file);
        await apiFetch(`/api/sections/${sectionId}`, {
          method: 'PUT',
          body: JSON.stringify({ name, description, imageUrl }),
        });
        state.editingSectionId = null;
        await loadSections();
      } catch (err) {
        errorEl.textContent = err.message;
      }
    }

    if (e.target.matches('.edit-product-form')) {
      e.preventDefault();
      const form = e.target;
      const productId = form.getAttribute('data-product-id');
      const name = form.name.value.trim();
      const mainPrice = form.mainPrice.value;
      const discountPrice = form.discountPrice.value;
      const description = form.description.value.trim();
      const errorEl = form.querySelector(`[data-error-for="product-${productId}"]`);
      const fileInput = form.querySelector('input[data-role="file-input"]');
      const file = fileInput ? fileInput.files[0] : null;
      try {
        let imageUrl = form.imageUrl.value || null;
        if (file) imageUrl = await uploadImage(file);
        await apiFetch(`/api/products/${productId}`, {
          method: 'PUT',
          body: JSON.stringify({
            name,
            mainPrice: Number(mainPrice),
            discountPrice: discountPrice === '' ? null : Number(discountPrice),
            description,
            imageUrl,
          }),
        });
        state.editingProductId = null;
        await loadSections();
      } catch (err) {
        errorEl.textContent = err.message;
      }
    }

    if (e.target.matches('.add-product-form')) {
      e.preventDefault();
      const form = e.target;
      const sectionId = form.getAttribute('data-section-id');
      const name = form.name.value.trim();
      const mainPrice = form.mainPrice.value;
      const discountPrice = form.discountPrice.value;
      const description = form.description.value.trim();
      const errorEl = form.querySelector(`[data-error-for="add-product-${sectionId}"]`);
      const fileInput = form.querySelector('input[data-role="file-input"]');
      const file = fileInput ? fileInput.files[0] : null;
      try {
        let imageUrl;
        if (file) imageUrl = await uploadImage(file);
        await apiFetch('/api/products', {
          method: 'POST',
          body: JSON.stringify({
            sectionId,
            name,
            mainPrice: Number(mainPrice),
            discountPrice: discountPrice === '' ? null : Number(discountPrice),
            description,
            imageUrl,
          }),
        });
        state.addingProductFor = null;
        await loadSections();
      } catch (err) {
        errorEl.textContent = err.message;
      }
    }
  });

  // ---------- Init ----------
  if (getToken()) {
    showDashboard();
  } else {
    showLogin();
  }
})();
