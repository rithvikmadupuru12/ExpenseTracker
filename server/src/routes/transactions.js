// server/src/routes/transactions.js
const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Get all transactions for user
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 20, category, startDate, endDate, type } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT 
                t.id, 
                t.amount, 
                t.description, 
                t.transaction_date,
                t.created_at,
                c.name as category_name,
                c.color as category_color,
                c.icon as category_icon,
                c.type as category_type
            FROM transactions t
            LEFT JOIN categories c ON t.category_id = c.id
            WHERE t.user_id = $1
        `;
        
        const params = [req.user.id];
        let paramCount = 1;

        // Add filters
        if (category) {
            paramCount++;
            query += ` AND c.id = $${paramCount}`;
            params.push(category);
        }

        if (startDate) {
            paramCount++;
            query += ` AND t.transaction_date >= $${paramCount}`;
            params.push(startDate);
        }

        if (endDate) {
            paramCount++;
            query += ` AND t.transaction_date <= $${paramCount}`;
            params.push(endDate);
        }

        if (type) {
            paramCount++;
            query += ` AND c.type = $${paramCount}`;
            params.push(type);
        }

        query += ` ORDER BY t.transaction_date DESC, t.created_at DESC`;
        
        // Add pagination
        paramCount++;
        query += ` LIMIT $${paramCount}`;
        params.push(limit);
        
        paramCount++;
        query += ` OFFSET $${paramCount}`;
        params.push(offset);

        const result = await pool.query(query, params);

        // Get total count for pagination
        let countQuery = `
            SELECT COUNT(*) 
            FROM transactions t
            LEFT JOIN categories c ON t.category_id = c.id
            WHERE t.user_id = $1
        `;
        const countParams = [req.user.id];
        let countParamIndex = 1;

        if (category) {
            countParamIndex++;
            countQuery += ` AND c.id = $${countParamIndex}`;
            countParams.push(category);
        }

        if (startDate) {
            countParamIndex++;
            countQuery += ` AND t.transaction_date >= $${countParamIndex}`;
            countParams.push(startDate);
        }

        if (endDate) {
            countParamIndex++;
            countQuery += ` AND t.transaction_date <= $${countParamIndex}`;
            countParams.push(endDate);
        }

        if (type) {
            countParamIndex++;
            countQuery += ` AND c.type = $${countParamIndex}`;
            countParams.push(type);
        }

        const countResult = await pool.query(countQuery, countParams);
        const totalTransactions = parseInt(countResult.rows[0].count);

        res.json({
            transactions: result.rows,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalTransactions / limit),
                totalTransactions,
                hasNext: (page * limit) < totalTransactions,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ message: 'Error fetching transactions' });
    }
});

// Get transaction by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
            SELECT 
                t.id, 
                t.amount, 
                t.description, 
                t.transaction_date,
                t.category_id,
                t.created_at,
                c.name as category_name,
                c.color as category_color,
                c.icon as category_icon,
                c.type as category_type
            FROM transactions t
            LEFT JOIN categories c ON t.category_id = c.id
            WHERE t.id = $1 AND t.user_id = $2
        `, [id, req.user.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        res.json({ transaction: result.rows[0] });
    } catch (error) {
        console.error('Error fetching transaction:', error);
        res.status(500).json({ message: 'Error fetching transaction' });
    }
});

// Create new transaction
router.post('/', async (req, res) => {
    try {
        const { amount, description, transactionDate, categoryId } = req.body;

        // Validation
        if (!amount || !description || !transactionDate || !categoryId) {
            return res.status(400).json({ 
                message: 'Amount, description, transaction date, and category are required' 
            });
        }

        if (parseFloat(amount) <= 0) {
            return res.status(400).json({ message: 'Amount must be greater than 0' });
        }

        // Verify category belongs to user
        const categoryCheck = await pool.query(
            'SELECT id FROM categories WHERE id = $1 AND user_id = $2',
            [categoryId, req.user.id]
        );

        if (categoryCheck.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid category selected' });
        }

        // Create transaction
        const result = await pool.query(`
            INSERT INTO transactions (amount, description, transaction_date, category_id, user_id)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, amount, description, transaction_date, created_at
        `, [parseFloat(amount), description, transactionDate, categoryId, req.user.id]);

        // Get full transaction details with category
        const fullTransaction = await pool.query(`
            SELECT 
                t.id, 
                t.amount, 
                t.description, 
                t.transaction_date,
                t.created_at,
                c.name as category_name,
                c.color as category_color,
                c.icon as category_icon,
                c.type as category_type
            FROM transactions t
            LEFT JOIN categories c ON t.category_id = c.id
            WHERE t.id = $1
        `, [result.rows[0].id]);

        res.status(201).json({
            message: 'Transaction created successfully',
            transaction: fullTransaction.rows[0]
        });
    } catch (error) {
        console.error('Error creating transaction:', error);
        res.status(500).json({ message: 'Error creating transaction' });
    }
});

// Update transaction
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, description, transactionDate, categoryId } = req.body;

        // Check if transaction exists and belongs to user
        const existingTransaction = await pool.query(
            'SELECT id FROM transactions WHERE id = $1 AND user_id = $2',
            [id, req.user.id]
        );

        if (existingTransaction.rows.length === 0) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        // Validation
        if (amount !== undefined && parseFloat(amount) <= 0) {
            return res.status(400).json({ message: 'Amount must be greater than 0' });
        }

        // Verify category belongs to user if provided
        if (categoryId) {
            const categoryCheck = await pool.query(
                'SELECT id FROM categories WHERE id = $1 AND user_id = $2',
                [categoryId, req.user.id]
            );

            if (categoryCheck.rows.length === 0) {
                return res.status(400).json({ message: 'Invalid category selected' });
            }
        }

        // Build update query dynamically
        const updates = [];
        const params = [];
        let paramCount = 0;

        if (amount !== undefined) {
            paramCount++;
            updates.push(`amount = $${paramCount}`);
            params.push(parseFloat(amount));
        }

        if (description !== undefined) {
            paramCount++;
            updates.push(`description = $${paramCount}`);
            params.push(description);
        }

        if (transactionDate !== undefined) {
            paramCount++;
            updates.push(`transaction_date = $${paramCount}`);
            params.push(transactionDate);
        }

        if (categoryId !== undefined) {
            paramCount++;
            updates.push(`category_id = $${paramCount}`);
            params.push(categoryId);
        }

        if (updates.length === 0) {
            return res.status(400).json({ message: 'No valid fields to update' });
        }

        paramCount++;
        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        params.push(id);

        const query = `
            UPDATE transactions 
            SET ${updates.join(', ')} 
            WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
            RETURNING id
        `;
        params.push(req.user.id);

        await pool.query(query, params);

        // Get updated transaction with category details
        const updatedTransaction = await pool.query(`
            SELECT 
                t.id, 
                t.amount, 
                t.description, 
                t.transaction_date,
                t.created_at,
                t.updated_at,
                c.name as category_name,
                c.color as category_color,
                c.icon as category_icon,
                c.type as category_type
            FROM transactions t
            LEFT JOIN categories c ON t.category_id = c.id
            WHERE t.id = $1
        `, [id]);

        res.json({
            message: 'Transaction updated successfully',
            transaction: updatedTransaction.rows[0]
        });
    } catch (error) {
        console.error('Error updating transaction:', error);
        res.status(500).json({ message: 'Error updating transaction' });
    }
});

// Delete transaction
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING id',
            [id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        res.json({ message: 'Transaction deleted successfully' });
    } catch (error) {
        console.error('Error deleting transaction:', error);
        res.status(500).json({ message: 'Error deleting transaction' });
    }
});

// Get transaction statistics
router.get('/stats/summary', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        let query = `
            SELECT 
                c.type,
                SUM(t.amount) as total
            FROM transactions t
            JOIN categories c ON t.category_id = c.id
            WHERE t.user_id = $1
        `;
        
        const params = [req.user.id];
        let paramCount = 1;

        if (startDate) {
            paramCount++;
            query += ` AND t.transaction_date >= $${paramCount}`;
            params.push(startDate);
        }

        if (endDate) {
            paramCount++;
            query += ` AND t.transaction_date <= $${paramCount}`;
            params.push(endDate);
        }

        query += ` GROUP BY c.type`;

        const result = await pool.query(query, params);
        
        const summary = {
            income: 0,
            expenses: 0,
            balance: 0
        };

        result.rows.forEach(row => {
            if (row.type === 'income') {
                summary.income = parseFloat(row.total);
            } else if (row.type === 'expense') {
                summary.expenses = parseFloat(row.total);
            }
        });

        summary.balance = summary.income - summary.expenses;

        res.json({ summary });
    } catch (error) {
        console.error('Error fetching transaction stats:', error);
        res.status(500).json({ message: 'Error fetching transaction statistics' });
    }
});

module.exports = router;