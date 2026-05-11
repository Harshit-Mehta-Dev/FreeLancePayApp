const knex = require('knex');
const path = require('path');

const db = knex({
    client: 'better-sqlite3',
    connection: {
        filename: path.join(__dirname, 'server/freelancepay.sqlite')
    },
    useNullAsDefault: true
});

async function checkAdmin() {
    try {
        const user = await db('users').where({ email: 'harshitmehta1012@gmail.com' }).first();
        if (user) {
            console.log(`User found: ${user.email}, Role: ${user.role}`);
            if (user.role !== 'admin') {
                await db('users').where({ email: 'harshitmehta1012@gmail.com' }).update({ role: 'admin' });
                console.log('User promoted to admin successfully.');
            }
        } else {
            console.log('User not found in local SQLite database.');
        }
    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        process.exit();
    }
}

checkAdmin();
