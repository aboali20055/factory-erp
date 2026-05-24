import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Search, Download, Eye } from 'lucide-react';
import { salesApi, financeApi } from '../../api';
import { Modal } from '../../components/ui/Modal';
import { Button, Input, Select, Badge, Table, Th, Td, LoadingSpinner, EmptyState } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import { formatCurrency, formatDate, today, getErrorMessage } from '../../utils';
import { ORDER_STATUS_LABELS } from '../../types';
import type { Sale, OrderStatus, SaleItem } from '../../types';
import * as XLSX from 'xlsx';

const STATUS_BADGE: Record<OrderStatus, 'green' | 'yellow' | 'blue'> = {
  DISPATCHED: 'green',
  NOT_DISPATCHED: 'yellow',
  CLIENT_ACCOUNT: 'blue',
};

const DELIVERY_METHODS = ['ايرجنت', 'مصنع', 'البريد', 'شحن موقف'];

interface SaleFormData {
  orderNumber: string;
  rowNumber: number;
  marketerName: string;
  clientName: string;
  clientMobile: string;
  invoiceValue: number;
  depositPaid: number;
  depositReceiverId: string;
  shippingNumber: string;
  shippingCollected: number;
  orderStatus: OrderStatus;
  deliveryMethod: string;
  warehouseLocation: string;
  notes: string;
  items: { modelCode: string; color: string; quantity: number; modelName: string }[];
}

const emptyForm = (): SaleFormData => ({
  orderNumber: '', rowNumber: 1, marketerName: '', clientName: '', clientMobile: '',
  invoiceValue: 0, depositPaid: 0, depositReceiverId: '', shippingNumber: '',
  shippingCollected: 0, orderStatus: 'NOT_DISPATCHED', deliveryMethod: '', warehouseLocation: '', notes: '',
  items: [{ modelCode: '', color: '', quantity: 1, modelName: '' }],
});

export default function SalesPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editSale, setEditSale] = useState<Sale | null>(null);
  const [viewSale, setViewSale] = useState<Sale | null>(null);
  const [form, setForm] = useState<SaleFormData>(emptyForm());

  const { data: salesData, isLoading } = useQuery({
    queryKey: ['sales', page, search],
    queryFn: () => salesApi.list({ page, limit: 50, search }),
  });

  const { data: partners = [] } = useQuery({
    queryKey: ['partners'],
    queryFn: financeApi.listPartners,
  });

  const createMutation = useMutation({
    mutationFn: salesApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sales'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); closeModal(); toast('تم إضافة الطلب بنجاح', 'success'); },
    onError: (err) => toast(getErrorMessage(err), 'error'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Sale> }) => salesApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sales'] }); closeModal(); toast('تم تحديث الطلب', 'success'); },
    onError: (err) => toast(getErrorMessage(err), 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: salesApi.remove,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sales'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); toast('تم حذف الطلب', 'success'); },
    onError: (err) => toast(getErrorMessage(err), 'error'),
  });

  const openCreate = () => { setEditSale(null); setForm(emptyForm()); setModalOpen(true); };
  const openEdit = (sale: Sale) => {
    setEditSale(sale);
    setForm({
      orderNumber: sale.orderNumber, rowNumber: sale.rowNumber,
      marketerName: sale.marketerName, clientName: sale.clientName,
      clientMobile: sale.clientMobile ?? '', invoiceValue: Number(sale.invoiceValue),
      depositPaid: Number(sale.depositPaid), depositReceiverId: String(sale.depositReceiverId ?? ''),
      shippingNumber: sale.shippingNumber ?? '', shippingCollected: Number(sale.shippingCollected),
      orderStatus: sale.orderStatus, deliveryMethod: sale.deliveryMethod ?? '',
      warehouseLocation: sale.warehouseLocation ?? '', notes: sale.notes ?? '',
      items: sale.items.map((it) => ({ modelCode: it.modelCode, color: it.color, quantity: it.quantity, modelName: it.modelName ?? '' })),
    });
    setModalOpen(true);
  };
  const closeModal = () => { setModalOpen(false); setEditSale(null); };

  const handleSubmit = () => {
    const payload = {
      ...form,
      depositReceiverId: form.depositReceiverId ? Number(form.depositReceiverId) : undefined,
      items: form.items.filter((it) => it.modelCode.trim()),
    };
    if (!payload.items.length) { toast('يجب إضافة منتج واحد على الأقل', 'error'); return; }
    if (editSale) {
      updateMutation.mutate({ id: editSale.id, data: payload });
    } else {
      createMutation.mutate(payload as any);
    }
  };

  const addItem = () => setForm((f) => ({ ...f, items: [...f.items, { modelCode: '', color: '', quantity: 1, modelName: '' }] }));
  const removeItem = (i: number) => setForm((f) => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));
  const updateItem = (i: number, field: string, value: string | number) => {
    setForm((f) => ({ ...f, items: f.items.map((it, idx) => idx === i ? { ...it, [field]: value } : it) }));
  };

  const exportExcel = () => {
    const rows = (salesData?.data ?? []).map((s: Sale) => ({
      'رقم الطلب': s.orderNumber, 'العميل': s.clientName, 'المسوق': s.marketerName,
      'قيمة الفاتورة': Number(s.invoiceValue), 'العربون': Number(s.depositPaid),
      'المتبقي': Number(s.remaining), 'الحالة': ORDER_STATUS_LABELS[s.orderStatus],
      'التاريخ': formatDate(s.createdAt),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'المبيعات');
    XLSX.writeFile(wb, `sales_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const sales: Sale[] = salesData?.data ?? [];
  const isMutating = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">بيان المبيعات</h1>
          <p className="text-sm text-gray-500 mt-0.5">{salesData?.meta?.total ?? 0} طلب</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" icon={<Download size={14} />} onClick={exportExcel}>
            تصدير Excel
          </Button>
          <Button icon={<Plus size={16} />} onClick={openCreate}>
            طلب جديد
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="بحث بالعميل، المسوق، رقم الطلب..."
          className="w-full pr-9 pl-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <LoadingSpinner />
      ) : sales.length === 0 ? (
        <EmptyState title="لا توجد طلبات" description="ابدأ بإضافة طلب جديد" />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>#</Th>
              <Th>رقم الطلب</Th>
              <Th>العميل</Th>
              <Th>المسوق</Th>
              <Th>المنتجات</Th>
              <Th>قيمة الفاتورة</Th>
              <Th>العربون</Th>
              <Th>المتبقي</Th>
              <Th>الحالة</Th>
              <Th>التاريخ</Th>
              <Th>إجراءات</Th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale) => (
              <tr key={sale.id} className="hover:bg-gray-50/50 transition-colors">
                <Td className="text-gray-400 text-xs">{sale.rowNumber}</Td>
                <Td className="font-mono text-xs">{sale.orderNumber}</Td>
                <Td className="font-medium">{sale.clientName}</Td>
                <Td>{sale.marketerName}</Td>
                <Td>
                  <div className="space-y-0.5">
                    {sale.items?.map((item, i) => (
                      <div key={i} className="text-xs text-gray-500">
                        {item.modelCode} / {item.color} × {item.quantity}
                      </div>
                    ))}
                  </div>
                </Td>
                <Td className="font-semibold tabular-nums">{formatCurrency(Number(sale.invoiceValue))}</Td>
                <Td className="text-emerald-600 tabular-nums">{formatCurrency(Number(sale.depositPaid))}</Td>
                <Td className={Number(sale.remaining) > 0 ? 'text-red-600 tabular-nums font-medium' : 'text-gray-400 tabular-nums'}>
                  {formatCurrency(Number(sale.remaining))}
                </Td>
                <Td>
                  <Badge variant={STATUS_BADGE[sale.orderStatus]}>
                    {ORDER_STATUS_LABELS[sale.orderStatus]}
                  </Badge>
                </Td>
                <Td className="text-xs text-gray-400 whitespace-nowrap">{formatDate(sale.createdAt)}</Td>
                <Td>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setViewSale(sale)} className="p-1.5 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors" title="عرض">
                      <Eye size={14} />
                    </button>
                    <button onClick={() => openEdit(sale)} className="p-1.5 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors" title="تعديل">
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => { if (confirm('هل تريد حذف هذا الطلب؟')) deleteMutation.mutate(sale.id); }}
                      className="p-1.5 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                      title="حذف"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {/* View Modal */}
      <Modal
        open={!!viewSale}
        onClose={() => setViewSale(null)}
        title={`تفاصيل الطلب — ${viewSale?.orderNumber}`}
        size="lg"
        footer={<Button variant="secondary" onClick={() => setViewSale(null)}>إغلاق</Button>}
      >
        {viewSale && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div><span className="text-gray-500">العميل:</span> <strong>{viewSale.clientName}</strong></div>
              <div><span className="text-gray-500">المسوق:</span> <strong>{viewSale.marketerName}</strong></div>
              <div><span className="text-gray-500">الهاتف:</span> <strong>{viewSale.clientMobile || '—'}</strong></div>
              <div><span className="text-gray-500">طريقة التسليم:</span> <strong>{viewSale.deliveryMethod || '—'}</strong></div>
              <div><span className="text-gray-500">قيمة الفاتورة:</span> <strong className="text-indigo-600">{formatCurrency(Number(viewSale.invoiceValue))}</strong></div>
              <div><span className="text-gray-500">العربون:</span> <strong className="text-emerald-600">{formatCurrency(Number(viewSale.depositPaid))}</strong></div>
              <div><span className="text-gray-500">المتبقي:</span> <strong className="text-red-600">{formatCurrency(Number(viewSale.remaining))}</strong></div>
              <div><span className="text-gray-500">الحالة:</span> <Badge variant={STATUS_BADGE[viewSale.orderStatus]}>{ORDER_STATUS_LABELS[viewSale.orderStatus]}</Badge></div>
            </div>
            <div>
              <p className="text-gray-500 font-medium mb-2">المنتجات:</p>
              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead><tr className="bg-gray-50"><th className="text-right px-4 py-2">الكود</th><th className="text-right px-4 py-2">اللون</th><th className="text-right px-4 py-2">الكمية</th></tr></thead>
                  <tbody>
                    {viewSale.items?.map((item, i) => (
                      <tr key={i} className="border-t border-gray-100">
                        <td className="px-4 py-2">{item.modelCode}</td>
                        <td className="px-4 py-2">{item.color}</td>
                        <td className="px-4 py-2 font-semibold">{item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editSale ? 'تعديل الطلب' : 'إضافة طلب جديد'}
        size="xl"
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>إلغاء</Button>
            <Button onClick={handleSubmit} loading={isMutating}>
              {editSale ? 'حفظ التعديلات' : 'إضافة الطلب'}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="رقم الطلب" value={form.orderNumber} onChange={(e) => setForm({ ...form, orderNumber: e.target.value })} required />
            <Input label="رقم الصف" type="number" value={form.rowNumber} onChange={(e) => setForm({ ...form, rowNumber: Number(e.target.value) })} required />
            <Input label="اسم العميل" value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} required />
            <Input label="هاتف العميل" value={form.clientMobile} onChange={(e) => setForm({ ...form, clientMobile: e.target.value })} />
            <Input label="اسم المسوق" value={form.marketerName} onChange={(e) => setForm({ ...form, marketerName: e.target.value })} required />
            <Select
              label="حالة الطلب"
              value={form.orderStatus}
              onChange={(e) => setForm({ ...form, orderStatus: e.target.value as OrderStatus })}
              options={Object.entries(ORDER_STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }))}
            />
            <Input label="قيمة الفاتورة" type="number" value={form.invoiceValue} onChange={(e) => setForm({ ...form, invoiceValue: Number(e.target.value) })} required />
            <Input label="العربون" type="number" value={form.depositPaid} onChange={(e) => setForm({ ...form, depositPaid: Number(e.target.value) })} />
            <Select
              label="مستلم العربون"
              value={form.depositReceiverId}
              onChange={(e) => setForm({ ...form, depositReceiverId: e.target.value })}
              placeholder="— اختر —"
              options={partners.map((p) => ({ value: p.id, label: p.name }))}
            />
            <Select
              label="طريقة التسليم"
              value={form.deliveryMethod}
              onChange={(e) => setForm({ ...form, deliveryMethod: e.target.value })}
              placeholder="— اختر —"
              options={DELIVERY_METHODS.map((m) => ({ value: m, label: m }))}
            />
            <Input label="رقم الشحن" value={form.shippingNumber} onChange={(e) => setForm({ ...form, shippingNumber: e.target.value })} />
            <Input label="مصاريف الشحن" type="number" value={form.shippingCollected} onChange={(e) => setForm({ ...form, shippingCollected: Number(e.target.value) })} />
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-700">المنتجات</h3>
              <Button variant="outline" size="sm" icon={<Plus size={12} />} onClick={addItem}>إضافة منتج</Button>
            </div>
            <div className="space-y-3">
              {form.items.map((item, i) => (
                <div key={i} className="grid grid-cols-4 gap-2 items-end p-3 bg-gray-50 rounded-lg">
                  <Input label={i === 0 ? 'كود الموديل' : undefined} placeholder="M001" value={item.modelCode} onChange={(e) => updateItem(i, 'modelCode', e.target.value)} />
                  <Input label={i === 0 ? 'اللون' : undefined} placeholder="أبيض" value={item.color} onChange={(e) => updateItem(i, 'color', e.target.value)} />
                  <Input label={i === 0 ? 'الكمية' : undefined} type="number" min={1} value={item.quantity} onChange={(e) => updateItem(i, 'quantity', Number(e.target.value))} />
                  {form.items.length > 1 && (
                    <Button variant="danger" size="sm" onClick={() => removeItem(i)}>حذف</Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <Input label="ملاحظات" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />

          {/* Invoice summary */}
          <div className="bg-indigo-50 rounded-xl p-4 text-sm">
            <div className="flex justify-between mb-1">
              <span className="text-gray-600">قيمة الفاتورة</span>
              <span className="font-semibold">{formatCurrency(form.invoiceValue)}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span className="text-gray-600">العربون المدفوع</span>
              <span className="font-semibold text-emerald-600">− {formatCurrency(form.depositPaid)}</span>
            </div>
            <div className="flex justify-between border-t border-indigo-200 pt-2 mt-2">
              <span className="font-bold">المتبقي</span>
              <span className="font-bold text-red-600">{formatCurrency(Math.max(0, form.invoiceValue - form.depositPaid))}</span>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
