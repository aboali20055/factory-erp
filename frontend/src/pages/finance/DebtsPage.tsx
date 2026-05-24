import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search, CreditCard, Edit, Trash2, DollarSign } from 'lucide-react';
import { financeApi } from '../../api';
import { Debt } from '../../types';
import {
  Button, Input, Badge, StatCard, LoadingSpinner, EmptyState, Table, Th, Td,
} from '../../components/ui';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { formatDate, formatDateInput, today, formatCurrency, getErrorMessage } from '../../utils';

const debtSchema = z.object({
  creditor: z.string().min(1, 'الاسم مطلوب'),
  totalAmount: z.coerce.number().positive('المبلغ يجب أن يكون موجبًا'),
  amountPaid: z.coerce.number().min(0).default(0),
  date: z.string().min(1, 'التاريخ مطلوب'),
  notes: z.string().optional(),
});
const paymentSchema = z.object({
  amount: z.coerce.number().positive('المبلغ يجب أن يكون موجبًا'),
  paymentDate: z.string().min(1, 'التاريخ مطلوب'),
  notes: z.string().optional(),
});
type DebtForm = z.infer<typeof debtSchema>;
type PaymentForm = z.infer<typeof paymentSchema>;

export default function DebtsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [editing, setEditing] = useState<Debt | null>(null);
  const [payTarget, setPayTarget] = useState<Debt | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Debt | null>(null);

  const { data: debts = [], isLoading } = useQuery({
    queryKey: ['debts'],
    queryFn: () => financeApi.listDebts(),
  });

  const filtered = debts.filter(d =>
    !search || d.creditor?.includes(search) || d.notes?.includes(search)
  );

  const { register: regDebt, handleSubmit: handleDebt, reset: resetDebt, formState: { errors: debtErrors, isSubmitting: debtSub } } = useForm<DebtForm>({
    resolver: zodResolver(debtSchema),
    defaultValues: { date: today(), amountPaid: 0 },
  });
  const { register: regPay, handleSubmit: handlePay, reset: resetPay, formState: { errors: payErrors, isSubmitting: paySub } } = useForm<PaymentForm>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { paymentDate: today() },
  });

  const openCreate = () => { resetDebt({ date: today(), amountPaid: 0 }); setEditing(null); setModalOpen(true); };
  const openEdit = (d: Debt) => {
    resetDebt({
      creditor: d.creditor,
      totalAmount: d.totalAmount,
      amountPaid: d.amountPaid,
      date: formatDateInput(d.date),
      notes: d.notes ?? '',
    });
    setEditing(d);
    setModalOpen(true);
  };
  const openPayment = (d: Debt) => { resetPay({ paymentDate: today() }); setPayTarget(d); setPayModalOpen(true); };

  const saveMutation = useMutation({
    mutationFn: (d: DebtForm) =>
      editing ? financeApi.updateDebt(editing.id, d) : financeApi.createDebt(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['debts'] });
      toast(editing ? 'تم التحديث' : 'تمت الإضافة', 'success');
      setModalOpen(false);
    },
    onError: (e) => toast(getErrorMessage(e), 'error'),
  });

  const payMutation = useMutation({
    mutationFn: (d: PaymentForm) => financeApi.addPayment(payTarget!.id, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['debts'] });
      toast('تم تسجيل الدفعة', 'success');
      setPayModalOpen(false);
    },
    onError: (e) => toast(getErrorMessage(e), 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => financeApi.deleteDebt(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['debts'] });
      toast('تم الحذف', 'success');
      setDeleteTarget(null);
    },
    onError: (e) => toast(getErrorMessage(e), 'error'),
  });

  const totalRemaining = debts.reduce((s, d) => s + d.remaining, 0);
  const totalAmount = debts.reduce((s, d) => s + d.totalAmount, 0);
  const settled = debts.filter(d => d.remaining <= 0).length;

  return (
    <div dir="rtl" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">الديون</h1>
          <p className="text-sm text-gray-500 mt-1">متابعة الديون والمستحقات</p>
        </div>
        <Button onClick={openCreate} icon={<Plus className="w-4 h-4" />}>إضافة دين</Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard title="إجمالي الديون (ج)" value={formatCurrency(totalAmount)} icon={<CreditCard className="w-5 h-5" />} color="blue" />
        <StatCard title="المتبقي (ج)" value={formatCurrency(totalRemaining)} icon={<CreditCard className="w-5 h-5" />} color="red" />
        <StatCard title="تم تسويتها" value={settled} icon={<CreditCard className="w-5 h-5" />} color="green" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              className="w-full pr-9 pl-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="بحث بالاسم..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><LoadingSpinner /></div>
        ) : filtered.length === 0 ? (
          <EmptyState title="لا توجد ديون" description="ابدأ بإضافة سجل دين جديد" />
        ) : (
          <Table>
            <thead>
              <tr className="bg-gray-50">
                <Th>الدائن</Th><Th>المبلغ الكلي</Th>
                <Th>المدفوع</Th><Th>المتبقي</Th><Th>التاريخ</Th><Th>الحالة</Th><Th>إجراءات</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(d => {
                const isSettled = d.remaining <= 0;
                return (
                  <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                    <Td className="font-medium">{d.creditor}</Td>
                    <Td>{formatCurrency(d.totalAmount)}</Td>
                    <Td className="text-green-700">{formatCurrency(d.amountPaid)}</Td>
                    <Td className={isSettled ? 'text-gray-400 line-through' : 'font-semibold text-red-700'}>
                      {formatCurrency(d.remaining)}
                    </Td>
                    <Td>{formatDate(d.date)}</Td>
                    <Td>
                      <Badge variant={isSettled ? 'success' : 'warning'}>
                        {isSettled ? 'مسدد' : 'قائم'}
                      </Badge>
                    </Td>
                    <Td>
                      <div className="flex gap-2">
                        {!isSettled && (
                          <button onClick={() => openPayment(d)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg" title="تسجيل دفعة">
                            <DollarSign className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => openEdit(d)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteTarget(d)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'تعديل الدين' : 'إضافة دين'} size="md">
        <form onSubmit={handleDebt(d => saveMutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="الدائن / الاسم" {...regDebt('creditor')} error={debtErrors.creditor?.message} />
            <Input label="التاريخ" type="date" {...regDebt('date')} error={debtErrors.date?.message} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="المبلغ الكلي (ج)" type="number" step="0.01" {...regDebt('totalAmount')} error={debtErrors.totalAmount?.message} />
            <Input label="المبلغ المدفوع (ج)" type="number" step="0.01" {...regDebt('amountPaid')} />
          </div>
          <Input label="ملاحظات (اختياري)" {...regDebt('notes')} />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>إلغاء</Button>
            <Button type="submit" loading={debtSub || saveMutation.isPending}>
              {editing ? 'حفظ' : 'إضافة'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={payModalOpen} onClose={() => setPayModalOpen(false)} title={`دفعة — ${payTarget?.creditor}`} size="sm">
        <form onSubmit={handlePay(d => payMutation.mutate(d))} className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-3 text-sm">
            <span className="text-gray-500">المتبقي: </span>
            <span className="font-semibold text-red-700">{formatCurrency(payTarget?.remaining ?? 0)}</span>
          </div>
          <Input label="مبلغ الدفعة (ج)" type="number" step="0.01" {...regPay('amount')} error={payErrors.amount?.message} />
          <Input label="تاريخ الدفع" type="date" {...regPay('paymentDate')} error={payErrors.paymentDate?.message} />
          <Input label="ملاحظات (اختياري)" {...regPay('notes')} />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setPayModalOpen(false)}>إلغاء</Button>
            <Button type="submit" loading={paySub || payMutation.isPending}>تسجيل الدفعة</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="تأكيد الحذف" size="sm">
        <p className="text-gray-600 mb-6">حذف سجل دين <strong>{deleteTarget?.creditor}</strong>؟</p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>إلغاء</Button>
          <Button variant="danger" loading={deleteMutation.isPending} onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}>حذف</Button>
        </div>
      </Modal>
    </div>
  );
}
