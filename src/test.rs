#![cfg(test)]

use super::*;
use soroban_sdk::Env;

// ============================================================
// HELPER: membuat environment dan client
// ============================================================
fn setup() -> (Env, WarehouseContractClient<'static>) {
    let env = Env::default();
    let contract_id = env.register(WarehouseContract, ());
    let client = WarehouseContractClient::new(&env, &contract_id);
    (env, client)
}

// ============================================================
// TEST 1: Tambah item baru
// ============================================================
#[test]
fn test_add_item() {
    let (env, client) = setup();

    let result = client.add_item(
        &String::from_str(&env, "Beras Premium"),
        &10,
        &FoodCategory::Dry,
        &1700000000,
        &1730000000,
        &String::from_str(&env, "Rak-A1"),
    );

    assert_eq!(result, String::from_str(&env, "Item berhasil ditambahkan"));

    let items = client.get_all_items();
    assert_eq!(items.len(), 1);
    assert_eq!(
        items.get(0).unwrap().name,
        String::from_str(&env, "Beras Premium")
    );
    assert_eq!(items.get(0).unwrap().quantity, 10);
    assert_eq!(items.get(0).unwrap().category, FoodCategory::Dry);
    assert_eq!(
        items.get(0).unwrap().location,
        String::from_str(&env, "Rak-A1")
    );
}

// ============================================================
// TEST 2: Ambil semua items
// ============================================================
#[test]
fn test_get_all_items() {
    let (env, client) = setup();

    // Awalnya kosong
    let items = client.get_all_items();
    assert_eq!(items.len(), 0);

    // Tambah 3 item berbeda kategori
    client.add_item(
        &String::from_str(&env, "Beras"),
        &10,
        &FoodCategory::Dry,
        &1700000000,
        &1730000000,
        &String::from_str(&env, "Rak-A1"),
    );
    client.add_item(
        &String::from_str(&env, "Ikan Beku"),
        &5,
        &FoodCategory::Frozen,
        &1700000000,
        &1720000000,
        &String::from_str(&env, "Rak-B1"),
    );
    client.add_item(
        &String::from_str(&env, "Sayur Segar"),
        &20,
        &FoodCategory::Fresh,
        &1700000000,
        &1705000000,
        &String::from_str(&env, "Rak-C1"),
    );

    let items = client.get_all_items();
    assert_eq!(items.len(), 3);
}

// ============================================================
// TEST 3: Ambil item berdasarkan ID
// ============================================================
#[test]
fn test_get_item() {
    let (env, client) = setup();

    client.add_item(
        &String::from_str(&env, "Beras Premium"),
        &10,
        &FoodCategory::Dry,
        &1700000000,
        &1730000000,
        &String::from_str(&env, "Rak-A1"),
    );

    // Ambil ID dari item yang baru ditambahkan
    let items = client.get_all_items();
    let id = items.get(0).unwrap().id;

    // Get item by ID
    let item = client.get_item(&id);
    assert_eq!(item.name, String::from_str(&env, "Beras Premium"));
    assert_eq!(item.quantity, 10);
    assert_eq!(item.category, FoodCategory::Dry);
}

// ============================================================
// TEST 4: Update seluruh data item
// ============================================================
#[test]
fn test_update_item() {
    let (env, client) = setup();

    client.add_item(
        &String::from_str(&env, "Beras Premium"),
        &10,
        &FoodCategory::Dry,
        &1700000000,
        &1730000000,
        &String::from_str(&env, "Rak-A1"),
    );

    let items = client.get_all_items();
    let id = items.get(0).unwrap().id;

    // Update item
    let result = client.update_item(
        &id,
        &String::from_str(&env, "Beras Super"),
        &15,
        &FoodCategory::Dry,
        &1700000000,
        &1735000000,
        &String::from_str(&env, "Rak-A2"),
    );

    assert_eq!(result, String::from_str(&env, "Item berhasil diupdate"));

    // Verifikasi perubahan
    let updated = client.get_item(&id);
    assert_eq!(updated.name, String::from_str(&env, "Beras Super"));
    assert_eq!(updated.quantity, 15);
    assert_eq!(updated.location, String::from_str(&env, "Rak-A2"));
}

// ============================================================
// TEST 5: Update stok saja
// ============================================================
#[test]
fn test_update_stock() {
    let (env, client) = setup();

    client.add_item(
        &String::from_str(&env, "Beras Premium"),
        &10,
        &FoodCategory::Dry,
        &1700000000,
        &1730000000,
        &String::from_str(&env, "Rak-A1"),
    );

    let items = client.get_all_items();
    let id = items.get(0).unwrap().id;

    // Update stok dari 10 menjadi 25
    let result = client.update_stock(&id, &25);
    assert_eq!(result, String::from_str(&env, "Stok berhasil diupdate"));

    // Verifikasi stok berubah, data lain tetap
    let item = client.get_item(&id);
    assert_eq!(item.quantity, 25);
    assert_eq!(item.name, String::from_str(&env, "Beras Premium"));
    assert_eq!(item.location, String::from_str(&env, "Rak-A1"));
}

// ============================================================
// TEST 6: Hapus item
// ============================================================
#[test]
fn test_delete_item() {
    let (env, client) = setup();

    // Tambah 2 item
    client.add_item(
        &String::from_str(&env, "Beras"),
        &10,
        &FoodCategory::Dry,
        &1700000000,
        &1730000000,
        &String::from_str(&env, "Rak-A1"),
    );
    client.add_item(
        &String::from_str(&env, "Ikan Beku"),
        &5,
        &FoodCategory::Frozen,
        &1700000000,
        &1720000000,
        &String::from_str(&env, "Rak-B1"),
    );

    let items = client.get_all_items();
    assert_eq!(items.len(), 2);

    // Hapus item pertama
    let id = items.get(0).unwrap().id;
    let result = client.delete_item(&id);
    assert_eq!(result, String::from_str(&env, "Item berhasil dihapus"));

    // Verifikasi tinggal 1 item
    let items = client.get_all_items();
    assert_eq!(items.len(), 1);

    // Hapus item yang tidak ada
    let result = client.delete_item(&999999);
    assert_eq!(result, String::from_str(&env, "Item tidak ditemukan"));
}

// ============================================================
// TEST 7: Cari item berdasarkan nama
// ============================================================
#[test]
fn test_search_by_name() {
    let (env, client) = setup();

    client.add_item(
        &String::from_str(&env, "Beras Premium"),
        &10,
        &FoodCategory::Dry,
        &1700000000,
        &1730000000,
        &String::from_str(&env, "Rak-A1"),
    );
    client.add_item(
        &String::from_str(&env, "Ikan Beku"),
        &5,
        &FoodCategory::Frozen,
        &1700000000,
        &1720000000,
        &String::from_str(&env, "Rak-B1"),
    );
    client.add_item(
        &String::from_str(&env, "Beras Premium"),
        &8,
        &FoodCategory::Dry,
        &1700100000,
        &1731000000,
        &String::from_str(&env, "Rak-A3"),
    );

    // Cari "Beras Premium" — harus ditemukan 2
    let results = client.search_by_name(&String::from_str(&env, "Beras Premium"));
    assert_eq!(results.len(), 2);

    // Cari yang tidak ada
    let no_results = client.search_by_name(&String::from_str(&env, "Gula Pasir"));
    assert_eq!(no_results.len(), 0);
}

// ============================================================
// TEST 8: Filter item berdasarkan kategori
// ============================================================
#[test]
fn test_get_by_category() {
    let (env, client) = setup();

    // Tambah beberapa item dengan kategori berbeda
    client.add_item(
        &String::from_str(&env, "Beras"),
        &10,
        &FoodCategory::Dry,
        &1700000000,
        &1730000000,
        &String::from_str(&env, "Rak-A1"),
    );
    client.add_item(
        &String::from_str(&env, "Mie Kering"),
        &20,
        &FoodCategory::Dry,
        &1700000000,
        &1740000000,
        &String::from_str(&env, "Rak-A2"),
    );
    client.add_item(
        &String::from_str(&env, "Ikan Beku"),
        &5,
        &FoodCategory::Frozen,
        &1700000000,
        &1720000000,
        &String::from_str(&env, "Rak-B1"),
    );
    client.add_item(
        &String::from_str(&env, "Sarden Kaleng"),
        &15,
        &FoodCategory::Canned,
        &1700000000,
        &1750000000,
        &String::from_str(&env, "Rak-D1"),
    );

    // Filter Dry — harus 2
    let dry_items = client.get_by_category(&FoodCategory::Dry);
    assert_eq!(dry_items.len(), 2);

    // Filter Frozen — harus 1
    let frozen_items = client.get_by_category(&FoodCategory::Frozen);
    assert_eq!(frozen_items.len(), 1);

    // Filter Fresh — harus 0
    let fresh_items = client.get_by_category(&FoodCategory::Fresh);
    assert_eq!(fresh_items.len(), 0);

    // Filter Canned — harus 1
    let canned_items = client.get_by_category(&FoodCategory::Canned);
    assert_eq!(canned_items.len(), 1);
    assert_eq!(
        canned_items.get(0).unwrap().name,
        String::from_str(&env, "Sarden Kaleng")
    );
}
