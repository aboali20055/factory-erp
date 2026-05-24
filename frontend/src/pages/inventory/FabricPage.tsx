import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search, Layers, Edit, Trash2 } from 'lucide-react';
import { inventoryApi } from '../../api';
import { FabricEntry } from '../../types';
import {
  Button, Input, StatCard, LoadingSpinner, EmptyState, Table, Th, Td,
} from '../../components/ui';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { formatDate, formatDateInput, today, formatCurrency, getErrorMessage } from '../../utils';

const schema = z.object({
  materialType: z.string().min(1, 'نوع القماش مطلوب'),
  color: z.string().min(1, 'اللون مطلوب'),
  qtyIn: z.coerce.number().positive('الكمية يجب أن تكون موجبة'),
  costPerKg: z.coerce.number().positive('السعر يجب أن يكون موجبًا'),
  date: z.string().min(1, 'التاريخ مطلوب'),
  notes: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function FabricPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FabricEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FabricEntry | null>(null);

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['fabric'],
    queryFn: () => inventoryApi.listFabric(),
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { date: today() },
  });

  const filtered = entries.filter(e =>
    !search || e.materialType?.includes(search) || e.color?.includes(search)
  );

  const openCreate = () => { reset({ date: today() }); setEditing(null); setModalOpen(true); };
  const openEdit = (f: FabricEntry) => {
    reset({
      materialType: f.materialType,
      color: f.color,
      qtyIn: f.qtyIn,
      costPerKg: f.costPerKg,
      date: formatDateInput(f.date),
      notes: f.notes ?? '',
    });
    setEditing(f);
    setModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: (d: FormData) =>
      editing ? inventoryApi.updateFabric(editing.id, d) : inventoryApi.createFabric(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fabric'] });
      toast(editing ? 'تم التحديث' : 'تمت الإضافة', 'success');
      setModalOpen(false);
    },
    onError: (e) => toast(getErrorMessage(e), 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => inventoryApi.deleteFabric(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fabric'] });
      toast('تم الحذف', 'success');
      setDeleteTarget(null);
    },
    onError: (e) => toast(getErrorMessage(e), 'error'),
  });

  const totalQty = entries.reduce((s, e) => s + e.qtyIn, 0);
  const totalValue = entries.reduce((s, e) => s + e.qtyIn * e.costPerKg, 0);

  return (
    <div dir="rtl" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">مخزن الأقمشة</h1>
          <p className="text-sm text-gray-500 mt-1">إدارة وارد الأقمشة</p>
        </div>
        <Button onClick={openCreate} icon={<Plus className="w-4 h-4" />}>إضافة قماش</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard title="إجمالي الوارد (كجم)" value={totalQty} icon={<Layers className="w-5 h-5" />} color="blue" />
        <StatCard title="عدد السجلات" value={entries.length} icon={<Layers className="w-5 h-5" />} color="green" />
        <StatCard title="قيمة المخزون (ج)" value={formatCurrency(totalValue)} icon={<Layers className="w-5 h-5" />} color="purple" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              className="w-full pr-9 pl-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="بحث بنوع القماش أو اللون..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><LoadingSpinner /></div>
        ) : filtered.length === 0 ? (
          <EmptyState title="لا توجد سجلات أقمشة" description="ابدأ بإضافة قماش جديد" />
        ) : (
          <Table>
            <thead>
              <tr className="bg-gray-50">
                <Th>نوع القماش</Th><Th>اللون</Th><Th>الكمية (كجم)</Th>
                <Th>سعر الكجم (ج)</Th><Th>القيمة (ج)</Th><Th>التاريخ</Th><Th>إجراءات</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(e => (
                <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                  <Td className="font-medium">{e.materialType}</Td>
                  <Td>{e.color}</Td>
                  <Td>{e.qtyIn.toLocaleString()}</Td>
                  <Td>{e.costPerKg.toLocaleString()} ج</Td>
                  <Td>{formatCurrency(e.qtyIn * e.costPerKg)}</Td>
                  <Td>{formatDate(e.date)}</Td>
                  <Td>
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(e)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteTarget(e)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'تعديل سجل قماش' : 'إضافة قماش'} size="md">
        <form onSubmit={handleSubmit(d => saveMutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="نوع القماش" {...register('materialType')} error={errors.materialType?.message} />
            <Input label="اللون" {...register('color')} error={errors.color?.message} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="الكمية (كجم)" type="number" step="0.01" {...register('qtyIn')} error={errors.qtyIn?.message} />
            <Input label="سعر الكجم (ج)" type="number" step="0.01" {...register('costPerKg')} error={errors.costPerKg?.message} />
          </div>
          <Input label="تاريخ الوارد" type="date" {...register('date')} error={errors.date?.message} />
          <Input label="ملاحظات (اختياري)" {...register('notes')} />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>إلغاء</Button>
            <Button type="submit" loading={isSubmitting || saveMutation.isPending}>
              {editing ? 'حفظ' : 'إضافة'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="تأكيد الحذف" size="sm">
        <p className="text-gray-600 mb-6">
          حذف سجل القماش <strong>{deleteTarget?.materialType} — {deleteTarget?.color}</strong>؟
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>إلغاء</Button>
          <Button variant="danger" loading={deleteMutation.isPending} onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}>حذف</Button>
        </div>
      </Modal>
    </div>
  );
}
