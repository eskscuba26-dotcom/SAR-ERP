import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '@/App';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Package, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function MaterialEntries({ user }) {
  const [entries, setEntries] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [formData, setFormData] = useState({
    entry_date: '',
    material_id: '',
    quantity: '',
    currency: 'TL',
    unit_price: '',
    total_amount: '',
    supplier: '',
    invoice_number: ''
  });

  const canEdit = user?.role !== 'viewer';

  useEffect(() => {
    fetchEntries();
    fetchMaterials();
  }, []);

  const fetchEntries = async () => {
    try {
      const response = await axios.get(`${API}/material-entries`);
      setEntries(response.data);
    } catch (error) {
      toast.error('Hammadde girişleri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const fetchMaterials = async () => {
    try {
      const response = await axios.get(`${API}/raw-materials`);
      setMaterials(response.data);
    } catch (error) {
      toast.error('Hammaddeler yüklenemedi');
    }
  };

  // Toplam tutarı otomatik hesapla
  const calculateTotal = () => {
    const qty = parseFloat(formData.quantity) || 0;
    const price = parseFloat(formData.unit_price) || 0;
    return (qty * price).toFixed(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const total = calculateTotal();
      const payload = {
        entry_date: new Date(formData.entry_date).toISOString(),
        material_id: formData.material_id,
        quantity: parseFloat(formData.quantity),
        currency: formData.currency,
        unit_price: parseFloat(formData.unit_price),
        total_amount: parseFloat(total),
        supplier: formData.supplier || null,
        invoice_number: formData.invoice_number || null
      };

      if (editingEntry) {
        await axios.put(`${API}/material-entries/${editingEntry.id}`, payload);
        toast.success('Hammadde girişi güncellendi');
      } else {
        await axios.post(`${API}/material-entries`, payload);
        toast.success('Hammadde girişi kaydedildi ve stok güncellendi');
      }
      
      setDialogOpen(false);
      setEditingEntry(null);
      setFormData({
        entry_date: '',
        material_id: '',
        quantity: '',
        currency: 'TL',
        unit_price: '',
        total_amount: '',
        supplier: '',
        invoice_number: ''
      });
      fetchEntries();
      fetchMaterials(); // Stokları yenile
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Hata oluştu');
    }
  };

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setFormData({
      entry_date: new Date(entry.entry_date).toISOString().slice(0, 10),
      material_id: entry.material_id,
      quantity: entry.quantity.toString(),
      currency: entry.currency,
      unit_price: entry.unit_price.toString(),
      total_amount: entry.total_amount.toString(),
      supplier: entry.supplier || '',
      invoice_number: entry.invoice_number || ''
    });
    setDialogOpen(true);
  };

  const handleDelete = async (entryId) => {
    if (!window.confirm('Bu hammadde girişini silmek istediğinize emin misiniz? Stok da güncellenecektir.')) {
      return;
    }
    try {
      await axios.delete(`${API}/material-entries/${entryId}`);
      toast.success('Hammadde girişi silindi ve stok güncellendi');
      fetchEntries();
      fetchMaterials();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Hata oluştu');
    }
  };

  const getMaterialName = (materialId) => {
    const material = materials.find(m => m.id === materialId);
    return material ? material.name : 'Bilinmeyen';
  };

  const getMaterialUnit = (materialId) => {
    const material = materials.find(m => m.id === materialId);
    return material ? material.unit : '';
  };

  // Toplam maliyet hesapla
  const calculateTotalCost = () => {
    return entries.reduce((sum, entry) => sum + entry.total_amount, 0);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full"><div className="spinner w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div></div>;
  }

  return (
    <div className="space-y-6 fade-in" data-testid="material-entries-page">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Space Grotesk' }}>
            <Package className="inline-block w-10 h-10 mr-3 text-green-600" />
            Hammadde Giriş Kayıtları
          </h1>
          <p className="text-gray-600">Hammadde alımları ve stok girişleri</p>
        </div>
        {canEdit && (
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setEditingEntry(null);
              setFormData({
                entry_date: '',
                material_id: '',
                quantity: '',
                currency: 'TL',
                unit_price: '',
                total_amount: '',
                supplier: '',
                invoice_number: ''
              });
            }
          }}>
            <DialogTrigger asChild>
              <Button data-testid="add-entry-btn" className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                Yeni Hammadde Girişi
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl" data-testid="add-entry-dialog">
              <DialogHeader>
                <DialogTitle>{editingEntry ? 'Hammadde Girişi Düzenle' : 'Yeni Hammadde Girişi'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="entry_date">Giriş Tarihi</Label>
                    <Input
                      id="entry_date"
                      type="date"
                      value={formData.entry_date}
                      onChange={(e) => setFormData({ ...formData, entry_date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="material">Hammadde</Label>
                    <Select value={formData.material_id} onValueChange={(value) => setFormData({ ...formData, material_id: value })}>
                      <SelectTrigger id="material">
                        <SelectValue placeholder="Hammadde seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {materials.map((material) => (
                          <SelectItem key={material.id} value={material.id}>
                            {material.name} ({material.unit})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Miktar</Label>
                    <Input
                      id="quantity"
                      type="number"
                      step="0.01"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      required
                      placeholder="Miktar"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Para Birimi</Label>
                    <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                      <SelectTrigger id="currency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TL">TL</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit_price">Birim Fiyat</Label>
                    <Input
                      id="unit_price"
                      type="number"
                      step="0.01"
                      value={formData.unit_price}
                      onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                      required
                      placeholder="Birim fiyat"
                    />
                  </div>
                </div>

                <div className="space-y-2 bg-green-50 p-4 rounded-lg border-2 border-green-200">
                  <Label className="text-lg font-bold">Toplam Tutar</Label>
                  <div className="text-2xl font-bold text-green-700">
                    {calculateTotal()} {formData.currency}
                  </div>
                  <p className="text-sm text-gray-600">Miktar × Birim Fiyat</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="supplier">Tedarikçi (Opsiyonel)</Label>
                    <Input
                      id="supplier"
                      value={formData.supplier}
                      onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                      placeholder="Tedarikçi adı"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invoice">İrsaliye/Fatura No (Opsiyonel)</Label>
                    <Input
                      id="invoice"
                      value={formData.invoice_number}
                      onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                      placeholder="İrsaliye numarası"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
                  {editingEntry ? 'Güncelle' : 'Kaydet ve Stoğa Ekle'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Özet Kart */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Toplam Hammadde Alım Maliyeti</p>
              <p className="text-4xl font-bold text-green-600">{calculateTotalCost().toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</p>
            </div>
            <Package className="w-16 h-16 text-green-400 opacity-50" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hammadde Giriş Kayıtları ({entries.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium text-gray-600">Tarih</th>
                  <th className="text-left p-3 font-medium text-gray-600">Hammadde</th>
                  <th className="text-right p-3 font-medium text-gray-600">Miktar</th>
                  <th className="text-left p-3 font-medium text-gray-600">Para Birimi</th>
                  <th className="text-right p-3 font-medium text-gray-600">Birim Fiyat</th>
                  <th className="text-right p-3 font-medium text-gray-600">Toplam</th>
                  <th className="text-left p-3 font-medium text-gray-600">Tedarikçi</th>
                  {canEdit && <th className="text-center p-3 font-medium text-gray-600">İşlem</th>}
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, index) => (
                  <tr key={entry.id} className="border-b hover:bg-green-50" data-testid={`entry-row-${index}`}>
                    <td className="p-3">{format(new Date(entry.entry_date), 'dd.MM.yyyy', { locale: tr })}</td>
                    <td className="p-3 font-semibold">{getMaterialName(entry.material_id)}</td>
                    <td className="p-3 text-right font-bold text-blue-600">
                      {entry.quantity.toLocaleString('tr-TR')} {getMaterialUnit(entry.material_id)}
                    </td>
                    <td className="p-3">{entry.currency}</td>
                    <td className="p-3 text-right">{entry.unit_price.toFixed(2)}</td>
                    <td className="p-3 text-right font-bold text-green-600">
                      {entry.total_amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-gray-600">{entry.supplier || '-'}</td>
                    {canEdit && (
                      <td className="p-3">
                        <div className="flex gap-1 justify-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(entry)}
                            data-testid={`edit-entry-${index}`}
                            title="Düzenle"
                          >
                            <Edit className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(entry.id)}
                            data-testid={`delete-entry-${index}`}
                            title="Sil"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {entries.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Henüz hammadde giriş kaydı bulunmuyor.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
