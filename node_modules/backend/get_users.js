import pool from './src/db.js';

async function getUsers() {
    try {
        const res = await pool.query('SELECT email FROM staff LIMIT 5;');
        console.log('Emails:', res.rows.map(r => r.email));
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

getUsers();
