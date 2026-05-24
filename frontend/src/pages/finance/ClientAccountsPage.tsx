import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search, Users, Edit, Trash2, DollarSign } from 'lucide-react';
import { financeApi } from '../../api';
import { ClientAccount } from '../../types';
import {
  Button, Input, Badge, StatCard, LoadingSpinner, EmptyState, Table, Th, Td,
} from '../../components/ui';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { formatDate, formatDateInput, today, formatCurrency, getErrorMessage } from '../../utils';

const accountSchema = z.object({
  clientName: z.string().min(1, 'اسم العميل مطلوب'),
  modelName: z.string().min(1, 'اسم الموديل مطلوب'),
  quantity: z.coerce.number().int().positive('الكمية مطلوبة'),
  totalAmount: z.coerce.number().positive('المبلغ الكلي مطلوب'),
  amountPaid: z.coerce.number().min(0).default(0),
  date: z.string().min(1, 'التاريخ مطلوب'),
  notes: z.string().optional(),
});
const paymentSchema = z.object({
  amount: z.coerce.number().positive('المبلغ يجب أن يكون موجبًا'),
  paymentDate: z.string().min(1, 'التاريخ مطلوب'),
  notes: z.string().optional(),
});
type AccountForm = z.infer<typeof accountSchema>;
type PaymentForm = z.infer<typeof paymentSchema>;

export default function ClientAccountsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [editing, setEditing] = useState<ClientAccount | null>(null);
  const [payTarget, setPayTarget] = useState<ClientAccount | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ClientAccount | null>(null);

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['client-accounts'],
    queryFn: () => financeApi.listClientAccounts(),
  });

  const filtered = accounts.filter(a =>
    !search || a.clientName?.includes(search) || a.modelName?.includes(search)
  );

  const { register: regAcc, handleSubmit: handleAcc, reset: resetAcc, formState: { errors: accErrors, isSubmitting: accSub } } = useForm<AccountForm>({
    resolver: zodResolver(accountSchema),
    defaultValues: { amountPaid: 0, date: today() },
  });
  const { register: regPay, handleSubmit: handlePay, reset: resetPay, formState: { errors: payErrors, isSubmitting: paySub } } = useForm<PaymentForm>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { paymentDate: today() },
  });

  const openCreate = () => { resetAcc({ amountPaid: 0, date: today() }); setEditing(null); setModalOpen(true); };
  const openEdit = (a: ClientAccount) => {
    resetAcc({
      clientName: a.clientName,
      modelName: a.modelName,
      quantity: a.quantity,
      totalAmount: a.totalAmount,
      amountPaid: a.amountPaid,
      date: formatDateInput(a.date),
      notes: a.notes ?? '',
    });
    setEditing(a);
    setModalOpen(true);
  };
  const openPayment = (a: ClientAccount) => { resetPay({ paymentDate: today() }); setPayTarget(a); setPayModalOpen(true); };

  const saveMutation = useMutation({
    mutationFn: (d: AccountForm) =>
      editing ? financeApi.updateClientAccount(editing.id, d) : financeApi.createClientAccount(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['client-accounts'] });
      toast(editing ? 'تم التحديث' : 'تمت الإضافة', 'success');
      setModalOpen(false);
    },
    onError: (e) => toast(getErrorMessage(e), 'error'),
  });

  const payMutation = useMutation({
    mutationFn: (d: PaymentForm) => financeApi.addClientPayment(payTarget!.id, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['client-accounts'] });
      toast('تم تسجيل الدفعة', 'success');
      setPayModalOpen(false);
    },
    onError: (e) => toast(getErrorMessage(e), 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => financeApi.deleteClientAccount(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['client-accounts'] });
      toast('تم الحذف', 'success');
      setDeleteTarget(null);
    },
    onError: (e) => toast(getErrorMessage(e), 'error'),
  });

  const totalAmount = accounts.reduce((s, a) => s + a.totalAmount, 0);
  const totalPaid = accounts.reduce((s, a) => s + a.amountPaid, 0);
  const totalRemaining = accounts.reduce((s, a) => s + a.remaining, 0);

  return (
    <div dir="rtl" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">حسابات العملاء</h1>
          <p className="text-sm text-gray-500 mt-1">متابعة أرصدة وحسابات العملاء</p>
        </div>
        <Button onClick={openCreate} icon={<Plus className="w-4 h-4" />}>إضافة حساب</Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard title="إجمالي المبيعات (ج)" value={formatCurrency(totalAmount)} icon={<Users className="w-5 h-5" />} color="blue" />
        <StatCard title="إجمالي المحصل (ج)" value={formatCurrency(totalPaid)} icon={<Users className="w-5 h-5" />} color="green" />
        <StatCard title="إجمالي المتبقي (ج)" value={formatCurrency(totalRemaining)} icon={<Users className="w-5 h-5" />} color="red" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              className="w-full pr-9 pl-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="بحث باسم العميل أو الموديل..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><LoadingSpinner /></div>
        ) : filtered.length === 0 ? (
          <EmptyState title="لا توجد حسابات" description="ابدأ بإضافة حساب عميل جديد" />
        ) : (
          <Table>
            <thead>
              <tr className="bg-gray-50">
                <Th>العميل</Th><Th>الموديل</Th><Th>الكمية</Th><Th>المبلغ الكلي</Th>
                <Th>المحصل</Th><Th>المتبقي</Th><Th>التاريخ</Th><Th>الحالة</Th><Th>إجراءات</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(a => {
                const isSettled = a.remaining <= 0;
                return (
                  <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                    <Td className="font-medium">{a.clientName}</Td>
                    <Td>{a.modelName}</Td>
                    <Td>{a.quantity.toLocaleString()}</Td>
                    <Td>{formatCurrency(a.totalAmount)}</Td>
                    <Td className="text-green-700">{formatCurrency(a.amountPaid)}</Td>
                    <Td className={isSettled ? 'text-gray-400' : 'font-semibold text-red-700'}>
                      {formatCurrency(a.remaining)}
                    </Td>
                    <Td>{formatDate(a.date)}</Td>
                    <Td>
                      <Badge variant={isSettled ? 'success' : a.remaining > 10000 ? 'danger' : 'warning'}>
                        {isSettled ? 'مسدد' : 'دائن'}
                      </Badge>
                    </Td>
                    <Td>
                      <div className="flex gap-2">
                        {!isSettled && (
                          <button onClick={() => openPayment(a)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg" title="تسجيل دفعة">
                            <DollarSign className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => openEdit(a)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteTarget(a)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'تعديل الحساب' : 'إضافة حساب عميل'} size="md">
        <form onSubmit={handleAcc(d => saveMutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="اسم العميل" {...regAcc('clientName')} error={accErrors.clientName?.message} />
            <Input label="اسم الموديل" {...regAcc('modelName')} error={accErrors.modelName?.message} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="الكمية" type="number" {...regAcc('quantity')} error={accErrors.quantity?.message} />
            <Input label="التاريخ" type="date" {...regAcc('date')} error={accErrors.date?.message} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="المبلغ الكلي (ج)" type="number" step="0.01" {...regAcc('totalAmount')} error={accErrors.totalAmount?.message} />
            <Input label="المبلغ المدفوع (ج)" type="number" step="0.01" {...regAcc('amountPaid')} />
          </div>
          <Input label="ملاحظات (اختياري)" {...regAcc('notes')} />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>إلغاء</Button>
            <Button type="submit" loading={accSub || saveMutation.isPending}>
              {editing ? 'حفظ' : 'إضافة'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={payModalOpen} onClose={() => setPayModalOpen(false)} title={`دفعة — ${payTarget?.clientName}`} size="sm">
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
        <p className="text-gray-600 mb-6">حذف حساب <strong>{deleteTarget?.clientName}</strong>؟</p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>إلغاء</Button>
          <Button variant="danger" loading={deleteMutation.isPending} onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}>حذف</Button>
        </div>
      </Modal>
    </div>
  );
}
