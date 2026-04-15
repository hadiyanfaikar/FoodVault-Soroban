#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Env, String, Symbol, Vec};

// ============================================================
// DATA STRUCTURES
// ============================================================

// Enum kategori makanan di gudang
#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub enum FoodCategory {
    Fresh,    // Makanan segar (sayur, buah)
    Frozen,   // Makanan beku
    Dry,      // Makanan kering (beras, mie)
    Canned,   // Makanan kaleng
    Beverage, // Minuman
}

// Struktur data untuk setiap item inventaris
#[contracttype]
#[derive(Clone, Debug)]
pub struct FoodItem {
    pub id: u64,
    pub name: String,
    pub quantity: u32,
    pub category: FoodCategory,
    pub entry_date: u64,  // Unix timestamp
    pub expiry_date: u64, // Unix timestamp
    pub location: String, // Lokasi rak (contoh: "Rak-A1")
}

// ============================================================
// STORAGE KEY
// ============================================================

const INVENTORY: Symbol = symbol_short!("INVENTORY");

// ============================================================
// CONTRACT
// ============================================================

#[contract]
pub struct WarehouseContract;

#[contractimpl]
impl WarehouseContract {
    // -------------------------------------------------------
    // 1. Mendapatkan semua item inventaris
    // -------------------------------------------------------
    pub fn get_all_items(env: Env) -> Vec<FoodItem> {
        env.storage()
            .instance()
            .get(&INVENTORY)
            .unwrap_or(Vec::new(&env))
    }

    // -------------------------------------------------------
    // 2. Mendapatkan item berdasarkan ID
    // -------------------------------------------------------
    pub fn get_item(env: Env, id: u64) -> FoodItem {
        let items: Vec<FoodItem> = env
            .storage()
            .instance()
            .get(&INVENTORY)
            .unwrap_or(Vec::new(&env));

        for i in 0..items.len() {
            let item = items.get(i).unwrap();
            if item.id == id {
                return item;
            }
        }

        panic!("Item dengan ID tersebut tidak ditemukan");
    }

    // -------------------------------------------------------
    // 3. Menambahkan item baru ke inventaris
    // -------------------------------------------------------
    pub fn add_item(
        env: Env,
        name: String,
        quantity: u32,
        category: FoodCategory,
        entry_date: u64,
        expiry_date: u64,
        location: String,
    ) -> String {
        // 1. Ambil data inventaris dari storage
        let mut items: Vec<FoodItem> = env
            .storage()
            .instance()
            .get(&INVENTORY)
            .unwrap_or(Vec::new(&env));

        // 2. Buat object item baru dengan ID acak
        let item = FoodItem {
            id: env.prng().gen::<u64>(),
            name,
            quantity,
            category,
            entry_date,
            expiry_date,
            location,
        };

        // 3. Tambahkan item baru ke list
        items.push_back(item);

        // 4. Simpan kembali ke storage
        env.storage().instance().set(&INVENTORY, &items);

        String::from_str(&env, "Item berhasil ditambahkan")
    }

    // -------------------------------------------------------
    // 4. Mengupdate seluruh data item
    // -------------------------------------------------------
    pub fn update_item(
        env: Env,
        id: u64,
        name: String,
        quantity: u32,
        category: FoodCategory,
        entry_date: u64,
        expiry_date: u64,
        location: String,
    ) -> String {
        let mut items: Vec<FoodItem> = env
            .storage()
            .instance()
            .get(&INVENTORY)
            .unwrap_or(Vec::new(&env));

        for i in 0..items.len() {
            let item = items.get(i).unwrap();
            if item.id == id {
                let updated = FoodItem {
                    id,
                    name,
                    quantity,
                    category,
                    entry_date,
                    expiry_date,
                    location,
                };
                items.set(i, updated);
                env.storage().instance().set(&INVENTORY, &items);
                return String::from_str(&env, "Item berhasil diupdate");
            }
        }

        String::from_str(&env, "Item tidak ditemukan")
    }

    // -------------------------------------------------------
    // 5. Mengupdate jumlah stok saja
    // -------------------------------------------------------
    pub fn update_stock(env: Env, id: u64, quantity: u32) -> String {
        let mut items: Vec<FoodItem> = env
            .storage()
            .instance()
            .get(&INVENTORY)
            .unwrap_or(Vec::new(&env));

        for i in 0..items.len() {
            let item = items.get(i).unwrap();
            if item.id == id {
                let updated = FoodItem {
                    id: item.id,
                    name: item.name,
                    quantity,
                    category: item.category,
                    entry_date: item.entry_date,
                    expiry_date: item.expiry_date,
                    location: item.location,
                };
                items.set(i, updated);
                env.storage().instance().set(&INVENTORY, &items);
                return String::from_str(&env, "Stok berhasil diupdate");
            }
        }

        String::from_str(&env, "Item tidak ditemukan")
    }

    // -------------------------------------------------------
    // 6. Menghapus item berdasarkan ID
    // -------------------------------------------------------
    pub fn delete_item(env: Env, id: u64) -> String {
        let mut items: Vec<FoodItem> = env
            .storage()
            .instance()
            .get(&INVENTORY)
            .unwrap_or(Vec::new(&env));

        for i in 0..items.len() {
            if items.get(i).unwrap().id == id {
                items.remove(i);
                env.storage().instance().set(&INVENTORY, &items);
                return String::from_str(&env, "Item berhasil dihapus");
            }
        }

        String::from_str(&env, "Item tidak ditemukan")
    }

    // -------------------------------------------------------
    // 7. Mencari item berdasarkan nama (exact match)
    // -------------------------------------------------------
    pub fn search_by_name(env: Env, name: String) -> Vec<FoodItem> {
        let items: Vec<FoodItem> = env
            .storage()
            .instance()
            .get(&INVENTORY)
            .unwrap_or(Vec::new(&env));

        let mut result = Vec::new(&env);

        for i in 0..items.len() {
            let item = items.get(i).unwrap();
            if item.name == name {
                result.push_back(item);
            }
        }

        result
    }

    // -------------------------------------------------------
    // 8. Memfilter item berdasarkan kategori
    // -------------------------------------------------------
    pub fn get_by_category(env: Env, category: FoodCategory) -> Vec<FoodItem> {
        let items: Vec<FoodItem> = env
            .storage()
            .instance()
            .get(&INVENTORY)
            .unwrap_or(Vec::new(&env));

        let mut result = Vec::new(&env);

        for i in 0..items.len() {
            let item = items.get(i).unwrap();
            if item.category == category {
                result.push_back(item);
            }
        }

        result
    }
}

mod test;
