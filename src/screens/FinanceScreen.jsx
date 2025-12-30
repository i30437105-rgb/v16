import React, { useState, useEffect } from 'react';
import { Wallet, TrendingUp, TrendingDown, Plus, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, PiggyBank, Edit3, Trash2, X, Check, PieChart, BarChart2 } from 'lucide-react';
import { COLORS } from '../constants';
import { Modal } from '../components/ui';

// ============================================
// КОНСТАНТЫ
// ============================================
const DEFAULT_INCOME_CATEGORIES = [
  { id: 'cat_salary', name: 'Зарплата', type: 'income', icon: '💼', color: '#27AE60' },
  { id: 'cat_freelance', name: 'Фриланс', type: 'income', icon: '💻', color: '#3498DB' },
  { id: 'cat_other_income', name: 'Прочие доходы', type: 'income', icon: '💰', color: '#9B59B6' },
];

const DEFAULT_EXPENSE_CATEGORIES = [
  { id: 'cat_food', name: 'Еда', type: 'expense', icon: '🍽️', color: '#E74C3C' },
  { id: 'cat_transport', name: 'Транспорт', type: 'expense', icon: '🚗', color: '#3498DB' },
  { id: 'cat_housing', name: 'Жильё', type: 'expense', icon: '🏠', color: '#9B59B6' },
  { id: 'cat_entertainment', name: 'Развлечения', type: 'expense', icon: '🎮', color: '#E67E22' },
  { id: 'cat_other_expense', name: 'Прочее', type: 'expense', icon: '📦', color: '#95A5A6' },
];

const DEFAULT_FUNDS = [
  { id: 'fund_emergency', name: 'Подушка безопасности', icon: '🛡️', balance: 0, ruleType: 'percent', ruleValue: 10 },
  { id: 'fund_vacation', name: 'Отпуск', icon: '✈️', balance: 0, ruleType: 'fixed', ruleValue: 5000 },
];

const PERIOD_TYPES = [
  { id: 'month', label: 'Месяц' },
  { id: 'quarter', label: 'Квартал' },
  { id: 'year', label: 'Год' },
];

const CATEGORY_ICONS = ['💼', '💻', '💰', '🍽️', '🚗', '🏠', '🎮', '📦', '👕', '💊', '📚', '🎁', '✈️', '🛒', '📱', '🔧', '💡', '🏋️', '🎵', '☕'];
const CATEGORY_COLORS = ['#E74C3C', '#3498DB', '#27AE60', '#9B59B6', '#E67E22', '#1ABC9C', '#F39C12', '#95A5A6', '#34495E', '#16A085'];
const FUND_ICONS = ['🛡️', '✈️', '🏠', '🎓', '🚗', '💍', '🎁', '📱', '👶', '🏥', '💼', '🎯'];

const CHART_VIEWS = [
  { id: 'pie', label: 'Круговая', icon: PieChart },
  { id: 'bar', label: 'Столбцы', icon: BarChart2 },
];

// ============================================
// УТИЛИТЫ
// ============================================
const formatMoney = (amount) => {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(amount);
};

const getPeriodLabel = (periodType, date) => {
  const months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
  const d = new Date(date);
  if (periodType === 'month') return `${months[d.getMonth()]} ${d.getFullYear()}`;
  if (periodType === 'quarter') return `${Math.floor(d.getMonth() / 3) + 1} квартал ${d.getFullYear()}`;
  return `${d.getFullYear()} год`;
};

const isInPeriod = (txnDate, periodType, periodDate) => {
  const d = new Date(txnDate);
  const p = new Date(periodDate);
  if (periodType === 'month') return d.getMonth() === p.getMonth() && d.getFullYear() === p.getFullYear();
  if (periodType === 'quarter') return Math.floor(d.getMonth() / 3) === Math.floor(p.getMonth() / 3) && d.getFullYear() === p.getFullYear();
  return d.getFullYear() === p.getFullYear();
};

const navigatePeriod = (periodType, date, direction) => {
  const d = new Date(date);
  if (periodType === 'month') d.setMonth(d.getMonth() + direction);
  else if (periodType === 'quarter') d.setMonth(d.getMonth() + direction * 3);
  else d.setFullYear(d.getFullYear() + direction);
  return d;
};

// ============================================
// КРУГОВАЯ ДИАГРАММА
// ============================================
const PieChartComponent = ({ data, total }) => {
  if (!data.length || total === 0) return null;
  let cumulativePercent = 0;
  
  return (
    <div style={{ position: 'relative', width: '160px', height: '160px', margin: '0 auto' }}>
      <svg viewBox="0 0 32 32" style={{ transform: 'rotate(-90deg)' }}>
        {data.map((item, i) => {
          const percent = (item.amount / total) * 100;
          const strokeDasharray = `${percent} ${100 - percent}`;
          const strokeDashoffset = -cumulativePercent;
          cumulativePercent += percent;
          return (
            <circle key={i} r="16" cx="16" cy="16" fill="transparent" stroke={item.color} strokeWidth="6" strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset} style={{ transition: 'stroke-dasharray 0.3s' }} />
          );
        })}
      </svg>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
        <p style={{ fontSize: '14px', fontWeight: '600', color: COLORS.text }}>{formatMoney(total)}</p>
      </div>
    </div>
  );
};

// ============================================
// СТОЛБЧАТАЯ ДИАГРАММА
// ============================================
const BarChartComponent = ({ data }) => {
  const max = Math.max(...data.map(d => d.amount), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '120px', padding: '10px 0' }}>
      {data.map((item, i) => {
        const height = (item.amount / max) * 100;
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '100%', height: '80px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
              <div style={{ width: '100%', maxWidth: '40px', height: `${Math.max(height, 2)}%`, background: item.color, borderRadius: '4px 4px 0 0' }} />
            </div>
            <span style={{ fontSize: '16px' }}>{item.icon}</span>
          </div>
        );
      })}
    </div>
  );
};

// ============================================
// ФОРМА КАТЕГОРИИ
// ============================================
const CategoryForm = ({ type, existingCategory, onSave, onClose, onDelete }) => {
  const [name, setName] = useState(existingCategory?.name || '');
  const [icon, setIcon] = useState(existingCategory?.icon || CATEGORY_ICONS[0]);
  const [color, setColor] = useState(existingCategory?.color || CATEGORY_COLORS[0]);

  const inputStyle = { width: '100%', padding: '14px 16px', background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: '12px', color: COLORS.text, fontSize: '16px', outline: 'none' };
  const labelStyle = { display: 'block', fontSize: '12px', color: COLORS.textMuted, marginBottom: '8px', textTransform: 'uppercase' };

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ id: existingCategory?.id || `cat_${Date.now()}`, name, icon, color, type });
  };

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>Название *</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Название категории" style={inputStyle} />
      </div>
      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>Иконка</label>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {CATEGORY_ICONS.map((i) => (
            <button key={i} onClick={() => setIcon(i)} style={{ width: '40px', height: '40px', background: icon === i ? `${color}30` : COLORS.bg, border: `2px solid ${icon === i ? color : COLORS.border}`, borderRadius: '8px', fontSize: '18px', cursor: 'pointer' }}>{i}</button>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>Цвет</label>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {CATEGORY_COLORS.map((c) => (
            <button key={c} onClick={() => setColor(c)} style={{ width: '32px', height: '32px', background: c, border: `3px solid ${color === c ? COLORS.text : 'transparent'}`, borderRadius: '50%', cursor: 'pointer' }} />
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '12px' }}>
        {existingCategory && <button onClick={() => onDelete(existingCategory.id)} style={{ padding: '16px', background: `${COLORS.danger}20`, border: `1px solid ${COLORS.danger}50`, borderRadius: '12px', color: COLORS.danger, cursor: 'pointer' }}><Trash2 style={{ width: '18px', height: '18px' }} /></button>}
        <button onClick={onClose} style={{ flex: 1, padding: '16px', background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: '12px', color: COLORS.text, fontSize: '15px', cursor: 'pointer' }}>Отмена</button>
        <button onClick={handleSave} disabled={!name.trim()} style={{ flex: 1, padding: '16px', background: name.trim() ? COLORS.gold : COLORS.bgCard, border: 'none', borderRadius: '12px', color: name.trim() ? COLORS.bg : COLORS.textDark, fontSize: '15px', fontWeight: '600', cursor: name.trim() ? 'pointer' : 'not-allowed' }}>Сохранить</button>
      </div>
    </div>
  );
};

// ============================================
// ФОРМА ТРАНЗАКЦИИ
// ============================================
const TransactionForm = ({ categories, funds, existingTransaction, onSave, onClose, onDelete, onManageCategories }) => {
  const [type, setType] = useState(existingTransaction?.type || 'expense');
  const [amount, setAmount] = useState(existingTransaction?.amount?.toString() || '');
  const [categoryId, setCategoryId] = useState(existingTransaction?.categoryId || '');
  const [comment, setComment] = useState(existingTransaction?.comment || '');
  const [date, setDate] = useState(existingTransaction?.date || new Date().toISOString().split('T')[0]);
  const [fundId, setFundId] = useState(existingTransaction?.fundId || '');

  const filteredCategories = categories.filter(c => c.type === type);
  const inputStyle = { width: '100%', padding: '14px 16px', background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: '12px', color: COLORS.text, fontSize: '16px', outline: 'none' };
  const labelStyle = { display: 'block', fontSize: '12px', color: COLORS.textMuted, marginBottom: '8px', textTransform: 'uppercase' };

  const handleSave = () => {
    if (!amount || !categoryId) return;
    onSave({ id: existingTransaction?.id || `txn_${Date.now()}`, type, amount: parseFloat(amount), categoryId, comment, date, fundId: type === 'expense' ? fundId : null, createdAt: existingTransaction?.createdAt || new Date().toISOString() });
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button onClick={() => setType('income')} style={{ flex: 1, padding: '14px', background: type === 'income' ? `${COLORS.success}20` : COLORS.bg, border: `1px solid ${type === 'income' ? COLORS.success : COLORS.border}`, borderRadius: '12px', color: type === 'income' ? COLORS.success : COLORS.textMuted, fontSize: '15px', fontWeight: '500', cursor: 'pointer' }}>Доход</button>
        <button onClick={() => setType('expense')} style={{ flex: 1, padding: '14px', background: type === 'expense' ? `${COLORS.danger}20` : COLORS.bg, border: `1px solid ${type === 'expense' ? COLORS.danger : COLORS.border}`, borderRadius: '12px', color: type === 'expense' ? COLORS.danger : COLORS.textMuted, fontSize: '15px', fontWeight: '500', cursor: 'pointer' }}>Расход</button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>Сумма *</label>
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" style={{ ...inputStyle, fontSize: '24px', textAlign: 'center', fontWeight: '600' }} />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <label style={{ ...labelStyle, marginBottom: 0 }}>Категория *</label>
          <button onClick={() => onManageCategories(type)} style={{ fontSize: '12px', color: COLORS.gold, background: 'none', border: 'none', cursor: 'pointer' }}>Управление</button>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {filteredCategories.map((c) => (
            <button key={c.id} onClick={() => setCategoryId(c.id)} style={{ padding: '10px 14px', background: categoryId === c.id ? `${c.color}20` : COLORS.bg, border: `1px solid ${categoryId === c.id ? c.color : COLORS.border}`, borderRadius: '20px', color: categoryId === c.id ? c.color : COLORS.textMuted, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>{c.icon}</span>{c.name}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>Дата</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />
      </div>

      {type === 'expense' && funds.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>Списать из фонда</label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button onClick={() => setFundId('')} style={{ padding: '10px 14px', background: !fundId ? `${COLORS.gold}20` : COLORS.bg, border: `1px solid ${!fundId ? COLORS.gold : COLORS.border}`, borderRadius: '20px', color: !fundId ? COLORS.gold : COLORS.textMuted, fontSize: '13px', cursor: 'pointer' }}>Без фонда</button>
            {funds.map((f) => (
              <button key={f.id} onClick={() => setFundId(f.id)} style={{ padding: '10px 14px', background: fundId === f.id ? `${COLORS.gold}20` : COLORS.bg, border: `1px solid ${fundId === f.id ? COLORS.gold : COLORS.border}`, borderRadius: '20px', color: fundId === f.id ? COLORS.gold : COLORS.textMuted, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>{f.icon}</span>{f.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>Комментарий</label>
        <input type="text" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Описание" style={inputStyle} />
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        {existingTransaction && <button onClick={() => onDelete(existingTransaction.id)} style={{ padding: '16px', background: `${COLORS.danger}20`, border: `1px solid ${COLORS.danger}50`, borderRadius: '12px', color: COLORS.danger, cursor: 'pointer' }}><Trash2 style={{ width: '18px', height: '18px' }} /></button>}
        <button onClick={onClose} style={{ flex: 1, padding: '16px', background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: '12px', color: COLORS.text, fontSize: '15px', cursor: 'pointer' }}>Отмена</button>
        <button onClick={handleSave} disabled={!amount || !categoryId} style={{ flex: 1, padding: '16px', background: (amount && categoryId) ? COLORS.gold : COLORS.bgCard, border: 'none', borderRadius: '12px', color: (amount && categoryId) ? COLORS.bg : COLORS.textDark, fontSize: '15px', fontWeight: '600', cursor: (amount && categoryId) ? 'pointer' : 'not-allowed' }}>Сохранить</button>
      </div>
    </div>
  );
};

// ============================================
// ФОРМА ФОНДА
// ============================================
const FundForm = ({ existingFund, onSave, onClose, onDelete }) => {
  const [name, setName] = useState(existingFund?.name || '');
  const [icon, setIcon] = useState(existingFund?.icon || '🛡️');
  const [ruleType, setRuleType] = useState(existingFund?.ruleType || 'percent');
  const [ruleValue, setRuleValue] = useState(existingFund?.ruleValue?.toString() || '');

  const inputStyle = { width: '100%', padding: '14px 16px', background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: '12px', color: COLORS.text, fontSize: '16px', outline: 'none' };
  const labelStyle = { display: 'block', fontSize: '12px', color: COLORS.textMuted, marginBottom: '8px', textTransform: 'uppercase' };

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ id: existingFund?.id || `fund_${Date.now()}`, name, icon, ruleType, ruleValue: ruleValue ? parseFloat(ruleValue) : null, balance: existingFund?.balance || 0, createdAt: existingFund?.createdAt || new Date().toISOString() });
  };

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>Название *</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Название фонда" style={inputStyle} />
      </div>
      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>Иконка</label>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {FUND_ICONS.map((i) => (
            <button key={i} onClick={() => setIcon(i)} style={{ width: '44px', height: '44px', background: icon === i ? `${COLORS.gold}30` : COLORS.bg, border: `2px solid ${icon === i ? COLORS.gold : COLORS.border}`, borderRadius: '10px', fontSize: '20px', cursor: 'pointer' }}>{i}</button>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>Правило пополнения</label>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <button onClick={() => setRuleType('percent')} style={{ flex: 1, padding: '12px', background: ruleType === 'percent' ? `${COLORS.gold}20` : COLORS.bg, border: `1px solid ${ruleType === 'percent' ? COLORS.gold : COLORS.border}`, borderRadius: '10px', color: ruleType === 'percent' ? COLORS.gold : COLORS.textMuted, fontSize: '13px', cursor: 'pointer' }}>% от дохода</button>
          <button onClick={() => setRuleType('fixed')} style={{ flex: 1, padding: '12px', background: ruleType === 'fixed' ? `${COLORS.gold}20` : COLORS.bg, border: `1px solid ${ruleType === 'fixed' ? COLORS.gold : COLORS.border}`, borderRadius: '10px', color: ruleType === 'fixed' ? COLORS.gold : COLORS.textMuted, fontSize: '13px', cursor: 'pointer' }}>Фикс. сумма</button>
          <button onClick={() => setRuleType('choice')} style={{ flex: 1, padding: '12px', background: ruleType === 'choice' ? `${COLORS.gold}20` : COLORS.bg, border: `1px solid ${ruleType === 'choice' ? COLORS.gold : COLORS.border}`, borderRadius: '10px', color: ruleType === 'choice' ? COLORS.gold : COLORS.textMuted, fontSize: '13px', cursor: 'pointer' }}>Вручную</button>
        </div>
        {ruleType !== 'choice' && <input type="number" value={ruleValue} onChange={(e) => setRuleValue(e.target.value)} placeholder={ruleType === 'percent' ? 'Процент' : 'Сумма'} style={inputStyle} />}
      </div>
      <div style={{ display: 'flex', gap: '12px' }}>
        {existingFund && <button onClick={() => onDelete(existingFund.id)} style={{ padding: '16px', background: `${COLORS.danger}20`, border: `1px solid ${COLORS.danger}50`, borderRadius: '12px', color: COLORS.danger, cursor: 'pointer' }}><Trash2 style={{ width: '18px', height: '18px' }} /></button>}
        <button onClick={onClose} style={{ flex: 1, padding: '16px', background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: '12px', color: COLORS.text, fontSize: '15px', cursor: 'pointer' }}>Отмена</button>
        <button onClick={handleSave} disabled={!name.trim()} style={{ flex: 1, padding: '16px', background: name.trim() ? COLORS.gold : COLORS.bgCard, border: 'none', borderRadius: '12px', color: name.trim() ? COLORS.bg : COLORS.textDark, fontSize: '15px', fontWeight: '600', cursor: name.trim() ? 'pointer' : 'not-allowed' }}>Сохранить</button>
      </div>
    </div>
  );
};

// ============================================
// ЭКРАН ФИНАНСОВ
// ============================================
export const FinanceScreen = ({ data, saveData }) => {
  const [periodType, setPeriodType] = useState('month');
  const [periodDate, setPeriodDate] = useState(new Date());
  const [fundsExpanded, setFundsExpanded] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [showFundForm, setShowFundForm] = useState(false);
  const [editingFund, setEditingFund] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [detailsType, setDetailsType] = useState('expense');
  const [chartView, setChartView] = useState('pie');
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryFormType, setCategoryFormType] = useState('expense');
  const [showCategoryManager, setShowCategoryManager] = useState(false);

  useEffect(() => {
    if (!data.financeCategories) {
      saveData({ ...data, financeCategories: [...DEFAULT_INCOME_CATEGORIES, ...DEFAULT_EXPENSE_CATEGORIES], funds: DEFAULT_FUNDS, transactions: [] });
    }
  }, [data, saveData]);

  const categories = data.financeCategories || [...DEFAULT_INCOME_CATEGORIES, ...DEFAULT_EXPENSE_CATEGORIES];
  const funds = data.funds || DEFAULT_FUNDS;
  const transactions = data.transactions || [];

  const periodTransactions = transactions.filter(t => isInPeriod(t.date, periodType, periodDate));
  const totalIncome = periodTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = periodTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;
  const totalFundsBalance = funds.reduce((sum, f) => sum + f.balance, 0);

  // Группировка по категориям
  const getGroupedByCategory = (type) => {
    const filtered = periodTransactions.filter(t => t.type === type);
    const grouped = {};
    filtered.forEach(t => {
      if (!grouped[t.categoryId]) grouped[t.categoryId] = { transactions: [], total: 0 };
      grouped[t.categoryId].transactions.push(t);
      grouped[t.categoryId].total += t.amount;
    });
    return Object.entries(grouped).map(([catId, data]) => {
      const cat = categories.find(c => c.id === catId) || { name: 'Без категории', icon: '📦', color: '#95A5A6' };
      return { ...cat, ...data };
    }).sort((a, b) => b.total - a.total);
  };

  const handleSaveTransaction = (transaction) => {
    const existingIndex = transactions.findIndex(t => t.id === transaction.id);
    let newTransactions, newFunds = [...funds];

    if (transaction.type === 'income' && !existingIndex) {
      newFunds = funds.map(f => {
        let addition = 0;
        if (f.ruleType === 'percent' && f.ruleValue) addition = (transaction.amount * f.ruleValue) / 100;
        else if (f.ruleType === 'fixed' && f.ruleValue) addition = f.ruleValue;
        return { ...f, balance: f.balance + addition };
      });
    } else if (transaction.fundId) {
      newFunds = funds.map(f => f.id === transaction.fundId ? { ...f, balance: Math.max(0, f.balance - transaction.amount) } : f);
    }

    if (existingIndex >= 0) {
      newTransactions = [...transactions];
      newTransactions[existingIndex] = transaction;
    } else {
      newTransactions = [...transactions, transaction];
    }

    saveData({ ...data, transactions: newTransactions, funds: newFunds });
    setShowTransactionForm(false);
    setEditingTransaction(null);
  };

  const handleDeleteTransaction = (id) => {
    saveData({ ...data, transactions: transactions.filter(t => t.id !== id) });
    setShowTransactionForm(false);
    setEditingTransaction(null);
  };

  const handleSaveFund = (fund) => {
    const existingIndex = funds.findIndex(f => f.id === fund.id);
    const newFunds = existingIndex >= 0 ? funds.map((f, i) => i === existingIndex ? fund : f) : [...funds, fund];
    saveData({ ...data, funds: newFunds });
    setShowFundForm(false);
    setEditingFund(null);
  };

  const handleDeleteFund = (id) => {
    saveData({ ...data, funds: funds.filter(f => f.id !== id) });
    setShowFundForm(false);
    setEditingFund(null);
  };

  const handleSaveCategory = (category) => {
    const existingIndex = categories.findIndex(c => c.id === category.id);
    const newCategories = existingIndex >= 0 ? categories.map((c, i) => i === existingIndex ? category : c) : [...categories, category];
    saveData({ ...data, financeCategories: newCategories });
    setShowCategoryForm(false);
    setEditingCategory(null);
  };

  const handleDeleteCategory = (id) => {
    saveData({ ...data, financeCategories: categories.filter(c => c.id !== id) });
    setShowCategoryForm(false);
    setEditingCategory(null);
  };

  const chartData = getGroupedByCategory(detailsType).map(g => ({ icon: g.icon, color: g.color, amount: g.total }));

  return (
    <div style={{ minHeight: '100vh', background: COLORS.bg, paddingBottom: '100px' }}>
      <div style={{ padding: '20px', paddingTop: '60px', background: `linear-gradient(to bottom, ${COLORS.bgCard} 0%, ${COLORS.bg} 100%)` }}>
        {/* Выбор типа периода */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {PERIOD_TYPES.map((p) => (
            <button key={p.id} onClick={() => setPeriodType(p.id)} style={{ flex: 1, padding: '10px', background: periodType === p.id ? `${COLORS.gold}20` : COLORS.bg, border: `1px solid ${periodType === p.id ? COLORS.gold : COLORS.border}`, borderRadius: '10px', color: periodType === p.id ? COLORS.gold : COLORS.textMuted, fontSize: '13px', cursor: 'pointer' }}>{p.label}</button>
          ))}
        </div>

        {/* Навигация по периоду */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <button onClick={() => setPeriodDate(navigatePeriod(periodType, periodDate, -1))} style={{ padding: '8px', background: 'none', border: 'none', cursor: 'pointer' }}>
            <ChevronLeft style={{ width: '24px', height: '24px', color: COLORS.textMuted }} />
          </button>
          <h1 style={{ fontSize: '20px', fontWeight: '600', color: COLORS.text, fontFamily: 'Georgia, serif' }}>{getPeriodLabel(periodType, periodDate)}</h1>
          <button onClick={() => setPeriodDate(navigatePeriod(periodType, periodDate, 1))} style={{ padding: '8px', background: 'none', border: 'none', cursor: 'pointer' }}>
            <ChevronRight style={{ width: '24px', height: '24px', color: COLORS.textMuted }} />
          </button>
        </div>

        {/* Карточки доход/расход */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <button onClick={() => { setDetailsType('income'); setShowDetails(true); }} style={{ flex: 1, padding: '16px', background: `${COLORS.success}15`, borderRadius: '16px', border: `1px solid ${COLORS.success}30`, cursor: 'pointer', textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <TrendingUp style={{ width: '18px', height: '18px', color: COLORS.success }} />
              <span style={{ fontSize: '12px', color: COLORS.textMuted }}>Доходы</span>
            </div>
            <p style={{ fontSize: '20px', fontWeight: '600', color: COLORS.success }}>{formatMoney(totalIncome)}</p>
          </button>
          <button onClick={() => { setDetailsType('expense'); setShowDetails(true); }} style={{ flex: 1, padding: '16px', background: `${COLORS.danger}15`, borderRadius: '16px', border: `1px solid ${COLORS.danger}30`, cursor: 'pointer', textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <TrendingDown style={{ width: '18px', height: '18px', color: COLORS.danger }} />
              <span style={{ fontSize: '12px', color: COLORS.textMuted }}>Расходы</span>
            </div>
            <p style={{ fontSize: '20px', fontWeight: '600', color: COLORS.danger }}>{formatMoney(totalExpense)}</p>
          </button>
        </div>

        {/* Баланс */}
        <div style={{ padding: '16px', background: COLORS.bg, borderRadius: '14px', border: `1px solid ${COLORS.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '14px', color: COLORS.textMuted }}>Баланс</span>
            <span style={{ fontSize: '24px', fontWeight: '600', color: balance >= 0 ? COLORS.success : COLORS.danger }}>{formatMoney(balance)}</span>
          </div>
        </div>
      </div>

      <div style={{ padding: '20px' }}>
        {/* Фонды сворачиваемые */}
        <button onClick={() => setFundsExpanded(!fundsExpanded)} style={{ width: '100%', padding: '14px', background: `${COLORS.gold}15`, borderRadius: '12px', border: `1px solid ${COLORS.gold}30`, marginBottom: fundsExpanded ? '12px' : '0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <PiggyBank style={{ width: '20px', height: '20px', color: COLORS.gold }} />
            <span style={{ fontSize: '14px', color: COLORS.text }}>Фонды</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '16px', fontWeight: '600', color: COLORS.gold }}>{formatMoney(totalFundsBalance)}</span>
            {fundsExpanded ? <ChevronUp style={{ width: '18px', height: '18px', color: COLORS.textMuted }} /> : <ChevronDown style={{ width: '18px', height: '18px', color: COLORS.textMuted }} />}
          </div>
        </button>

        {fundsExpanded && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
            {funds.map((f) => (
              <div key={f.id} style={{ padding: '14px', background: COLORS.bgCard, borderRadius: '12px', border: `1px solid ${COLORS.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '24px' }}>{f.icon}</span>
                  <div>
                    <p style={{ fontSize: '14px', color: COLORS.text, fontWeight: '500' }}>{f.name}</p>
                    <p style={{ fontSize: '11px', color: COLORS.textMuted, marginTop: '2px' }}>{f.ruleType === 'percent' ? `${f.ruleValue}% от дохода` : f.ruleType === 'fixed' ? `${formatMoney(f.ruleValue)} с дохода` : 'Вручную'}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '16px', fontWeight: '600', color: COLORS.gold }}>{formatMoney(f.balance)}</span>
                  <button onClick={() => { setEditingFund(f); setShowFundForm(true); }} style={{ padding: '6px', background: 'none', border: 'none', cursor: 'pointer' }}><Edit3 style={{ width: '16px', height: '16px', color: COLORS.textMuted }} /></button>
                </div>
              </div>
            ))}
            <button onClick={() => { setEditingFund(null); setShowFundForm(true); }} style={{ padding: '12px', background: COLORS.bg, border: `1px dashed ${COLORS.border}`, borderRadius: '12px', color: COLORS.textMuted, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><Plus style={{ width: '16px', height: '16px' }} />Добавить фонд</button>
          </div>
        )}

        {/* Операции за период */}
        <div style={{ marginTop: fundsExpanded ? '0' : '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '600', color: COLORS.text }}>Операции за {getPeriodLabel(periodType, periodDate).toLowerCase()}</h2>
            <button onClick={() => { setDetailsType('expense'); setShowDetails(true); }} style={{ fontSize: '13px', color: COLORS.gold, background: 'none', border: 'none', cursor: 'pointer' }}>Подробно →</button>
          </div>

          {periodTransactions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <Wallet style={{ width: '48px', height: '48px', color: COLORS.textDark, margin: '0 auto 16px' }} />
              <p style={{ color: COLORS.textMuted, fontSize: '14px' }}>Нет операций</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {periodTransactions.slice(-5).reverse().map((t) => {
                const category = categories.find(c => c.id === t.categoryId);
                return (
                  <button key={t.id} onClick={() => { setEditingTransaction(t); setShowTransactionForm(true); }} style={{ padding: '12px 14px', background: COLORS.bgCard, borderRadius: '10px', border: `1px solid ${COLORS.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '20px' }}>{category?.icon || '📦'}</span>
                      <div style={{ textAlign: 'left' }}>
                        <p style={{ fontSize: '14px', color: COLORS.text }}>{category?.name || 'Без категории'}</p>
                        {t.comment && <p style={{ fontSize: '11px', color: COLORS.textMuted, marginTop: '2px' }}>{t.comment}</p>}
                      </div>
                    </div>
                    <span style={{ fontSize: '15px', fontWeight: '600', color: t.type === 'income' ? COLORS.success : COLORS.danger }}>{t.type === 'income' ? '+' : '-'}{formatMoney(t.amount)}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* FAB */}
      <button onClick={() => { setEditingTransaction(null); setShowTransactionForm(true); }} style={{ position: 'fixed', right: '20px', bottom: '100px', width: '56px', height: '56px', background: `linear-gradient(135deg, ${COLORS.goldDark} 0%, ${COLORS.gold} 100%)`, border: 'none', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: `0 8px 24px ${COLORS.gold}40` }}>
        <Plus style={{ width: '24px', height: '24px', color: COLORS.bg }} />
      </button>

      {/* Модалка транзакции */}
      <Modal isOpen={showTransactionForm} onClose={() => { setShowTransactionForm(false); setEditingTransaction(null); }} title={editingTransaction ? 'Редактировать' : 'Новая операция'}>
        <TransactionForm categories={categories} funds={funds} existingTransaction={editingTransaction} onSave={handleSaveTransaction} onClose={() => { setShowTransactionForm(false); setEditingTransaction(null); }} onDelete={handleDeleteTransaction} onManageCategories={(type) => { setCategoryFormType(type); setShowCategoryManager(true); }} />
      </Modal>

      {/* Модалка фонда */}
      <Modal isOpen={showFundForm} onClose={() => { setShowFundForm(false); setEditingFund(null); }} title={editingFund ? 'Редактировать фонд' : 'Новый фонд'}>
        <FundForm existingFund={editingFund} onSave={handleSaveFund} onClose={() => { setShowFundForm(false); setEditingFund(null); }} onDelete={handleDeleteFund} />
      </Modal>

      {/* Модалка категории */}
      <Modal isOpen={showCategoryForm} onClose={() => { setShowCategoryForm(false); setEditingCategory(null); }} title={editingCategory ? 'Редактировать категорию' : 'Новая категория'}>
        <CategoryForm type={categoryFormType} existingCategory={editingCategory} onSave={handleSaveCategory} onClose={() => { setShowCategoryForm(false); setEditingCategory(null); }} onDelete={handleDeleteCategory} />
      </Modal>

      {/* Модалка управления категориями */}
      <Modal isOpen={showCategoryManager} onClose={() => setShowCategoryManager(false)} title="Управление категориями">
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button onClick={() => setCategoryFormType('income')} style={{ flex: 1, padding: '10px', background: categoryFormType === 'income' ? `${COLORS.success}20` : COLORS.bg, border: `1px solid ${categoryFormType === 'income' ? COLORS.success : COLORS.border}`, borderRadius: '10px', color: categoryFormType === 'income' ? COLORS.success : COLORS.textMuted, fontSize: '13px', cursor: 'pointer' }}>Доходы</button>
          <button onClick={() => setCategoryFormType('expense')} style={{ flex: 1, padding: '10px', background: categoryFormType === 'expense' ? `${COLORS.danger}20` : COLORS.bg, border: `1px solid ${categoryFormType === 'expense' ? COLORS.danger : COLORS.border}`, borderRadius: '10px', color: categoryFormType === 'expense' ? COLORS.danger : COLORS.textMuted, fontSize: '13px', cursor: 'pointer' }}>Расходы</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {categories.filter(c => c.type === categoryFormType).map((c) => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: COLORS.bg, borderRadius: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '20px' }}>{c.icon}</span>
                <span style={{ fontSize: '14px', color: COLORS.text }}>{c.name}</span>
              </div>
              <button onClick={() => { setEditingCategory(c); setShowCategoryForm(true); setShowCategoryManager(false); }} style={{ padding: '6px', background: 'none', border: 'none', cursor: 'pointer' }}><Edit3 style={{ width: '16px', height: '16px', color: COLORS.textMuted }} /></button>
            </div>
          ))}
          <button onClick={() => { setEditingCategory(null); setShowCategoryForm(true); setShowCategoryManager(false); }} style={{ padding: '12px', background: COLORS.bg, border: `1px dashed ${COLORS.border}`, borderRadius: '10px', color: COLORS.textMuted, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><Plus style={{ width: '16px', height: '16px' }} />Добавить категорию</button>
        </div>
      </Modal>

      {/* Модалка подробно (графики) */}
      <Modal isOpen={showDetails} onClose={() => setShowDetails(false)} title="Подробно">
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button onClick={() => setDetailsType('expense')} style={{ flex: 1, padding: '10px', background: detailsType === 'expense' ? `${COLORS.danger}20` : COLORS.bg, border: `1px solid ${detailsType === 'expense' ? COLORS.danger : COLORS.border}`, borderRadius: '10px', color: detailsType === 'expense' ? COLORS.danger : COLORS.textMuted, fontSize: '13px', cursor: 'pointer' }}>Расходы</button>
          <button onClick={() => setDetailsType('income')} style={{ flex: 1, padding: '10px', background: detailsType === 'income' ? `${COLORS.success}20` : COLORS.bg, border: `1px solid ${detailsType === 'income' ? COLORS.success : COLORS.border}`, borderRadius: '10px', color: detailsType === 'income' ? COLORS.success : COLORS.textMuted, fontSize: '13px', cursor: 'pointer' }}>Доходы</button>
        </div>

        <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
          {CHART_VIEWS.map((v) => (
            <button key={v.id} onClick={() => setChartView(v.id)} style={{ flex: 1, padding: '8px', background: chartView === v.id ? `${COLORS.gold}20` : COLORS.bg, border: `1px solid ${chartView === v.id ? COLORS.gold : COLORS.border}`, borderRadius: '8px', color: chartView === v.id ? COLORS.gold : COLORS.textMuted, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}><v.icon style={{ width: '14px', height: '14px' }} />{v.label}</button>
          ))}
        </div>

        <div style={{ marginBottom: '20px' }}>
          {chartView === 'pie' ? (
            <PieChartComponent data={chartData} total={detailsType === 'expense' ? totalExpense : totalIncome} />
          ) : (
            <BarChartComponent data={chartData} />
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
          {getGroupedByCategory(detailsType).map((group) => (
            <CategoryGroup key={group.id} group={group} categories={categories} onEditTransaction={(t) => { setEditingTransaction(t); setShowTransactionForm(true); setShowDetails(false); }} />
          ))}
        </div>
      </Modal>
    </div>
  );
};

// Группа категорий с разворачиванием
const CategoryGroup = ({ group, categories, onEditTransaction }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{ background: COLORS.bgCard, borderRadius: '12px', border: `1px solid ${COLORS.border}`, overflow: 'hidden' }}>
      <button onClick={() => setExpanded(!expanded)} style={{ width: '100%', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', background: `${group.color}20`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>{group.icon}</div>
          <div style={{ textAlign: 'left' }}>
            <p style={{ fontSize: '14px', color: COLORS.text, fontWeight: '500' }}>{group.name}</p>
            <p style={{ fontSize: '11px', color: COLORS.textMuted }}>{group.transactions.length} операций</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '15px', fontWeight: '600', color: group.color }}>{formatMoney(group.total)}</span>
          {expanded ? <ChevronUp style={{ width: '16px', height: '16px', color: COLORS.textMuted }} /> : <ChevronDown style={{ width: '16px', height: '16px', color: COLORS.textMuted }} />}
        </div>
      </button>
      {expanded && (
        <div style={{ borderTop: `1px solid ${COLORS.border}`, padding: '8px' }}>
          {group.transactions.map((t) => (
            <button key={t.id} onClick={() => onEditTransaction(t)} style={{ width: '100%', padding: '10px', display: 'flex', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '8px' }}>
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontSize: '13px', color: COLORS.text }}>{t.comment || 'Без комментария'}</p>
                <p style={{ fontSize: '11px', color: COLORS.textMuted }}>{new Date(t.date).toLocaleDateString('ru-RU')}</p>
              </div>
              <span style={{ fontSize: '14px', color: group.color }}>{formatMoney(t.amount)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
