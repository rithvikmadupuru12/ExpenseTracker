// server/src/routes/categories.js
const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Get all categories for user
router.get('/', async (req, res) => {
    try {
        const { type } = req.query; // 'income', 'expense', or undefined for all

        let query = `
            SELECT id, name, color, icon, type, created_at
            FROM categories 
            WHERE user_id = $1
        `;
        const params = [req.user.id];

        if (type && (type === 'income' || type === 'expense')) {
            query += ` AND type = $2`;
            params.push(type);
        }

        query += ` ORDER BY type, name ASC`;

        const result = await pool.query(query, params);

        // Group by type for easier frontend consumption
        const categories = {
            income: result.rows.filter(cat => cat.type === 'income'),
            expense: result.rows.filter(cat => cat.type === 'expense')
        };

        res.json({ categories });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ message: 'Error fetching categories' });
    }
});

// Get category by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'SELECT id, name, color, icon, type, created_at FROM categories WHERE id = $1 AND user_id = $2',
            [id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Category not found' });
        }

        res.json({ category: result.rows[0] });
    } catch (error) {
        console.error('Error fetching category:', error);
        res.status(500).json({ message: 'Error fetching category' });
    }
});

// Create new category
router.post('/', async (req, res) => {
    try {
        const { name, color = '#3B82F6', icon = 'dollar-sign', type } = req.body;

        // Validation
        if (!name || !type) {
            return res.status(400).json({ message: 'Name and type are required' });
        }

        if (!['income', 'expense'].includes(type)) {
            return res.status(400).json({ message: 'Type must be either "income" or "expense"' });
        }

        // Check if category name already exists for this user
        const existingCategory = await pool.query(
            'SELECT id FROM categories WHERE name = $1 AND user_id = $2 AND type = $3',
            [name.trim(), req.user.id, type]
        );

        if (existingCategory.rows.length > 0) {
            return res.status(400).json({ message: 'Category with this name already exists for this type' });
        }

        // Validate color format (hex)
        const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
        if (!hexColorRegex.test(color)) {
            return res.status(400).json({ message: 'Color must be a valid hex color (e.g., #FF0000)' });
        }

        // Create category
        const result = await pool.query(`
            INSERT INTO categories (name, color, icon, type, user_id)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, name, color, icon, type, created_at
        `, [name.trim(), color, icon, type, req.user.id]);

        res.status(201).json({
            message: 'Category created successfully',
            category: result.rows[0]
        });
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({ message: 'Error creating category' });
    }
});

// Update category
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, color, icon, type } = req.body;

        // Check if category exists and belongs to user
        const existingCategory = await pool.query(
            'SELECT id FROM categories WHERE id = $1 AND user_id = $2',
            [id, req.user.id]
        );

        if (existingCategory.rows.length === 0) {
            return res.status(404).json({ message: 'Category not found' });
        }

        // Validate type if provided
        if (type && !['income', 'expense'].includes(type)) {
            return res.status(400).json({ message: 'Type must be either "income" or "expense"' });
        }

        // Validate color format if provided
        if (color) {
            const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
            if (!hexColorRegex.test(color)) {
                return res.status(400).json({ message: 'Color must be a valid hex color (e.g., #FF0000)' });
            }
        }

        // Check for duplicate name if name is being changed
        if (name) {
            const duplicateCheck = await pool.query(
                'SELECT id FROM categories WHERE name = $1 AND user_id = $2 AND type = $3 AND id != $4',
                [name.trim(), req.user.id, type || 'expense', id]
            );

            if (duplicateCheck.rows.length > 0) {
                return res.status(400).json({ message: 'Category with this name already exists for this type' });
            }
        }

        // Build update query dynamically
        const updates = [];
        const params = [];
        let paramCount = 0;

        if (name !== undefined) {
            paramCount++;
            updates.push(`name = $${paramCount}`);
            params.push(name.trim());
        }

        if (color !== undefined) {
            paramCount++;
            updates.push(`color = $${paramCount}`);
            params.push(color);
        }

        if (icon !== undefined) {
            paramCount++;
            updates.push(`icon = $${paramCount}`);
            params.push(icon);
        }

        if (type !== undefined) {
            paramCount++;
            updates.push(`type = $${paramCount}`);
            params.push(type);
        }

        if (updates.length === 0) {
            return res.status(400).json({ message: 'No valid fields to update' });
        }

        paramCount++;
        params.push(id);
        paramCount++;
        params.push(req.user.id);

        const query = `
            UPDATE categories 
            SET ${updates.join(', ')} 
            WHERE id = $${paramCount - 1} AND user_id = $${paramCount}
            RETURNING id, name, color, icon, type, created_at
        `;

        const result = await pool.query(query, params);

        res.json({
            message: 'Category updated successfully',
            category: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({ message: 'Error updating category' });
    }
});

// Delete category
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if category has transactions
        const transactionCheck = await pool.query(
            'SELECT COUNT(*) as count FROM transactions WHERE category_id = $1 AND user_id = $2',
            [id, req.user.id]
        );

        const transactionCount = parseInt(transactionCheck.rows[0].count);

        if (transactionCount > 0) {
            return res.status(400).json({ 
                message: `Cannot delete category. It is used by ${transactionCount} transaction(s). Please reassign or delete those transactions first.`,
                transactionCount
            });
        }

        // Delete category
        const result = await pool.query(
            'DELETE FROM categories WHERE id = $1 AND user_id = $2 RETURNING id',
            [id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Category not found' });
        }

        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ message: 'Error deleting category' });
    }
});

// Get category spending statistics
router.get('/stats/spending', async (req, res) => {
    try {
        const { startDate, endDate, type } = req.query;
        
        let query = `
            SELECT 
                c.id,
                c.name,
                c.color,
                c.icon,
                c.type,
                SUM(t.amount) as total,
                COUNT(t.id) as transaction_count
            FROM categories c
            LEFT JOIN transactions t ON c.id = t.category_id
            WHERE c.user_id = $1
        `;
        
        const params = [req.user.id];
        let paramCount = 1;

        if (type && (type === 'income' || type === 'expense')) {
            paramCount++;
            query += ` AND c.type = $${paramCount}`;
            params.push(type);
        }

        if (startDate) {
            paramCount++;
            query += ` AND (t.transaction_date >= $${paramCount} OR t.transaction_date IS NULL)`;
            params.push(startDate);
        }

        if (endDate) {
            paramCount++;
            query += ` AND (t.transaction_date <= $${paramCount} OR t.transaction_date IS NULL)`;
            params.push(endDate);
        }

        query += ` 
            GROUP BY c.id, c.name, c.color, c.icon, c.type
            ORDER BY total DESC NULLS LAST
        `;

        const result = await pool.query(query, params);
        
        const statistics = result.rows.map(row => ({
            category: {
                id: row.id,
                name: row.name,
                color: row.color,
                icon: row.icon,
                type: row.type
            },
            total: parseFloat(row.total || 0),
            transactionCount: parseInt(row.transaction_count)
        }));

        res.json({ statistics });
    } catch (error) {
        console.error('Error fetching category statistics:', error);
        res.status(500).json({ message: 'Error fetching category statistics' });
    }
});

module.exports = router;