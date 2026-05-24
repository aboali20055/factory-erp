import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp, TrendingDown, Wallet, AlertTriangle,
  DollarSign, ShoppingCart, Package, ArrowLeftRight, Bell,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { dashboardApi } from '../api';
import { StatCard, LoadingSpinner, Badge } from '../components/ui';
import { formatCurrency, formatDate } from '../utils';
import type { OrderStatus } from '../types';

const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const STATUS_LABELS: Record<string, string> = {
  DISPATCHED: 'تم الصرف',
  NOT_DISPATCHED: 'لم يتم الصرف',
  CLIENT_ACCOUNT: 'حساب عميل',
};

const STATUS_BADGE: Record<string, 'green' | 'yellow' | 'blue'> = {
  DISPATCHED: 'green',
  NOT_DISPATCHED: 'yellow',
  CLIENT_ACCOUNT: 'blue',
};

export default function DashboardPage() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.getMetrics,
    refetchInterval: 30_000, // Refetch every 30s — not every 1.5s!
  });

  if (isLoading) return <LoadingSpinner text="جاري تحميل لوحة التحكم..." />;
  if (!metrics) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">لوحة التحكم</h1>
          <p className="text-sm text-gray-500 mt-0.5">{new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        {metrics.inventoryAlerts.length > 0 && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
            <Bell size={16} className="text-amber-600" />
            <span className="text-sm text-amber-700 font-medium">
              {metrics.inventoryAlerts.length} تنبيه مخزن
            </span>
          </div>
        )}
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="إجمالي المبيعات"
          value={metrics.totalSales}
          icon={<ShoppingCart size={20} />}
          colorClass="bg-blue-500"
          trend="neutral"
        />
        <StatCard
          title="إجمالي المصاريف"
          value={metrics.totalExpenses}
          icon={<TrendingDown size={20} />}
          colorClass="bg-red-500"
          trend="down"
        />
        <StatCard
          title="صافي الربح"
          value={metrics.netProfit}
          icon={metrics.netProfit >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
          colorClass={metrics.netProfit >= 0 ? 'bg-emerald-500' : 'bg-red-500'}
          trend={metrics.netProfit >= 0 ? 'up' : 'down'}
        />
        <StatCard
          title="الديون المتبقية"
          value={metrics.remainingDebts}
          icon={<AlertTriangle size={20} />}
          colorClass="bg-amber-500"
          trend={metrics.remainingDebts > 0 ? 'down' : 'neutral'}
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="الكاش المتاح"
          value={metrics.cashAvailable}
          subtitle="الوارد − المصاريف − الديون"
          icon={<Wallet size={20} />}
          colorClass={metrics.cashAvailable >= 0 ? 'bg-indigo-500' : 'bg-red-500'}
          trend={metrics.cashAvailable >= 0 ? 'up' : 'down'}
        />
        <StatCard
          title="المستحقات للتحصيل"
          value={metrics.moneyOwedToUs}
          subtitle="مبيعات غير مصروفة + حسابات عملاء"
          icon={<DollarSign size={20} />}
          colorClass="bg-purple-500"
          trend="neutral"
        />
        <StatCard
          title="إجمالي الأصول المتداولة"
          value={metrics.totalCurrentAssets}
          subtitle="مخزون + مستحقات + نقدية"
          icon={<Package size={20} />}
          colorClass="bg-teal-500"
          trend="neutral"
        />
      </div>

      {/* Partners Summary */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <ArrowLeftRight size={18} className="text-indigo-600" />
          <h2 className="font-bold text-gray-800">ملخص الشركاء</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-right px-6 py-3 font-semibold text-gray-600">الشريك</th>
                <th className="text-center px-6 py-3 font-semibold text-gray-600">إجمالي الوارد</th>
                <th className="text-center px-6 py-3 font-semibold text-gray-600">إجمالي الصادر</th>
                <th className="text-center px-6 py-3 font-semibold text-gray-600">الصافي</th>
              </tr>
            </thead>
            <tbody>
              {metrics.partnerSummaries.map((partner) => (
                <tr key={partner.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-3.5 font-semibold text-gray-800">{partner.name}</td>
                  <td className="px-6 py-3.5 text-center text-emerald-600 font-semibold tabular-nums">
                    {formatCurrency(partner.totalIn)}
                  </td>
                  <td className="px-6 py-3.5 text-center text-red-600 font-semibold tabular-nums">
                    {formatCurrency(partner.totalOut)}
                  </td>
                  <td className={`px-6 py-3.5 text-center font-bold tabular-nums ${partner.net >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                    {formatCurrency(partner.net)}
                  </td>
                </tr>
              ))}
              {/* Total row */}
              <tr className="border-t-2 border-gray-200 bg-gray-50 font-bold">
                <td className="px-6 py-3.5 text-gray-700">الإجمالي</td>
                <td className="px-6 py-3.5 text-center text-emerald-700 tabular-nums">
                  {formatCurrency(metrics.partnerSummaries.reduce((s, p) => s + p.totalIn, 0))}
                </td>
                <td className="px-6 py-3.5 text-center text-red-700 tabular-nums">
                  {formatCurrency(metrics.partnerSummaries.reduce((s, p) => s + p.totalOut, 0))}
                </td>
                <td className={`px-6 py-3.5 text-center tabular-nums ${metrics.netProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                  {formatCurrency(metrics.netProfit)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales by Marketer Pie Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-4">المبيعات حسب المسوق</h3>
          {metrics.salesByMarketer.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={metrics.salesByMarketer}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {metrics.salesByMarketer.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-60 flex items-center justify-center text-gray-400 text-sm">لا توجد بيانات</div>
          )}
        </div>

        {/* Order Status Bar Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-4">حالة الطلبات</h3>
          {metrics.orderStatusCounts.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={metrics.orderStatusCounts} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" name="عدد الطلبات" radius={[6, 6, 0, 0]}>
                  {metrics.orderStatusCounts.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-60 flex items-center justify-center text-gray-400 text-sm">لا توجد بيانات</div>
          )}
        </div>
      </div>

      {/* Recent Sales + Inventory Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-800">آخر الطلبات</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {metrics.recentSales.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-8">لا توجد طلبات</p>
            )}
            {metrics.recentSales.map((sale) => (
              <div key={sale.id} className="px-6 py-3.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-gray-800 text-sm truncate">{sale.clientName}</p>
                  <p className="text-xs text-gray-400">{sale.orderNumber} · {formatDate(sale.createdAt)}</p>
                </div>
                <div className="text-left flex-shrink-0 flex flex-col items-end gap-1">
                  <span className="font-bold text-gray-800 tabular-nums text-sm">{formatCurrency(sale.invoiceValue)}</span>
                  <Badge variant={STATUS_BADGE[sale.orderStatus as OrderStatus] ?? 'gray'}>
                    {STATUS_LABELS[sale.orderStatus] ?? sale.orderStatus}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Inventory Alerts */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-500" />
            <h3 className="font-bold text-gray-800">تنبيهات المخزون</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {metrics.inventoryAlerts.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-8">✅ المخزون بحالة جيدة</p>
            )}
            {metrics.inventoryAlerts.map((alert, i) => (
              <div key={i} className="px-6 py-3.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-gray-800 text-sm truncate">{alert.productName}</p>
                  <p className="text-xs text-gray-400">{alert.modelCode} · {alert.color}</p>
                </div>
                <Badge variant={alert.type === 'negative_stock' ? 'red' : 'yellow'}>
                  {alert.currentBalance} قطعة
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
