/* ============================================================
   FOODVAULT — Application Logic
   Simulates Soroban smart contract interactions locally
   ============================================================ */

// ============================================================
// CONSTANTS & CATEGORY CONFIG
// ============================================================
const CATEGORY_CONFIG = {
    Fresh:    { emoji: '🥬', label: 'Fresh',    color: '#22c55e' },
    Frozen:   { emoji: '🧊', label: 'Frozen',   color: '#3b82f6' },
    Dry:      { emoji: '🌾', label: 'Dry',      color: '#f59e0b' },
    Canned:   { emoji: '🥫', label: 'Canned',   color: '#ef4444' },
    Beverage: { emoji: '🥤', label: 'Beverage', color: '#8b5cf6' },
};

const LOW_STOCK_THRESHOLD = 5;
const EXPIRY_WARNING_DAYS = 30;
const STORAGE_KEY = 'foodvault_inventory';

// ============================================================
// STATE MANAGEMENT (mirrors Soroban contract storage)
// ============================================================
class InventoryStore {
    constructor() {
        this.items = this._load();
    }

    // --- Contract Mirror: get_all_items ---
    getAllItems() {
        return [...this.items];
    }

    // --- Contract Mirror: get_item ---
    getItem(id) {
        const item = this.items.find(i => i.id === id);
        if (!item) throw new Error('Item tidak ditemukan');
        return { ...item };
    }

    // --- Contract Mirror: add_item ---
    addItem(name, quantity, category, entryDate, expiryDate, location) {
        const item = {
            id: this._generateId(),
            name,
            quantity: parseInt(quantity),
            category,
            entry_date: new Date(entryDate).getTime(),
            expiry_date: new Date(expiryDate).getTime(),
            location,
        };
        this.items.push(item);
        this._save();
        return 'Item berhasil ditambahkan';
    }

    // --- Contract Mirror: update_item ---
    updateItem(id, name, quantity, category, entryDate, expiryDate, location) {
        const idx = this.items.findIndex(i => i.id === id);
        if (idx === -1) return 'Item tidak ditemukan';
        this.items[idx] = {
            ...this.items[idx],
            name,
            quantity: parseInt(quantity),
            category,
            entry_date: new Date(entryDate).getTime(),
            expiry_date: new Date(expiryDate).getTime(),
            location,
        };
        this._save();
        return 'Item berhasil diupdate';
    }

    // --- Contract Mirror: update_stock ---
    updateStock(id, quantity) {
        const idx = this.items.findIndex(i => i.id === id);
        if (idx === -1) return 'Item tidak ditemukan';
        this.items[idx].quantity = parseInt(quantity);
        this._save();
        return 'Stok berhasil diupdate';
    }

    // --- Contract Mirror: delete_item ---
    deleteItem(id) {
        const idx = this.items.findIndex(i => i.id === id);
        if (idx === -1) return 'Item tidak ditemukan';
        this.items.splice(idx, 1);
        this._save();
        return 'Item berhasil dihapus';
    }

    // --- Contract Mirror: search_by_name ---
    searchByName(name) {
        const q = name.toLowerCase();
        return this.items.filter(i => i.name.toLowerCase().includes(q));
    }

    // --- Contract Mirror: get_by_category ---
    getByCategory(category) {
        return this.items.filter(i => i.category === category);
    }

    // Internal helpers
    _generateId() {
        return Date.now() * 1000 + Math.floor(Math.random() * 1000);
    }

    _save() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items));
    }

    _load() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : this._getDefaultItems();
        } catch {
            return this._getDefaultItems();
        }
    }

    _getDefaultItems() {
        const now = Date.now();
        const day = 86400000;
        const defaults = [
            { id: this._generateId() + 1, name: 'Beras Premium 5kg',    quantity: 45,  category: 'Dry',      entry_date: now - 10*day, expiry_date: now + 180*day, location: 'Rak-A1' },
            { id: this._generateId() + 2, name: 'Ikan Salmon Beku',     quantity: 12,  category: 'Frozen',   entry_date: now - 5*day,  expiry_date: now + 60*day,  location: 'Rak-B2' },
            { id: this._generateId() + 3, name: 'Sayur Bayam Segar',    quantity: 3,   category: 'Fresh',    entry_date: now - 1*day,  expiry_date: now + 3*day,   location: 'Rak-C1' },
            { id: this._generateId() + 4, name: 'Sarden Kaleng ABC',    quantity: 60,  category: 'Canned',   entry_date: now - 30*day, expiry_date: now + 365*day, location: 'Rak-D3' },
            { id: this._generateId() + 5, name: 'Teh Botol Kotak',      quantity: 24,  category: 'Beverage', entry_date: now - 7*day,  expiry_date: now + 90*day,  location: 'Rak-E1' },
            { id: this._generateId() + 6, name: 'Mie Instan Goreng',    quantity: 2,   category: 'Dry',      entry_date: now - 15*day, expiry_date: now + 200*day, location: 'Rak-A3' },
            { id: this._generateId() + 7, name: 'Daging Ayam Beku',     quantity: 8,   category: 'Frozen',   entry_date: now - 3*day,  expiry_date: now + 45*day,  location: 'Rak-B1' },
            { id: this._generateId() + 8, name: 'Susu UHT Coklat',      quantity: 18,  category: 'Beverage', entry_date: now - 2*day,  expiry_date: now + 120*day, location: 'Rak-E2' },
            { id: this._generateId() + 9, name: 'Tomat Segar',          quantity: 0,   category: 'Fresh',    entry_date: now - 4*day,  expiry_date: now - 1*day,   location: 'Rak-C2' },
        ];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
        return defaults;
    }
}

// ============================================================
// APP CONTROLLER
// ============================================================
class FoodVaultApp {
    constructor() {
        this.store = new InventoryStore();
        this.activeFilter = 'all';
        this.searchQuery = '';
        this.openDropdownId = null;

        this._cacheDOM();
        this._bindEvents();
        this._initParticles();
        this.render();
    }

    // ---- DOM Cache ----
    _cacheDOM() {
        // Stats
        this.elTotalItems = document.getElementById('totalItemsValue');
        this.elTotalStock = document.getElementById('totalStockValue');
        this.elLowStock   = document.getElementById('lowStockValue');
        this.elExpired    = document.getElementById('expiredValue');

        // Grid & Empty
        this.elGrid      = document.getElementById('inventoryGrid');
        this.elEmpty      = document.getElementById('emptyState');

        // Search
        this.elSearch     = document.getElementById('searchInput');
        this.elSearchClear= document.getElementById('searchClear');

        // Category Filters
        this.elFilters    = document.getElementById('categoryFilters');

        // Add buttons
        this.elAddBtn     = document.getElementById('addItemBtn');
        this.elAddEmptyBtn= document.getElementById('addItemEmptyBtn');

        // Item Modal
        this.elModalOvl   = document.getElementById('modalOverlay');
        this.elModalTitle = document.getElementById('modalTitle');
        this.elItemForm   = document.getElementById('itemForm');
        this.elEditId     = document.getElementById('editItemId');
        this.elCloseModal = document.getElementById('closeModal');
        this.elCancelBtn  = document.getElementById('cancelBtn');
        this.elSubmitBtn  = document.getElementById('submitBtn');

        // Stock Modal
        this.elStockOvl     = document.getElementById('stockModalOverlay');
        this.elStockForm    = document.getElementById('stockForm');
        this.elStockId      = document.getElementById('stockItemId');
        this.elStockName    = document.getElementById('stockItemName');
        this.elStockCurrent = document.getElementById('stockCurrent');
        this.elNewQty       = document.getElementById('newQuantity');
        this.elCloseStock   = document.getElementById('closeStockModal');
        this.elCancelStock  = document.getElementById('cancelStockBtn');

        // Delete Modal
        this.elDeleteOvl    = document.getElementById('deleteModalOverlay');
        this.elDeleteId     = document.getElementById('deleteItemId');
        this.elDeleteName   = document.getElementById('deleteItemName');
        this.elConfirmDel   = document.getElementById('confirmDeleteBtn');
        this.elCloseDel     = document.getElementById('closeDeleteModal');
        this.elCancelDel    = document.getElementById('cancelDeleteBtn');

        // Toast
        this.elToast = document.getElementById('toastContainer');
    }

    // ---- Event Bindings ----
    _bindEvents() {
        // Search
        this.elSearch.addEventListener('input', () => {
            this.searchQuery = this.elSearch.value.trim();
            this.elSearchClear.style.display = this.searchQuery ? 'block' : 'none';
            this.render();
        });
        this.elSearchClear.addEventListener('click', () => {
            this.elSearch.value = '';
            this.searchQuery = '';
            this.elSearchClear.style.display = 'none';
            this.render();
        });

        // Category Filters
        this.elFilters.addEventListener('click', (e) => {
            const chip = e.target.closest('.filter-chip');
            if (!chip) return;
            this.elFilters.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            this.activeFilter = chip.dataset.category;
            this.render();
        });

        // Add Buttons
        this.elAddBtn.addEventListener('click', () => this._openAddModal());
        this.elAddEmptyBtn.addEventListener('click', () => this._openAddModal());

        // Item Modal
        this.elCloseModal.addEventListener('click', () => this._closeModal(this.elModalOvl));
        this.elCancelBtn.addEventListener('click', () => this._closeModal(this.elModalOvl));
        this.elModalOvl.addEventListener('click', (e) => {
            if (e.target === this.elModalOvl) this._closeModal(this.elModalOvl);
        });
        this.elItemForm.addEventListener('submit', (e) => this._handleFormSubmit(e));

        // Stock Modal
        this.elCloseStock.addEventListener('click', () => this._closeModal(this.elStockOvl));
        this.elCancelStock.addEventListener('click', () => this._closeModal(this.elStockOvl));
        this.elStockOvl.addEventListener('click', (e) => {
            if (e.target === this.elStockOvl) this._closeModal(this.elStockOvl);
        });
        this.elStockForm.addEventListener('submit', (e) => this._handleStockSubmit(e));

        // Delete Modal
        this.elCloseDel.addEventListener('click', () => this._closeModal(this.elDeleteOvl));
        this.elCancelDel.addEventListener('click', () => this._closeModal(this.elDeleteOvl));
        this.elDeleteOvl.addEventListener('click', (e) => {
            if (e.target === this.elDeleteOvl) this._closeModal(this.elDeleteOvl);
        });
        this.elConfirmDel.addEventListener('click', () => this._handleDelete());

        // Close dropdowns on outside click
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.card-menu')) {
                this._closeAllDropdowns();
            }
        });

        // Keyboard ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this._closeModal(this.elModalOvl);
                this._closeModal(this.elStockOvl);
                this._closeModal(this.elDeleteOvl);
                this._closeAllDropdowns();
            }
        });
    }

    // ============================================================
    // RENDERING
    // ============================================================
    render() {
        const allItems = this.store.getAllItems();

        // Apply filters
        let filtered = allItems;
        if (this.activeFilter !== 'all') {
            filtered = this.store.getByCategory(this.activeFilter);
        }
        if (this.searchQuery) {
            const q = this.searchQuery.toLowerCase();
            filtered = filtered.filter(i => i.name.toLowerCase().includes(q));
        }

        // Update stats (always from all items)
        this._updateStats(allItems);

        // Render grid
        if (filtered.length === 0) {
            this.elGrid.innerHTML = '';
            this.elEmpty.style.display = 'block';
        } else {
            this.elEmpty.style.display = 'none';
            this.elGrid.innerHTML = filtered.map((item, idx) => this._renderCard(item, idx)).join('');
        }
    }

    _updateStats(items) {
        const now = Date.now();
        const totalItems = items.length;
        const totalStock = items.reduce((sum, i) => sum + i.quantity, 0);
        const lowStock = items.filter(i => i.quantity <= LOW_STOCK_THRESHOLD && i.quantity > 0).length;
        const expired = items.filter(i => i.expiry_date < now).length;

        this._animateValue(this.elTotalItems, totalItems);
        this._animateValue(this.elTotalStock, totalStock);
        this._animateValue(this.elLowStock, lowStock);
        this._animateValue(this.elExpired, expired);
    }

    _animateValue(el, target) {
        const current = parseInt(el.textContent) || 0;
        if (current === target) return;
        el.textContent = target;
        el.style.transform = 'scale(1.15)';
        el.style.transition = 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
        setTimeout(() => { el.style.transform = 'scale(1)'; }, 200);
    }

    _renderCard(item, index) {
        const cat = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.Dry;
        const now = Date.now();
        const expiryDate = new Date(item.expiry_date);
        const entryDate = new Date(item.entry_date);
        const daysUntilExpiry = Math.ceil((item.expiry_date - now) / 86400000);

        // Expiry status
        let expiryClass, expiryLabel;
        if (daysUntilExpiry < 0) {
            expiryClass = 'expired';
            expiryLabel = 'Kadaluarsa';
        } else if (daysUntilExpiry <= EXPIRY_WARNING_DAYS) {
            expiryClass = 'warning';
            expiryLabel = `${daysUntilExpiry} hari lagi`;
        } else {
            expiryClass = 'safe';
            expiryLabel = `${daysUntilExpiry} hari lagi`;
        }

        // Quantity bar
        const maxQty = 100;
        const barPercent = Math.min((item.quantity / maxQty) * 100, 100);
        let barClass = '';
        if (item.quantity === 0) barClass = 'critical';
        else if (item.quantity <= LOW_STOCK_THRESHOLD) barClass = 'low';

        return `
            <div class="item-card" data-id="${item.id}" style="animation-delay: ${index * 0.05}s">
                <div class="card-top">
                    <span class="category-badge ${item.category}">
                        ${cat.emoji} ${cat.label}
                    </span>
                    <div class="card-menu">
                        <button class="card-menu-btn" onclick="app.toggleDropdown(${item.id})" aria-label="Menu">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/>
                            </svg>
                        </button>
                        <div class="card-dropdown" id="dropdown-${item.id}">
                            <button class="dropdown-item" onclick="app.openEditModal(${item.id})">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                </svg>
                                Edit Item
                            </button>
                            <button class="dropdown-item" onclick="app.openStockModal(${item.id})">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                                </svg>
                                Update Stok
                            </button>
                            <button class="dropdown-item danger" onclick="app.openDeleteModal(${item.id})">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="3 6 5 6 21 6"/>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                </svg>
                                Hapus Item
                            </button>
                        </div>
                    </div>
                </div>
                <h3 class="card-name">${this._escapeHTML(item.name)}</h3>
                <div class="card-details">
                    <div class="card-detail quantity-wrap">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                        <span class="detail-label">Stok</span>
                        <span class="detail-value">${item.quantity} unit</span>
                    </div>
                    <div class="quantity-bar-bg">
                        <div class="quantity-bar ${barClass}" style="width: ${barPercent}%"></div>
                    </div>
                    <div class="card-detail">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        <span class="detail-label">Lokasi</span>
                        <span class="detail-value">${this._escapeHTML(item.location)}</span>
                    </div>
                    <div class="card-detail">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        <span class="detail-label">Masuk</span>
                        <span class="detail-value">${this._formatDate(entryDate)}</span>
                    </div>
                    <div class="card-detail">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        <span class="detail-label">Exp</span>
                        <span class="detail-value">${this._formatDate(expiryDate)}</span>
                        <span class="expiry-status ${expiryClass}">${expiryLabel}</span>
                    </div>
                </div>
            </div>
        `;
    }

    // ============================================================
    // MODAL HANDLERS
    // ============================================================
    _openAddModal() {
        this.elModalTitle.textContent = 'Tambah Item Baru';
        this.elSubmitBtn.querySelector('span').textContent = 'Simpan Item';
        this.elEditId.value = '';
        this.elItemForm.reset();

        // Set default entry date to today
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('itemEntryDate').value = today;

        this._openModal(this.elModalOvl);
    }

    openEditModal(id) {
        this._closeAllDropdowns();
        try {
            const item = this.store.getItem(id);
            this.elModalTitle.textContent = 'Edit Item';
            this.elSubmitBtn.querySelector('span').textContent = 'Update Item';
            this.elEditId.value = id;

            document.getElementById('itemName').value = item.name;
            document.getElementById('itemQuantity').value = item.quantity;
            document.getElementById('itemCategory').value = item.category;
            document.getElementById('itemLocation').value = item.location;
            document.getElementById('itemEntryDate').value = this._toInputDate(item.entry_date);
            document.getElementById('itemExpiryDate').value = this._toInputDate(item.expiry_date);

            this._openModal(this.elModalOvl);
        } catch (err) {
            this.showToast(err.message, 'error');
        }
    }

    openStockModal(id) {
        this._closeAllDropdowns();
        try {
            const item = this.store.getItem(id);
            this.elStockId.value = id;
            this.elStockName.textContent = item.name;
            this.elStockCurrent.textContent = `Stok saat ini: ${item.quantity} unit`;
            this.elNewQty.value = item.quantity;
            this._openModal(this.elStockOvl);
            setTimeout(() => this.elNewQty.select(), 100);
        } catch (err) {
            this.showToast(err.message, 'error');
        }
    }

    openDeleteModal(id) {
        this._closeAllDropdowns();
        try {
            const item = this.store.getItem(id);
            this.elDeleteId.value = id;
            this.elDeleteName.textContent = item.name;
            this._openModal(this.elDeleteOvl);
        } catch (err) {
            this.showToast(err.message, 'error');
        }
    }

    _openModal(overlay) {
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    _closeModal(overlay) {
        overlay.classList.remove('active');
        // Only restore scroll if no other modal is open
        const anyOpen = document.querySelector('.modal-overlay.active');
        if (!anyOpen) document.body.style.overflow = '';
    }

    // ============================================================
    // FORM HANDLERS
    // ============================================================
    _handleFormSubmit(e) {
        e.preventDefault();

        const id       = this.elEditId.value;
        const name     = document.getElementById('itemName').value.trim();
        const quantity = document.getElementById('itemQuantity').value;
        const category = document.getElementById('itemCategory').value;
        const location = document.getElementById('itemLocation').value.trim();
        const entry    = document.getElementById('itemEntryDate').value;
        const expiry   = document.getElementById('itemExpiryDate').value;

        if (!name || !quantity || !category || !location || !entry || !expiry) {
            this.showToast('Lengkapi semua field!', 'error');
            return;
        }

        let msg;
        if (id) {
            // Update existing item
            msg = this.store.updateItem(parseInt(id), name, quantity, category, entry, expiry, location);
        } else {
            // Add new item
            msg = this.store.addItem(name, quantity, category, entry, expiry, location);
        }

        this._closeModal(this.elModalOvl);
        this.render();
        this.showToast(msg, 'success');
    }

    _handleStockSubmit(e) {
        e.preventDefault();
        const id  = parseInt(this.elStockId.value);
        const qty = this.elNewQty.value;

        if (!qty && qty !== 0) {
            this.showToast('Masukkan jumlah stok!', 'error');
            return;
        }

        const msg = this.store.updateStock(id, qty);
        this._closeModal(this.elStockOvl);
        this.render();
        this.showToast(msg, 'success');
    }

    _handleDelete() {
        const id = parseInt(this.elDeleteId.value);

        // Animate card removal
        const card = document.querySelector(`.item-card[data-id="${id}"]`);
        if (card) card.classList.add('removing');

        setTimeout(() => {
            const msg = this.store.deleteItem(id);
            this._closeModal(this.elDeleteOvl);
            this.render();
            this.showToast(msg, 'success');
        }, 250);
    }

    // ============================================================
    // DROPDOWN
    // ============================================================
    toggleDropdown(id) {
        const dropdown = document.getElementById(`dropdown-${id}`);
        if (!dropdown) return;

        if (this.openDropdownId === id) {
            dropdown.classList.remove('active');
            this.openDropdownId = null;
        } else {
            this._closeAllDropdowns();
            dropdown.classList.add('active');
            this.openDropdownId = id;
        }
    }

    _closeAllDropdowns() {
        document.querySelectorAll('.card-dropdown.active').forEach(d => d.classList.remove('active'));
        this.openDropdownId = null;
    }

    // ============================================================
    // TOAST NOTIFICATIONS
    // ============================================================
    showToast(message, type = 'info') {
        const icons = {
            success: '✅',
            error: '❌',
            info: 'ℹ️',
        };

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-icon">${icons[type] || icons.info}</div>
            <span class="toast-message">${this._escapeHTML(message)}</span>
        `;

        this.elToast.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('removing');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // ============================================================
    // BACKGROUND PARTICLES
    // ============================================================
    _initParticles() {
        const container = document.getElementById('bgParticles');
        const count = 25;

        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.className = 'bg-particle';
            const size = Math.random() * 3 + 1;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.animationDuration = `${Math.random() * 15 + 10}s`;
            particle.style.animationDelay = `${Math.random() * 10}s`;
            container.appendChild(particle);
        }
    }

    // ============================================================
    // UTILITIES
    // ============================================================
    _formatDate(date) {
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    }

    _toInputDate(timestamp) {
        const d = new Date(timestamp);
        return d.toISOString().split('T')[0];
    }

    _escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
}

// ============================================================
// INITIALIZE APP
// ============================================================
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new FoodVaultApp();
});
