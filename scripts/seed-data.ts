import axios from 'axios';

const API_URL = 'http://localhost:4000/api';

async function seedData() {
    console.log('🌱 Starting Seed Data Process...\n');

    try {
        let tenantId: string = "";

        // 1. Try to create tenant, if fails, fetch all (using public endpoint if possible, but it's not)
        // So we just try to create and if it fails, we use the known domain to find it later or use a new domain.
        const domain = `cafe_${Math.floor(Math.random() * 1000)}.pos`;
        try {
            const tenantResp = await axios.post(`${API_URL}/tenants`, {
                name: "Grand Central Cafe",
                domain: domain
            });
            tenantId = tenantResp.data.id;
            console.log('✅ Tenant Created:', domain, `(${tenantId})`);
        } catch (e: any) {
            console.log('❌ Failed to create tenant:', e.response?.data || e.message);
            process.exit(1);
        }

        // 2. Create Staff (Manager)
        console.log('\n📋 Creating Staff...');
        const email = `manager_${Math.floor(Math.random() * 1000)}@grandcentral.com`;
        const staffResp = await axios.post(`${API_URL}/staff`, {
            tenant_id: tenantId,
            name: "John Doe",
            email: email,
            role: "manager"
        });
        const staffId = staffResp.data.id;
        console.log('✅ Staff Created:', email);

        // 3. Login to get token
        console.log('\n📋 Authenticating...');
        const loginResp = await axios.post(`${API_URL}/auth/login`, {
            email: email,
            password: "password123"
        });
        const token = loginResp.data.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        console.log('✅ Authenticated.');

        // 4. Create Store
        console.log('\n📋 Creating Store...');
        const storeResp = await axios.post(`${API_URL}/stores`, {
            tenant_id: tenantId,
            name: "Downtown Branch",
            address: "123 Main St, New York"
        }, config);
        const storeId = storeResp.data.id;
        console.log('✅ Store Created:', storeId);

        // 5. Create Categories
        console.log('\n📋 Creating Categories...');
        const cat1 = await axios.post(`${API_URL}/categories`, { tenant_id: tenantId, name: "Beverages" }, config);
        const cat2 = await axios.post(`${API_URL}/categories`, { tenant_id: tenantId, name: "Food" }, config);
        console.log('✅ Categories Created.');

        // 6. Create Products
        console.log('\n📋 Creating Products...');
        const products = [
            { name: "Espresso", price: 3.50, cat: cat1.data.id, tax: 8 },
            { name: "Cappuccino", price: 4.50, cat: cat1.data.id, tax: 8 },
            { name: "Latte", price: 4.75, cat: cat1.data.id, tax: 8 },
            { name: "Croissant", price: 3.25, cat: cat2.data.id, tax: 5 },
            { name: "Avocado Toast", price: 12.00, cat: cat2.data.id, tax: 5 }
        ];

        for (const p of products) {
            const prodResp = await axios.post(`${API_URL}/products`, {
                tenant_id: tenantId,
                category_id: p.cat,
                name: p.name,
                description: `Freshly prepared ${p.name}`,
                sku: p.name.toUpperCase().slice(0, 4) + Math.floor(Math.random() * 100),
                base_price: p.price,
                tax_rate: p.tax
            }, config);

            // Initial Stock
            await axios.post(`${API_URL}/inventory`, {
                tenant_id: tenantId,
                store_id: storeId,
                product_id: prodResp.data.id,
                quantity: 100,
                type: 'restock'
            }, config);
        }
        console.log('✅ Products & Inventory Created.');

        console.log('\n🎉 Seeding Complete! USE THESE FOR THE TERMINAL:');
        console.log('---------------------------------------------------------');
        console.log(`Tenant ID: ${tenantId}`);
        console.log(`Store ID:  ${storeId}`);
        console.log(`Staff ID:  ${staffId}`);
        console.log(`Email:     ${email}`);
        console.log(`Token:     ${token}`);
        console.log('---------------------------------------------------------');

    } catch (err: any) {
        console.error('❌ Seeding Failed:', err.response?.data || err.message);
    }
}

seedData();
