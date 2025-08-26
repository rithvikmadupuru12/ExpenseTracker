// server/src/routes/budgets.js
const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Get all budgets for user
router.get('/', async (req, res) => {
    try {
        const { period = 'monthly' } = req.query;

        const result = await pool.query(`
            SELECT 
                b.id,
                b.amount,
                b.period,
                b.start_date,
                b.end_date,
                b.created_at,
                c.id as category_id,
                c.name as category_name,
                c.color as category_color,
                c.icon as category_icon,
                c.type as category_type
            FROM budgets b
            JOIN categories c ON b.category_id = c.id
            WHERE b.user_id = $1 AND b.period = $2
            ORDER BY b.start_date DESC, c.name ASC
        `, [req.user.id, period]);

        // Calculate spent amount for each budget
        const budgetsWithSpent = await Promise.all(result.rows.map(async (budget) => {
            const spentResult = await pool.query(`
                SELECT COALESCE(SUM(amount), 0) as spent
                FROM transactions t
                WHERE t.category_id = $1 
                AND t.user_id = $2 
                AND t.transaction_date >= $3 
                AND t.transaction_date <= $4
            `, [budget.category_id, req.user.id, budget.start_date, budget.end_date]);

            const spent = parseFloat(spentResult.rows[0].spent);
            const budgetAmount = parseFloat(budget.amount);
            const remaining = budgetAmount - spent;
            const percentage = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;

            return {
                id: budget.id,
                amount: budgetAmount,
                spent,
                remaining,
                percentage: Math.round(percentage * 100) / 100,
                period: budget.period,
                startDate: budget.start_date,
                endDate: budget.end_date,
                createdAt: budget.created_at,
                category: {
                    id: budget.category_id,
                    name: budget.category_name,
                    color: budget.category_color,
                    icon: budget.category_icon,
                    type: budget.category_type
                },
                status: percentage > 100 ? 'over' : percentage > 80 ? 'warning' : 'good'
            };
        }));

        res.json({ budgets: budgetsWithSpent });
    } catch (error) {
        console.error('Error fetching budgets:', error);
        res.status(500).json({ message: 'Error fetching budgets' });
    }
});

// Get budget by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
            SELECT 
                b.id,
                b.amount,
                b.period,
                b.start_date,
                b.end_date,
                b.created_at,
                c.id as category_id,
                c.name as category_name,
                c.color as category_color,
                c.icon as category_icon,
                c.type as category_type
            FROM budgets b
            JOIN categories c ON b.category_id = c.id
            WHERE b.id = $1 AND b.user_id = $2
        `, [id, req.user.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Budget not found' });
        }

        const budget = result.rows[0];

        // Calculate spent amount
        const spentResult = await pool.query(`
            SELECT COALESCE(SUM(amount), 0) as spent
            FROM transactions t
            WHERE t.category_id = $1 
            AND t.user_id = $2 
            AND t.transaction_date >= $3 
            AND t.transaction_date <= $4
        `, [budget.category_id, req.user.id, budget.start_date, budget.end_date]);

        const spent = parseFloat(spentResult.rows[0].spent);
        const budgetAmount = parseFloat(budget.amount);
        const remaining = budgetAmount - spent;
        const percentage = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;

        const budgetWithSpent = {
            id: budget.id,
            amount: budgetAmount,
            spent,
            remaining,
            percentage: Math.round(percentage * 100) / 100,
            period: budget.period,
            startDate: budget.start_date,
            endDate: budget.end_date,
            createdAt: budget.created_at,
            category: {
                id: budget.category_id,
                name: budget.category_name,
                color: budget.category_color,
                icon: budget.category_icon,
                type: budget.category_type
            },
            status: percentage > 100 ? 'over' : percentage > 80 ? 'warning' : 'good'
        };

        res.json({ budget: budgetWithSpent });
    } catch (error) {
        console.error('Error fetching budget:', error);
        res.status(500).json({ message: 'Error fetching budget' });
    }
});

// Create new budget
router.post('/', async (req, res) => {
    try {
        const { categoryId, amount, period = 'monthly', startDate, endDate } = req.body;

        // Validation
        if (!categoryId || !amount || !startDate || !endDate) {
            return res.status(400).json({ 
                message: 'Category, amount, start date, and end date are required' 
            });
        }

        if (parseFloat(amount) <= 0) {
            return res.status(400).json({ message: 'Budget amount must be greater than 0' });
        }

        // Verify category belongs to user and is expense type
        const categoryCheck = await pool.query(
            'SELECT id, type FROM categories WHERE id = $1 AND user_id = $2',
            [categoryId, req.user.id]
        );

        if (categoryCheck.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid category selected' });
        }

        if (categoryCheck.rows[0].type !== 'expense') {
            return res.status(400).json({ message: 'Budgets can only be created for expense categories' });
        }

        // Check for overlapping budget periods for same category
        const overlapCheck = await pool.query(`
            SELECT id FROM budgets 
            WHERE category_id = $1 
            AND user_id = $2 
            AND (
                (start_date <= $3 AND end_date >= $3) OR
                (start_date <= $4 AND end_date >= $4) OR
                (start_date >= $3 AND end_date <= $4)
            )
        `, [categoryId, req.user.id, startDate, endDate]);

        if (overlapCheck.rows.length > 0) {
            return res.status(400).json({ 
                message: 'A budget already exists for this category in the specified time period' 
            });
        }

        // Create budget
        const result = await pool.query(`
            INSERT INTO budgets (category_id, user_id, amount, period, start_date, end_date)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, amount, period, start_date, end_date, created_at
        `, [categoryId, req.user.id, parseFloat(amount), period, startDate, endDate]);

        // Get full budget details with category
        const fullBudget = await pool.query(`
            SELECT 
                b.id,
                b.amount,
                b.period,
                b.start_date,
                b.end_date,
                b.created_at,
                c.id as category_id,
                c.name as category_name,
                c.color as category_color,
                c.icon as category_icon,
                c.type as category_type
            FROM budgets b
            JOIN categories c ON b.category_id = c.id
            WHERE b.id = $1
        `, [result.rows[0].id]);

        const budget = fullBudget.rows[0];

        res.status(201).json({
            message: 'Budget created successfully',
            budget: {
                id: budget.id,
                amount: parseFloat(budget.amount),
                spent: 0,
                remaining: parseFloat(budget.amount),
                percentage: 0,
                period: budget.period,
                startDate: budget.start_date,
                endDate: budget.end_date,
                createdAt: budget.created_at,
                category: {
                    id: budget.category_id,
                    name: budget.category_name,
                    color: budget.category_color,
                    icon: budget.category_icon,
                    type: budget.category_type
                },
                status: 'good'
            }
        });
    } catch (error) {
        console.error('Error creating budget:', error);
        res.status(500).json({ message: 'Error creating budget' });
    }
});

// Update budget
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, period, startDate, endDate } = req.body;

        // Check if budget exists and belongs to user
        const existingBudget = await pool.query(
            'SELECT id, category_id FROM budgets WHERE id = $1 AND user_id = $2',
            [id, req.user.id]
        );

        if (existingBudget.rows.length === 0) {
            return res.status(404).json({ message: 'Budget not found' });
        }

        // Validation
        if (amount !== undefined && parseFloat(amount) <= 0) {
            return res.status(400).json({ message: 'Budget amount must be greater than 0' });
        }

        // Check for overlapping periods if dates are being changed
        if (startDate || endDate) {
            const currentBudget = await pool.query(
                'SELECT start_date, end_date FROM budgets WHERE id = $1',
                [id]
            );

            const newStartDate = startDate || currentBudget.rows[0].start_date;
            const newEndDate = endDate || currentBudget.rows[0].end_date;

            const overlapCheck = await pool.query(`
                SELECT id FROM budgets 
                WHERE category_id = $1 
                AND user_id = $2 
                AND id != $3
                AND (
                    (start_date <= $4 AND end_date >= $4) OR
                    (start_date <= $5 AND end_date >= $5) OR
                    (start_date >= $4 AND end_date <= $5)
                )
            `, [existingBudget.rows[0].category_id, req.user.id, id, newStartDate, newEndDate]);

            if (overlapCheck.rows.length > 0) {
                return res.status(400).json({ 
                    message: 'A budget already exists for this category in the specified time period' 
                });
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

        if (period !== undefined) {
            paramCount++;
            updates.push(`period = $${paramCount}`);
            params.push(period);
        }

        if (startDate !== undefined) {
            paramCount++;
            updates.push(`start_date = $${paramCount}`);
            params.push(startDate);
        }

        if (endDate !== undefined) {
            paramCount++;
            updates.push(`end_date = $${paramCount}`);
            params.push(endDate);
        }

        if (updates.length === 0) {
            return res.status(400).json({ message: 'No valid fields to update' });
        }

        paramCount++;
        params.push(id);
        paramCount++;
        params.push(req.user.id);

        const query = `
            UPDATE budgets 
            SET ${updates.join(', ')} 
            WHERE id = $${paramCount - 1} AND user_id = $${paramCount}
            RETURNING id
        `;

        await pool.query(query, params);

        // Get updated budget with spending info
        const updatedBudget = await pool.query(`
            SELECT 
                b.id,
                b.amount,
                b.period,
                b.start_date,
                b.end_date,
                b.created_at,
                c.id as category_id,
                c.name as category_name,
                c.color as category_color,
                c.icon as category_icon,
                c.type as category_type
            FROM budgets b
            JOIN categories c ON b.category_id = c.id
            WHERE b.id = $1
        `, [id]);

        const budget = updatedBudget.rows[0];

        // Calculate spent amount
        const spentResult = await pool.query(`
            SELECT COALESCE(SUM(amount), 0) as spent
            FROM transactions t
            WHERE t.category_id = $1 
            AND t.user_id = $2 
            AND t.transaction_date >= $3 
            AND t.transaction_date <= $4
        `, [budget.category_id, req.user.id, budget.start_date, budget.end_date]);

        const spent = parseFloat(spentResult.rows[0].spent);
        const budgetAmount = parseFloat(budget.amount);
        const remaining = budgetAmount - spent;
        const percentage = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;

        res.json({
            message: 'Budget updated successfully',
            budget: {
                id: budget.id,
                amount: budgetAmount,
                spent,
                remaining,
                percentage: Math.round(percentage * 100) / 100,
                period: budget.period,
                startDate: budget.start_date,
                endDate: budget.end_date,
                createdAt: budget.created_at,
                category: {
                    id: budget.category_id,
                    name: budget.category_name,
                    color: budget.category_color,
                    icon: budget.category_icon,
                    type: budget.category_type
                },
                status: percentage > 100 ? 'over' : percentage > 80 ? 'warning' : 'good'
            }
        });
    } catch (error) {
        console.error('Error updating budget:', error);
        res.status(500).json({ message: 'Error updating budget' });
    }
});

// Delete budget
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM budgets WHERE id = $1 AND user_id = $2 RETURNING id',
            [id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Budget not found' });
        }

        res.json({ message: 'Budget deleted successfully' });
    } catch (error) {
        console.error('Error deleting budget:', error);
        res.status(500).json({ message: 'Error deleting budget' });
    }
});

module.exports = router;