import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search, Package, Edit, Trash2 } from 'lucide-react';
import { productionApi } from '../../api';
import { ModelProduction, PRODUCTION_STATUS_LABELS } from '../../types';
import {
  Button, Input, Select, Badge, StatCard, LoadingSpinner, EmptyState, Table, Th, Td,
} from '../../components/ui';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { formatDate, formatDateInput, today, getErrorMessage } from '../../utils';

const schema = z.object({
  cuttingOrderId: z.coerce.number().int().positive('أمر القص مطلوب'),
  modelCode: z.string().min(1, 'كود الموديل مطلوب'),
  modelDescription: z.string().min(1, 'وصف الموديل مطلوب'),
  color: z.string().min(1, 'اللون مطلوب'),
  sizes: z.string().optional(),
  qtyFromCutting: z.coerce.number().int().positive('الكمية من القص مطلوبة'),
  status: z.enum(['IN_PROGRESS', 'COMPLETED', 'DEFECTIVE']),
  wastage: z.coerce.number().int().min(0).default(0),
  qtyReceived: z.coerce.number().int().min(0).optional(),
  date: z.string().min(1, 'التاريخ مطلوب'),
  notes: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const STATUS_VARIANTS: Record<string, 'default' | 'success' | 'danger'> = {
  IN_PROGRESS: 'default',
  COMPLETED: 'success',
  DEFECTIVE: 'danger',
};

export default function ModelProductionPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ModelProduction | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ModelProduction | null>(null);

  const { data: productions = [], isLoading } = useQuery({
    queryKey: ['model-production'],
    queryFn: () => productionApi.listModelProd(),
  });

  const { data: cuttingOrders = [] } = useQuery({
    queryKey: ['cutting'],
    queryFn: () => productionApi.listCutting(),
  });

  const filtered = productions.filter(p =>
    !search || p.modelDescription?.includes(search) || p.modelCode?.includes(search)
  );

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { date: today(), status: 'IN_PROGRESS', wastage: 0 },
  });

  const openCreate = () => { reset({ date: today(), status: 'IN_PROGRESS', wastage: 0 }); setEditing(null); setModalOpen(true); };
  const openEdit = (p: ModelProduction) => {
    reset({
      cuttingOrderId: p.cuttingOrderId,
      modelCode: p.modelCode,
      modelDescription: p.modelDescription,
      color: p.color,
      sizes: p.sizes ?? '',
      qtyFromCutting: p.qtyFromCutting,
      status: p.status,
      wastage: p.wastage,
      qtyReceived: p.qtyReceived,
      date: formatDateInput(p.date),
      notes: p.notes ?? '',
    });
    setEditing(p);
    setModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: (d: FormData) =>
      editing ? productionApi.updateModelProd(editing.id, d) : productionApi.createModelProd(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['model-production'] });
      toast(editing ? 'تم التحديث' : 'تم الإنشاء', 'success');
      setModalOpen(false);
    },
    onError: (e) => toast(getErrorMessage(e), 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => productionApi.deleteModelProd(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['model-production'] });
      toast('تم الحذف', 'success');
      setDeleteTarget(null);
    },
    onError: (e) => toast(getErrorMessage(e), 'error'),
  });

  const completed = productions.filter(p => p.status === 'COMPLETED').length;
  const totalQty = productions.reduce((s, p) => s + p.qtyFromCutting, 0);

  return (
    <div dir="rtl" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إنتاج الموديلات</h1>
          <p className="text-sm text-gray-500 mt-1">متابعة إنتاج الموديلات من القص للمخزن</p>
        </div>
        <Button onClick={openCreate} icon={<Plus className="w-4 h-4" />}>إنتاج جديد</Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard title="إجمالي الموديلات" value={productions.length} icon={<Package className="w-5 h-5" />} color="blue" />
        <StatCard title="مكتملة" value={completed} icon={<Package className="w-5 h-5" />} color="green" />
        <StatCard title="إجمالي القطع" value={totalQty} icon={<Package className="w-5 h-5" />} color="purple" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              className="w-full pr-9 pl-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="بحث بالوصف أو الكود..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><LoadingSpinner /></div>
        ) : filtered.length === 0 ? (
          <EmptyState title="لا توجد بيانات إنتاج" description="ابدأ بإضافة سجل إنتاج جديد" />
        ) : (
          <Table>
            <thead>
              <tr className="bg-gray-50">
                <Th>الكود</Th><Th>الوصف</Th><Th>اللون</Th><Th>المقاسات</Th>
                <Th>من القص</Th><Th>الهالك</Th><Th>المستلم</Th><Th>الحالة</Th><Th>التاريخ</Th><Th>إجراءات</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <Td className="font-mono text-sm">{p.modelCode}</Td>
                  <Td className="font-medium">{p.modelDescription}</Td>
                  <Td>{p.color}</Td>
                  <Td className="text-xs text-gray-500">{p.sizes ?? '—'}</Td>
                  <Td>{p.qtyFromCutting}</Td>
                  <Td className="text-red-600">{p.wastage}</Td>
                  <Td className="text-green-700 font-semibold">{p.qtyReceived ?? '—'}</Td>
                  <Td>
                    <Badge variant={STATUS_VARIANTS[p.status]}>
                      {PRODUCTION_STATUS_LABELS[p.status]}
                    </Badge>
                  </Td>
                  <Td>{formatDate(p.date)}</Td>
                  <Td>
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(p)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteTarget(p)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'تعديل سجل الإنتاج' : 'إنتاج جديد'} size="lg">
        <form onSubmit={handleSubmit(d => saveMutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">أمر القص</label>
              <select {...register('cuttingOrderId')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">— اختر أمر القص —</option>
                {cuttingOrders.map(o => (
                  <option key={o.id} value={o.id}>#{o.cutNumber} — {o.cutDescription}</option>
                ))}
              </select>
              {errors.cuttingOrderId && <p className="text-red-500 text-xs mt-1">{errors.cuttingOrderId.message}</p>}
            </div>
            <Input label="التاريخ" type="date" {...register('date')} error={errors.date?.message} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="كود الموديل" {...register('modelCode')} error={errors.modelCode?.message} />
            <Input label="وصف الموديل" {...register('modelDescription')} error={errors.modelDescription?.message} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="اللون" {...register('color')} error={errors.color?.message} />
            <Input label="المقاسات (مثل: S,M,L)" {...register('sizes')} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input label="الكمية من القص" type="number" {...register('qtyFromCutting')} error={errors.qtyFromCutting?.message} />
            <Input label="الهالك" type="number" {...register('wastage')} />
            <Input label="الكمية المستلمة" type="number" {...register('qtyReceived')} />
          </div>
          <Select
            label="الحالة"
            {...register('status')}
            options={[
              { value: 'IN_PROGRESS', label: 'قيد التشغيل' },
              { value: 'COMPLETED', label: 'تام' },
              { value: 'DEFECTIVE', label: 'هالك' },
            ]}
          />
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
        <p className="text-gray-600 mb-6">حذف سجل الإنتاج <strong>{deleteTarget?.modelDescription}</strong>؟</p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>إلغاء</Button>
          <Button variant="danger" loading={deleteMutation.isPending} onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}>حذف</Button>
        </div>
      </Modal>
    </div>
  );
}
