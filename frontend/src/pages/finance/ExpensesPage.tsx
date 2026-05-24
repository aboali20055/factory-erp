import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search, Receipt, Edit, Trash2, Eye, PlusCircle, XCircle } from 'lucide-react';
import { financeApi } from '../../api';
import { ExpenseRecord, OPERATION_TYPE_LABELS, OperationType } from '../../types';
import {
  Button, Input, StatCard, LoadingSpinner, EmptyState, Table, Th, Td,
} from '../../components/ui';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { formatDate, formatDateInput, today, formatCurrency, getErrorMessage } from '../../utils';

const lineSchema = z.object({
  partnerId: z.coerce.number().int().positive('الشريك مطلوب'),
  amountIn: z.coerce.number().min(0).default(0),
  amountOut: z.coerce.number().min(0).default(0),
});
const schema = z.object({
  statement: z.string().min(1, 'البيان مطلوب'),
  operationType: z.enum(['CAPITAL', 'OPERATING_EXP', 'SALES_REVENUE', 'LOAN', 'REPAYMENT']),
  date: z.string().min(1, 'التاريخ مطلوب'),
  notes: z.string().optional(),
  lines: z.array(lineSchema).min(1, 'يجب إضافة سطر واحد على الأقل'),
});
type FormData = z.infer<typeof schema>;

export default function ExpensesPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [viewRecord, setViewRecord] = useState<ExpenseRecord | null>(null);
  const [editing, setEditing] = useState<ExpenseRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExpenseRecord | null>(null);

  const { data: expData, isLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => financeApi.listExpenses(),
  });

  const { data: partners = [] } = useQuery({
    queryKey: ['partners'],
    queryFn: financeApi.listPartners,
  });

  const records: ExpenseRecord[] = expData?.data ?? expData ?? [];
  const filtered = records.filter(r =>
    !search || r.statement?.includes(search)
  );

  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { date: today(), operationType: 'OPERATING_EXP', lines: [{ partnerId: 0, amountIn: 0, amountOut: 0 }] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'lines' });

  const openCreate = () => {
    reset({ date: today(), operationType: 'OPERATING_EXP', lines: [{ partnerId: partners[0]?.id ?? 0, amountIn: 0, amountOut: 0 }] });
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (r: ExpenseRecord) => {
    reset({
      statement: r.statement,
      operationType: r.operationType as OperationType,
      date: formatDateInput(r.date),
      notes: r.notes ?? '',
      lines: r.lines?.map(l => ({ partnerId: l.partnerId, amountIn: Number(l.amountIn), amountOut: Number(l.amountOut) })) ?? [],
    });
    setEditing(r);
    setModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: (d: FormData) =>
      editing ? financeApi.updateExpense(editing.id, d) : financeApi.createExpense(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast(editing ? 'تم التحديث' : 'تمت الإضافة', 'success');
      setModalOpen(false);
    },
    onError: (e) => toast(getErrorMessage(e), 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => financeApi.deleteExpense(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] });
      toast('تم الحذف', 'success');
      setDeleteTarget(null);
    },
    onError: (e) => toast(getErrorMessage(e), 'error'),
  });

  const totalOut = records.reduce((s, r) => s + r.lines.reduce((ls, l) => ls + Number(l.amountOut), 0), 0);
  const totalIn = records.reduce((s, r) => s + r.lines.reduce((ls, l) => ls + Number(l.amountIn), 0), 0);

  return (
    <div dir="rtl" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">سجل المصروفات والإيرادات</h1>
          <p className="text-sm text-gray-500 mt-1">إدارة الحركات المالية</p>
        </div>
        <Button onClick={openCreate} icon={<Plus className="w-4 h-4" />}>إضافة حركة</Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard title="إجمالي الإيرادات (ج)" value={formatCurrency(totalIn)} icon={<Receipt className="w-5 h-5" />} color="green" />
        <StatCard title="إجمالي المصروفات (ج)" value={formatCurrency(totalOut)} icon={<Receipt className="w-5 h-5" />} color="red" />
        <StatCard title="عدد السجلات" value={records.length} icon={<Receipt className="w-5 h-5" />} color="blue" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              className="w-full pr-9 pl-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="بحث بالبيان..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><LoadingSpinner /></div>
        ) : filtered.length === 0 ? (
          <EmptyState title="لا توجد سجلات" description="ابدأ بتسجيل أول حركة مالية" />
        ) : (
          <Table>
            <thead>
              <tr className="bg-gray-50">
                <Th>البيان</Th><Th>نوع العملية</Th><Th>إجمالي داخل (ج)</Th><Th>إجمالي خارج (ج)</Th><Th>التاريخ</Th><Th>إجراءات</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(r => {
                const totalLineIn = r.lines.reduce((s, l) => s + Number(l.amountIn), 0);
                const totalLineOut = r.lines.reduce((s, l) => s + Number(l.amountOut), 0);
                return (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <Td className="font-medium">{r.statement}</Td>
                    <Td>
                      <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-md text-xs font-medium">
                        {OPERATION_TYPE_LABELS[r.operationType as OperationType]}
                      </span>
                    </Td>
                    <Td className="text-green-700 font-semibold">{totalLineIn > 0 ? formatCurrency(totalLineIn) : '—'}</Td>
                    <Td className="text-red-700 font-semibold">{totalLineOut > 0 ? formatCurrency(totalLineOut) : '—'}</Td>
                    <Td>{formatDate(r.date)}</Td>
                    <Td>
                      <div className="flex gap-2">
                        <button onClick={() => setViewRecord(r)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => openEdit(r)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteTarget(r)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
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

      {/* Form Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'تعديل الحركة' : 'إضافة حركة مالية'} size="lg">
        <form onSubmit={handleSubmit(d => saveMutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="البيان" {...register('statement')} error={errors.statement?.message} />
            <Input label="التاريخ" type="date" {...register('date')} error={errors.date?.message} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">نوع العملية</label>
            <select {...register('operationType')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {Object.entries(OPERATION_TYPE_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">سطور الحركة</label>
              <button type="button" onClick={() => append({ partnerId: partners[0]?.id ?? 0, amountIn: 0, amountOut: 0 })}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700">
                <PlusCircle className="w-4 h-4" /> إضافة سطر
              </button>
            </div>
            <div className="space-y-2">
              {fields.map((field, idx) => (
                <div key={field.id} className="grid grid-cols-4 gap-2 items-end bg-gray-50 p-3 rounded-lg">
                  <div>
                    {idx === 0 && <label className="block text-xs font-medium text-gray-600 mb-1">الشريك</label>}
                    <select {...register(`lines.${idx}.partnerId`)} className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    {idx === 0 && <label className="block text-xs font-medium text-gray-600 mb-1">داخل (ج)</label>}
                    <input type="number" step="0.01" {...register(`lines.${idx}.amountIn`)} placeholder="0" className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    {idx === 0 && <label className="block text-xs font-medium text-gray-600 mb-1">خارج (ج)</label>}
                    <input type="number" step="0.01" {...register(`lines.${idx}.amountOut`)} placeholder="0" className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <button type="button" onClick={() => fields.length > 1 && remove(idx)}
                    className="p-2 text-red-400 hover:text-red-600 disabled:opacity-30" disabled={fields.length === 1}>
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
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

      {/* View Modal */}
      <Modal open={!!viewRecord} onClose={() => setViewRecord(null)} title="تفاصيل الحركة" size="md">
        {viewRecord && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">البيان:</span> <span className="font-medium">{viewRecord.statement}</span></div>
              <div><span className="text-gray-500">النوع:</span> <span className="font-medium">{OPERATION_TYPE_LABELS[viewRecord.operationType as OperationType]}</span></div>
              <div><span className="text-gray-500">التاريخ:</span> <span className="font-medium">{formatDate(viewRecord.date)}</span></div>
            </div>
            {viewRecord.lines?.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">السطور:</p>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead><tr className="bg-gray-50"><th className="text-right px-3 py-2">الشريك</th><th className="text-right px-3 py-2">داخل</th><th className="text-right px-3 py-2">خارج</th></tr></thead>
                    <tbody>
                      {viewRecord.lines.map((l, i) => (
                        <tr key={i} className="border-t border-gray-100">
                          <td className="px-3 py-2">{l.partner?.name ?? l.partnerId}</td>
                          <td className="px-3 py-2 text-green-700">{Number(l.amountIn) > 0 ? formatCurrency(Number(l.amountIn)) : '—'}</td>
                          <td className="px-3 py-2 text-red-700">{Number(l.amountOut) > 0 ? formatCurrency(Number(l.amountOut)) : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="تأكيد الحذف" size="sm">
        <p className="text-gray-600 mb-6">حذف السجل <strong>{deleteTarget?.statement}</strong>؟</p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>إلغاء</Button>
          <Button variant="danger" loading={deleteMutation.isPending} onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}>حذف</Button>
        </div>
      </Modal>
    </div>
  );
}
