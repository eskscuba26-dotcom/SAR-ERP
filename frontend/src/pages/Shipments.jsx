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
import { Plus, Trash2, Truck, Edit, Filter, FileDown, X } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Shipments({ user }) {
  const [shipments, setShipments] = useState([]);
  const [filteredShipments, setFilteredShipments] = useState([]);
  const [colors, setColors] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingShipment, setEditingShipment] = useState(null);
  const [useStockSelection, setUseStockSelection] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    customer: '',
    thickness: '',
    width: ''
  });
  const [formData, setFormData] = useState({
    shipment_date: '',
    customer_company: '',
    thickness_mm: '',
    width_cm: '',
    length_m: '',
    color_material_id: '',
    quantity: '',
    invoice_number: '',
    vehicle_plate: '',
    driver_name: ''
  });

  const canEdit = user?.role !== 'viewer';

  useEffect(() => {
    fetchShipments();
    fetchColors();
    fetchStocks();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [shipments, filters]);

  const fetchShipments = async () => {
    try {
      const response = await axios.get(`${API}/shipments`);
      setShipments(response.data);
    } catch (error) {
      toast.error('Sevkiyatlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...shipments];

    if (filters.startDate) {
      filtered = filtered.filter(s => new Date(s.shipment_date) >= new Date(filters.startDate));
    }
    if (filters.endDate) {
      filtered = filtered.filter(s => new Date(s.shipment_date) <= new Date(filters.endDate));
    }
    if (filters.customer) {
      filtered = filtered.filter(s => s.customer_company?.toLowerCase().includes(filters.customer.toLowerCase()));
    }
    if (filters.thickness) {
      filtered = filtered.filter(s => s.thickness_mm === parseFloat(filters.thickness));
    }
    if (filters.width) {
      filtered = filtered.filter(s => s.width_cm === parseFloat(filters.width));
    }

    setFilteredShipments(filtered);
  };

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      customer: '',
      thickness: '',
      width: ''
    });
  };

  const exportToPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('SAR - Sevkiyat Kayıtları', 14, 15);
    
    const tableData = filteredShipments.map(shipment => [
      format(new Date(shipment.shipment_date), 'dd.MM.yyyy', { locale: tr }),
      shipment.customer_company || '',
      shipment.thickness_mm || '',
      shipment.width_cm || '',
      shipment.length_m || '',
      shipment.color_name || '-',
      shipment.quantity || '',
      shipment.square_meters?.toFixed(2) || '',
      shipment.invoice_number || '',
      shipment.vehicle_plate || '',
      shipment.driver_name || ''
    ]);

    doc.autoTable({
      startY: 20,
      head: [['Tarih', 'Alıcı', 'Kalınlık', 'En', 'Metre', 'Renk', 'Adet', 'm²', 'İrsaliye', 'Plaka', 'Şoför']],
      body: tableData,
      styles: { fontSize: 7, font: 'helvetica' },
      headStyles: { fillColor: [79, 70, 229], textColor: 255 }
    });

    doc.save(`sevkiyat-kayitlari-${new Date().toLocaleDateString('tr-TR')}.pdf`);
    toast.success('PDF indirildi');
  };

  const fetchColors = async () => {
    try {
      const response = await axios.get(`${API}/raw-materials`);
      const colorMaterials = response.data.filter(m => m.name.toLowerCase().includes('renk'));
      setColors(colorMaterials);
    } catch (error) {
      console.error('Renkler yüklenemedi:', error);
    }
  };

  const fetchStocks = async () => {
    try {
      const response = await axios.get(`${API}/stock`);
      setStocks(response.data);
    } catch (error) {
      console.error('Stoklar yüklenemedi:', error);
    }
  };

  const handleStockSelect = (stock) => {
    setFormData({
      ...formData,
      thickness_mm: stock.thickness_mm.toString(),
      width_cm: stock.width_cm.toString(),
      length_m: stock.length_m.toString(),
      color_material_id: stock.color_name || ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        shipment_date: new Date(formData.shipment_date).toISOString(),
        thickness_mm: parseFloat(formData.thickness_mm),
        width_cm: parseFloat(formData.width_cm),
        length_m: parseFloat(formData.length_m),
        quantity: parseInt(formData.quantity),
        color_material_id: formData.color_material_id || null
      };

      if (editingShipment) {
        await axios.put(`${API}/shipments/${editingShipment.id}`, payload);
        toast.success('Sevkiyat kaydı güncellendi');
      } else {
        await axios.post(`${API}/shipments`, payload);
        toast.success('Sevkiyat kaydı oluşturuldu');
      }
      
      setDialogOpen(false);
      setEditingShipment(null);
      setFormData({
        shipment_date: '',
        customer_company: '',
        thickness_mm: '',
        width_cm: '',
        length_m: '',
        color_material_id: '',
        quantity: '',
        invoice_number: '',
        vehicle_plate: '',
        driver_name: ''
      });
      fetchShipments();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Hata oluştu');
    }
  };

  const handleEdit = (shipment) => {
    setEditingShipment(shipment);
    setFormData({
      shipment_date: new Date(shipment.shipment_date).toISOString().slice(0, 10),
      customer_company: shipment.customer_company || '',
      thickness_mm: shipment.thickness_mm.toString(),
      width_cm: shipment.width_cm.toString(),
      length_m: shipment.length_m.toString(),
      color_material_id: shipment.color_material_id || '',
      quantity: shipment.quantity.toString(),
      invoice_number: shipment.invoice_number || '',
      vehicle_plate: shipment.vehicle_plate || '',
      driver_name: shipment.driver_name || ''
    });
    setDialogOpen(true);
  };

  const handleDelete = async (shipmentId) => {
    if (!window.confirm('Bu sevkiyat kaydını silmek istediğinize emin misiniz?')) {
      return;
    }
    try {
      await axios.delete(`${API}/shipments/${shipmentId}`);
      toast.success('Sevkiyat kaydı silindi');
      fetchShipments();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Hata oluştu');
    }
  };

  const calculateSquareMeters = () => {
    const width = parseFloat(formData.width_cm);
    const length = parseFloat(formData.length_m);
    const quantity = parseInt(formData.quantity);
    if (width && length && quantity) {
      return ((width / 100) * length * quantity).toFixed(2);
    }
    return '0';
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full"><div className="spinner w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div></div>;
  }

  return (
    <div className="space-y-6 fade-in" data-testid="shipments-page">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Space Grotesk' }}>Sevkiyat Yönetimi</h1>
          <p className="text-gray-600">Ürün sevkiyatları ve teslimat kayıtları</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowFilters(!showFilters)} variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filtrele
          </Button>
          <Button onClick={exportToPDF} variant="outline" className="gap-2">
            <FileDown className="h-4 w-4" />
            PDF İndir
          </Button>
          {canEdit && (
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setEditingShipment(null);
              setFormData({
                shipment_date: '',
                customer_company: '',
                thickness_mm: '',
                width_cm: '',
                length_m: '',
                color_material_id: '',
                quantity: '',
                invoice_number: '',
                vehicle_plate: '',
                driver_name: ''
              });
            }
          }}>
            <DialogTrigger asChild>
              <Button data-testid="add-shipment-btn">
                <Plus className="h-4 w-4 mr-2" />
                Yeni Sevkiyat
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="add-shipment-dialog" aria-describedby="shipment-dialog-description">
              <DialogHeader>
                <DialogTitle>{editingShipment ? 'Sevkiyat Düzenle' : 'Yeni Sevkiyat Kaydı'}</DialogTitle>
                <p id="shipment-dialog-description" className="sr-only">Sevkiyat bilgilerini girin</p>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="shipment_date">Sevkiyat Tarihi</Label>
                    <Input
                      id="shipment_date"
                      data-testid="shipment-date"
                      type="date"
                      value={formData.shipment_date}
                      onChange={(e) => setFormData({ ...formData, shipment_date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customer_company">Alıcı Firma</Label>
                    <Input
                      id="customer_company"
                      data-testid="shipment-customer"
                      value={formData.customer_company}
                      onChange={(e) => setFormData({ ...formData, customer_company: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* STOK SEÇİMİ */}
                <div className="space-y-2 border-t pt-4">
                  <div className="flex items-center gap-4 mb-2">
                    <Label>Sevk Edilecek Ürün:</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={useStockSelection ? "default" : "outline"}
                        size="sm"
                        onClick={() => setUseStockSelection(true)}
                      >
                        Stoktan Seç
                      </Button>
                      <Button
                        type="button"
                        variant={!useStockSelection ? "default" : "outline"}
                        size="sm"
                        onClick={() => setUseStockSelection(false)}
                      >
                        Manuel Giriş
                      </Button>
                    </div>
                  </div>

                  {useStockSelection && (
                    <div className="space-y-2">
                      <Label htmlFor="stock_select">Stoktan Ürün Seç</Label>
                      <Select onValueChange={(value) => {
                        const selected = stocks.find(s => `${s.thickness_mm}|${s.width_cm}|${s.length_m}` === value);
                        if (selected) handleStockSelect(selected);
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Stoktan ürün seçin" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px] overflow-y-auto">
                          {stocks.map((stock, idx) => (
                            <SelectItem key={idx} value={`${stock.thickness_mm}|${stock.width_cm}|${stock.length_m}`}>
                              {stock.thickness_mm}mm × {stock.width_cm}cm × {stock.length_m}m 
                              ({stock.total_quantity} adet stokta)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-gray-500">* Stoktan seçim yaptıktan sonra boyutlar otomatik dolacak</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="thickness">Kalınlık (mm)</Label>
                    <Input
                      id="thickness"
                      data-testid="shipment-thickness"
                      type="number"
                      step="0.1"
                      value={formData.thickness_mm}
                      onChange={(e) => setFormData({ ...formData, thickness_mm: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="width">En (cm)</Label>
                    <Input
                      id="width"
                      data-testid="shipment-width"
                      type="number"
                      value={formData.width_cm}
                      onChange={(e) => setFormData({ ...formData, width_cm: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="length">Metre</Label>
                    <Input
                      id="length"
                      data-testid="shipment-length"
                      type="number"
                      value={formData.length_m}
                      onChange={(e) => setFormData({ ...formData, length_m: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="color">Renk (Opsiyonel)</Label>
                  <Select value={formData.color_material_id || "none"} onValueChange={(value) => setFormData({ ...formData, color_material_id: value === "none" ? "" : value })}>
                    <SelectTrigger id="color" data-testid="shipment-color">
                      <SelectValue placeholder="Renk seçin (opsiyonel)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Renk Yok</SelectItem>
                      {colors.map((color) => (
                        <SelectItem key={color.id} value={color.id}>
                          {color.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Adet</Label>
                    <Input
                      id="quantity"
                      data-testid="shipment-quantity"
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="square_meters">Metrekare (Otomatik)</Label>
                    <Input
                      id="square_meters"
                      type="text"
                      value={calculateSquareMeters()}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="invoice_number">İrsaliye Numarası</Label>
                    <Input
                      id="invoice_number"
                      data-testid="shipment-invoice"
                      value={formData.invoice_number}
                      onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vehicle_plate">Araç Plakası</Label>
                    <Input
                      id="vehicle_plate"
                      data-testid="shipment-plate"
                      value={formData.vehicle_plate}
                      onChange={(e) => setFormData({ ...formData, vehicle_plate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="driver_name">Şoför Bilgisi</Label>
                    <Input
                      id="driver_name"
                      data-testid="shipment-driver"
                      value={formData.driver_name}
                      onChange={(e) => setFormData({ ...formData, driver_name: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" data-testid="submit-shipment-btn">Kaydet</Button>
              </form>
            </DialogContent>
          </Dialog>
          )}
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className="border-indigo-200 bg-indigo-50">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Filtreler</CardTitle>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Temizle
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <Label>Başlangıç Tarihi</Label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                />
              </div>
              <div>
                <Label>Bitiş Tarihi</Label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                />
              </div>
              <div>
                <Label>Alıcı Firma</Label>
                <Input
                  type="text"
                  placeholder="Firma adı"
                  value={filters.customer}
                  onChange={(e) => setFilters({...filters, customer: e.target.value})}
                />
              </div>
              <div>
                <Label>Kalınlık (mm)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Örn: 2"
                  value={filters.thickness}
                  onChange={(e) => setFilters({...filters, thickness: e.target.value})}
                />
              </div>
              <div>
                <Label>En (cm)</Label>
                <Input
                  type="number"
                  placeholder="Örn: 150"
                  value={filters.width}
                  onChange={(e) => setFilters({...filters, width: e.target.value})}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Sevkiyat Listesi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium text-gray-600">Tarih</th>
                  <th className="text-left p-2 font-medium text-gray-600">Alıcı Firma</th>
                  <th className="text-left p-2 font-medium text-gray-600">Kalınlık (mm)</th>
                  <th className="text-left p-2 font-medium text-gray-600">En (cm)</th>
                  <th className="text-left p-2 font-medium text-gray-600">Metre</th>
                  <th className="text-left p-2 font-medium text-gray-600">Renk</th>
                  <th className="text-left p-2 font-medium text-gray-600">Adet</th>
                  <th className="text-left p-2 font-medium text-gray-600">m²</th>
                  <th className="text-left p-2 font-medium text-gray-600">İrsaliye</th>
                  <th className="text-left p-2 font-medium text-gray-600">Plaka</th>
                  <th className="text-left p-2 font-medium text-gray-600">Şoför</th>
                  {canEdit && <th className="text-left p-2 font-medium text-gray-600">İşlem</th>}
                </tr>
              </thead>
              <tbody>
                {filteredShipments.map((shipment, index) => (
                  <tr key={shipment.id} className="border-b hover:bg-gray-50" data-testid={`shipment-row-${index}`}>
                    <td className="p-2">{format(new Date(shipment.shipment_date), 'dd.MM.yyyy', { locale: tr })}</td>
                    <td className="p-2 font-medium">{shipment.customer_company}</td>
                    <td className="p-2">{shipment.thickness_mm}</td>
                    <td className="p-2">{shipment.width_cm}</td>
                    <td className="p-2">{shipment.length_m}</td>
                    <td className="p-2">
                      {shipment.color_name ? (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                          {shipment.color_name}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="p-2 font-bold text-red-600">{shipment.quantity}</td>
                    <td className="p-2 font-medium text-indigo-600">{shipment.square_meters.toFixed(2)}</td>
                    <td className="p-2 text-xs">{shipment.invoice_number}</td>
                    <td className="p-2 text-xs">{shipment.vehicle_plate}</td>
                    <td className="p-2 text-xs">{shipment.driver_name}</td>
                    {canEdit && (
                      <td className="p-2">
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(shipment)}
                            data-testid={`edit-shipment-${index}`}
                            title="Düzenle"
                          >
                            <Edit className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(shipment.id)}
                            data-testid={`delete-shipment-${index}`}
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
            {filteredShipments.length === 0 && shipments.length > 0 && (
              <div className="text-center py-8 text-gray-500">
                Filtreye uygun sevkiyat kaydı bulunamadı.
              </div>
            )}
            {shipments.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Henüz sevkiyat kaydı bulunmuyor.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
