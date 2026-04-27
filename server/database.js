const knex = require('knex');
const path = require('path');

const dbType = process.env.DB_TYPE || 'sqlite3';

let config;

if (dbType === 'mysql') {
    config = {
        client: 'mysql2',
        connection: {
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'freelance_pay'
        },
        pool: { min: 2, max: 10 }
    };
} else if (dbType === 'postgres') {
    config = {
        client: 'pg',
        connection: {
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'freelance_pay',
            port: process.env.DB_PORT || 5432
        },
        pool: { min: 2, max: 10 }
    };
} else {
    // Default to SQLite
    config = {
        client: 'better-sqlite3',
        connection: {
            filename: process.env.NODE_ENV === 'production' 
                ? path.join(__dirname, 'data/freelancepay.sqlite')
                : path.join(__dirname, 'freelancepay.sqlite')
        },
        useNullAsDefault: true
    };
}

const db = knex(config);

// Migration/Initialization logic
const initDb = async () => {
    const hasUsers = await db.schema.hasTable('users');
    if (!hasUsers) {
        await db.schema.createTable('users', table => {
            table.increments('id').primary();
            table.string('name').notNullable();
            table.string('email').unique().notNullable();
            table.string('password').notNullable();
            table.string('currency').defaultTo('USD');
            table.integer('email_verified').defaultTo(0);
            table.string('verification_code');
            table.string('reset_code');
            table.string('reset_expires');
            table.string('avatar');
            table.timestamp('created_at').defaultTo(db.fn.now());
        });
    } else {
        // Force add missing columns if they don't exist
        try {
            if (!(await db.schema.hasColumn('users', 'currency'))) {
                await db.schema.table('users', t => t.string('currency').defaultTo('USD'));
            }
            if (!(await db.schema.hasColumn('users', 'email_verified'))) {
                await db.schema.table('users', t => t.integer('email_verified').defaultTo(0));
            }
            if (!(await db.schema.hasColumn('users', 'verification_code'))) {
                await db.schema.table('users', t => t.string('verification_code'));
            }
            if (!(await db.schema.hasColumn('users', 'reset_code'))) {
                await db.schema.table('users', t => t.string('reset_code'));
            }
            if (!(await db.schema.hasColumn('users', 'reset_expires'))) {
                await db.schema.table('users', t => t.string('reset_expires'));
            }
            if (!(await db.schema.hasColumn('users', 'avatar'))) {
                await db.schema.table('users', t => t.string('avatar'));
            }
            if (!(await db.schema.hasColumn('users', 'role'))) {
                await db.schema.table('users', t => t.string('role').defaultTo('user'));
            }
            console.log('📡 Migrated users table: verified security, profile & role columns');
        } catch (e) {
            console.error('❌ Migration failed:', e.message);
        }
    }

    const hasBills = await db.schema.hasTable('bills');
    if (!hasBills) {
        await db.schema.createTable('bills', table => {
            table.increments('id').primary();
            table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
            table.string('name').notNullable();
            table.string('category').notNullable();
            table.float('amount').notNullable();
            table.string('due_date').notNullable();
            table.string('recurrence').defaultTo('one-time');
            table.string('status').defaultTo('upcoming');
            table.text('notes');
            table.string('client');
            table.timestamp('created_at').defaultTo(db.fn.now());
        });
    }

    const hasPayments = await db.schema.hasTable('payments');
    if (!hasPayments) {
        await db.schema.createTable('payments', table => {
            table.increments('id').primary();
            table.integer('bill_id').unsigned().references('id').inTable('bills').onDelete('CASCADE');
            table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
            table.float('amount').notNullable();
            table.string('paid_date').notNullable();
            table.text('note');
            table.timestamp('created_at').defaultTo(db.fn.now());
        });
    }

    const hasIncome = await db.schema.hasTable('income');
    if (!hasIncome) {
        await db.schema.createTable('income', table => {
            table.increments('id').primary();
            table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
            table.string('description').notNullable();
            table.float('amount').notNullable();
            table.string('received_date').notNullable();
            table.string('client');
            table.string('category').defaultTo('freelance');
            table.timestamp('created_at').defaultTo(db.fn.now());
        });
    }

    const hasSecurityLogs = await db.schema.hasTable('security_logs');
    if (!hasSecurityLogs) {
        await db.schema.createTable('security_logs', table => {
            table.increments('id').primary();
            table.string('event_type').notNullable();
            table.string('ip_address');
            table.text('details');
            table.timestamp('created_at').defaultTo(db.fn.now());
        });
    }

    const hasMavinModels = await db.schema.hasTable('mavin_models');
    if (!hasMavinModels) {
        await db.schema.createTable('mavin_models', table => {
            table.increments('id').primary();
            table.string('name').unique();
            table.float('accuracy');
            table.integer('training_samples');
            table.timestamp('last_updated').defaultTo(db.fn.now());
        });
    }

    const hasMavinInspections = await db.schema.hasTable('mavin_inspections');
    if (!hasMavinInspections) {
        await db.schema.createTable('mavin_inspections', table => {
            table.increments('id').primary();
            table.string('resource_type');
            table.integer('resource_id');
            table.string('result');
            table.float('confidence');
            table.text('anomalies');
            table.timestamp('timestamp').defaultTo(db.fn.now());
        });
    }

    const hasFeedback = await db.schema.hasTable('feedback');
    if (!hasFeedback) {
        await db.schema.createTable('feedback', table => {
            table.increments('id').primary();
            table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
            table.string('email');
            table.string('subject').notNullable();
            table.text('message').notNullable();
            table.integer('rating').defaultTo(5);
            table.timestamp('created_at').defaultTo(db.fn.now());
        });
    }

    // Root Admin Auto-Promotion & Restriction
    try {
        await db('users').where({ email: 'harshitmehta1012@gmail.com' }).update({ role: 'admin' });
        await db('users').whereNot({ email: 'harshitmehta1012@gmail.com' }).update({ role: 'user' });
    } catch (e) {
        // Silently fail if users table doesn't exist yet
    }

    console.log(`✅ Database initialized (${dbType})`);
};

module.exports = { db, initDb };
