import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('login');
  const [loading, setLoading] = useState(true);

  // Check for existing token on app load
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token with backend
      fetch('https://expensetracker-a20g.onrender.com/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(response => response.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
          setCurrentView('dashboard');
        } else {
          localStorage.removeItem('token');
        }
      })
      .catch(() => {
        localStorage.removeItem('token');
      })
      .finally(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setCurrentView('login');
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="App">
      {user && (
        <nav style={{ 
          padding: '1rem', 
          backgroundColor: '#2563eb', 
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>ExpenseTracker</h1>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button 
              className="btn"
              onClick={() => setCurrentView('dashboard')}
              style={{ 
                backgroundColor: currentView === 'dashboard' ? '#1d4ed8' : 'transparent',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.2)'
              }}
            >
              Dashboard
            </button>
            <button 
              className="btn"
              onClick={() => setCurrentView('transactions')}
              style={{ 
                backgroundColor: currentView === 'transactions' ? '#1d4ed8' : 'transparent',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.2)'
              }}
            >
              Transactions
            </button>
            <button 
              className="btn"
              onClick={() => setCurrentView('categories')}
              style={{ 
                backgroundColor: currentView === 'categories' ? '#1d4ed8' : 'transparent',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.2)'
              }}
            >
              Categories
            </button>
            <span style={{ marginLeft: '1rem' }}>Hi, {user.firstName}!</span>
            <button 
              className="btn btn-secondary" 
              onClick={handleLogout}
              style={{ marginLeft: '1rem' }}
            >
              Logout
            </button>
          </div>
        </nav>
      )}

      <main style={{ padding: user ? '2rem' : '0', minHeight: 'calc(100vh - 80px)' }}>
        {currentView === 'login' && <LoginRegisterForm onLogin={handleLogin} />}
        {currentView === 'dashboard' && <Dashboard user={user} />}
        {currentView === 'transactions' && <Transactions user={user} />}
        {currentView === 'categories' && <Categories user={user} />}
      </main>
    </div>
  );
}

// Combined Login/Register Form
function LoginRegisterForm({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const body = isLogin 
        ? { email, password }
        : { email, password, firstName, lastName };

      const response = await fetch(`https://expensetracker-a20g.onrender.com${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        onLogin(data.user);
      } else {
        setError(data.message || 'Authentication failed');
      }
    } catch (error) {
      setError('Network error. Please check if the server is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      backgroundColor: '#f8fafc'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px', margin: '2rem' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '2rem', color: '#1f2937' }}>
          {isLogin ? 'Login to ExpenseTracker' : 'Create Account'}
        </h2>
        
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  First Name
                </label>
                <input
                  className="input"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required={!isLogin}
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Last Name
                </label>
                <input
                  className="input"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required={!isLogin}
                />
              </div>
            </>
          )}
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
              Email
            </label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
              Password
            </label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div style={{ 
              color: '#ef4444', 
              backgroundColor: '#fef2f2', 
              border: '1px solid #fecaca',
              padding: '0.75rem', 
              borderRadius: '0.375rem',
              marginBottom: '1rem',
              fontSize: '0.875rem'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', marginBottom: '1rem' }}
          >
            {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Create Account')}
          </button>
        </form>

        <div style={{ textAlign: 'center' }}>
          {isLogin && (
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
              Demo: test@example.com / password123
            </p>
          )}
          <p style={{ margin: 0, color: '#6b7280' }}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#2563eb',
                cursor: 'pointer',
                textDecoration: 'underline',
                fontSize: 'inherit'
              }}
            >
              {isLogin ? 'Sign up' : 'Login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

// Dashboard Component
function Dashboard({ user }) {
  const [stats, setStats] = useState({ income: 0, expenses: 0, balance: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('https://expensetracker-a20g.onrender.com/api/transactions/stats/summary', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.summary) {
        setStats(data.summary);
      }
    })
    .catch(error => {
      console.error('Error fetching stats:', error);
    })
    .finally(() => {
      setLoading(false);
    });
  }, []);

  return (
    <div className="container">
      <h1 style={{ marginBottom: '2rem', color: '#1f2937' }}>
        Welcome back, {user.firstName}!
      </h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card" style={{ textAlign: 'center', backgroundColor: '#10b981', color: 'white' }}>
          <h3 style={{ margin: '0 0 0.5rem 0' }}>Total Income</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>
            ${loading ? '...' : stats.income.toFixed(2)}
          </p>
        </div>
        
        <div className="card" style={{ textAlign: 'center', backgroundColor: '#ef4444', color: 'white' }}>
          <h3 style={{ margin: '0 0 0.5rem 0' }}>Total Expenses</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>
            ${loading ? '...' : stats.expenses.toFixed(2)}
          </p>
        </div>
        
        <div className="card" style={{ textAlign: 'center', backgroundColor: stats.balance >= 0 ? '#2563eb' : '#f59e0b', color: 'white' }}>
          <h3 style={{ margin: '0 0 0.5rem 0' }}>Net Balance</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>
            ${loading ? '...' : stats.balance.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Quick Actions</h2>
        <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
          Your expense tracker is connected and ready to use!
        </p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button className="btn btn-primary">Add Transaction</button>
          <button className="btn btn-secondary">View Reports</button>
          <button className="btn btn-secondary">Manage Categories</button>
        </div>
      </div>
    </div>
  );
}

// Full Transaction Management Component
function Transactions({ user }) {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState({ income: [], expense: [] });
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [filter, setFilter] = useState('all');
  
  // Form state
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    transactionDate: new Date().toISOString().split('T')[0],
    categoryId: ''
  });

  const token = localStorage.getItem('token');

  // Fetch data on component mount
  useEffect(() => {
    Promise.all([
      fetch('https://expensetracker-a20g.onrender.com/api/transactions', {
        headers: { 'Authorization': `Bearer ${token}` }
      }),
      fetch('https://expensetracker-a20g.onrender.com/api/categories', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
    ])
    .then(async ([transRes, catRes]) => {
      const transData = await transRes.json();
      const catData = await catRes.json();
      
      if (transData.transactions) setTransactions(transData.transactions);
      if (catData.categories) setCategories(catData.categories);
    })
    .catch(error => console.error('Error fetching data:', error))
    .finally(() => setLoading(false));
  }, [token]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const method = editingTransaction ? 'PUT' : 'POST';
      const url = editingTransaction 
        ? `https://expensetracker-a20g.onrender.com/api/transactions/${editingTransaction.id}`
        : 'https://expensetracker-a20g.onrender.com/api/transactions';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        if (editingTransaction) {
          setTransactions(transactions.map(t => 
            t.id === editingTransaction.id ? data.transaction : t
          ));
          setEditingTransaction(null);
        } else {
          setTransactions([data.transaction, ...transactions]);
        }
        
        setFormData({
          amount: '',
          description: '',
          transactionDate: new Date().toISOString().split('T')[0],
          categoryId: ''
        });
        setShowAddForm(false);
      }
    } catch (error) {
      console.error('Error saving transaction:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;

    try {
      const response = await fetch(`https://expensetracker-a20g.onrender.com/api/transactions/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setTransactions(transactions.filter(t => t.id !== id));
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  // Handle edit
  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      amount: transaction.amount.toString(),
      description: transaction.description,
      transactionDate: transaction.transaction_date,
      categoryId: transaction.category_id || ''
    });
    setShowAddForm(true);
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(t => {
    if (filter === 'all') return true;
    return t.category_type === filter;
  });

  if (loading && transactions.length === 0) {
    return <div className="container"><div className="card">Loading...</div></div>;
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Transactions</h1>
        <button 
          className="btn btn-primary" 
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Cancel' : 'Add Transaction'}
        </button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3>{editingTransaction ? 'Edit Transaction' : 'Add New Transaction'}</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Amount ($)
                </label>
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Date
                </label>
                <input
                  className="input"
                  type="date"
                  value={formData.transactionDate}
                  onChange={(e) => setFormData({...formData, transactionDate: e.target.value})}
                  required
                />
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Description
              </label>
              <input
                className="input"
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                required
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Category
              </label>
              <select
                className="input"
                value={formData.categoryId}
                onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
                required
              >
                <option value="">Select a category</option>
                <optgroup label="Income">
                  {categories.income.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </optgroup>
                <optgroup label="Expenses">
                  {categories.expense.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : (editingTransaction ? 'Update' : 'Add Transaction')}
              </button>
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingTransaction(null);
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Buttons */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ fontWeight: '500' }}>Filter:</span>
          <button 
            className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button 
            className={`btn ${filter === 'income' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter('income')}
          >
            Income
          </button>
          <button 
            className={`btn ${filter === 'expense' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter('expense')}
          >
            Expenses
          </button>
        </div>
      </div>

      {/* Transaction List */}
      <div className="card">
        <h3>Transaction History ({filteredTransactions.length})</h3>
        {filteredTransactions.length === 0 ? (
          <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>
            No transactions found. Add your first transaction above!
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '600' }}>Date</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '600' }}>Description</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '600' }}>Category</th>
                  <th style={{ textAlign: 'right', padding: '0.75rem', fontWeight: '600' }}>Amount</th>
                  <th style={{ textAlign: 'center', padding: '0.75rem', fontWeight: '600' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map(transaction => (
                  <tr key={transaction.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '0.75rem' }}>
                      {new Date(transaction.transaction_date).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '0.75rem' }}>{transaction.description}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span 
                        style={{ 
                          backgroundColor: transaction.category_color || '#e5e7eb',
                          color: 'white',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem'
                        }}
                      >
                        {transaction.category_name || 'Uncategorized'}
                      </span>
                    </td>
                    <td style={{ 
                      padding: '0.75rem', 
                      textAlign: 'right',
                      color: transaction.category_type === 'income' ? '#10b981' : '#ef4444',
                      fontWeight: '600'
                    }}>
                      {transaction.category_type === 'income' ? '+' : '-'}${parseFloat(transaction.amount).toFixed(2)}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button
                          className="btn"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          onClick={() => handleEdit(transaction)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn"
                          style={{ 
                            padding: '0.25rem 0.5rem', 
                            fontSize: '0.75rem',
                            backgroundColor: '#ef4444',
                            color: 'white'
                          }}
                          onClick={() => handleDelete(transaction.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// Complete Category Management Component
function Categories({ user }) {
  const [categories, setCategories] = useState({ income: [], expense: [] });
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [selectedType, setSelectedType] = useState('expense');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    color: '#3B82F6',
    icon: 'dollar-sign',
    type: 'expense'
  });

  const token = localStorage.getItem('token');

  // Color options for categories
  const colorOptions = [
    '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', 
    '#EC4899', '#6B7280', '#059669', '#0EA5E9', '#6366F1'
  ];

  // Icon options
  const iconOptions = [
    'dollar-sign', 'utensils', 'car', 'shopping-bag', 'film', 
    'file-text', 'heart', 'briefcase', 'laptop', 'plus-circle'
  ];

  // Fetch categories
  useEffect(() => {
    fetch('https://expensetracker-a20g.onrender.com/api/categories', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => response.json())
    .then(data => {
      if (data.categories) {
        setCategories(data.categories);
      }
    })
    .catch(error => console.error('Error fetching categories:', error))
    .finally(() => setLoading(false));
  }, [token]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const method = editingCategory ? 'PUT' : 'POST';
      const url = editingCategory 
        ? `https://expensetracker-a20g.onrender.com/api/categories/${editingCategory.id}`
        : 'https://expensetracker-a20g.onrender.com/api/categories';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        if (editingCategory) {
          // Update existing category
          setCategories(prev => ({
            ...prev,
            [formData.type]: prev[formData.type].map(cat => 
              cat.id === editingCategory.id ? data.category : cat
            )
          }));
          setEditingCategory(null);
        } else {
          // Add new category
          setCategories(prev => ({
            ...prev,
            [formData.type]: [...prev[formData.type], data.category]
          }));
        }
        
        setFormData({
          name: '',
          color: '#3B82F6',
          icon: 'dollar-sign',
          type: 'expense'
        });
        setShowAddForm(false);
      } else {
        alert(data.message || 'Error saving category');
      }
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (id, type) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;

    try {
      const response = await fetch(`https://expensetracker-a20g.onrender.com/api/categories/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (response.ok) {
        setCategories(prev => ({
          ...prev,
          [type]: prev[type].filter(cat => cat.id !== id)
        }));
      } else {
        alert(data.message || 'Error deleting category');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Network error. Please try again.');
    }
  };

  // Handle edit
  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      color: category.color,
      icon: category.icon,
      type: category.type
    });
    setShowAddForm(true);
  };

  if (loading && categories.income.length === 0 && categories.expense.length === 0) {
    return <div className="container"><div className="card">Loading...</div></div>;
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Categories</h1>
        <button 
          className="btn btn-primary" 
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Cancel' : 'Add Category'}
        </button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3>{editingCategory ? 'Edit Category' : 'Add New Category'}</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Category Name
                </label>
                <input
                  className="input"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g., Groceries, Rent, Salary"
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Type
                </label>
                <select
                  className="input"
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  required
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Color
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {colorOptions.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({...formData, color})}
                    style={{
                      width: '40px',
                      height: '40px',
                      backgroundColor: color,
                      border: formData.color === color ? '3px solid #000' : '1px solid #ccc',
                      borderRadius: '0.5rem',
                      cursor: 'pointer'
                    }}
                  />
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Icon
              </label>
              <select
                className="input"
                value={formData.icon}
                onChange={(e) => setFormData({...formData, icon: e.target.value})}
              >
                {iconOptions.map(icon => (
                  <option key={icon} value={icon}>{icon}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : (editingCategory ? 'Update Category' : 'Add Category')}
              </button>
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingCategory(null);
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Type Filter */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ fontWeight: '500' }}>Show:</span>
          <button 
            className={`btn ${selectedType === 'expense' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSelectedType('expense')}
          >
            Expense Categories ({categories.expense.length})
          </button>
          <button 
            className={`btn ${selectedType === 'income' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSelectedType('income')}
          >
            Income Categories ({categories.income.length})
          </button>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="card">
        <h3 style={{ textTransform: 'capitalize' }}>{selectedType} Categories</h3>
        {categories[selectedType].length === 0 ? (
          <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>
            No {selectedType} categories found. Add your first one above!
          </p>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
            gap: '1rem',
            marginTop: '1rem'
          }}>
            {categories[selectedType].map(category => (
              <div 
                key={category.id}
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  backgroundColor: '#fff'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div
                    style={{
                      width: '30px',
                      height: '30px',
                      backgroundColor: category.color,
                      borderRadius: '0.25rem',
                      marginRight: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '0.75rem'
                    }}
                  >
                    {category.icon.charAt(0)}
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>
                      {category.name}
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#6b7280' }}>
                      {category.icon}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  <button
                    className="btn"
                    style={{ 
                      padding: '0.25rem 0.75rem', 
                      fontSize: '0.75rem',
                      backgroundColor: '#f3f4f6',
                      color: '#374151'
                    }}
                    onClick={() => handleEdit(category)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn"
                    style={{ 
                      padding: '0.25rem 0.75rem', 
                      fontSize: '0.75rem',
                      backgroundColor: '#ef4444',
                      color: 'white'
                    }}
                    onClick={() => handleDelete(category.id, category.type)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;