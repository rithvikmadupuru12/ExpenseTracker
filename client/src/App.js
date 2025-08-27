import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('login');
  const [loading, setLoading] = useState(true);
  const [animationClass, setAnimationClass] = useState('');

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
    setAnimationClass('fade-in');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setCurrentView('login');
    setAnimationClass('fade-out');
  };

  const handleViewChange = (view) => {
    setAnimationClass('slide-out');
    setTimeout(() => {
      setCurrentView(view);
      setAnimationClass('slide-in');
    }, 200);
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="App">
      {user && (
        <nav style={{ 
          padding: '1rem 2rem', 
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <h1 style={{ margin: 0, fontSize: '1.8rem' }}>💎 WealthFlow</h1>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button 
              className="btn btn-ghost"
              onClick={() => handleViewChange('dashboard')}
              style={{ 
                backgroundColor: currentView === 'dashboard' ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              📊 Dashboard
            </button>
            <button 
              className="btn btn-ghost"
              onClick={() => handleViewChange('transactions')}
              style={{ 
                backgroundColor: currentView === 'transactions' ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              💳 Transactions
            </button>
            <button 
              className="btn btn-ghost"
              onClick={() => handleViewChange('categories')}
              style={{ 
                backgroundColor: currentView === 'categories' ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              📁 Categories
            </button>
            <span style={{ 
              marginLeft: '2rem',
              padding: '0.5rem 1rem',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '20px',
              fontSize: '0.9rem'
            }}>
              Hi, {user.firstName}! ✨
            </span>
            <button 
              className="btn btn-secondary" 
              onClick={handleLogout}
              style={{ marginLeft: '0.5rem' }}
            >
              Logout
            </button>
          </div>
        </nav>
      )}

      <main style={{ 
        padding: user ? '2rem' : '0', 
        minHeight: 'calc(100vh - 80px)',
        className: animationClass 
      }}>
        {currentView === 'login' && <LoginRegisterForm onLogin={handleLogin} />}
        {currentView === 'dashboard' && <Dashboard user={user} setCurrentView={setCurrentView} />}
        {currentView === 'transactions' && <Transactions user={user} />}
        {currentView === 'categories' && <Categories user={user} />}
      </main>
    </div>
  );
}

// Enhanced Login/Register Form
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
      minHeight: '100vh'
    }}>
      <div className="card auth-card" style={{ width: '100%', maxWidth: '450px', margin: '2rem' }}>
        <h2 style={{ 
          textAlign: 'center', 
          marginBottom: '0.5rem', 
          fontSize: '2.5rem',
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: '800'
        }}>
          💎 WealthFlow
        </h2>
        <p style={{ 
          textAlign: 'center', 
          marginBottom: '2rem', 
          color: '#64748b',
          fontSize: '1rem'
        }}>
          {isLogin ? 'Welcome back to your financial journey' : 'Start your wealth management journey'}
        </p>
        
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#475569' }}>
                  First Name
                </label>
                <input
                  className="input"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  required={!isLogin}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#475569' }}>
                  Last Name
                </label>
                <input
                  className="input"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  required={!isLogin}
                />
              </div>
            </div>
          )}
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#475569' }}>
              Email Address
            </label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#475569' }}>
              Password
            </label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', marginBottom: '1rem', fontSize: '1rem', padding: '0.75rem' }}
          >
            {loading ? <span className="loading-spinner" style={{width: '20px', height: '20px'}}></span> : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div style={{ textAlign: 'center' }}>
          <p style={{ margin: 0, color: '#64748b' }}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              style={{
                border: 'none',
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: 'inherit'
              }}
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

// Enhanced Dashboard Component - FIXED: Now receives setCurrentView as prop
function Dashboard({ user, setCurrentView }) {
  const [stats, setStats] = useState({ income: 0, expenses: 0, balance: 0 });
  const [loading, setLoading] = useState(true);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    // Fetch stats
    Promise.all([
      fetch('https://expensetracker-a20g.onrender.com/api/transactions/stats/summary', {
        headers: { 'Authorization': `Bearer ${token}` }
      }),
      fetch('https://expensetracker-a20g.onrender.com/api/transactions', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
    ])
    .then(async ([statsRes, transRes]) => {
      const statsData = await statsRes.json();
      const transData = await transRes.json();
      
      if (statsData.summary) {
        setStats(statsData.summary);
      }
      if (transData.transactions) {
        setRecentTransactions(transData.transactions.slice(0, 5));
      }
      
      // Generate chart data
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      setChartData(months.map(month => ({
        month,
        amount: Math.random() * 2000 + 1000
      })));
    })
    .catch(error => {
      console.error('Error fetching data:', error);
    })
    .finally(() => {
      setLoading(false);
    });
  }, []);

  return (
    <div className="container">
      <h1 style={{ 
        marginBottom: '2rem', 
        color: 'white',
        fontSize: '2.5rem',
        fontWeight: '700'
      }}>
        Welcome back, {user.firstName}! 👋
      </h1>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '1.5rem', 
        marginBottom: '2rem' 
      }}>
        <div className="card stat-card" style={{ 
          background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)', 
          color: 'white' 
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '2rem' }}>💰</span>
            <span style={{ 
              background: 'rgba(255,255,255,0.2)', 
              padding: '0.25rem 0.75rem',
              borderRadius: '20px',
              fontSize: '0.85rem'
            }}>+12%</span>
          </div>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', opacity: 0.9 }}>Total Income</h3>
          <p style={{ fontSize: '2.2rem', fontWeight: 'bold', margin: 0 }}>
            ${loading ? '...' : stats.income.toFixed(2)}
          </p>
        </div>
        
        <div className="card stat-card" style={{ 
          background: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)', 
          color: 'white' 
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '2rem' }}>💸</span>
            <span style={{ 
              background: 'rgba(255,255,255,0.2)', 
              padding: '0.25rem 0.75rem',
              borderRadius: '20px',
              fontSize: '0.85rem'
            }}>+8%</span>
          </div>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', opacity: 0.9 }}>Total Expenses</h3>
          <p style={{ fontSize: '2.2rem', fontWeight: 'bold', margin: 0 }}>
            ${loading ? '...' : stats.expenses.toFixed(2)}
          </p>
        </div>
        
        <div className="card stat-card" style={{ 
          background: stats.balance >= 0 
            ? 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)' 
            : 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)', 
          color: 'white' 
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '2rem' }}>💎</span>
            <span style={{ 
              background: 'rgba(255,255,255,0.2)', 
              padding: '0.25rem 0.75rem',
              borderRadius: '20px',
              fontSize: '0.85rem'
            }}>{stats.balance >= 0 ? '+' : '-'}5%</span>
          </div>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', opacity: 0.9 }}>Net Balance</h3>
          <p style={{ fontSize: '2.2rem', fontWeight: 'bold', margin: 0 }}>
            ${loading ? '...' : stats.balance.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Monthly Spending Trend</h2>
        <div style={{ 
          height: '250px',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-around',
          padding: '20px 0'
        }}>
          {chartData.map((data, index) => (
            <div key={index} style={{ 
              width: '60px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px'
            }}>
              <div style={{
                width: '100%',
                height: `${(data.amount / 3000) * 200}px`,
                background: 'linear-gradient(to top, #667eea, #764ba2)',
                borderRadius: '8px 8px 0 0',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                position: 'relative'
              }}
              onMouseEnter={(e) => e.target.style.transform = 'scaleY(1.05)'}
              onMouseLeave={(e) => e.target.style.transform = 'scaleY(1)'}
              >
                <span style={{
                  position: 'absolute',
                  top: '-25px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  color: '#667eea'
                }}>
                  ${data.amount.toFixed(0)}
                </span>
              </div>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{data.month}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ marginTop: 0 }}>Recent Transactions</h2>
          <button className="btn btn-primary" onClick={() => setCurrentView('transactions')}>
            View All →
          </button>
        </div>
        
        {recentTransactions.length > 0 ? (
          <div>
            {recentTransactions.map(transaction => (
              <div key={transaction.id} className="transaction-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: '45px',
                    height: '45px',
                    background: `${transaction.category_color}20`,
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.3rem'
                  }}>
                    {transaction.category_icon || '💰'}
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1rem' }}>{transaction.description}</h4>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                      {transaction.category_name || 'Uncategorized'}
                    </p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{
                    margin: 0,
                    fontSize: '1.2rem',
                    fontWeight: '600',
                    color: transaction.category_type === 'income' ? '#10b981' : '#ef4444'
                  }}>
                    {transaction.category_type === 'income' ? '+' : '-'}${parseFloat(transaction.amount).toFixed(2)}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                    {new Date(transaction.transaction_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>
            No transactions yet. Add your first transaction!
          </p>
        )}
      </div>

      <div className="card" style={{ marginTop: '2rem' }}>
        <h2 style={{ marginTop: 0 }}>Quick Actions</h2>
        <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
          Manage your finances with these quick shortcuts
        </p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button className="btn btn-primary">➕ Add Transaction</button>
          <button className="btn btn-secondary">📊 View Reports</button>
          <button className="btn btn-secondary">📁 Manage Categories</button>
          <button className="btn btn-secondary">🎯 Set Budget</button>
          <button className="btn btn-secondary">💾 Export Data</button>
        </div>
      </div>
    </div>
  );
}

// Enhanced Transactions Component
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

  // Icons for categories (for visual enhancement)
  const categoryIcons = {
    'Food': '🍔',
    'Transportation': '🚗',
    'Entertainment': '🎬',
    'Shopping': '🛍️',
    'Bills': '📄',
    'Healthcare': '🏥',
    'Salary': '💰',
    'Freelance': '💼',
    'Investments': '📈'
  };

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

  const filteredTransactions = transactions.filter(t => {
    if (filter === 'all') return true;
    return t.category_type === filter;
  });

  if (loading && transactions.length === 0) {
    return (
      <div className="container">
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ color: 'white', fontSize: '2.5rem' }}>Transactions</h1>
        <button 
          className="btn btn-primary" 
          onClick={() => setShowAddForm(!showAddForm)}
          style={{ fontSize: '1rem', padding: '0.75rem 1.5rem' }}
        >
          {showAddForm ? '✕ Cancel' : '➕ Add Transaction'}
        </button>
      </div>

      {showAddForm && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginTop: 0 }}>{editingTransaction ? '✏️ Edit Transaction' : '➕ Add New Transaction'}</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Amount ($)
                </label>
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
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
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                Description
              </label>
              <input
                className="input"
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="What was this transaction for?"
                required
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                Category
              </label>
              <select
                className="input"
                value={formData.categoryId}
                onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
                required
                style={{ cursor: 'pointer' }}
              >
                <option value="">Select a category</option>
                <optgroup label="💰 Income">
                  {categories.income.map(cat => (
                    <option key={cat.id} value={cat.id}>{categoryIcons[cat.name] || '💰'} {cat.name}</option>
                  ))}
                </optgroup>
                <optgroup label="💸 Expenses">
                  {categories.expense.map(cat => (
                    <option key={cat.id} value={cat.id}>{categoryIcons[cat.name] || '💸'} {cat.name}</option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : (editingTransaction ? '💾 Update' : '➕ Add Transaction')}
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

      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: '600' }}>Filter:</span>
          <button 
            className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter('all')}
          >
            All ({transactions.length})
          </button>
          <button 
            className={`btn ${filter === 'income' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter('income')}
            style={{ background: filter === 'income' ? 'linear-gradient(135deg, #10b981, #34d399)' : '' }}
          >
            💰 Income
          </button>
          <button 
            className={`btn ${filter === 'expense' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter('expense')}
            style={{ background: filter === 'expense' ? 'linear-gradient(135deg, #ef4444, #f87171)' : '' }}
          >
            💸 Expenses
          </button>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Transaction History ({filteredTransactions.length})</h3>
        {filteredTransactions.length === 0 ? (
          <p style={{ color: '#64748b', textAlign: 'center', padding: '3rem' }}>
            No transactions found. Add your first transaction above!
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '1rem' }}>Date</th>
                  <th style={{ textAlign: 'left', padding: '1rem' }}>Description</th>
                  <th style={{ textAlign: 'left', padding: '1rem' }}>Category</th>
                  <th style={{ textAlign: 'right', padding: '1rem' }}>Amount</th>
                  <th style={{ textAlign: 'center', padding: '1rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map(transaction => (
                  <tr key={transaction.id}>
                    <td style={{ padding: '1rem' }}>
                      {new Date(transaction.transaction_date).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '1rem', fontWeight: '500' }}>{transaction.description}</td>
                    <td style={{ padding: '1rem' }}>
                      <span 
                        style={{ 
                          backgroundColor: `${transaction.category_color}20` || 'rgba(229, 231, 235, 0.5)',
                          color: transaction.category_color || '#64748b',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '20px',
                          fontSize: '0.85rem',
                          fontWeight: '600'
                        }}
                      >
                        {categoryIcons[transaction.category_name] || '📁'} {transaction.category_name || 'Uncategorized'}
                      </span>
                    </td>
                    <td style={{ 
                      padding: '1rem', 
                      textAlign: 'right',
                      color: transaction.category_type === 'income' ? '#10b981' : '#ef4444',
                      fontWeight: '700',
                      fontSize: '1.1rem'
                    }}>
                      {transaction.category_type === 'income' ? '+' : '-'}${parseFloat(transaction.amount).toFixed(2)}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button
                          className="btn"
                          style={{ 
                            padding: '0.5rem 1rem', 
                            fontSize: '0.85rem',
                            background: 'linear-gradient(135deg, #667eea, #764ba2)'
                          }}
                          onClick={() => handleEdit(transaction)}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          className="btn"
                          style={{ 
                            padding: '0.5rem 1rem', 
                            fontSize: '0.85rem',
                            background: 'linear-gradient(135deg, #ef4444, #f87171)',
                            color: 'white'
                          }}
                          onClick={() => handleDelete(transaction.id)}
                        >
                          🗑️ Delete
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

// Enhanced Categories Component
function Categories({ user }) {
  const [categories, setCategories] = useState({ income: [], expense: [] });
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [selectedType, setSelectedType] = useState('expense');

  const [formData, setFormData] = useState({
    name: '',
    color: '#667eea',
    icon: '📁',
    type: 'expense'
  });

  const token = localStorage.getItem('token');

  const colorOptions = [
    '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', 
    '#ec4899', '#6b7280', '#059669', '#0ea5e9', '#6366f1'
  ];

  const iconOptions = [
    '💰', '🍔', '🚗', '🛍️', '🎬', 
    '📄', '🏥', '💼', '💻', '📈'
  ];

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
          setCategories(prev => ({
            ...prev,
            [formData.type]: prev[formData.type].map(cat => 
              cat.id === editingCategory.id ? data.category : cat
            )
          }));
          setEditingCategory(null);
        } else {
          setCategories(prev => ({
            ...prev,
            [formData.type]: [...prev[formData.type], data.category]
          }));
        }
        
        setFormData({
          name: '',
          color: '#667eea',
          icon: '📁',
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
    return (
      <div className="container">
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ color: 'white', fontSize: '2.5rem' }}>Categories</h1>
        <button 
          className="btn btn-primary" 
          onClick={() => setShowAddForm(!showAddForm)}
          style={{ fontSize: '1rem', padding: '0.75rem 1.5rem' }}
        >
          {showAddForm ? '✕ Cancel' : '➕ Add Category'}
        </button>
      </div>

      {showAddForm && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginTop: 0 }}>{editingCategory ? '✏️ Edit Category' : '➕ Add New Category'}</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
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
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Type
                </label>
                <select
                  className="input"
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  required
                  style={{ cursor: 'pointer' }}
                >
                  <option value="expense">💸 Expense</option>
                  <option value="income">💰 Income</option>
                </select>
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                Color
              </label>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {colorOptions.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({...formData, color})}
                    style={{
                      width: '45px',
                      height: '45px',
                      backgroundColor: color,
                      border: formData.color === color ? '3px solid #1f2937' : '2px solid #e5e7eb',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      transform: formData.color === color ? 'scale(1.1)' : 'scale(1)'
                    }}
                  />
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                Icon
              </label>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {iconOptions.map(icon => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setFormData({...formData, icon})}
                    style={{
                      width: '45px',
                      height: '45px',
                      backgroundColor: formData.icon === icon ? 'rgba(102, 126, 234, 0.1)' : '#f8fafc',
                      border: formData.icon === icon ? '2px solid #667eea' : '2px solid #e5e7eb',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      fontSize: '1.5rem',
                      transition: 'all 0.2s ease',
                      transform: formData.icon === icon ? 'scale(1.1)' : 'scale(1)'
                    }}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : (editingCategory ? '💾 Update Category' : '➕ Add Category')}
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

      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: '600' }}>Show:</span>
          <button 
            className={`btn ${selectedType === 'expense' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSelectedType('expense')}
            style={{ background: selectedType === 'expense' ? 'linear-gradient(135deg, #ef4444, #f87171)' : '' }}
          >
            💸 Expense Categories ({categories.expense.length})
          </button>
          <button 
            className={`btn ${selectedType === 'income' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSelectedType('income')}
            style={{ background: selectedType === 'income' ? 'linear-gradient(135deg, #10b981, #34d399)' : '' }}
          >
            💰 Income Categories ({categories.income.length})
          </button>
        </div>
      </div>

      <div className="card">
        <h3 style={{ textTransform: 'capitalize', marginTop: 0 }}>
          {selectedType === 'income' ? '💰' : '💸'} {selectedType} Categories
        </h3>
        {categories[selectedType].length === 0 ? (
          <p style={{ color: '#64748b', textAlign: 'center', padding: '3rem' }}>
            No {selectedType} categories found. Add your first one above!
          </p>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
            gap: '1rem',
            marginTop: '1.5rem'
          }}>
            {categories[selectedType].map(category => (
              <div 
                key={category.id}
                className="category-card"
              >
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                  <div
                    style={{
                      width: '50px',
                      height: '50px',
                      background: `linear-gradient(135deg, ${category.color}30, ${category.color}10)`,
                      borderRadius: '15px',
                      marginRight: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem'
                    }}
                  >
                    {category.icon || '📁'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600', color: '#1f2937' }}>
                      {category.name}
                    </h4>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                      {selectedType === 'income' ? 'Income' : 'Expense'} Category
                    </p>
                  </div>
                </div>
                <div style={{ 
                  display: 'flex', 
                  gap: '0.5rem', 
                  paddingTop: '1rem',
                  borderTop: '1px solid #e5e7eb'
                }}>
                  <button
                    className="btn"
                    style={{ 
                      flex: 1,
                      padding: '0.5rem', 
                      fontSize: '0.85rem',
                      background: 'linear-gradient(135deg, #667eea, #764ba2)'
                    }}
                    onClick={() => handleEdit(category)}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    className="btn"
                    style={{ 
                      flex: 1,
                      padding: '0.5rem', 
                      fontSize: '0.85rem',
                      background: 'linear-gradient(135deg, #ef4444, #f87171)',
                      color: 'white'
                    }}
                    onClick={() => handleDelete(category.id, category.type)}
                  >
                    🗑️ Delete
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