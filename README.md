# 🏭 FoodVault — Web3 Warehouse Inventory

**Sistem inventaris gudang makanan terdesentralisasi** berbasis **Stellar Soroban** smart contract, dibangun dengan Rust.

![Stellar](https://img.shields.io/badge/Stellar-Soroban-blue?style=for-the-badge&logo=stellar)
![Rust](https://img.shields.io/badge/Rust-Language-orange?style=for-the-badge&logo=rust)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

---

## 📋 Deskripsi

FoodVault adalah smart contract Web3 yang memungkinkan pengelolaan inventaris gudang makanan secara terdesentralisasi di blockchain Stellar. Contract ini menyediakan fitur CRUD lengkap, pencarian, dan filter kategori untuk mengelola stok makanan di gudang.

Project ini juga dilengkapi dengan **frontend dashboard** premium yang mensimulasikan interaksi dengan smart contract.

---

## 🏗️ Struktur Project

```
food-warehouse-inventory/
├── Cargo.toml                  # Konfigurasi project Soroban
├── README.md                   # Dokumentasi project
├── src/
│   ├── lib.rs                  # Smart contract utama
│   └── test.rs                 # Unit tests
└── frontend/
    ├── index.html              # Dashboard HTML
    ├── style.css               # Styling (dark theme)
    └── app.js                  # Logic & state management
```

---

## 📦 Data Structures

### `FoodCategory` (Enum)

| Variant    | Emoji | Keterangan              |
|------------|-------|-------------------------|
| `Fresh`    | 🥬   | Makanan segar (sayur, buah) |
| `Frozen`   | 🧊   | Makanan beku            |
| `Dry`      | 🌾   | Makanan kering (beras, mie) |
| `Canned`   | 🥫   | Makanan kaleng          |
| `Beverage` | 🥤   | Minuman                 |

### `FoodItem` (Struct)

| Field         | Type           | Keterangan                    |
|---------------|----------------|-------------------------------|
| `id`          | `u64`          | ID unik (random via PRNG)     |
| `name`        | `String`       | Nama barang                   |
| `quantity`    | `u32`          | Jumlah stok                   |
| `category`    | `FoodCategory` | Kategori makanan              |
| `entry_date`  | `u64`          | Tanggal masuk (Unix timestamp)|
| `expiry_date` | `u64`          | Tanggal kadaluarsa (Unix timestamp) |
| `location`    | `String`       | Lokasi rak (contoh: "Rak-A1") |

---

## 🔧 Smart Contract Functions

Contract `WarehouseContract` menyediakan **8 fungsi** publik:

| #  | Fungsi            | Parameter                                                        | Return          | Deskripsi                        |
|----|-------------------|------------------------------------------------------------------|-----------------|----------------------------------|
| 1  | `get_all_items`   | —                                                                | `Vec<FoodItem>` | Ambil semua item inventaris      |
| 2  | `get_item`        | `id: u64`                                                        | `FoodItem`      | Ambil item berdasarkan ID        |
| 3  | `add_item`        | `name, quantity, category, entry_date, expiry_date, location`    | `String`        | Tambah item baru                 |
| 4  | `update_item`     | `id, name, quantity, category, entry_date, expiry_date, location`| `String`        | Update seluruh data item         |
| 5  | `update_stock`    | `id: u64, quantity: u32`                                         | `String`        | Update jumlah stok saja          |
| 6  | `delete_item`     | `id: u64`                                                        | `String`        | Hapus item berdasarkan ID        |
| 7  | `search_by_name`  | `name: String`                                                   | `Vec<FoodItem>` | Cari item berdasarkan nama       |
| 8  | `get_by_category` | `category: FoodCategory`                                         | `Vec<FoodItem>` | Filter item berdasarkan kategori |

---

## 🚀 Cara Menjalankan

### Prerequisites

- **Rust** v1.84.0 atau lebih baru
- **Soroban CLI** (Stellar CLI)
- **Wasm target**: `rustup target add wasm32v1-none`

### 1. Clone / Setup Project

```bash
cd food-warehouse-inventory
```

### 2. Menjalankan Unit Tests

```bash
cargo test
```

Output yang diharapkan:
```
running 8 tests
test test::test_add_item ... ok
test test::test_get_all_items ... ok
test test::test_get_item ... ok
test test::test_update_item ... ok
test test::test_update_stock ... ok
test test::test_delete_item ... ok
test test::test_search_by_name ... ok
test test::test_get_by_category ... ok

test result: ok. 8 passed; 0 failed
```

### 3. Build Smart Contract (Wasm)

```bash
stellar contract build
```

Output file: `target/wasm32v1-none/release/food_warehouse_inventory.wasm`

### 4. Deploy ke Testnet (Opsional)

```bash
# Tambah network testnet
stellar network add --global testnet \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015"

# Generate keypair
stellar keys generate --global deployer

# Deploy contract
stellar contract deploy \
  --wasm target/wasm32v1-none/release/food_warehouse_inventory.wasm \
  --source deployer \
  --network testnet
```

### 5. Menjalankan di Okashi (Browser IDE)

1. Buka [okashi.dev](https://okashi.dev)
2. Copy-paste isi `src/lib.rs` ke editor
3. Klik **Build**
4. Invoke fungsi-fungsi contract langsung dari UI

---

## 🖥️ Frontend Dashboard

Frontend dashboard bisa dijalankan langsung di browser tanpa server:

```
Buka file: frontend/index.html
```

### Fitur Frontend

- **📊 Stats Dashboard** — Total items, total stok, stok rendah, kadaluarsa
- **🔍 Real-time Search** — Pencarian item berdasarkan nama
- **🏷️ Category Filters** — Filter berdasarkan 5 kategori makanan
- **📦 Item Cards** — Kartu item dengan badge kategori, stok bar, lokasi, tanggal
- **➕ Add/Edit Modal** — Form lengkap untuk tambah atau edit item
- **📈 Update Stock Modal** — Modal khusus untuk update stok cepat
- **🗑️ Delete Confirmation** — Konfirmasi sebelum menghapus item
- **🔔 Toast Notifications** — Notifikasi feedback setiap aksi

### Desain

- Dark premium theme dengan glassmorphism
- Color-coded categories
- Responsive layout (desktop, tablet, mobile)
- Micro-animations & floating particles
- Google Fonts (Inter)

> **Catatan:** Frontend menggunakan `localStorage` untuk mensimulasikan interaksi smart contract. Untuk koneksi ke contract yang sudah di-deploy, diperlukan integrasi `@stellar/stellar-sdk` dan wallet seperti Freighter.

---

## 🧪 Unit Tests

Project ini memiliki **8 unit test** komprehensif:

| Test                     | Validasi                                        |
|--------------------------|------------------------------------------------|
| `test_add_item`          | Tambah item, verifikasi data tersimpan         |
| `test_get_all_items`     | Tambah beberapa item, verifikasi jumlah        |
| `test_get_item`          | Ambil item by ID, verifikasi data              |
| `test_update_item`       | Update item, verifikasi perubahan              |
| `test_update_stock`      | Update stok, verifikasi stok berubah, data lain tetap |
| `test_delete_item`       | Hapus item, verifikasi terhapus                |
| `test_search_by_name`    | Cari by nama, verifikasi hasil pencarian       |
| `test_get_by_category`   | Filter by kategori, verifikasi jumlah per kategori |

---

## 🛠️ Tech Stack

| Layer           | Teknologi                  |
|-----------------|----------------------------|
| Smart Contract  | Rust + Soroban SDK v25.1.1 |
| Blockchain      | Stellar Network            |
| Frontend        | HTML, CSS, JavaScript      |
| Design          | Vanilla CSS (Dark Theme)   |
| Storage         | Soroban Instance Storage   |

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<p align="center">
  Built with ❤️ and Rust 🦀 on Stellar Soroban
</p>
