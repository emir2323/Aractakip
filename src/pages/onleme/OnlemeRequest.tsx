import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { vehicleRequestsApi } from '../../api';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { FormField, Input } from '../../components/ui/FormField';

export function OnlemeRequest() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    requestDate: '',
    returnDate: '',
    purpose: '',
  });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const createMutation = useMutation({
    mutationFn: () =>
      vehicleRequestsApi.create({
        requestDate: form.requestDate,
        returnDate: form.returnDate || null,
        purpose: form.purpose.trim(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-requests'] });
      setSuccess(true);
      setForm({ requestDate: '', returnDate: '', purpose: '' });
    },
    onError: (err: any) => {
      setError(err.response?.data?.error ?? 'Talep gönderilemedi. Lütfen tekrar deneyin.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.requestDate || !form.purpose.trim()) return;
    createMutation.mutate();
  };

  if (success) {
    return (
      <div className="max-w-lg mx-auto fade-in">
        <Card>
          <CardBody className="py-12 text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={36} className="text-green-400" />
            </div>
            <h2 className="text-white text-xl font-bold mb-2">Talebiniz Alındı!</h2>
            <p className="text-gray-400 text-sm mb-6">
              Araç talebiniz başarıyla iletildi. Admin onayını bekleyebilirsiniz.
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                variant="secondary"
                onClick={() => setSuccess(false)}
              >
                Yeni Talep Oluştur
              </Button>
              <Button onClick={() => navigate('/onleme')}>
                Taleplerime Git
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6 fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Araç Talep Et</h1>
        <p className="text-gray-500 text-sm mt-1">Görev için araç talep formunu doldurun</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <PlusCircle size={18} className="text-orange-400" />
            <h2 className="text-white font-semibold">Talep Formu</h2>
          </div>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-5">
            <FormField label="Talep Tarihi" required>
              <Input
                type="date"
                value={form.requestDate}
                onChange={e => setForm(f => ({ ...f, requestDate: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
              />
            </FormField>

            <FormField label="İade Tarihi (Opsiyonel)">
              <Input
                type="date"
                value={form.returnDate}
                onChange={e => setForm(f => ({ ...f, returnDate: e.target.value }))}
                min={form.requestDate || new Date().toISOString().split('T')[0]}
              />
              <p className="text-gray-600 text-xs mt-1">Dönüş tarihi belli değilse boş bırakabilirsiniz.</p>
            </FormField>

            <FormField label="Kullanım Amacı" required>
              <textarea
                value={form.purpose}
                onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))}
                placeholder="Görev detaylarını ve araç kullanım amacını açıklayın..."
                rows={4}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm
                  placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent
                  resize-none transition-all"
              />
            </FormField>

            {error && (
              <div className="flex items-start gap-2 text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2.5">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={!form.requestDate || !form.purpose.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Gönderiliyor...
                </>
              ) : (
                <>
                  <PlusCircle size={15} />
                  Talebi Gönder
                </>
              )}
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
