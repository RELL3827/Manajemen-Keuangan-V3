import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  FileSpreadsheet,
  FileText,
  TrendingUp,
  PieChart as PieIcon,
  RefreshCw,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { api } from '../services/api';
import { formatRupiah, formatCompactRupiah } from '../utils/formatters';

export const ReportsPage: React.FC = () => {
  const [period, setPeriod] = useState<string>('this_month');
  const [reportData, setReportData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchReport = async () => {
    setIsLoading(true);
    try {
      const res = await api.getReportsSummary(period);
      setReportData(res);
    } catch (err) {
      console.error('Failed to load report:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [period]);

  const summary = reportData?.summary || {};
  const categoryBreakdown = reportData?.category_breakdown || [];
  const monthlyTrend = reportData?.monthly_trend || [];
  const accountsSummary = reportData?.accounts_summary || [];

  const CHART_COLORS = ['#F43F5E', '#FB923C', '#EAB308', '#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#64748B'];

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    // Summary Sheet
    const summaryRows = [
      { Indikator: 'Total Saldo Likuiditas', Nilai: summary.total_balance || 0 },
      { Indikator: 'Total Pemasukan', Nilai: summary.income || 0 },
      { Indikator: 'Total Pengeluaran', Nilai: summary.expense || 0 },
      { Indikator: 'Arus Kas Bersih', Nilai: summary.net_cashflow || 0 },
      { Indikator: 'Rasio Tabungan (%)', Nilai: `${summary.savings_rate || 0}%` },
      { Indikator: 'Pengeluaran Rutin', Nilai: summary.routine_expense || 0 },
      { Indikator: 'Pengeluaran Non-Rutin', Nilai: summary.non_routine_expense || 0 },
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan');

    // Category Breakdown Sheet
    const catRows = categoryBreakdown.map((c: any) => ({
      Kategori: c.name,
      Total_Pengeluaran: c.amount,
      Persentase: `${c.percentage}%`,
      Frekuensi_Transaksi: c.count,
    }));
    const wsCats = XLSX.utils.json_to_sheet(catRows);
    XLSX.utils.book_append_sheet(wb, wsCats, 'Kategori Pengeluaran');

    XLSX.writeFile(wb, `Laporan_Keuangan_FinTrack_${period}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.text('Laporan Analisis Keuangan FinTrack', 14, 20);
    doc.setFontSize(10);
    doc.text(`Periode: ${reportData?.period?.current || 'Bulan Ini'} | Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 14, 27);

    // Summary Table
    autoTable(doc, {
      startY: 33,
      head: [['Indikator Keuangan', 'Nilai (IDR)']],
      body: [
        ['Total Saldo Seluruh Akun', formatRupiah(summary.total_balance)],
        ['Total Pemasukan', formatRupiah(summary.income)],
        ['Total Pengeluaran', formatRupiah(summary.expense)],
        ['Arus Kas Bersih', formatRupiah(summary.net_cashflow)],
        ['Rasio Tabungan (Savings Rate)', `${summary.savings_rate}%`],
        ['Pengeluaran Rutin / Tagihan', formatRupiah(summary.routine_expense)],
        ['Pengeluaran Non-Rutin', formatRupiah(summary.non_routine_expense)],
      ],
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] },
    });

    // Category Breakdown Table
    const catBody = categoryBreakdown.map((c: any) => [
      c.name,
      formatRupiah(c.amount),
      `${c.percentage}%`,
      `${c.count} kali`,
    ]);

    const finalY = (doc as any).lastAutoTable.finalY || 100;
    doc.text('Rincian Pengeluaran per Kategori', 14, finalY + 12);

    autoTable(doc, {
      startY: finalY + 16,
      head: [['Kategori', 'Total Nominal', 'Porsi (%)', 'Frekuensi']],
      body: catBody,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
    });

    doc.save(`Laporan_FinTrack_${period}.pdf`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white m-0">Laporan & Analisis Finansial</h2>
          <p className="text-xs text-slate-400 m-0">
            Analisis arus kas mendalam, porsi belanja, dan tren historis
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Period Presets */}
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white focus:border-emerald-500 focus:outline-hidden"
          >
            <option value="this_month">Bulan Ini</option>
            <option value="last_month">Bulan Lalu</option>
            <option value="this_year">Tahun Ini</option>
          </select>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Ekspor Excel</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-rose-400" />
            <span>Ekspor PDF</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">Total Pemasukan</span>
          <span className="text-xl font-black font-mono text-emerald-400">
            {formatRupiah(summary.income || 0)}
          </span>
          <span className="text-[10px] text-slate-500 mt-1 block">
            Periode lalu: {formatRupiah(summary.prev_income || 0)}
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">Total Pengeluaran</span>
          <span className="text-xl font-black font-mono text-rose-400">
            {formatRupiah(summary.expense || 0)}
          </span>
          <span className="text-[10px] text-slate-500 mt-1 block">
            Periode lalu: {formatRupiah(summary.prev_expense || 0)}
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">Arus Kas Bersih (Surplus/Defisit)</span>
          <span className={`text-xl font-black font-mono ${summary.net_cashflow >= 0 ? 'text-white' : 'text-rose-400'}`}>
            {formatRupiah(summary.net_cashflow || 0)}
          </span>
          <span className="text-[10px] text-slate-500 mt-1 block">
            Saldo likuid: {formatRupiah(summary.total_balance || 0)}
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">Rasio Tabungan (Savings Rate)</span>
          <span className="text-xl font-black font-mono text-cyan-400">
            {summary.savings_rate || 0}%
          </span>
          <span className="text-[10px] text-slate-500 mt-1 block">
            Rutin: {formatRupiah(summary.routine_expense || 0)}
          </span>
        </div>
      </div>

      {/* Main Visuals: Bar Chart Trend & Category Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cashflow Bar Chart */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white m-0">Perbandingan Pemasukan & Pengeluaran</h3>
              <p className="text-xs text-slate-400 m-0">Historis arus kas tiap bulan</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="label" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => formatCompactRupiah(val)}
                />
                <Tooltip
                  formatter={(val: any) => [formatRupiah(val), '']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="income" name="Pemasukan" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Pengeluaran" fill="#F43F5E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Net Trend Line Chart */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white m-0">Tren Surplus Kas Bersih</h3>
              <p className="text-xs text-slate-400 m-0">Pertumbuhan tabungan bersih bulanan</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="label" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => formatCompactRupiah(val)}
                />
                <Tooltip
                  formatter={(val: any) => [formatRupiah(val), 'Net Surplus']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                />
                <Line
                  type="monotone"
                  dataKey="net"
                  name="Surplus Bersih"
                  stroke="#06B6D4"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#06B6D4' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Category Breakdown Full Table */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl p-5">
        <h3 className="text-sm font-bold text-white mb-3">Tabel Analisis Pengeluaran per Kategori</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-bold">
                <th className="py-2.5 px-3">Kategori</th>
                <th className="py-2.5 px-3">Total Nominal</th>
                <th className="py-2.5 px-3">Porsi dari Total</th>
                <th className="py-2.5 px-3">Frekuensi</th>
                <th className="py-2.5 px-3">Rata-rata per Transaksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {categoryBreakdown.map((cat: any, i: number) => (
                <tr key={i} className="hover:bg-slate-800/40">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                      />
                      <span className="font-semibold text-white">{cat.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-rose-400">
                    {formatRupiah(cat.amount)}
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-rose-500 rounded-full"
                          style={{ width: `${cat.percentage}%` }}
                        />
                      </div>
                      <span className="font-mono text-slate-300">{cat.percentage}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-slate-400">{cat.count} transaksi</td>
                  <td className="py-3 px-3 font-mono text-slate-300">
                    {formatRupiah(cat.count > 0 ? cat.amount / cat.count : 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
