require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../src/config/db');

async function seed() {
    const client = await db.connect();

    try {
        console.log('Connected to database. Starting seed process...');
        await client.query('BEGIN');

        // 1. Truncate existing tables and reset primary key counters
        console.log('Clearing old data...');
        await client.query(`
      TRUNCATE TABLE 
        product_supplier_map, 
        order_item, 
        orders, 
        customer, 
        product, 
        supplier, 
        category,
        users
      RESTART IDENTITY CASCADE;
    `);

        // 2. Hash passwords and Seed Users (1 ADMIN, 1 STAFF)
        console.log('Seeding users...');
        const adminPasswordHash = await bcrypt.hash('admin', 10);
        const staffPasswordHash = await bcrypt.hash('staff', 10);

        const adminResult = await client.query(`
            INSERT INTO users (email, password, role)
            VALUES ($1, $2, 'ADMIN')
            RETURNING id;
        `, ['admin@example.com', adminPasswordHash]);
        const adminId = adminResult.rows[0].id;

        await client.query(`
            INSERT INTO users (email, password, role, created_by)
            VALUES ($1, $2, 'STAFF', $3);
        `, ['staff@example.com', staffPasswordHash, adminId]);

        // 3. Seed 5 Categories
        console.log('Seeding 5 categories...');
        const categoriesResult = await client.query(`
            INSERT INTO category (name, description, created_by)
      VALUES 
                ('Electronics', 'Gadgets, devices, and electronic accessories', $1),
                ('Books', 'Printed books, e-books, and audiobooks', $1),
                ('Home & Kitchen', 'Appliances, cookware, and home décor', $1),
                ('Apparel', 'Clothing, footwear, and accessories', $1),
                ('Sports & Outdoors', 'Sporting goods and outdoor equipment', $1)
      RETURNING id;
        `, [adminId]);
        const categoryIds = categoriesResult.rows.map(r => r.id);

        // 4. Seed 50 Products
        console.log('Seeding 50 products...');
        const productValues = [];
        const productParams = [];
        let paramIndex = 1;

        for (let i = 1; i <= 50; i++) {
            const name = `Product ${i}`;
            const sku = `SKU-${1000 + i}`;
            const price = parseFloat((Math.random() * 95 + 5).toFixed(2));
            const stock = Math.floor(Math.random() * 100) + 10;
            const categoryId = categoryIds[(i - 1) % categoryIds.length];

            productValues.push(`($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++})`);
            productParams.push(name, sku, price, stock, categoryId, adminId);
        }

        const productsResult = await client.query(`
            INSERT INTO product (name, sku, price, stock_quantity, fk_category_id, created_by)
            VALUES ${productValues.join(', ')}
            RETURNING id, price;
        `, productParams);

        const productRecords = productsResult.rows.map(r => ({
            id: r.id,
            price: parseFloat(r.price)
        }));

        // 5. Seed 10 Customers
        console.log('Seeding 10 customers...');
        const customerValues = [];
        const customerParams = [];
        paramIndex = 1;

        for (let i = 1; i <= 10; i++) {
            customerValues.push(`($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++})`);
            customerParams.push(
                `Customer ${i}`,
                `customer${i}@example.com`,
                `98213823${i}`,
                `${100 + i} Ahmedabad ${i}`,
                adminId
            );
        }

        const customersResult = await client.query(`
            INSERT INTO customer (name, email, phone, address, created_by)
            VALUES ${customerValues.join(', ')}
            RETURNING id;
        `, customerParams);
        const customerIds = customersResult.rows.map(r => r.id);

        // 6. Seed 20 Orders and Order Items
        console.log('Seeding 20 orders & item details...');
        const statuses = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];

        for (let i = 1; i <= 20; i++) {
            const customerId = customerIds[i % customerIds.length];
            const status = statuses[i % statuses.length];

            // Create Order parent record (using orders table name)
            const orderRes = await client.query(`
                INSERT INTO orders (fk_customer_id, status, total_amount, created_by)
                VALUES ($1, $2, 0.00, $3)
                RETURNING id;
            `, [customerId, status, adminId]);
            const orderId = orderRes.rows[0].id;

            // Select 1–4 distinct random products for this order
            const itemCount = Math.floor(Math.random() * 4) + 1;
            const shuffledProducts = [...productRecords].sort(() => 0.5 - Math.random());
            const selectedProducts = shuffledProducts.slice(0, itemCount);

            let orderTotal = 0;
            const itemValues = [];
            const itemParams = [];
            paramIndex = 1;

            for (const prod of selectedProducts) {
                const quantity = Math.floor(Math.random() * 3) + 1;
                const lineTotal = parseFloat((prod.price * quantity).toFixed(2));
                orderTotal += lineTotal;

                itemValues.push(`($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++})`);
                itemParams.push(orderId, prod.id, quantity, prod.price, lineTotal, adminId);
            }

            // Insert Order Items
            await client.query(`
                INSERT INTO order_item (fk_order_id, fk_product_id, quantity, unit_price, line_total, created_by)
                VALUES ${itemValues.join(', ')};
            `, itemParams);

            // Update Order total in orders table
            await client.query(`
                UPDATE orders SET total_amount = $1 WHERE id = $2;
            `, [orderTotal.toFixed(2), orderId]);
        }

        await client.query('COMMIT');
        console.log('Database seeded successfully!');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error seeding database. Transaction rolled back.\n', error);
        process.exitCode = 1;
    } finally {
        client.release();
        await db.pool.end();
    }
}

seed();