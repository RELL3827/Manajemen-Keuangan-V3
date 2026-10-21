import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Flame,
  ShieldAlert,
  Target,
  CheckCircle2,
  HelpCircle,
  RefreshCw,
  PieChart,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../services/api';
import { InsightItem, FinancialHealth } from '../types';

export const InsightsPage: React.FC = () => {
  const [insights, setInsights] = useState<InsightItem[]>([]);
  const [health, setHealth] = useState<FinancialHealth | null>(null);
  const [hasSufficientData, setHasSufficientData] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchInsights = async () => {
    setIsLoading(true);
    try {
      const res = await api.getInsights();
      setInsights(res.insights || []);
      setHealth(res.financial_health || null);
      setHasSufficientData(res.has_sufficient_data ?? true);
    } catch (err) {
      console.error('Failed to load insights:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'warning':
      case 'alert':
        return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      case 'danger':
        return <Flame className="w-5 h-5 text-rose-400" />;
      case 'goal':
        return <Target className="w-5 h-5 text-sky-400" />;
      case 'success':
        return <Sparkles className="w-5 h-5 text-emerald-400" />;
      default:
        return <PieChart className="w-5 h-5 text-indigo-400" />;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold text-white m-0">Insight Keuangan Otomatis</h2>
          </div>
          <p className="text-xs text-slate-400 m-0">
            Analisis prediktif dan evaluasi berbasis riwayat transaksi & anggaran nyata
          </p>
        </div>

        <button
          onClick={fetchInsights}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold hover:bg-slate-800 transition-colors self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Analisis Ulang</span>
        </button>
      </div>

      {/* Health Score Big Card */}
      <div className="p-6 rounded-3xl bg-linear-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Score Ring */}
            <div className="relative w-24 h-24 rounded-full bg-slate-950 border-4 border-emerald-500/30 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/10">
              <div className="text-center">
                <span className="text-2xl font-black font-mono text-emerald-400 block leading-tight">
                  {health?.score || 80}
                </span>
                <span className="text-[10px] text-slate-400 uppercase font-bold">/ 100</span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Kesehatan Finansial
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {health?.status || 'Sehat'}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mt-1">
                {health?.summary || 'Kondisi keuangan Anda dalam keadaan optimal.'}
              </h3>
              <p className="text-xs text-slate-300 mt-1 max-w-xl">
                Rasio tabungan bulanan berada di angka <span className="font-bold text-cyan-400 font-mono">{health?.savings_rate || 0}%</span> dari total pendapatan. Alokasi pengeluaran Anda terkontrol dengan baik.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 shrink-0 self-stretch md:self-center">
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
              <span className="text-slate-400 block text-[10px]">Benchmark Sehat</span>
              <span className="font-bold text-emerald-400">Rasio Tabungan &ge; 20%</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
              <span className="text-slate-400 block text-[10px]">Batas Toleransi</span>
              <span className="font-bold text-amber-400">Pengeluaran &le; 80% Gaji</span>
            </div>
          </div>
        </div>
      </div>

      {/* Insights List */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-white">Temuan & Rekomendasi Cerdas</h3>

        {isLoading ? (
          <div className="py-16 text-center text-slate-400">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-400" />
            <p className="text-xs">Menjalankan kalkulasi data keuangan...</p>
          </div>
        ) : !hasSufficientData ? (
          <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center text-slate-400">
            <HelpCircle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-bold text-white mb-1">Data Transaksi Belum Cukup</p>
            <p className="text-xs max-w-md mx-auto">
              Insight otomatis akan otomatis aktif setelah Anda mencatat minimal 3 transaksi pada 2 periode berbeda.
            </p>
          </div>
        ) : insights.length === 0 ? (
          <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center text-slate-400">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-white mb-1">Seluruh Arus Kas Normal</p>
            <p className="text-xs">
              Tidak ada anomali atau lonjakan pengeluaran yang perlu diwaspadai saat ini.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex items-start gap-4 shadow-lg group"
              >
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 shrink-0">
                  {getInsightIcon(item.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="text-sm font-bold text-white truncate">{item.title}</h4>
                    {item.metric && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-800 text-cyan-300">
                        {item.metric}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{item.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
