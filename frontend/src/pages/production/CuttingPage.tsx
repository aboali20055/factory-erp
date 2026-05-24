import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search, Scissors, Edit, Trash2 } from 'lucide-react';
import { productionApi } from '../../api';
import { CuttingOrder } from '../../types';
import {
  Button, Input, StatCard, LoadingSpinner, EmptyState, Table, Th, Td,
} from '../../components/ui';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { formatDate, formatDateInput, today, getErrorMessage } from '../../utils';

const schema = z.object({
  cutNumber: z.coerce.number().int().positive('رقم القص مطلوب'),
  cutDescription: z.string().min(1, 'وصف القص مطلوب'),
  materialType: z.string().min(1, 'نوع القماش مطلوب'),
  color: z.string().min(1, 'اللون مطلوب'),
  layersCount: z.coerce.number().int().positive('عدد الطبقات مطلوب'),
  spreadLengthM: z.coerce.number().positive('طول الفرشة مطلوب'),
  totalPieces: z.coerce.number().int().positive('عدد القطع مطلوب'),
  kgConsumed: z.coerce.number().positive('القماش المستهلك مطلوب'),
  date: z.string().min(1, 'التاريخ مطلوب'),
  notes: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function CuttingPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CuttingOrder | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CuttingOrder | null>(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['cutting'],
    queryFn: () => productionApi.listCutting(),
  });

  const filtered = orders.filter(o =>
    !search || o.cutDescription?.includes(search) || o.materialType?.includes(search) || String(o.cutNumber).includes(search)
  );

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { date: today() },
  });

  const openCreate = () => { reset({ date: today() }); setEditing(null); setModalOpen(true); };
  const openEdit = (o: CuttingOrder) => {
    reset({
      cutNumber: o.cutNumber,
      cutDescription: o.cutDescription,
      materialType: o.materialType,
      color: o.color,
      layersCount: o.layersCount,
      spreadLengthM: o.spreadLengthM,
      totalPieces: o.totalPieces,
      kgConsumed: o.kgConsumed,
      date: formatDateInput(o.date),
      notes: o.notes ?? '',
    });
    setEditing(o);
    setModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: (d: FormData) =>
      editing ? productionApi.updateCutting(editing.id, d) : productionApi.createCutting(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cutting'] });
      toast(editing ? 'تم تحديث أمر القص' : 'تم إنشاء أمر القص', 'success');
      setModalOpen(false);
    },
    onError: (e) => toast(getErrorMessage(e), 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => productionApi.deleteCutting(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cutting'] });
      toast('تم الحذف', 'success');
      setDeleteTarget(null);
    },
    onError: (e) => toast(getErrorMessage(e), 'error'),
  });

  const totalPieces = orders.reduce((s, o) => s + o.totalPieces, 0);
  const totalKg = orders.reduce((s, o) => s + o.kgConsumed, 0);

  return (
    <div dir="rtl" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">أوامر القص</h1>
          <p className="text-sm text-gray-500 mt-1">إدارة عمليات القص</p>
        </div>
        <Button onClick={openCreate} icon={<Plus className="w-4 h-4" />}>أمر قص جديد</Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard title="عدد أوامر القص" value={orders.length} icon={<Scissors className="w-5 h-5" />} color="blue" />
        <StatCard title="إجمالي القطع" value={totalPieces} icon={<Scissors className="w-5 h-5" />} color="green" />
        <StatCard title="إجمالي القماش (كجم)" value={totalKg} icon={<Scissors className="w-5 h-5" />} color="yellow" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              className="w-full pr-9 pl-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="بحث بالوصف أو نوع القماش..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><LoadingSpinner /></div>
        ) : filtered.length === 0 ? (
          <EmptyState title="لا توجد أوامر قص" description="ابدأ بإضافة أمر قص جديد" />
        ) : (
          <Table>
            <thead>
              <tr className="bg-gray-50">
                <Th>رقم القص</Th><Th>الوصف</Th><Th>نوع القماش</Th><Th>اللون</Th>
                <Th>عدد الطبقات</Th><Th>طول الفرشة (م)</Th><Th>القطع</Th><Th>القماش (كجم)</Th><Th>التاريخ</Th><Th>إجراءات</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(o => (
                <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                  <Td className="font-mono font-semibold">{o.cutNumber}</Td>
                  <Td>{o.cutDescription}</Td>
                  <Td>{o.materialType}</Td>
                  <Td>{o.color}</Td>
                  <Td>{o.layersCount}</Td>
                  <Td>{o.spreadLengthM}</Td>
                  <Td className="font-semibold text-indigo-700">{o.totalPieces.toLocaleString()}</Td>
                  <Td>{o.kgConsumed}</Td>
                  <Td>{formatDate(o.date)}</Td>
                  <Td>
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(o)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteTarget(o)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'تعديل أمر القص' : 'أمر قص جديد'} size="lg">
        <form onSubmit={handleSubmit(d => saveMutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="رقم القص" type="number" {...register('cutNumber')} error={errors.cutNumber?.message} />
            <Input label="التاريخ" type="date" {...register('date')} error={errors.date?.message} />
          </div>
          <Input label="وصف القص" {...register('cutDescription')} error={errors.cutDescription?.message} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="نوع القماش" {...register('materialType')} error={errors.materialType?.message} />
            <Input label="اللون" {...register('color')} error={errors.color?.message} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="عدد الطبقات" type="number" {...register('layersCount')} error={errors.layersCount?.message} />
            <Input label="طول الفرشة (م)" type="number" step="0.01" {...register('spreadLengthM')} error={errors.spreadLengthM?.message} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="عدد القطع الكلي" type="number" {...register('totalPieces')} error={errors.totalPieces?.message} />
            <Input label="القماش المستهلك (كجم)" type="number" step="0.01" {...register('kgConsumed')} error={errors.kgConsumed?.message} />
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
        <p className="text-gray-600 mb-6">حذف أمر القص رقم <strong>{deleteTarget?.cutNumber}</strong>؟</p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>إلغاء</Button>
          <Button variant="danger" loading={deleteMutation.isPending} onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}>حذف</Button>
        </div>
      </Modal>
    </div>
  );
}
