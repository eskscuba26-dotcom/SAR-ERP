import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '@/App';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DollarSign, Euro, TrendingUp, Save, AlertCircle } from 'lucide-react';

export default function ExchangeRates() {
  const [loading, setLoading] = useState(true);
  const [rates, setRates] = useState({
    USD: { rate: 32.50, updated_at: '', updated_by: '' },
    EUR: { rate: 35.00, updated_at: '', updated_by: '' }
  });
  const [formData, setFormData] = useState({
    usd_rate: 32.50,
    eur_rate: 35.00
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/exchange-rates`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRates(response.data);
      setFormData({
        usd_rate: response.data.USD.rate,
        eur_rate: response.data.EUR.rate
      });
    } catch (error) {
      toast.error('Kurlar yüklenemedi');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRates = async (e) => {
    e.preventDefault();

    if (formData.usd_rate <= 0 || formData.eur_rate <= 0) {
      toast.error('Kur değerleri 0\'dan büyük olmalıdır');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/exchange-rates`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Döviz kurları güncellendi');
      fetchRates();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Kurlar güncellenemedi');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in p-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Space Grotesk' }}>
          Döviz Kur Yönetimi
        </h1>
        <p className="text-gray-600">Manuel döviz kuru girişi</p>
      </div>

      {/* Info Alert */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">Önemli Bilgi</p>
              <p>
                Bu kurlar hammadde maliyetlerini hesaplamak için kullanılır. 
                Kurları güncelledikten sonra tüm maliyet hesaplamaları yeni kurlara göre yapılacaktır.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Rates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <DollarSign className="h-6 w-6" />
              USD (Dolar)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-4xl font-bold">{rates.USD.rate.toFixed(4)} ₺</p>
              {rates.USD.updated_at && (
                <div className="text-sm text-white/80">
                  <p>Son Güncelleme: {new Date(rates.USD.updated_at).toLocaleString('tr-TR')}</p>
                  <p>Güncelleyen: {rates.USD.updated_by}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Euro className="h-6 w-6" />
              EUR (Euro)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-4xl font-bold">{rates.EUR.rate.toFixed(4)} ₺</p>
              {rates.EUR.updated_at && (
                <div className="text-sm text-white/80">
                  <p>Son Güncelleme: {new Date(rates.EUR.updated_at).toLocaleString('tr-TR')}</p>
                  <p>Güncelleyen: {rates.EUR.updated_by}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Update Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Kurları Güncelle
          </CardTitle>
          <CardDescription>
            1 USD ve 1 EUR'nun TL karşılığını girin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveRates} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="usd_rate" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  USD Kuru (1 USD = ? TL)
                </Label>
                <div className="relative">
                  <Input
                    id="usd_rate"
                    type="number"
                    step="0.0001"
                    min="0"
                    value={formData.usd_rate}
                    onChange={(e) => setFormData({ ...formData, usd_rate: parseFloat(e.target.value) })}
                    placeholder="Örn: 32.5000"
                    required
                    className="text-lg font-semibold"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">₺</span>
                </div>
                <p className="text-xs text-gray-500">
                  1 USD = {formData.usd_rate.toFixed(4)} TL
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="eur_rate" className="flex items-center gap-2">
                  <Euro className="h-4 w-4" />
                  EUR Kuru (1 EUR = ? TL)
                </Label>
                <div className="relative">
                  <Input
                    id="eur_rate"
                    type="number"
                    step="0.0001"
                    min="0"
                    value={formData.eur_rate}
                    onChange={(e) => setFormData({ ...formData, eur_rate: parseFloat(e.target.value) })}
                    placeholder="Örn: 35.0000"
                    required
                    className="text-lg font-semibold"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">₺</span>
                </div>
                <p className="text-xs text-gray-500">
                  1 EUR = {formData.eur_rate.toFixed(4)} TL
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={fetchRates}
                disabled={saving}
              >
                İptal
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Kaydediliyor...' : 'Kurları Kaydet'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Kur Bilgileri</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600">
          <p>• Kurlar TL (Türk Lirası) cinsinden girilmelidir</p>
          <p>• Örnek: 1 USD = 32.5000 TL şeklinde</p>
          <p>• Kurlar güncellendikten sonra tüm maliyet hesaplamaları otomatik olarak yeni kurlara göre yapılır</p>
          <p>• Hammadde girişlerindeki dövizli işlemler bu kurlarla TL'ye çevrilir</p>
          <p>• Sadece admin kullanıcılar kur güncelleyebilir</p>
        </CardContent>
      </Card>
    </div>
  );
}
