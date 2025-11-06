import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '@/App';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileDown, Calendar, Package, Factory, Truck, TrendingUp, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [reportData, setReportData] = useState({
    manufacturing: [],
    consumptions: [],
    shipments: [],
    rawMaterials: []
  });

  useEffect(() => {
    fetchReportData();
  }, [selectedMonth, selectedYear]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      // Fetch data for selected month/year
      const [manufacturing, consumptions, shipments, rawMaterials] = await Promise.all([
        axios.get(`${API}/manufacturing`),
        axios.get(`${API}/daily-consumptions`),
        axios.get(`${API}/shipments`),
        axios.get(`${API}/raw-materials`)
      ]);

      // Filter data by selected month/year if specified
      let manufacturingData = manufacturing.data;
      let consumptionsData = consumptions.data;
      let shipmentsData = shipments.data;

      if (selectedMonth && selectedYear) {
        const filterByMonth = (items, dateField) => {
          return items.filter(item => {
            const date = new Date(item[dateField]);
            return date.getMonth() + 1 === parseInt(selectedMonth) && 
                   date.getFullYear() === parseInt(selectedYear);
          });
        };

        manufacturingData = filterByMonth(manufacturing.data, 'production_date');
        consumptionsData = filterByMonth(consumptions.data, 'date');
        shipmentsData = filterByMonth(shipments.data, 'shipment_date');
      }

      setReportData({
        manufacturing: manufacturingData,
        consumptions: consumptionsData,
        shipments: shipmentsData,
        rawMaterials: rawMaterials.data
      });
    } catch (error) {
      toast.error('Rapor verileri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const totalProduction = reportData.manufacturing.reduce((sum, item) => sum + item.quantity, 0);
    const totalProductionM2 = reportData.manufacturing.reduce((sum, item) => sum + item.square_meters, 0);
    const totalConsumption = reportData.consumptions.reduce((sum, item) => sum + item.total_petkim, 0);
    const totalShipments = reportData.shipments.reduce((sum, item) => sum + item.quantity, 0);
    const totalShipmentsM2 = reportData.shipments.reduce((sum, item) => sum + item.square_meters, 0);
    const lowStockItems = reportData.rawMaterials.filter(item => item.current_stock <= item.min_stock_level).length;

    return {
      totalProduction,
      totalProductionM2,
      totalConsumption,
      totalShipments,
      totalShipmentsM2,
      lowStockItems
    };
  };

  const exportToPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('SAR - Monthly Report', 14, 20);
    
    const monthName = selectedMonth && selectedYear 
      ? new Date(selectedYear, selectedMonth - 1).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })
      : 'Tum Veriler';
      
    doc.setFontSize(14);
    doc.text(`Period: ${monthName}`, 14, 30);
    
    const stats = calculateStats();
    let yPos = 50;
    
    // Özet bilgiler
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('SUMMARY INFORMATION', 14, yPos);
    yPos += 10;
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Production: ${stats.totalProduction.toLocaleString()} pcs (${stats.totalProductionM2.toFixed(2)} m2)`, 14, yPos);
    yPos += 6;
    doc.text(`Total Consumption: ${stats.totalConsumption.toFixed(2)} kg`, 14, yPos);
    yPos += 6;
    doc.text(`Total Shipment: ${stats.totalShipments.toLocaleString()} pcs (${stats.totalShipmentsM2.toFixed(2)} m2)`, 14, yPos);
    yPos += 6;
    doc.text(`Low Stock Materials: ${stats.lowStockItems} items`, 14, yPos);
    yPos += 15;
    
    // Hammadde stok durumu tablosu
    doc.setFont('helvetica', 'bold');
    doc.text('RAW MATERIAL STOCK STATUS', 14, yPos);
    yPos += 10;
    
    const rawMaterialsData = reportData.rawMaterials.map(rm => [
      rm.name,
      `${rm.stock?.toLocaleString('tr-TR') || 0} ${rm.unit}`,
      `${rm.min_stock?.toLocaleString('tr-TR') || 0} ${rm.unit}`
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Material', 'Stock', 'Min. Stock']],
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
        <div className="spinner w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Space Grotesk' }}>Aylık Raporlama</h1>
          <p className="text-gray-600">Üretim, tüketim ve sevkiyat özetleri</p>
        </div>
        <Button onClick={exportToPDF} className="gap-2">
          <FileDown className="h-4 w-4" />
          Raporu PDF İndir
        </Button>
      </div>

      {/* Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Rapor Dönemi Seçin
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <div>
              <label className="block text-sm font-medium mb-2">Ay</label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Ay seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tümü</SelectItem>
                  {months.map(month => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Yıl</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-24">
                  <SelectValue placeholder="Yıl" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tümü</SelectItem>
                  {years.map(year => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {monthName && (
              <div className="text-lg font-semibold text-indigo-600">
                Seçilen Dönem: {monthName}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Üretim</CardTitle>
            <Factory className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProduction.toLocaleString()} adet</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalProductionM2.toFixed(2)} m²
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tüketim</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalConsumption.toFixed(2)} kg</div>
            <p className="text-xs text-muted-foreground">
              Toplam Petkim
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sevkiyat</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalShipments.toLocaleString()} adet</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalShipmentsM2.toFixed(2)} m²
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Düşük Stok Uyarısı</CardTitle>
            <Package className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.lowStockItems}</div>
            <p className="text-xs text-muted-foreground">
              Hammadde çeşidi
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stok Durumu</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.rawMaterials.length}</div>
            <p className="text-xs text-muted-foreground">
              Toplam hammadde çeşidi
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Raw Materials Table */}
      <Card>
        <CardHeader>
          <CardTitle>Hammadde Stok Durumu</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium">Hammadde</th>
                  <th className="text-right p-2 font-medium">Mevcut Stok</th>
                  <th className="text-right p-2 font-medium">Min. Stok</th>
                  <th className="text-center p-2 font-medium">Durum</th>
                </tr>
              </thead>
              <tbody>
                {reportData.rawMaterials.map((material, index) => {
                  const isLowStock = material.current_stock <= material.min_stock_level;
                  return (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-medium">{material.name}</td>
                      <td className="p-2 text-right">
                        {material.current_stock?.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} {material.unit}
                      </td>
                      <td className="p-2 text-right">
                        {material.min_stock_level?.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} {material.unit}
                      </td>
                      <td className="p-2 text-center">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                          isLowStock 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {isLowStock ? 'Düşük' : 'Normal'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
