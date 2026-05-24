import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search, Tag, Edit, Trash2 } from 'lucide-react';
import { inventoryApi } from '../../api';
import { AccessoryEntry } from '../../types';
import {
  Button, Input, StatCard, LoadingSpinner, EmptyState, Table, Th, Td,
} from '../../components/ui';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { formatDate, formatDateInput, today, formatCurrency, getErrorMessage } from '../../utils';

const schema = z.object({
  itemName: z.string().min(1, 'اسم المادة مطلوب'),
  qtyIn: z.coerce.number().positive('الكمية يجب أن تكون موجبة'),
  qtyConsumed: z.coerce.number().min(0).default(0),
  cost: z.coerce.number().min(0).default(0),
  date: z.string().min(1, 'التاريخ مطلوب'),
  notes: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function AccessoriesPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AccessoryEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AccessoryEntry | null>(null);

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['accessories'],
    queryFn: () => inventoryApi.listAccessories(),
  });

  const filtered = entries.filter(e =>
    !search || e.itemName?.includes(search)
  );

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { date: today(), qtyConsumed: 0, cost: 0 },
  });

  const openCreate = () => { reset({ date: today(), qtyConsumed: 0, cost: 0 }); setEditing(null); setModalOpen(true); };
  const openEdit = (a: AccessoryEntry) => {
    reset({
      itemName: a.itemName,
      qtyIn: a.qtyIn,
      qtyConsumed: a.qtyConsumed,
      cost: a.cost,
      date: formatDateInput(a.date),
      notes: a.notes ?? '',
    });
    setEditing(a);
    setModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: (d: FormData) =>
      editing ? inventoryApi.updateAccessory(editing.id, d) : inventoryApi.createAccessory(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accessories'] });
      toast(editing ? 'تم التحديث' : 'تمت الإضافة', 'success');
      setModalOpen(false);
    },
    onError: (e) => toast(getErrorMessage(e), 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => inventoryApi.deleteAccessory(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accessories'] });
      toast('تم الحذف', 'success');
      setDeleteTarget(null);
    },
    onError: (e) => toast(getErrorMessage(e), 'error'),
  });

  const totalValue = entries.reduce((s, e) => s + e.qtyIn * e.cost, 0);
  const totalConsumed = entries.reduce((s, e) => s + e.qtyConsumed, 0);

  return (
    <div dir="rtl" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">مخزن الاكسسوارات</h1>
          <p className="text-sm text-gray-500 mt-1">إدارة الاكسسوارات والمستلزمات</p>
        </div>
        <Button onClick={openCreate} icon={<Plus className="w-4 h-4" />}>إضافة صنف</Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard title="عدد الأصناف" value={entries.length} icon={<Tag className="w-5 h-5" />} color="blue" />
        <StatCard title="إجمالي المستهلك" value={totalConsumed} icon={<Tag className="w-5 h-5" />} color="yellow" />
        <StatCard title="قيمة المخزون (ج)" value={formatCurrency(totalValue)} icon={<Tag className="w-5 h-5" />} color="green" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              className="w-full pr-9 pl-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="بحث باسم الصنف..."
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
                <Th>اسم الصنف</Th><Th>الوارد</Th><Th>المستهلك</Th>
                <Th>المتبقي</Th><Th>التكلفة/وحدة</Th><Th>التاريخ</Th><Th>إجراءات</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(e => {
                const remaining = e.qtyIn - e.qtyConsumed;
                return (
                  <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                    <Td className="font-medium">{e.itemName}</Td>
                    <Td>{e.qtyIn.toLocaleString()}</Td>
                    <Td className="text-yellow-700">{e.qtyConsumed.toLocaleString()}</Td>
                    <Td className={remaining <= 0 ? 'text-red-600 font-semibold' : 'text-green-700 font-medium'}>
                      {remaining.toLocaleString()}
                    </Td>
                    <Td>{formatCurrency(e.cost)}</Td>
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
                );
              })}
            </tbody>
          </Table>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'تعديل صنف' : 'إضافة صنف'} size="md">
        <form onSubmit={handleSubmit(d => saveMutation.mutate(d))} className="space-y-4">
          <Input label="اسم الصنف" {...register('itemName')} error={errors.itemName?.message} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="الكمية الواردة" type="number" step="0.01" {...register('qtyIn')} error={errors.qtyIn?.message} />
            <Input label="الكمية المستهلكة" type="number" step="0.01" {...register('qtyConsumed')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="التكلفة/وحدة (ج)" type="number" step="0.01" {...register('cost')} />
            <Input label="التاريخ" type="date" {...register('date')} error={errors.date?.message} />
          </div>
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
        <p className="text-gray-600 mb-6">حذف الصنف <strong>{deleteTarget?.itemName}</strong>؟</p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>إلغاء</Button>
          <Button variant="danger" loading={deleteMutation.isPending} onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}>حذف</Button>
        </div>
      </Modal>
    </div>
  );
}
