import React, { useState, useEffect } from 'react';
import { CheckSquare, Plus, Clock, Calendar, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Edit3, Check, X, Trash2, Target, Flag, AlertCircle, ThumbsUp, ThumbsDown, Minus, Repeat } from 'lucide-react';
import { COLORS } from '../constants';
import { Modal } from '../components/ui';

// ============================================
// КОНСТАНТЫ
// ============================================
const ACTION_PRIORITIES = [
  { id: 'can_wait', label: 'Подождёт', color: COLORS.textMuted },
  { id: 'not_important', label: 'Обычная', color: COLORS.textMuted },
  { id: 'important', label: 'Важная', color: COLORS.yellow },
  { id: 'critical', label: 'Критичная', color: COLORS.danger },
  { id: 'urgent', label: 'Срочная', color: COLORS.red },
];

const REPEAT_TYPES = [
  { id: 'none', label: 'Нет' },
  { id: 'daily', label: 'Ежедневно' },
  { id: 'weekly', label: 'Еженедельно' },
  { id: 'monthly', label: 'Ежемесячно' },
  { id: 'weekdays', label: 'По будням' },
  { id: 'custom', label: 'Свой интервал' },
];

const STRENGTH_OPTIONS = [
  { id: 'positive', icon: ThumbsUp, label: 'Полезная', color: COLORS.success },
  { id: 'neutral', icon: Minus, label: 'Нейтральная', color: COLORS.textMuted },
  { id: 'negative', icon: ThumbsDown, label: 'Вредная', color: COLORS.danger },
];

// ============================================
// УТИЛИТЫ
// ============================================
const formatDateKey = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const formatDateDisplay = (date) => {
  const d = new Date(date);
  const today = new Date();
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  
  if (formatDateKey(d) === formatDateKey(today)) return 'Сегодня';
  if (formatDateKey(d) === formatDateKey(tomorrow)) return 'Завтра';
  if (formatDateKey(d) === formatDateKey(yesterday)) return 'Вчера';
  
  const weekdays = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  const months = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  return `${weekdays[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`;
};

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const getDaysUntil = (deadline) => {
  if (!deadline) return null;
  const now = new Date();
  const dl = new Date(deadline);
  const diff = Math.ceil((dl - now) / (1000 * 60 * 60 * 24));
  return diff;
};

// ============================================
// ФОРМА ДЕЙСТВИЯ
// ============================================
const ActionForm = ({ steps, goals, spheres, selectedDate, existingAction, onSave, onClose, onDelete }) => {
  const [title, setTitle] = useState(existingAction?.title || '');
  const [description, setDescription] = useState(existingAction?.description || '');
  const [date, setDate] = useState(existingAction?.date || formatDateKey(selectedDate));
  const [time, setTime] = useState(existingAction?.time || '');
  const [deadline, setDeadline] = useState(existingAction?.deadline || '');
  const [priority, setPriority] = useState(existingAction?.priority || 'not_important');
  const [strength, setStrength] = useState(existingAction?.strength || 'neutral');
  const [stepId, setStepId] = useState(existingAction?.stepId || '');
  const [repeatType, setRepeatType] = useState(existingAction?.repeatType || 'none');
  const [repeatInterval, setRepeatInterval] = useState(existingAction?.repeatInterval || 1);
  const [subtasks, setSubtasks] = useState(existingAction?.subtasks || []);
  const [newSubtask, setNewSubtask] = useState('');
  const [showStepPicker, setShowStepPicker] = useState(false);

  const inputStyle = { width: '100%', padding: '14px 16px', background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: '12px', color: COLORS.text, fontSize: '16px', outline: 'none' };
  const labelStyle = { display: 'block', fontSize: '12px', color: COLORS.textMuted, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' };

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;
    setSubtasks([...subtasks, { id: `subtask_${Date.now()}`, title: newSubtask.trim(), isCompleted: false }]);
    setNewSubtask('');
  };

  const handleToggleSubtask = (id) => {
    setSubtasks(subtasks.map(s => s.id === id ? { ...s, isCompleted: !s.isCompleted } : s));
  };

  const handleDeleteSubtask = (id) => {
    setSubtasks(subtasks.filter(s => s.id !== id));
  };

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({
      id: existingAction?.id || `action_${Date.now()}`,
      title, description, date: date || null, time: time || null, deadline: deadline || null,
      priority, strength, stepId: stepId || null,
      repeatType, repeatInterval: repeatType === 'custom' ? repeatInterval : null,
      subtasks,
      status: existingAction?.status || 'active',
      sortOrder: existingAction?.sortOrder || Date.now(),
      createdAt: existingAction?.createdAt || new Date().toISOString(),
    });
  };

  const selectedStep = steps.find(s => s.id === stepId);
  const selectedGoal = selectedStep ? goals.find(g => g.id === selectedStep.goalId) : null;

  return (
    <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>Название *</label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Что нужно сделать?" style={inputStyle} />
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>Описание</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Подробности..." rows={2} style={{ ...inputStyle, resize: 'none' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
        <div>
          <label style={labelStyle}>Дата</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Время</label>
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} style={inputStyle} />
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>Дедлайн</label>
        <input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} style={inputStyle} />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>Приоритет</label>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {ACTION_PRIORITIES.map((p) => (
            <button key={p.id} onClick={() => setPriority(p.id)} style={{ padding: '8px 12px', background: priority === p.id ? `${p.color}20` : COLORS.bg, border: `1px solid ${priority === p.id ? p.color : COLORS.border}`, borderRadius: '8px', color: priority === p.id ? p.color : COLORS.textMuted, fontSize: '12px', cursor: 'pointer' }}>{p.label}</button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>Сила задачи</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          {STRENGTH_OPTIONS.map((s) => (
            <button key={s.id} onClick={() => setStrength(s.id)} style={{ flex: 1, padding: '12px', background: strength === s.id ? `${s.color}20` : COLORS.bg, border: `1px solid ${strength === s.id ? s.color : COLORS.border}`, borderRadius: '10px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <s.icon style={{ width: '20px', height: '20px', color: strength === s.id ? s.color : COLORS.textMuted }} />
              <span style={{ fontSize: '11px', color: strength === s.id ? s.color : COLORS.textMuted }}>{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>Привязка к рубежу/цели</label>
        <button onClick={() => setShowStepPicker(!showStepPicker)} style={{ width: '100%', padding: '14px 16px', background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: '12px', color: stepId ? COLORS.text : COLORS.textMuted, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>{stepId ? `${selectedStep?.title} → ${selectedGoal?.title || ''}` : 'Без привязки'}</span>
          <ChevronDown style={{ width: '16px', height: '16px', transform: showStepPicker ? 'rotate(180deg)' : 'none' }} />
        </button>
        {showStepPicker && (
          <div style={{ marginTop: '8px', background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: '12px', maxHeight: '200px', overflowY: 'auto' }}>
            <button onClick={() => { setStepId(''); setShowStepPicker(false); }} style={{ width: '100%', padding: '12px 16px', background: !stepId ? `${COLORS.gold}15` : 'transparent', border: 'none', borderBottom: `1px solid ${COLORS.border}`, color: !stepId ? COLORS.gold : COLORS.textMuted, fontSize: '13px', cursor: 'pointer', textAlign: 'left' }}>Без привязки</button>
            {steps.map((step) => {
              const goal = goals.find(g => g.id === step.goalId);
              return (
                <button key={step.id} onClick={() => { setStepId(step.id); setShowStepPicker(false); }} style={{ width: '100%', padding: '12px 16px', background: stepId === step.id ? `${COLORS.gold}15` : 'transparent', border: 'none', borderBottom: `1px solid ${COLORS.border}`, color: stepId === step.id ? COLORS.gold : COLORS.text, fontSize: '13px', cursor: 'pointer', textAlign: 'left' }}>
                  <div>{step.title}</div>
                  {goal && <div style={{ fontSize: '11px', color: COLORS.textMuted, marginTop: '2px' }}>→ {goal.title}</div>}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>Повтор</label>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {REPEAT_TYPES.map((r) => (
            <button key={r.id} onClick={() => setRepeatType(r.id)} style={{ padding: '8px 12px', background: repeatType === r.id ? `${COLORS.gold}20` : COLORS.bg, border: `1px solid ${repeatType === r.id ? COLORS.gold : COLORS.border}`, borderRadius: '8px', color: repeatType === r.id ? COLORS.gold : COLORS.textMuted, fontSize: '12px', cursor: 'pointer' }}>{r.label}</button>
          ))}
        </div>
        {repeatType === 'custom' && (
          <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: COLORS.textMuted }}>Каждые</span>
            <input type="number" value={repeatInterval} onChange={(e) => setRepeatInterval(parseInt(e.target.value) || 1)} min="1" style={{ ...inputStyle, width: '60px', padding: '8px 12px', textAlign: 'center' }} />
            <span style={{ fontSize: '13px', color: COLORS.textMuted }}>дней</span>
          </div>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>Подзадачи</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {subtasks.map((sub) => (
            <div key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: COLORS.bg, borderRadius: '10px' }}>
              <button onClick={() => handleToggleSubtask(sub.id)} style={{ width: '20px', height: '20px', background: sub.isCompleted ? COLORS.success : 'transparent', border: `2px solid ${sub.isCompleted ? COLORS.success : COLORS.textDark}`, borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                {sub.isCompleted && <Check style={{ width: '12px', height: '12px', color: COLORS.bg }} />}
              </button>
              <span style={{ flex: 1, fontSize: '14px', color: sub.isCompleted ? COLORS.textMuted : COLORS.text, textDecoration: sub.isCompleted ? 'line-through' : 'none' }}>{sub.title}</span>
              <button onClick={() => handleDeleteSubtask(sub.id)} style={{ padding: '4px', background: 'none', border: 'none', cursor: 'pointer' }}><X style={{ width: '14px', height: '14px', color: COLORS.textMuted }} /></button>
            </div>
          ))}
          <div style={{ display: 'flex', gap: '8px' }}>
            <input type="text" value={newSubtask} onChange={(e) => setNewSubtask(e.target.value)} placeholder="Добавить подзадачу..." onKeyPress={(e) => e.key === 'Enter' && handleAddSubtask()} style={{ ...inputStyle, flex: 1, padding: '10px 14px', fontSize: '14px' }} />
            <button onClick={handleAddSubtask} disabled={!newSubtask.trim()} style={{ padding: '10px 16px', background: newSubtask.trim() ? COLORS.gold : COLORS.bgCard, border: 'none', borderRadius: '10px', color: newSubtask.trim() ? COLORS.bg : COLORS.textDark, cursor: newSubtask.trim() ? 'pointer' : 'not-allowed' }}><Plus style={{ width: '18px', height: '18px' }} /></button>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        {existingAction && (
          <button onClick={() => onDelete(existingAction.id)} style={{ padding: '16px', background: `${COLORS.danger}20`, border: `1px solid ${COLORS.danger}50`, borderRadius: '12px', color: COLORS.danger, cursor: 'pointer' }}><Trash2 style={{ width: '18px', height: '18px' }} /></button>
        )}
        <button onClick={onClose} style={{ flex: 1, padding: '16px', background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: '12px', color: COLORS.text, fontSize: '15px', cursor: 'pointer' }}>Отмена</button>
        <button onClick={handleSave} disabled={!title.trim()} style={{ flex: 1, padding: '16px', background: title.trim() ? COLORS.gold : COLORS.bgCard, border: 'none', borderRadius: '12px', color: title.trim() ? COLORS.bg : COLORS.textDark, fontSize: '15px', fontWeight: '600', cursor: title.trim() ? 'pointer' : 'not-allowed' }}>Сохранить</button>
      </div>
    </div>
  );
};

// ============================================
// КАРТОЧКА ДЕЙСТВИЯ
// ============================================
const ActionCard = ({ action, step, goal, isCompleted, onToggle, onEdit }) => {
  const [expanded, setExpanded] = useState(false);
  const priority = ACTION_PRIORITIES.find(p => p.id === action.priority) || ACTION_PRIORITIES[1];
  const strengthOption = STRENGTH_OPTIONS.find(s => s.id === action.strength);
  const completedSubtasks = action.subtasks?.filter(s => s.isCompleted).length || 0;
  const totalSubtasks = action.subtasks?.length || 0;
  const daysUntilDeadline = getDaysUntil(action.deadline);

  return (
    <div style={{ background: isCompleted ? `${COLORS.success}10` : COLORS.bgCard, borderRadius: '12px', border: `1px solid ${isCompleted ? `${COLORS.success}30` : priority.color !== COLORS.textMuted ? `${priority.color}40` : COLORS.border}`, marginBottom: '8px', overflow: 'hidden' }}>
      <div style={{ padding: '14px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <button onClick={onToggle} disabled={isCompleted} style={{ width: '22px', height: '22px', background: isCompleted ? COLORS.success : 'transparent', border: `2px solid ${isCompleted ? COLORS.success : COLORS.textDark}`, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isCompleted ? 'default' : 'pointer', flexShrink: 0, marginTop: '2px' }}>
          {isCompleted && <Check style={{ width: '14px', height: '14px', color: COLORS.bg }} />}
        </button>
        
        <div style={{ flex: 1, minWidth: 0 }} onClick={() => setExpanded(!expanded)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', cursor: 'pointer' }}>
            <span style={{ fontSize: '15px', color: isCompleted ? COLORS.textMuted : COLORS.text, fontWeight: '500', textDecoration: isCompleted ? 'line-through' : 'none' }}>{action.title}</span>
            {priority.color !== COLORS.textMuted && <span style={{ fontSize: '10px', padding: '2px 6px', background: `${priority.color}20`, color: priority.color, borderRadius: '4px' }}>{priority.label}</span>}
            {strengthOption && strengthOption.id !== 'neutral' && <strengthOption.icon style={{ width: '14px', height: '14px', color: strengthOption.color }} />}
            {action.repeatType && action.repeatType !== 'none' && <Repeat style={{ width: '12px', height: '12px', color: COLORS.textMuted }} />}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px', flexWrap: 'wrap' }}>
            {action.time && <span style={{ fontSize: '12px', color: COLORS.gold, display: 'flex', alignItems: 'center', gap: '4px' }}><Clock style={{ width: '12px', height: '12px' }} />{action.time}</span>}
            {daysUntilDeadline !== null && <span style={{ fontSize: '11px', color: daysUntilDeadline < 0 ? COLORS.danger : daysUntilDeadline <= 1 ? COLORS.warning : COLORS.textMuted }}>{daysUntilDeadline < 0 ? `Просрочено ${Math.abs(daysUntilDeadline)}д` : daysUntilDeadline === 0 ? 'Сегодня!' : `Осталось ${daysUntilDeadline}д`}</span>}
            {totalSubtasks > 0 && <span style={{ fontSize: '11px', color: completedSubtasks === totalSubtasks ? COLORS.success : COLORS.textMuted }}>{completedSubtasks}/{totalSubtasks}</span>}
          </div>
        </div>
        
        <button onClick={() => setExpanded(!expanded)} style={{ padding: '4px', background: 'none', border: 'none', cursor: 'pointer' }}>
          {expanded ? <ChevronUp style={{ width: '18px', height: '18px', color: COLORS.textMuted }} /> : <ChevronDown style={{ width: '18px', height: '18px', color: COLORS.textMuted }} />}
        </button>
      </div>
      
      {expanded && (
        <div style={{ padding: '0 14px 14px', borderTop: `1px solid ${COLORS.border}`, marginTop: '-4px', paddingTop: '14px' }}>
          {action.description && <p style={{ fontSize: '13px', color: COLORS.textMuted, marginBottom: '12px' }}>{action.description}</p>}
          
          <div style={{ padding: '10px 12px', background: COLORS.bg, borderRadius: '8px', marginBottom: '12px' }}>
            {step && goal ? (
              <>
                <p style={{ fontSize: '11px', color: COLORS.textMuted, marginBottom: '4px' }}>Привязка:</p>
                <p style={{ fontSize: '13px', color: COLORS.text }}><Flag style={{ width: '12px', height: '12px', color: COLORS.gold, marginRight: '4px' }} />{step.title}</p>
                <p style={{ fontSize: '12px', color: COLORS.textMuted, marginTop: '2px' }}><Target style={{ width: '11px', height: '11px', marginRight: '4px' }} />{goal.title}</p>
              </>
            ) : (
              <p style={{ fontSize: '12px', color: COLORS.textMuted }}>Без привязки к целям</p>
            )}
          </div>
          
          {totalSubtasks > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <p style={{ fontSize: '11px', color: COLORS.textMuted, marginBottom: '8px' }}>Подзадачи:</p>
              {action.subtasks.map((sub) => (
                <div key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0' }}>
                  <div style={{ width: '14px', height: '14px', background: sub.isCompleted ? COLORS.success : 'transparent', border: `2px solid ${sub.isCompleted ? COLORS.success : COLORS.textDark}`, borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {sub.isCompleted && <Check style={{ width: '10px', height: '10px', color: COLORS.bg }} />}
                  </div>
                  <span style={{ fontSize: '13px', color: sub.isCompleted ? COLORS.textMuted : COLORS.text, textDecoration: sub.isCompleted ? 'line-through' : 'none' }}>{sub.title}</span>
                </div>
              ))}
            </div>
          )}
          
          {!isCompleted && (
            <button onClick={onEdit} style={{ width: '100%', padding: '10px', background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: '8px', color: COLORS.textMuted, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Edit3 style={{ width: '14px', height: '14px' }} />Редактировать
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================
// ЭКРАН ДЕЙСТВИЯ
// ============================================
export const ActionScreen = ({ data, saveData }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [editingAction, setEditingAction] = useState(null);

  useEffect(() => {
    if (!data.actions) saveData({ ...data, actions: [] });
  }, [data, saveData]);

  const actions = data.actions || [];
  const steps = data.steps || [];
  const goals = data.goals || [];
  const spheres = data.spheres || [];
  const dateKey = formatDateKey(selectedDate);

  const todayActions = actions.filter(a => a.date === dateKey && a.status !== 'cancelled');
  const activeActions = todayActions.filter(a => a.status === 'active');
  const completedActions = todayActions.filter(a => a.status === 'done');
  
  const withTime = activeActions.filter(a => a.time).sort((a, b) => a.time.localeCompare(b.time));
  const withoutTime = activeActions.filter(a => !a.time).sort((a, b) => a.sortOrder - b.sortOrder);
  const undatedActions = actions.filter(a => !a.date && a.status === 'active');

  const handleSaveAction = (actionData) => {
    const existingIndex = actions.findIndex(a => a.id === actionData.id);
    let newActions;
    if (existingIndex >= 0) {
      newActions = [...actions];
      newActions[existingIndex] = { ...actionData, updatedAt: new Date().toISOString() };
    } else {
      newActions = [...actions, actionData];
    }
    saveData({ ...data, actions: newActions });
    setShowForm(false);
    setEditingAction(null);
  };

  const handleToggleAction = (action) => {
    if (action.status === 'done') return;
    const newActions = actions.map(a => a.id === action.id ? { ...a, status: 'done', completedAt: new Date().toISOString() } : a);
    saveData({ ...data, actions: newActions });
  };

  const handleDeleteAction = (actionId) => {
    saveData({ ...data, actions: actions.filter(a => a.id !== actionId) });
    setShowForm(false);
    setEditingAction(null);
  };

  const getStepAndGoal = (action) => {
    const step = steps.find(s => s.id === action.stepId);
    const goal = step ? goals.find(g => g.id === step.goalId) : null;
    return { step, goal };
  };

  return (
    <div style={{ minHeight: '100vh', background: COLORS.bg, paddingBottom: '100px' }}>
      <div style={{ padding: '20px', paddingTop: '60px', background: `linear-gradient(to bottom, ${COLORS.bgCard} 0%, ${COLORS.bg} 100%)` }}>
        <h1 style={{ fontSize: '28px', fontWeight: '600', color: COLORS.text, fontFamily: 'Georgia, serif', marginBottom: '16px' }}>Действия</h1>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <button onClick={() => setSelectedDate(addDays(selectedDate, -1))} style={{ width: '40px', height: '40px', background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <ChevronLeft style={{ width: '20px', height: '20px', color: COLORS.textMuted }} />
          </button>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '18px', fontWeight: '500', color: COLORS.text }}>{formatDateDisplay(selectedDate)}</p>
            <button onClick={() => setSelectedDate(new Date())} style={{ background: 'none', border: 'none', color: COLORS.gold, fontSize: '12px', cursor: 'pointer', marginTop: '4px' }}>Сегодня</button>
          </div>
          <button onClick={() => setSelectedDate(addDays(selectedDate, 1))} style={{ width: '40px', height: '40px', background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <ChevronRight style={{ width: '20px', height: '20px', color: COLORS.textMuted }} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1, padding: '12px', background: COLORS.bg, borderRadius: '10px', textAlign: 'center', border: `1px solid ${COLORS.border}` }}>
            <p style={{ fontSize: '20px', fontWeight: '600', color: COLORS.gold }}>{completedActions.length}</p>
            <p style={{ fontSize: '11px', color: COLORS.textMuted }}>Выполнено</p>
          </div>
          <div style={{ flex: 1, padding: '12px', background: COLORS.bg, borderRadius: '10px', textAlign: 'center', border: `1px solid ${COLORS.border}` }}>
            <p style={{ fontSize: '20px', fontWeight: '600', color: COLORS.text }}>{activeActions.length}</p>
            <p style={{ fontSize: '11px', color: COLORS.textMuted }}>Осталось</p>
          </div>
          {undatedActions.length > 0 && (
            <div style={{ flex: 1, padding: '12px', background: `${COLORS.warning}15`, borderRadius: '10px', textAlign: 'center', border: `1px solid ${COLORS.warning}30` }}>
              <p style={{ fontSize: '20px', fontWeight: '600', color: COLORS.warning }}>{undatedActions.length}</p>
              <p style={{ fontSize: '11px', color: COLORS.textMuted }}>Без даты</p>
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: '20px' }}>
        {withTime.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <p style={{ fontSize: '12px', color: COLORS.textMuted, textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}><Clock style={{ width: '14px', height: '14px' }} />Запланировано</p>
            {withTime.map((action) => { const { step, goal } = getStepAndGoal(action); return <ActionCard key={action.id} action={action} step={step} goal={goal} isCompleted={false} onToggle={() => handleToggleAction(action)} onEdit={() => { setEditingAction(action); setShowForm(true); }} />; })}
          </div>
        )}

        {withoutTime.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <p style={{ fontSize: '12px', color: COLORS.textMuted, textTransform: 'uppercase', marginBottom: '12px' }}>Задачи на день</p>
            {withoutTime.map((action) => { const { step, goal } = getStepAndGoal(action); return <ActionCard key={action.id} action={action} step={step} goal={goal} isCompleted={false} onToggle={() => handleToggleAction(action)} onEdit={() => { setEditingAction(action); setShowForm(true); }} />; })}
          </div>
        )}

        {completedActions.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <p style={{ fontSize: '12px', color: COLORS.success, textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}><Check style={{ width: '14px', height: '14px' }} />Выполнено</p>
            {completedActions.map((action) => { const { step, goal } = getStepAndGoal(action); return <ActionCard key={action.id} action={action} step={step} goal={goal} isCompleted={true} onToggle={() => {}} onEdit={() => {}} />; })}
          </div>
        )}

        {activeActions.length === 0 && completedActions.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ width: '80px', height: '80px', background: `radial-gradient(circle, ${COLORS.gold}15 0%, transparent 70%)`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <CheckSquare style={{ width: '40px', height: '40px', color: COLORS.gold, opacity: 0.5 }} />
            </div>
            <h3 style={{ color: COLORS.text, fontSize: '18px', marginBottom: '8px', fontFamily: 'Georgia, serif' }}>Нет задач</h3>
            <p style={{ color: COLORS.textMuted, fontSize: '14px' }}>Добавьте действие на этот день</p>
          </div>
        )}

        {undatedActions.length > 0 && (
          <div>
            <p style={{ fontSize: '12px', color: COLORS.warning, textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}><AlertCircle style={{ width: '14px', height: '14px' }} />Без даты</p>
            {undatedActions.map((action) => { const { step, goal } = getStepAndGoal(action); return <ActionCard key={action.id} action={action} step={step} goal={goal} isCompleted={false} onToggle={() => handleToggleAction(action)} onEdit={() => { setEditingAction(action); setShowForm(true); }} />; })}
          </div>
        )}
      </div>

      <button onClick={() => { setEditingAction(null); setShowForm(true); }} style={{ position: 'fixed', right: '20px', bottom: '100px', width: '56px', height: '56px', background: `linear-gradient(135deg, ${COLORS.goldDark} 0%, ${COLORS.gold} 100%)`, border: 'none', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: `0 8px 24px ${COLORS.gold}40` }}>
        <Plus style={{ width: '24px', height: '24px', color: COLORS.bg }} />
      </button>

      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditingAction(null); }} title={editingAction ? 'Редактировать' : 'Новое действие'}>
        <ActionForm steps={steps} goals={goals} spheres={spheres} selectedDate={selectedDate} existingAction={editingAction} onSave={handleSaveAction} onClose={() => { setShowForm(false); setEditingAction(null); }} onDelete={handleDeleteAction} />
      </Modal>
    </div>
  );
};
