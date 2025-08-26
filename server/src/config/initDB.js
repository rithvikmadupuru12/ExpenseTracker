// server/src/config/initDB.js
const pool = require('./database');

const createTables = async () => {
    try {
        // Users table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                first_name VARCHAR(100) NOT NULL,
                last_name VARCHAR(100) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Categories table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS categories (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                color VARCHAR(7) DEFAULT '#3B82F6',
                icon VARCHAR(50) DEFAULT 'dollar-sign',
                type VARCHAR(20) CHECK (type IN ('income', 'expense')) NOT NULL,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Transactions table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS transactions (
                id SERIAL PRIMARY KEY,
                amount DECIMAL(10,2) NOT NULL,
                description VARCHAR(255) NOT NULL,
                transaction_date DATE NOT NULL,
                category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Budgets table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS budgets (
                id SERIAL PRIMARY KEY,
                category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                amount DECIMAL(10,2) NOT NULL,
                period VARCHAR(20) DEFAULT 'monthly',
                start_date DATE NOT NULL,
                end_date DATE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log('Database tables created successfully');
    } catch (error) {
        console.error('Error creating tables:', error);
    }
};

// Add default categories for new users
const addDefaultCategories = async (userId) => {
    const defaultCategories = [
        { name: 'Food & Dining', color: '#EF4444', icon: 'utensils', type: 'expense' },
        { name: 'Transportation', color: '#F59E0B', icon: 'car', type: 'expense' },
        { name: 'Shopping', color: '#8B5CF6', icon: 'shopping-bag', type: 'expense' },
        { name: 'Entertainment', color: '#EC4899', icon: 'film', type: 'expense' },
        { name: 'Bills & Utilities', color: '#6B7280', icon: 'file-text', type: 'expense' },
        { name: 'Healthcare', color: '#10B981', icon: 'heart', type: 'expense' },
        { name: 'Salary', color: '#059669', icon: 'briefcase', type: 'income' },
        { name: 'Freelance', color: '#0EA5E9', icon: 'laptop', type: 'income' },
        { name: 'Other Income', color: '#6366F1', icon: 'plus-circle', type: 'income' }
    ];

    for (const category of defaultCategories) {
        await pool.query(
            'INSERT INTO categories (name, color, icon, type, user_id) VALUES ($1, $2, $3, $4, $5)',
            [category.name, category.color, category.icon, category.type, userId]
        );
    }
};

module.exports = { createTables, addDefaultCategories };