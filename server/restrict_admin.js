const knex = require('knex');
const path = require('path');

const db = knex({
    client: 'better-sqlite3',
    connection: {
        filename: path.join(__dirname, 'server/freelancepay.sqlite')
    },
    useNullAsDefault: true
});

async function restrictAdmin() {
    try {
        // Demote everyone except the root admin
        const count = await db('users')
            .whereNot({ email: 'harshitmehta1012@gmail.com' })
            .update({ role: 'user' });
        
        console.log(`✅ Success: ${count} user(s) demoted to USER.`);
        
        // Ensure root admin is promoted
        const root = await db('users').where({ email: 'harshitmehta1012@gmail.com' }).update({ role: 'admin' });
        if (root) console.log('👑 Root Admin verified: harshitmehta1012@gmail.com');
        else console.log('⚠️ Root Admin not found in database. Please register with this email.');

    } catch (err) {
        console.error('❌ Error restricting admins:', err.message);
    } finally {
        process.exit();
    }
}

restrictAdmin();
