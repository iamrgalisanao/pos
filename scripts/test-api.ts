import axios from 'axios';

const API_URL = 'http://localhost:4000/api';

async function runTests() {
    console.log('🚀 Starting POS System Connectivity & Integration Tests...\n');

    try {
        // 1. Health Check
        console.log('📋 Test 1: System Health Check...');
        const health = await axios.get('http://localhost:4000/health');
        console.log('✅ Health status:', health.data.status);

        // 2. Create Tenant
        console.log('\n📋 Test 2: Creating a New Tenant...');
        const tenantResponse = await axios.post(`${API_URL}/tenants`, {
            name: "Antigravity Coffee",
            domain: "antigravity.pos"
        });
        const tenantId = tenantResponse.data.id;
        console.log('✅ Tenant Created:', tenantResponse.data.name, `(ID: ${tenantId})`);

        // 3. Create Staff Member
        console.log('\n📋 Test 3: Creating a Staff Member...');
        const staffResponse = await axios.post(`${API_URL}/staff`, {
            tenant_id: tenantId,
            name: "Test Manager",
            email: `manager_${Date.now()}@test.com`,
            role: "manager"
        });
        const staff = staffResponse.data;
        console.log('✅ Staff Created:', staff.name, `(Role: ${staff.role})`);

        // 4. Authentication (Mock Login)
        console.log('\n📋 Test 4: Testing Authentication Flow...');
        const loginResponse = await axios.post(`${API_URL}/auth/login`, {
            email: staff.email,
            password: "password123" // Note: Currently a placeholder in the controller
        });
        const token = loginResponse.data.token;
        console.log('✅ Login Successful. Token received.');

        // 5. Fetch Protected Resource (Tenants List)
        console.log('\n📋 Test 5: Fetching Protected Resource (Tenants List)...');
        const tenantsList = await axios.get(`${API_URL}/tenants`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Protected access verified. Found', tenantsList.data.length, 'tenants.');

        console.log('\n🎉 All connectivity tests passed successfully!');
    } catch (error) {
        console.error('\n❌ Test failed!');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error:', error.message);
        }
        process.exit(1);
    }
}

runTests();
