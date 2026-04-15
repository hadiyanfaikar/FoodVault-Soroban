# 🏭 FoodVault — Web3 Warehouse Inventory

**Decentralized food warehouse inventory system** built on **Stellar Soroban** smart contracts with Rust.

![Stellar](https://img.shields.io/badge/Stellar-Soroban-blue?style=for-the-badge&logo=stellar)
![Rust](https://img.shields.io/badge/Rust-Language-orange?style=for-the-badge&logo=rust)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

---

## 📋 Description

FoodVault is a Web3 smart contract that enables decentralized food warehouse inventory management on the Stellar blockchain. This contract provides full CRUD features, search, and category filtering to manage food stock in a warehouse.

This project also includes a **premium frontend dashboard** that simulates smart contract interactions.

---

## 🏗️ Project Structure

```
food-warehouse-inventory/
├── Cargo.toml                  # Soroban project configuration
├── README.md                   # Project documentation
├── src/
│   ├── lib.rs                  # Main smart contract
│   └── test.rs                 # Unit tests
└── frontend/
    ├── index.html              # Dashboard HTML
    ├── style.css               # Styling (dark theme)
    └── app.js                  # Logic & state management
```

---

## 📦 Data Structures

### `FoodCategory` (Enum)

| Variant    | Emoji | Description                    |
|------------|-------|--------------------------------|
| `Fresh`    | 🥬   | Fresh food (vegetables, fruits) |
| `Frozen`   | 🧊   | Frozen food                    |
| `Dry`      | 🌾   | Dry food (rice, noodles)       |
| `Canned`   | 🥫   | Canned food                    |
| `Beverage` | 🥤   | Beverages                      |

### `FoodItem` (Struct)

| Field         | Type           | Description                          |
|---------------|----------------|--------------------------------------|
| `id`          | `u64`          | Unique ID (random via PRNG)          |
| `name`        | `String`       | Item name                            |
| `quantity`    | `u32`          | Stock quantity                       |
| `category`    | `FoodCategory` | Food category                        |
| `entry_date`  | `u64`          | Entry date (Unix timestamp)          |
| `expiry_date` | `u64`          | Expiry date (Unix timestamp)         |
| `location`    | `String`       | Shelf location (e.g., "Rack-A1")     |

---

## 🔧 Smart Contract Functions

The `WarehouseContract` provides **8 public functions**:

| #  | Function          | Parameters                                                       | Return          | Description                          |
|----|-------------------|------------------------------------------------------------------|-----------------|--------------------------------------|
| 1  | `get_all_items`   | —                                                                | `Vec<FoodItem>` | Retrieve all inventory items         |
| 2  | `get_item`        | `id: u64`                                                        | `FoodItem`      | Retrieve an item by ID               |
| 3  | `add_item`        | `name, quantity, category, entry_date, expiry_date, location`    | `String`        | Add a new item                       |
| 4  | `update_item`     | `id, name, quantity, category, entry_date, expiry_date, location`| `String`        | Update all item data                 |
| 5  | `update_stock`    | `id: u64, quantity: u32`                                         | `String`        | Update stock quantity only            |
| 6  | `delete_item`     | `id: u64`                                                        | `String`        | Delete an item by ID                 |
| 7  | `search_by_name`  | `name: String`                                                   | `Vec<FoodItem>` | Search items by name                 |
| 8  | `get_by_category` | `category: FoodCategory`                                         | `Vec<FoodItem>` | Filter items by category             |

---

## 🚀 Getting Started

### Prerequisites

- **Rust** v1.84.0 or later
- **Soroban CLI** (Stellar CLI)
- **Wasm target**: `rustup target add wasm32v1-none`

### 1. Clone / Setup Project

```bash
cd food-warehouse-inventory
```

### 2. Run Unit Tests

```bash
cargo test
```

Expected output:
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

### 4. Deploy to Testnet (Optional)

```bash
# Add testnet network
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

### 5. Run on Okashi (Online Soroban IDE)

1. Open [okashi.dev](https://okashi.dev)
2. Copy and paste the contents of `src/lib.rs` into the editor (remove `mod test;` at the last line)
3. Click **Build** / **Compile**
4. Invoke contract functions directly from the UI

---

## 🖥️ Frontend Dashboard

The frontend dashboard can be run directly in the browser without a server:

```
Open file: frontend/index.html
```

### Frontend Features

- **📊 Stats Dashboard** — Total items, total stock, low stock, expired items
- **🔍 Real-time Search** — Search items by name
- **🏷️ Category Filters** — Filter by 5 food categories
- **📦 Item Cards** — Item cards with category badges, stock bar, location, dates
- **➕ Add/Edit Modal** — Complete form to add or edit items
- **📈 Update Stock Modal** — Quick stock update modal
- **🗑️ Delete Confirmation** — Confirmation before deleting items
- **🔔 Toast Notifications** — Feedback notifications for every action

### Design

- Dark premium theme with glassmorphism
- Color-coded categories
- Responsive layout (desktop, tablet, mobile)
- Micro-animations & floating particles
- Google Fonts (Inter)

> **Note:** The frontend uses `localStorage` to simulate smart contract interactions. To connect to a deployed contract, integration with `@stellar/stellar-sdk` and a wallet like Freighter is required.

---

## 🧪 Unit Tests

This project has **8 comprehensive unit tests**:

| Test                     | Validates                                           |
|--------------------------|-----------------------------------------------------|
| `test_add_item`          | Add item, verify data is stored                     |
| `test_get_all_items`     | Add multiple items, verify count                    |
| `test_get_item`          | Get item by ID, verify data                         |
| `test_update_item`       | Update item, verify changes                         |
| `test_update_stock`      | Update stock, verify stock changed, other data intact |
| `test_delete_item`       | Delete item, verify removal                         |
| `test_search_by_name`    | Search by name, verify search results               |
| `test_get_by_category`   | Filter by category, verify count per category       |

---

## 🛠️ Tech Stack

| Layer           | Technology                 |
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
