const knex = require('knex');
const path = require('path');

const db = knex({
    client: 'better-sqlite3',
    connection: {
        filename: path.join(__dirname, 'freelancepay.sqlite')
    },
    useNullAsDefault: true
});

async function makeAdmin() {
    try {
        const users = await db('users').select('id', 'email', 'name');
        console.log('Current Users:', users);
        
        if (users.length > 0) {
            // Update all users to admin for now since it's a dev environment and user requested it
            const count = await db('users').update({ role: 'admin' });
            console.log(`✅ Success: ${count} user(s) promoted to ADMIN.`);
        } else {
            console.log('❌ No users found in database.');
        }
    } catch (err) {
        console.error('❌ Error updating users:', err.message);
    } finally {
        await db.destroy();
    }
}

makeAdmin();
