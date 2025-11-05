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
import { Plus, Scissors, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function CutProduction({ user }) {
  const [records, setRecords] = useState([]);
  const [productions, setProductions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    date: '',
    source_production_id: '',
    cut_width_cm: '',
    cut_length_cm: '',
    requested_pieces: '',
    color: ''
  });
  const [calculations, setCalculations] = useState(null);

  const canEdit = user?.role !== 'viewer';

  useEffect(() => {
    fetchRecords();
    fetchProductions();
  }, []);

  const fetchRecords = async () => {
    try {
      const response = await axios.get(`${API}/cut-production`);
      setRecords(response.data);
    } catch (error) {
      toast.error('Kesilmiş üretim kayıtları yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const fetchProductions = async () => {
    try {
      const response = await axios.get(`${API}/manufacturing`);
      setProductions(response.data);
    } catch (error) {
      toast.error('Üretim kayıtları yüklenemedi');
    }
  };

  // Seçilen ana malzeme bilgisini al
  const getSelectedSource = () => {
    if (!formData.source_production_id) return null;
    return productions.find(p => p.id === formData.source_production_id);
  };

  // Form değiştiğinde hesapla
  useEffect(() => {
    const source = getSelectedSource();
    if (!source || !formData.cut_width_cm || !formData.cut_length_cm || !formData.requested_pieces) {
      setCalculations(null);
      return;
    }

    const sourceWidth = source.width_cm;
    const sourceLength = source.length_m * 100; // cm'ye çevir
    const cutWidth = parseFloat(formData.cut_width_cm);
    const cutLength = parseFloat(formData.cut_length_cm);
    const requested = parseInt(formData.requested_pieces);

    if (isNaN(cutWidth) || isNaN(cutLength) || isNaN(requested)) {
      setCalculations(null);
      return;
    }

    // 1 ana malzemeden kaç adet çıkar
    const piecesWidth = Math.floor(sourceWidth / cutWidth);
    const piecesLength = Math.floor(sourceLength / cutLength);
    const piecesPerSource = piecesWidth * piecesLength;

    if (piecesPerSource === 0) {
      setCalculations(null);
      return;
    }

    // Kaç ana malzeme gerekli
    const sourcePiecesUsed = Math.ceil(requested / piecesPerSource);

    // Toplam kesilmiş adet
    const totalCutPieces = piecesPerSource * sourcePiecesUsed;

    // Metrekare
    const cutSquareMeters = (cutWidth / 100) * (cutLength / 100) * totalCutPieces;

    setCalculations({
      piecesPerSource,
      sourcePiecesUsed,
      totalCutPieces,
      cutSquareMeters,
      excess: totalCutPieces - requested
    });
  }, [formData.source_production_id, formData.cut_width_cm, formData.cut_length_cm, formData.requested_pieces, productions]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Tarih için sadece gün/ay/yıl kullan (saat 00:00:00)
      const dateObj = new Date(formData.date);
      dateObj.setHours(0, 0, 0, 0);
      
      const payload = {
        date: dateObj.toISOString(),
        source_production_id: formData.source_production_id,
        cut_width_cm: parseFloat(formData.cut_width_cm),
        cut_length_cm: parseFloat(formData.cut_length_cm),
        requested_pieces: parseInt(formData.requested_pieces),
        color: formData.color || null
      };

      await axios.post(`${API}/cut-production`, payload);
      toast.success('Kesilmiş üretim kaydı oluşturuldu');
      
      setDialogOpen(false);
      setFormData({
        date: '',
        source_production_id: '',
        cut_width_cm: '',
        cut_length_cm: '',
        requested_pieces: '',
        color: ''
      });
      setCalculations(null);
      fetchRecords();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Hata oluştu');
    }
  };

  const handleDelete = async (recordId) => {
    if (!window.confirm('Bu kesilmiş üretim kaydını silmek istediğinize emin misiniz?')) {
      return;
    }
    try {
      await axios.delete(`${API}/cut-production/${recordId}`);
      toast.success('Kesilmiş üretim kaydı silindi');
      fetchRecords();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Hata oluştu');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full"><div className="spinner w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div></div>;
  }

  return (
    <div className="space-y-6 fade-in" data-testid="cut-production-page">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Space Grotesk' }}>
            <Scissors className="inline-block w-10 h-10 mr-3 text-purple-600" />
            Kesilmiş Üretim Kayıtları
          </h1>
          <p className="text-gray-600">Ana malzemeden kesilmiş ürün takibi</p>
        </div>
        {canEdit && (
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setFormData({
                date: '',
                source_production_id: '',
                cut_width_cm: '',
                cut_length_cm: '',
                requested_pieces: '',
                color: ''
              });
              setCalculations(null);
            }
          }}>
            <DialogTrigger asChild>
              <Button data-testid="add-cut-btn" className="bg-purple-600 hover:bg-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                Yeni Kesim Kaydı
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Yeni Kesilmiş Üretim Kaydı</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Tarih</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="color">Renk (Opsiyonel)</Label>
                    <Input
                      id="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      placeholder="Örn: Sarı"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="source">Ana Malzeme (Üretim Kaydından)</Label>
                  <Select value={formData.source_production_id} onValueChange={(value) => setFormData({ ...formData, source_production_id: value })}>
                    <SelectTrigger id="source">
                      <SelectValue placeholder="Ana malzeme seçin" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px] overflow-y-auto">
                      {productions.map((prod) => (
                        <SelectItem key={prod.id} value={prod.id}>
                          {prod.thickness_mm}mm × {prod.width_cm}cm × {prod.length_m}m ({prod.quantity} adet)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {getSelectedSource() && (
                    <p className="text-sm text-gray-600">
                      Ana Model: {getSelectedSource().thickness_mm}mm × {getSelectedSource().width_cm}cm × {getSelectedSource().length_m}m
                    </p>
                  )}
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-bold mb-3">Kesilmiş Ürün Ölçüleri</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cut_width">Kesilmiş En (cm)</Label>
                      <Input
                        id="cut_width"
                        type="number"
                        step="0.1"
                        value={formData.cut_width_cm}
                        onChange={(e) => setFormData({ ...formData, cut_width_cm: e.target.value })}
                        required
                        placeholder="Örn: 50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cut_length">Kesilmiş Boy (cm)</Label>
                      <Input
                        id="cut_length"
                        type="number"
                        step="0.1"
                        value={formData.cut_length_cm}
                        onChange={(e) => setFormData({ ...formData, cut_length_cm: e.target.value })}
                        required
                        placeholder="Örn: 137.5"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="requested">İstenilen Adet</Label>
                  <Input
                    id="requested"
                    type="number"
                    value={formData.requested_pieces}
                    onChange={(e) => setFormData({ ...formData, requested_pieces: e.target.value })}
                    required
                    placeholder="Örn: 5000"
                  />
                </div>

                {calculations && (
                  <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-200 space-y-2">
                    <h3 className="font-bold text-lg text-purple-800">Otomatik Hesaplamalar</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-600">1 Ana Malzemeden Çıkan:</p>
                        <p className="text-2xl font-bold text-purple-600">{calculations.piecesPerSource} adet</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Kullanılacak Ana Malzeme:</p>
                        <p className="text-2xl font-bold text-orange-600">{calculations.sourcePiecesUsed} adet</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Toplam Kesilecek:</p>
                        <p className="text-2xl font-bold text-green-600">{calculations.totalCutPieces} adet</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Fazla Çıkan:</p>
                        <p className="text-2xl font-bold text-blue-600">+{calculations.excess} adet</p>
                      </div>
                    </div>
                    <div className="pt-2 border-t">
                      <p className="text-gray-600">Toplam Metrekare:</p>
                      <p className="text-xl font-bold text-indigo-600">{calculations.cutSquareMeters.toFixed(2)} m²</p>
                    </div>
                  </div>
                )}

                <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={!calculations}>
                  Kaydet ve Stoka Ekle
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kesilmiş Üretim Kayıtları ({records.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium text-gray-600">Tarih</th>
                  <th className="text-left p-2 font-medium text-gray-600">Ana Malzeme</th>
                  <th className="text-left p-2 font-medium text-gray-600">Kesilmiş Ürün</th>
                  <th className="text-right p-2 font-medium text-gray-600">İstenilen</th>
                  <th className="text-right p-2 font-medium text-gray-600">Ana Kullanılan</th>
                  <th className="text-right p-2 font-medium text-gray-600">Toplam Çıkan</th>
                  <th className="text-right p-2 font-medium text-gray-600">m²</th>
                  {canEdit && <th className="text-center p-2 font-medium text-gray-600">İşlem</th>}
                </tr>
              </thead>
              <tbody>
                {records.map((record, index) => (
                  <tr key={record.id} className="border-b hover:bg-purple-50">
                    <td className="p-2">{format(new Date(record.date), 'dd.MM.yyyy', { locale: tr })}</td>
                    <td className="p-2">
                      <div className="text-xs text-gray-600">
                        {record.source_thickness_mm}mm × {record.source_width_cm}cm × {record.source_length_m}m
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="text-xs font-bold text-purple-600">
                        {record.source_thickness_mm}mm × {record.cut_width_cm}cm × {(record.cut_length_cm / 100).toFixed(2)}m
                      </div>
                    </td>
                    <td className="p-2 text-right">{record.requested_pieces}</td>
                    <td className="p-2 text-right font-bold text-orange-600">{record.source_pieces_used}</td>
                    <td className="p-2 text-right font-bold text-green-600">{record.total_cut_pieces}</td>
                    <td className="p-2 text-right">{record.cut_square_meters.toFixed(2)}</td>
                    {canEdit && (
                      <td className="p-2">
                        <div className="flex justify-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(record.id)}
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
            {records.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Henüz kesilmiş üretim kaydı bulunmuyor.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
