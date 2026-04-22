import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PlusCircle, 
  LayoutDashboard, 
  Receipt, 
  TrendingUp, 
  TrendingDown, 
  Wallet,
  Calendar,
  FileDown,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Trash2,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import { auth, signIn, signOut } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  Transaction, 
  createTransaction, 
  subscribeToTransactions, 
  deleteTransaction,
  TransactionType 
} from './services/transactionService';
import { formatCurrency, formatDate, cn } from './lib/utils';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  isWithinInterval,
  parseISO 
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { jsPDF } from 'jspdf';
import { Parser } from '@json2csv/plainjs';

// --- Components ---

const Button = ({ children, className, variant = 'primary', ...props }: any) => (
  <button 
    className={cn(
      "px-4 py-2 rounded-lg font-semibold transition-all active:scale-95 disabled:opacity-50",
      variant === 'primary' ? "btn-primary" : "bg-bg-card border border-border-theme text-text-main hover:bg-bg-surface",
      className
    )}
    {...props}
  >
    {children}
  </button>
);

const Card = ({ title, value, colorClass, labelColor }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="card-theme p-5"
  >
    <div className="text-[10px] uppercase tracking-widest text-text-muted mb-2 font-bold">{title}</div>
    <div className={cn("text-2xl font-bold tracking-tight", labelColor)}>{value}</div>
  </motion.div>
);

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'form' | 'history'>('dashboard');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Form State
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dueDate, setDueDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [type, setType] = useState<TransactionType>('despesa');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (user) {
      const unsubscribe = subscribeToTransactions(user.uid, setTransactions);
      return unsubscribe;
    }
  }, [user]);

  const filteredTransactions = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return transactions.filter(t => {
      const tDate = parseISO(t.date);
      return isWithinInterval(tDate, { start, end });
    });
  }, [transactions, currentMonth]);

  const stats = useMemo(() => {
    const receitasTotal = transactions
      .filter(t => t.type === 'receita')
      .reduce((acc, curr) => acc + curr.amount, 0);
    
    const despesasTotal = transactions
      .filter(t => t.type === 'despesa')
      .reduce((acc, curr) => acc + curr.amount, 0);
    
    const investimentosTotal = transactions
      .filter(t => t.type === 'investimento')
      .reduce((acc, curr) => acc + curr.amount, 0);

    const filteredReceitas = filteredTransactions
      .filter(t => t.type === 'receita')
      .reduce((acc, curr) => acc + curr.amount, 0);
    
    const filteredDespesas = filteredTransactions
      .filter(t => t.type === 'despesa')
      .reduce((acc, curr) => acc + curr.amount, 0);

    return {
      saldoAtual: receitasTotal - (despesasTotal + investimentosTotal),
      receitasMes: filteredReceitas,
      despesasMes: filteredDespesas
    };
  }, [transactions, filteredTransactions]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !date || !dueDate) return;

    await createTransaction({
      description,
      amount: parseFloat(amount),
      date: new Date(date).toISOString(),
      dueDate: new Date(dueDate).toISOString(),
      type
    });

    setDescription('');
    setAmount('');
    setActiveTab('dashboard');
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Relatório Financeiro', 20, 20);
    doc.setFontSize(12);
    doc.text(`Período: ${format(currentMonth, 'MMMM yyyy', { locale: ptBR })}`, 20, 30);
    
    let y = 40;
    filteredTransactions.forEach((t) => {
      doc.text(`${formatDate(t.date)} - ${t.description} (${t.type}): ${formatCurrency(t.amount)}`, 20, y);
      y += 10;
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
    });

    doc.save(`relatorio_${format(currentMonth, 'MM_yyyy')}.pdf`);
  };

  const exportCSV = () => {
    try {
      const parser = new Parser();
      const csv = parser.parse(filteredTransactions.map(t => ({
        Data: formatDate(t.date),
        Vencimento: formatDate(t.dueDate),
        Descrição: t.description,
        Valor: t.amount,
        Tipo: t.type
      })));
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `relatorio_${format(currentMonth, 'MM_yyyy')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-bg-base">
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        className="w-8 h-8 border-2 border-border-theme border-t-accent-income rounded-full"
      />
    </div>
  );

  if (!user) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-bg-base">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card-theme p-12 max-w-sm w-full text-center"
      >
        <div className="w-16 h-16 bg-accent-income/10 rounded-2xl flex items-center justify-center mx-auto mb-8">
          <Wallet className="w-8 h-8 text-accent-income" />
        </div>
        <h1 className="text-3xl font-bold text-text-main mb-2">FinApp</h1>
        <p className="text-text-muted mb-10 text-sm">Gerencie suas finanças com elegância.</p>
        <button 
          onClick={signIn}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          Entrar com Google
        </button>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-bg-base text-text-main">
      {/* Sidebar - Desktop */}
      <nav className="hidden md:flex w-64 bg-bg-surface border-r border-border-theme flex-col py-8 sticky top-0 h-screen">
        <div className="px-8 flex items-center gap-2 mb-12">
            <div className="w-8 h-8 bg-accent-income text-black rounded-lg flex items-center justify-center">
                <Wallet className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-accent-income">Financier.io</span>
        </div>
        
        <div className="flex-1 space-y-1">
            <div 
              onClick={() => setActiveTab('dashboard')}
              className={cn("nav-item-theme", activeTab === 'dashboard' && "active")}
            >
              <LayoutDashboard size={20} /> Visão Geral
            </div>
            <div 
              onClick={() => setActiveTab('form')}
              className={cn("nav-item-theme", activeTab === 'form' && "active")}
            >
              <PlusCircle size={20} /> Novo Registro
            </div>
            <div 
              onClick={() => setActiveTab('history')}
              className={cn("nav-item-theme", activeTab === 'history' && "active")}
            >
              <Receipt size={20} /> Relatórios
            </div>
        </div>

        <div className="px-6 mt-auto">
            <button 
              onClick={signOut}
              className="flex items-center gap-3 w-full px-4 py-3 text-text-muted hover:text-accent-expense transition-colors"
            >
              <LogOut size={20} /> Sair
            </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 lg:p-12 overflow-y-auto">
        {/* Header Mobile */}
        <div className="md:hidden flex justify-between items-center mb-8">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-accent-income text-black rounded-lg flex items-center justify-center">
                    <Wallet className="w-5 h-5" />
                </div>
                <span className="font-bold text-lg text-accent-income tracking-tight">FinApp</span>
            </div>
            <button onClick={signOut} className="text-text-muted hover:text-accent-expense">
                <LogOut size={22} />
            </button>
        </div>

        {/* Global Period Selector */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
          <div className="flex items-center gap-4 bg-bg-surface border border-border-theme px-4 py-2 rounded-full">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="text-text-muted hover:text-text-main">
                <ChevronLeft size={20} />
            </button>
            <span className="text-sm font-bold uppercase tracking-widest min-w-[140px] text-center">
                {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </span>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="text-text-muted hover:text-text-main">
                <ChevronRight size={20} />
            </button>
          </div>

          <div className="flex gap-2">
             <button onClick={exportPDF} className="p-2 rounded-lg bg-bg-surface border border-border-theme text-text-muted hover:text-text-main hover:border-text-muted transition-all" title="Exportar PDF">
                <FileText size={18} />
             </button>
             <button onClick={exportCSV} className="p-2 rounded-lg bg-bg-surface border border-border-theme text-text-muted hover:text-text-main hover:border-text-muted transition-all" title="Exportar CSV">
                <FileSpreadsheet size={18} />
             </button>
          </div>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
            <Card title="Saldo Atual" value={formatCurrency(stats.saldoAtual)} />
            <Card title="Despesas do Mês" value={formatCurrency(stats.despesasMes)} labelColor="text-accent-expense" />
            <Card title="Receitas do Mês" value={formatCurrency(stats.receitasMes)} labelColor="text-accent-income" />
        </section>

        <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
                <div key="dashboard-tab" className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-10">
                    {/* Left Side: Recent Activity (simplified for dashboard) */}
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold">Atividade Recente</h3>
                            <button onClick={() => setActiveTab('history')} className="text-xs text-accent-income hover:underline">Ver tudo</button>
                        </div>
                        <div className="space-y-3">
                            {filteredTransactions.slice(0, 8).map(t => (
                                <div key={t.id} className="bg-bg-surface border border-border-theme p-4 rounded-xl flex justify-between items-center group">
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "w-2 h-2 rounded-full",
                                            t.type === 'receita' ? "bg-accent-income" : t.type === 'investimento' ? "bg-accent-invest" : "bg-accent-expense"
                                        )} />
                                        <div>
                                            <div className="text-sm font-semibold">{t.description}</div>
                                            <div className="text-[10px] text-text-muted uppercase tracking-tight">{formatDate(t.date)}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "text-sm font-bold",
                                            t.type === 'receita' ? "text-accent-income" : t.type === 'investimento' ? "text-accent-invest" : "text-accent-expense"
                                        )}>
                                            {t.type === 'receita' ? '+' : '-'} {formatCurrency(t.amount)}
                                        </div>
                                        <button onClick={() => t.id && deleteTransaction(t.id)} className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-accent-expense transition-all">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {filteredTransactions.length === 0 && (
                                <div className="text-center py-10 text-text-muted text-sm border-2 border-dashed border-border-theme rounded-xl">
                                    Nenhuma transação este mês.
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Right Side: Quick Add for Dashboard or other info */}
                    <motion.div 
                         initial={{ opacity: 0, scale: 0.98 }}
                         animate={{ opacity: 1, scale: 1 }}
                         className="card-theme p-8 hidden lg:block h-fit sticky top-32"
                    >
                        <h3 className="text-lg font-bold mb-6">Resumo Mensal</h3>
                        <div className="space-y-8">
                             <div className="space-y-2">
                                <div className="flex justify-between text-xs text-text-muted uppercase font-bold tracking-wider">
                                    <span>Receitas</span>
                                    <span>{formatCurrency(stats.receitasMes)}</span>
                                </div>
                                <div className="h-1 bg-bg-card rounded-full overflow-hidden">
                                     <div className="h-full bg-accent-income" style={{ width: '100%' }} />
                                </div>
                             </div>
                             <div className="space-y-2">
                                <div className="flex justify-between text-xs text-text-muted uppercase font-bold tracking-wider">
                                    <span>Despesas</span>
                                    <span>{formatCurrency(stats.despesasMes)}</span>
                                </div>
                                <div className="h-1 bg-bg-card rounded-full overflow-hidden">
                                     <div className="h-full bg-accent-expense" style={{ width: `${Math.min((stats.despesasMes / (stats.receitasMes || 1)) * 100, 100)}%` }} />
                                </div>
                             </div>
                        </div>
                        <Button onClick={() => setActiveTab('form')} className="w-full mt-10">Realizar Novo Lançamento</Button>
                    </motion.div>
                </div>
            )}

            {activeTab === 'form' && (
                <motion.div 
                    key="form-tab"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-xl mx-auto md:mx-0"
                >
                    <div className="card-theme p-8">
                        <h2 className="text-xl font-bold mb-8">Nova Transação</h2>
                        <form onSubmit={handleCreate} className="space-y-6">
                            <div className="grid grid-cols-3 gap-2">
                                {(['receita', 'despesa', 'investimento'] as TransactionType[]).map((t) => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => setType(t)}
                                        className={cn(
                                            "py-2.5 rounded-lg border border-border-theme uppercase text-[10px] font-bold transition-all",
                                            type === t ? "bg-accent-income text-black border-accent-income" : "bg-bg-base text-text-muted"
                                        )}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase font-bold text-text-muted tracking-widest">Descrição</label>
                                    <input 
                                        type="text" 
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="input-theme w-full"
                                        placeholder="Ex: Aluguel, Supermercado..."
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] uppercase font-bold text-text-muted tracking-widest">Valor (R$)</label>
                                        <input 
                                            type="number" 
                                            step="0.01"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            className="input-theme w-full text-lg font-bold"
                                            placeholder="0,00"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] uppercase font-bold text-text-muted tracking-widest">Data</label>
                                        <input 
                                            type="date" 
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            className="input-theme w-full"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase font-bold text-text-muted tracking-widest">Vencimento</label>
                                    <input 
                                        type="date" 
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                        className="input-theme w-full"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <Button type="button" variant="secondary" onClick={() => setActiveTab('dashboard')} className="flex-1">Cancelar</Button>
                                <Button type="submit" className="flex-2">Confirmar Lançamento</Button>
                            </div>
                        </form>
                    </div>
                </motion.div>
            )}

            {activeTab === 'history' && (
                <motion.div 
                    key="history-tab"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                >
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold">Relatório Detalhado</h2>
                        <div className="text-sm text-text-muted">{filteredTransactions.length} registros encontrados</div>
                    </div>

                    <div className="card-theme overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-[10px] uppercase font-bold text-text-muted tracking-widest border-b border-border-theme bg-bg-surface">
                                    <th className="px-6 py-4">Data</th>
                                    <th className="px-6 py-4">Descrição</th>
                                    <th className="px-6 py-4">Tipo</th>
                                    <th className="px-6 py-4 text-right">Valor</th>
                                    <th className="px-6 py-4 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-theme">
                                {filteredTransactions.map(t => (
                                    <tr key={t.id} className="hover:bg-bg-card/30 transition-colors group">
                                        <td className="px-6 py-4 text-sm text-text-muted">{formatDate(t.date)}</td>
                                        <td className="px-6 py-4 text-sm font-semibold">{t.description}</td>
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                "text-[9px] font-bold uppercase px-2 py-1 rounded-md",
                                                t.type === 'receita' ? "bg-accent-income/10 text-accent-income" : t.type === 'investimento' ? "bg-accent-invest/10 text-accent-invest" : "bg-accent-expense/10 text-accent-expense"
                                            )}>
                                                {t.type}
                                            </span>
                                        </td>
                                        <td className={cn(
                                            "px-6 py-4 text-sm font-bold text-right",
                                            t.type === 'receita' ? "text-accent-income" : "text-accent-expense"
                                        )}>
                                            {formatCurrency(t.amount)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button onClick={() => t.id && deleteTransaction(t.id)} className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-accent-expense transition-all">
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredTransactions.length === 0 && (
                            <div className="text-center py-20 text-text-muted text-sm">Nenhum dado encontrado para este período.</div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
      </main>

      {/* Navigation Mobile - Fixed Bottom */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-bg-surface border-t border-border-theme flex justify-around items-center p-4 z-50">
        <button onClick={() => setActiveTab('dashboard')} className={cn("flex flex-col items-center gap-1", activeTab === 'dashboard' ? "text-accent-income" : "text-text-muted")}>
            <LayoutDashboard size={20} />
            <span className="text-[10px] font-bold uppercase tracking-tight">Dashboard</span>
        </button>
        <button onClick={() => setActiveTab('form')} className={cn("flex flex-col items-center gap-1", activeTab === 'form' ? "text-accent-income" : "text-text-muted")}>
            <PlusCircle size={20} />
            <span className="text-[10px] font-bold uppercase tracking-tight">Novo</span>
        </button>
        <button onClick={() => setActiveTab('history')} className={cn("flex flex-col items-center gap-1", activeTab === 'history' ? "text-accent-income" : "text-text-muted")}>
            <Receipt size={20} />
            <span className="text-[10px] font-bold uppercase tracking-tight">Relatórios</span>
        </button>
      </nav>
    </div>
  );
}
