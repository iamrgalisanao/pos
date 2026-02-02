import axios from 'axios';

async function testLogin() {
    const email = 'admin@example.com';
    const password = 'password123';
    const url = 'http://localhost:4000/api/auth/login';

    console.log(`Attempting login to ${url} with ${email}...`);
    try {
        const response = await axios.post(url, { email, password });
        console.log('Login successful!');
        console.log('Response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        if (error.response) {
            console.error('Login failed with status:', error.response.status);
            console.error('Error data:', error.response.data);
        } else {
            console.error('Login failed with error:', error.message);
        }
    }
}

testLogin();
