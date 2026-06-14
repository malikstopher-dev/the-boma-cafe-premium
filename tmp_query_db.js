const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(process.cwd(), 'data', 'cms.db');
try {
    const db = new Database(dbPath);
    
    console.log('=== CATEGORIES ===');
    const cats = db.prepare('SELECT * FROM menu_categories ORDER BY order_index').all();
    cats.forEach(c => console.log(c.id, c.name, c.description, c.order_index, c.is_active));
    
    console.log('\n=== MENU ITEMS COUNT ===');
    const count = db.prepare('SELECT COUNT(*) as count FROM menu_items').get();
    console.log('Count:', count.count);
    
    console.log('\n=== ITEMS PER CATEGORY ===');
    const perCat = db.prepare("SELECT c.name as category, COUNT(mi.id) as item_count FROM menu_categories c LEFT JOIN menu_items mi ON mi.category_id = c.id GROUP BY c.name ORDER BY c.order_index").all();
    perCat.forEach(row => console.log(row.category + ': ' + row.item_count));
    
    console.log('\n=== ITEM NAMES ===');
    const items = db.prepare('SELECT name FROM menu_items ORDER BY order_index').all();
    items.forEach(item => console.log(item.name));
    
    console.log('\n=== FEATURED ITEMS ===');
    const featured = db.prepare('SELECT name, is_featured, is_on_promo, price, is_available FROM menu_items WHERE is_featured = 1').all();
    featured.forEach(item => console.log(item.name + ' | featured=' + item.is_featured + ' | promo=' + item.is_on_promo + ' | price=' + item.price));
    
    db.close();
} catch(e) {
    console.error('Error:', e.message);
}
