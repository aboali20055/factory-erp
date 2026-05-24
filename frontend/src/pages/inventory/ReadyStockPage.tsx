import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search, Box, Edit, Trash2 } from 'lucide-react';
import { inventoryApi } from '../../api';
import { ReadyStock } from '../../types';
import {
  Button, Input, StatCard, LoadingSpinner, EmptyState, Table, Th, Td,
} from '../../components/ui';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { formatCurrency, getErrorMessage } from '../../utils';

const schema = z.object({
  modelCode: z.string().min(1, 'كود الموديل مطلوب'),
  productName: z.string().min(1, 'اسم المنتج مطلوب'),
  color: z.string().min(1, 'اللون مطلوب'),
  openingBalance: z.coerce.number().int().min(0).default(0),
  costPerPiece: z.coerce.number().min(0).default(0),
  location: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function ReadyStockPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ReadyStock | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ReadyStock | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['ready-stock'],
    queryFn: () => inventoryApi.listReadyStock(),
  });

  const filtered = items.filter(i =>
    !search || i.productName?.includes(search) || i.modelCode?.includes(search) || i.color?.includes(search)
  );

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { openingBalance: 0, costPerPiece: 0 },
  });

  const openCreate = () => { reset({ openingBalance: 0, costPerPiece: 0 }); setEditing(null); setModalOpen(true); };
  const openEdit = (s: ReadyStock) => {
    reset({
      modelCode: s.modelCode,
      productName: s.productName,
      color: s.color,
      openingBalance: s.openingBalance,
      costPerPiece: s.costPerPiece,
      location: s.location ?? '',
    });
    setEditing(s);
    setModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: (d: FormData) =>
      editing ? inventoryApi.updateReadyStock(editing.id, d) : inventoryApi.createReadyStock(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ready-stock'] });
      toast(editing ? 'تم التحديث' : 'تمت الإضافة', 'success');
      setModalOpen(false);
    },
    onError: (e) => toast(getErrorMessage(e), 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => inventoryApi.deleteReadyStock(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ready-stock'] });
      toast('تم الحذف', 'success');
      setDeleteTarget(null);
    },
    onError: (e) => toast(getErrorMessage(e), 'error'),
  });

  const totalItems = items.reduce((s, i) => s + i.openingBalance, 0);
  const totalValue = items.reduce((s, i) => s + i.openingBalance * i.costPerPiece, 0);

  return (
    <div dir="rtl" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">المخزون الجاهز</h1>
          <p className="text-sm text-gray-500 mt-1">إدارة المخزون الجاهز للبيع</p>
        </div>
        <Button onClick={openCreate} icon={<Plus className="w-4 h-4" />}>إضافة صنف</Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard title="عدد الأصناف" value={items.length} icon={<Box className="w-5 h-5" />} color="blue" />
        <StatCard title="إجمالي الوحدات" value={totalItems} icon={<Box className="w-5 h-5" />} color="green" />
        <StatCard title="قيمة المخزون (ج)" value={formatCurrency(totalValue)} icon={<Box className="w-5 h-5" />} color="purple" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              className="w-full pr-9 pl-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="بحث بالاسم أو الكود أو اللون..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><LoadingSpinner /></div>
        ) : filtered.length === 0 ? (
          <EmptyState title="لا توجد أصناف" description="ابدأ بإضافة صنف جديد" />
        ) : (
          <Table>
            <thead>
              <tr className="bg-gray-50">
                <Th>كود الموديل</Th><Th>اسم المنتج</Th><Th>اللون</Th>
                <Th>الرصيد الافتتاحي</Th><Th>تكلفة القطعة (ج)</Th><Th>القيمة الإجمالية (ج)</Th><Th>الموقع</Th><Th>إجراءات</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(item => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <Td className="font-mono text-sm">{item.modelCode}</Td>
                  <Td className="font-medium">{item.productName}</Td>
                  <Td>{item.color}</Td>
                  <Td>{item.openingBalance.toLocaleString()}</Td>
                  <Td>{formatCurrency(item.costPerPiece)}</Td>
                  <Td className="font-semibold">{formatCurrency(item.openingBalance * item.costPerPiece)}</Td>
                  <Td className="text-gray-500">{item.location ?? '—'}</Td>
                  <Td>
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteTarget(item)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'تعديل صنف' : 'إضافة صنف'} size="md">
        <form onSubmit={handleSubmit(d => saveMutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="كود الموديل" {...register('modelCode')} error={errors.modelCode?.message} />
            <Input label="اسم المنتج" {...register('productName')} error={errors.productName?.message} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="اللون" {...register('color')} error={errors.color?.message} />
            <Input label="الموقع (اختياري)" {...register('location')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="الرصيد الافتتاحي" type="number" {...register('openingBalance')} />
            <Input label="تكلفة القطعة (ج)" type="number" step="0.01" {...register('costPerPiece')} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>إلغاء</Button>
            <Button type="submit" loading={isSubmitting || saveMutation.isPending}>
              {editing ? 'حفظ' : 'إضافة'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="تأكيد الحذف" size="sm">
        <p className="text-gray-600 mb-6">حذف الصنف <strong>{deleteTarget?.productName} — {deleteTarget?.color}</strong>؟</p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>إلغاء</Button>
          <Button variant="danger" loading={deleteMutation.isPending} onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}>حذف</Button>
        </div>
      </Modal>
    </div>
  );
}
