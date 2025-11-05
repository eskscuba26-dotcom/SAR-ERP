import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '@/App';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileDown, Calendar, Package, Factory, Truck, TrendingUp, BarChart3 } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [reportData, setReportData] = useState({
    production: [],
    consumption: [],
    shipments: [],
    stock: [],
    rawMaterials: []
  });

  useEffect(() => {
    const now = new Date();
    setSelectedMonth((now.getMonth() + 1).toString());
    setSelectedYear(now.getFullYear().toString());
  }, []);

  useEffect(() => {
    if (selectedMonth && selectedYear) {
      fetchReportData();
    }
  }, [selectedMonth, selectedYear]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Tüm verileri paralel olarak çek
      const [production, consumption, gasConsumption, shipments, stock, rawMaterials] = await Promise.all([
        axios.get(`${API}/manufacturing`, { headers }),
        axios.get(`${API}/daily-consumptions`, { headers }),
        axios.get(`${API}/gas-consumption`, { headers }),
        axios.get(`${API}/shipments`, { headers }),
        axios.get(`${API}/stock`, { headers }),
        axios.get(`${API}/raw-materials`, { headers })
      ]);

      // Seçilen aya göre filtrele
      const filterByMonth = (items, dateField) => {
        return items.filter(item => {
          const itemDate = new Date(item[dateField]);
          return itemDate.getMonth() + 1 === parseInt(selectedMonth) && 
                 itemDate.getFullYear() === parseInt(selectedYear);
        });
      };

      setReportData({
        production: filterByMonth(production.data, 'production_date'),
        consumption: filterByMonth(consumption.data, 'date'),
        gasConsumption: filterByMonth(gasConsumption.data, 'date'),
        shipments: filterByMonth(shipments.data, 'shipment_date'),
        stock: stock.data,
        rawMaterials: rawMaterials.data
      });
    } catch (error) {
      toast.error('Rapor verileri yüklenemedi');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    // Üretim istatistikleri
    const totalProduction = reportData.production.reduce((sum, p) => sum + (p.quantity || 0), 0);
    const totalSqm = reportData.production.reduce((sum, p) => sum + (p.square_meters || 0), 0);

    // Tüketim istatistikleri
    const totalPetkim = reportData.consumption.reduce((sum, c) => sum + (c.petkim_quantity || 0) + (c.fire_quantity || 0), 0);
    const totalEstol = reportData.consumption.reduce((sum, c) => sum + (c.estol_quantity || 0), 0);
    const totalTalk = reportData.consumption.reduce((sum, c) => sum + (c.talk_quantity || 0), 0);
    const totalGas = reportData.gasConsumption?.reduce((sum, g) => sum + (g.total_gas || 0), 0) || 0;

    // Sevkiyat istatistikleri
    const totalShipments = reportData.shipments.reduce((sum, s) => sum + (s.quantity || 0), 0);
    const totalShipmentSqm = reportData.shipments.reduce((sum, s) => sum + (s.square_meters || 0), 0);
    const uniqueCompanies = [...new Set(reportData.shipments.map(s => s.company))].length;

    // Stok durumu
    const totalStockQuantity = reportData.stock.reduce((sum, s) => sum + (s.quantity || 0), 0);
    const totalStockSqm = reportData.stock.reduce((sum, s) => sum + (s.square_meters || 0), 0);

    return {
      production: { total: totalProduction, sqm: totalSqm, count: reportData.production.length },
      consumption: { petkim: totalPetkim, estol: totalEstol, talk: totalTalk, gas: totalGas },
      shipments: { total: totalShipments, sqm: totalShipmentSqm, companies: uniqueCompanies, count: reportData.shipments.length },
      stock: { quantity: totalStockQuantity, sqm: totalStockSqm, items: reportData.stock.length }
    };
  };

  const exportToPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const stats = calculateStats();
    const monthName = new Date(selectedYear, selectedMonth - 1).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });

    // Başlık
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('SAR İmalat Sistemi', 105, 15, { align: 'center' });
    
    doc.setFontSize(14);
    doc.text(`Aylık Üretim Raporu - ${monthName}`, 105, 25, { align: 'center' });

    let yPos = 35;

    // Üretim Özeti
    doc.setFontSize(12);
    doc.text('ÜRETİM ÖZETİ', 14, yPos);
    yPos += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Toplam Üretim Adedi: ${stats.production.total.toLocaleString('tr-TR')}`, 14, yPos);
    yPos += 5;
    doc.text(`Toplam Metrekare: ${stats.production.sqm.toFixed(2).toLocaleString('tr-TR')} m²`, 14, yPos);
    yPos += 5;
    doc.text(`Üretim Kayıt Sayısı: ${stats.production.count}`, 14, yPos);
    yPos += 10;

    // Hammadde Tüketimi
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('HAMMADDE TÜKETİMİ', 14, yPos);
    yPos += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Petkim: ${stats.consumption.petkim.toFixed(2).toLocaleString('tr-TR')} kg`, 14, yPos);
    yPos += 5;
    doc.text(`Estol: ${stats.consumption.estol.toFixed(2).toLocaleString('tr-TR')} kg`, 14, yPos);
    yPos += 5;
    doc.text(`Talk: ${stats.consumption.talk.toFixed(2).toLocaleString('tr-TR')} kg`, 14, yPos);
    yPos += 5;
    doc.text(`Gaz: ${stats.consumption.gas.toFixed(2).toLocaleString('tr-TR')} kg`, 14, yPos);
    yPos += 10;

    // Sevkiyat Özeti
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('SEVKİYAT ÖZETİ', 14, yPos);
    yPos += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Toplam Sevkiyat Adedi: ${stats.shipments.total.toLocaleString('tr-TR')}`, 14, yPos);
    yPos += 5;
    doc.text(`Toplam Metrekare: ${stats.shipments.sqm.toFixed(2).toLocaleString('tr-TR')} m²`, 14, yPos);
    yPos += 5;
    doc.text(`Sevkiyat Sayısı: ${stats.shipments.count}`, 14, yPos);
    yPos += 5;
    doc.text(`Müşteri Sayısı: ${stats.shipments.companies}`, 14, yPos);
    yPos += 10;

    // Stok Durumu
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('STOK DURUMU (Güncel)', 14, yPos);
    yPos += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Toplam Stok Adedi: ${stats.stock.quantity.toLocaleString('tr-TR')}`, 14, yPos);
    yPos += 5;
    doc.text(`Toplam Metrekare: ${stats.stock.sqm.toFixed(2).toLocaleString('tr-TR')} m²`, 14, yPos);
    yPos += 5;
    doc.text(`Stok Kalem Sayısı: ${stats.stock.items}`, 14, yPos);
    yPos += 10;

    // Hammadde Stok Durumu
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('HAMMADDE STOK DURUMU (Güncel)', 14, yPos);
    yPos += 7;

    const rawMaterialsData = reportData.rawMaterials.map(rm => [
      rm.name,
      `${rm.stock?.toLocaleString('tr-TR') || 0} ${rm.unit}`,
      `${rm.min_stock?.toLocaleString('tr-TR') || 0} ${rm.unit}`
    ]);

    doc.autoTable({
      startY: yPos,
      head: [['Hammadde', 'Stok', 'Min. Stok']],
      body: rawMaterialsData,
      styles: { fontSize: 9, font: 'helvetica' },
      headStyles: { fillColor: [79, 70, 229] }
    });

    doc.save(`SAR-Aylik-Rapor-${monthName}.pdf`);
    toast.success('Rapor PDF olarak indirildi');
  };

  const stats = calculateStats();
  const monthName = selectedMonth && selectedYear 
    ? new Date(selectedYear, selectedMonth - 1).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })
    : '';

  const months = [
    { value: '1', label: 'Ocak' },
    { value: '2', label: 'Şubat' },
    { value: '3', label: 'Mart' },
    { value: '4', label: 'Nisan' },
    { value: '5', label: 'Mayıs' },
    { value: '6', label: 'Haziran' },
    { value: '7', label: 'Temmuz' },
    { value: '8', label: 'Ağustos' },
    { value: '9', label: 'Eylül' },
    { value: '10', label: 'Ekim' },
    { value: '11', label: 'Kasım' },
    { value: '12', label: 'Aralık' }
  ];

  const years = ['2024', '2025', '2026'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Space Grotesk' }}>
            Aylık Raporlama
          </h1>
          <p className="text-gray-600">Detaylı üretim ve tüketim raporları</p>
        </div>
        <Button onClick={exportToPDF} className="gap-2">
          <FileDown className="h-4 w-4" />
          Raporu PDF İndir
        </Button>
      </div>

      {/* Ay ve Yıl Seçimi */}
      <Card className="border-indigo-200 bg-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Rapor Dönemi Seçin
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <div className="w-48">
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Ay seçin" />
                </SelectTrigger>
                <SelectContent>
                  {months.map(m => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-32">
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Yıl seçin" />
                </SelectTrigger>
                <SelectContent>
                  {years.map(y => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-lg font-semibold text-indigo-700">
              {monthName}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Üretim */}
        <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Factory className="h-5 w-5" />
              Üretim
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-3xl font-bold">{stats.production.total.toLocaleString('tr-TR')}</p>
              <p className="text-sm text-white/80">Toplam Adet</p>
              <p className="text-lg">{stats.production.sqm.toFixed(2).toLocaleString('tr-TR')} m²</p>
              <p className="text-xs text-white/70">{stats.production.count} kayıt</p>
            </div>
          </CardContent>
        </Card>

        {/* Hammadde Tüketimi */}
        <Card className="bg-gradient-to-br from-orange-500 to-red-600 text-white">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Package className="h-5 w-5" />
              Tüketim
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-sm">
              <p className="font-semibold">Petkim: {stats.consumption.petkim.toFixed(0)} kg</p>
              <p>Estol: {stats.consumption.estol.toFixed(0)} kg</p>
              <p>Talk: {stats.consumption.talk.toFixed(0)} kg</p>
              <p>Gaz: {stats.consumption.gas.toFixed(0)} kg</p>
            </div>
          </CardContent>
        </Card>

        {/* Sevkiyat */}
        <Card className="bg-gradient-to-br from-green-500 to-teal-600 text-white">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Sevkiyat
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-3xl font-bold">{stats.shipments.total.toLocaleString('tr-TR')}</p>
              <p className="text-sm text-white/80">Toplam Adet</p>
              <p className="text-lg">{stats.shipments.sqm.toFixed(2).toLocaleString('tr-TR')} m²</p>
              <p className="text-xs text-white/70">{stats.shipments.companies} müşteri</p>
            </div>
          </CardContent>
        </Card>

        {/* Stok */}
        <Card className="bg-gradient-to-br from-purple-500 to-pink-600 text-white">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Stok
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-3xl font-bold">{stats.stock.quantity.toLocaleString('tr-TR')}</p>
              <p className="text-sm text-white/80">Toplam Adet</p>
              <p className="text-lg">{stats.stock.sqm.toFixed(2).toLocaleString('tr-TR')} m²</p>
              <p className="text-xs text-white/70">{stats.stock.items} kalem</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hammadde Stok Tablosu */}
      <Card>
        <CardHeader>
          <CardTitle>Hammadde Stok Durumu (Güncel)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {reportData.rawMaterials.map(material => (
              <div 
                key={material.id} 
                className={`p-4 rounded-lg border-2 ${
                  material.stock < material.min_stock 
                    ? 'bg-red-50 border-red-300' 
                    : 'bg-green-50 border-green-300'
                }`}
              >
                <p className="font-semibold text-sm">{material.name}</p>
                <p className="text-2xl font-bold mt-1">
                  {material.stock?.toLocaleString('tr-TR') || 0}
                </p>
                <p className="text-xs text-gray-600">{material.unit}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Min: {material.min_stock} {material.unit}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
