import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Shield, Edit, UserX } from 'lucide-react';
import { authApi } from '../../api';
import { User } from '../../types';
import { useAuthStore } from '../../store/auth.store';
import {
  Button, Input, Badge, StatCard, LoadingSpinner, EmptyState, Table, Th, Td,
} from '../../components/ui';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { formatDate, getErrorMessage } from '../../utils';

const createSchema = z.object({
  name: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل'),
  email: z.string().email('بريد إلكتروني غير صالح'),
  password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
  role: z.enum(['ADMIN', 'MANAGER', 'STAFF', 'VIEWER']),
});
const updateSchema = z.object({
  name: z.string().min(2),
  role: z.enum(['ADMIN', 'MANAGER', 'STAFF', 'VIEWER']),
  password: z.string().min(8).optional().or(z.literal('')),
});
type CreateForm = z.infer<typeof createSchema>;
type UpdateForm = z.infer<typeof updateSchema>;

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'مدير النظام',
  MANAGER: 'مدير',
  STAFF: 'موظف',
  VIEWER: 'مشاهد',
};
const ROLE_VARIANTS: Record<string, 'default' | 'success' | 'warning' | 'danger'> = {
  ADMIN: 'danger',
  MANAGER: 'warning',
  STAFF: 'success',
  VIEWER: 'default',
};

export default function UsersPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const currentUser = useAuthStore(s => s.user);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<User | null>(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: authApi.listUsers,
  });

  const createForm = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { role: 'STAFF' },
  });
  const updateForm = useForm<UpdateForm>({
    resolver: zodResolver(updateSchema),
  });

  const openCreate = () => { createForm.reset({ role: 'STAFF' }); setEditing(null); setModalOpen(true); };
  const openEdit = (u: User) => {
    updateForm.reset({ name: u.name, role: u.role as any, password: '' });
    setEditing(u);
    setModalOpen(true);
  };

  const createMutation = useMutation({
    mutationFn: (d: CreateForm) => authApi.createUser(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast('تم إنشاء المستخدم', 'success');
      setModalOpen(false);
    },
    onError: (e) => toast(getErrorMessage(e), 'error'),
  });

  const updateMutation = useMutation({
    mutationFn: (d: UpdateForm) => authApi.updateUser(editing!.id, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast('تم التحديث', 'success');
      setModalOpen(false);
    },
    onError: (e) => toast(getErrorMessage(e), 'error'),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: number) => authApi.updateUser(id, { isActive: false } as any),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast('تم تعطيل المستخدم', 'success');
      setDeactivateTarget(null);
    },
    onError: (e) => toast(getErrorMessage(e), 'error'),
  });

  const active = users.filter(u => u.isActive !== false).length;
  const admins = users.filter(u => u.role === 'ADMIN').length;

  return (
    <div dir="rtl" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إدارة المستخدمين</h1>
          <p className="text-sm text-gray-500 mt-1">إضافة وتعديل المستخدمين وصلاحياتهم</p>
        </div>
        <Button onClick={openCreate} icon={<Plus className="w-4 h-4" />}>مستخدم جديد</Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard title="إجمالي المستخدمين" value={users.length} icon={<Shield className="w-5 h-5" />} color="blue" />
        <StatCard title="نشطون" value={active} icon={<Shield className="w-5 h-5" />} color="green" />
        <StatCard title="مديرو النظام" value={admins} icon={<Shield className="w-5 h-5" />} color="red" />
      </div>

      {/* Role Legend */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm font-medium text-blue-800 mb-2">صلاحيات الأدوار:</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-blue-700">
          <div><strong>مدير النظام:</strong> كامل الصلاحيات + إدارة المستخدمين</div>
          <div><strong>مدير:</strong> جميع الصفحات بدون إدارة المستخدمين</div>
          <div><strong>موظف:</strong> إضافة وتعديل البيانات (بدون حذف)</div>
          <div><strong>مشاهد:</strong> عرض البيانات فقط</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        {isLoading ? (
          <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
        ) : users.length === 0 ? (
          <EmptyState title="لا يوجد مستخدمون" description="ابدأ بإضافة مستخدم جديد" />
        ) : (
          <Table>
            <thead>
              <tr className="bg-gray-50">
                <Th>الاسم</Th><Th>البريد الإلكتروني</Th><Th>الدور</Th>
                <Th>الحالة</Th><Th>تاريخ الإنشاء</Th><Th>إجراءات</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <Td className="font-medium">{u.name}</Td>
                  <Td className="text-gray-500 text-sm">{u.email}</Td>
                  <Td>
                    <Badge variant={ROLE_VARIANTS[u.role]}>{ROLE_LABELS[u.role]}</Badge>
                  </Td>
                  <Td>
                    <Badge variant={u.isActive !== false ? 'success' : 'default'}>
                      {u.isActive !== false ? 'نشط' : 'معطل'}
                    </Badge>
                  </Td>
                  <Td>{formatDate(u.createdAt ?? '')}</Td>
                  <Td>
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(u)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg">
                        <Edit className="w-4 h-4" />
                      </button>
                      {u.id !== currentUser?.id && u.isActive !== false && (
                        <button onClick={() => setDeactivateTarget(u)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="تعطيل">
                          <UserX className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>

      {/* Create Modal */}
      {!editing && (
        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="مستخدم جديد" size="md">
          <form onSubmit={createForm.handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
            <Input label="الاسم الكامل" {...createForm.register('name')} error={createForm.formState.errors.name?.message} />
            <Input label="البريد الإلكتروني" type="email" {...createForm.register('email')} error={createForm.formState.errors.email?.message} />
            <Input label="كلمة المرور" type="password" {...createForm.register('password')} error={createForm.formState.errors.password?.message} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الدور</label>
              <select
                {...createForm.register('role')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="VIEWER">مشاهد</option>
                <option value="STAFF">موظف</option>
                <option value="MANAGER">مدير</option>
                <option value="ADMIN">مدير النظام</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>إلغاء</Button>
              <Button type="submit" loading={createForm.formState.isSubmitting || createMutation.isPending}>إنشاء</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Modal */}
      {editing && (
        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={`تعديل: ${editing.name}`} size="md">
          <form onSubmit={updateForm.handleSubmit(d => updateMutation.mutate(d))} className="space-y-4">
            <Input label="الاسم الكامل" {...updateForm.register('name')} error={updateForm.formState.errors.name?.message} />
            <Input label="كلمة مرور جديدة (اتركها فارغة إن لم تريد التغيير)" type="password" {...updateForm.register('password')} error={updateForm.formState.errors.password?.message} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الدور</label>
              <select
                {...updateForm.register('role')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="VIEWER">مشاهد</option>
                <option value="STAFF">موظف</option>
                <option value="MANAGER">مدير</option>
                <option value="ADMIN">مدير النظام</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>إلغاء</Button>
              <Button type="submit" loading={updateForm.formState.isSubmitting || updateMutation.isPending}>حفظ</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Deactivate Confirm */}
      <Modal open={!!deactivateTarget} onClose={() => setDeactivateTarget(null)} title="تأكيد التعطيل" size="sm">
        <p className="text-gray-600 mb-6">
          هل تريد تعطيل حساب <strong>{deactivateTarget?.name}</strong>؟ لن يتمكن من تسجيل الدخول.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeactivateTarget(null)}>إلغاء</Button>
          <Button variant="danger" loading={deactivateMutation.isPending} onClick={() => deactivateTarget && deactivateMutation.mutate(deactivateTarget.id)}>تعطيل</Button>
        </div>
      </Modal>
    </div>
  );
}
