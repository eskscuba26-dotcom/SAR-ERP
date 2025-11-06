import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '@/App';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Package, Filter, FileDown, X } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function Stock() {
  const [stockItems, setStockItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    thickness: '',
    width: '',
    minQuantity: '',
    maxQuantity: ''
  });

  useEffect(() => {
    fetchStock();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [stockItems, filters]);

  const fetchStock = async () => {
    try {
      const response = await axios.get(`${API}/stock`);
      // Sort by total quantity descending
      const sorted = response.data.sort((a, b) => b.total_quantity - a.total_quantity);
      setStockItems(sorted);
    } catch (error) {
      toast.error('Stok bilgileri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...stockItems];

    if (filters.thickness) {
      filtered = filtered.filter(item => item.thickness_mm === parseFloat(filters.thickness));
    }
    if (filters.width) {
      filtered = filtered.filter(item => item.width_cm === parseFloat(filters.width));
    }
    if (filters.minQuantity) {
      filtered = filtered.filter(item => item.total_quantity >= parseInt(filters.minQuantity));
    }
    if (filters.maxQuantity) {
      filtered = filtered.filter(item => item.total_quantity <= parseInt(filters.maxQuantity));
    }

    setFilteredItems(filtered);
  };

  const clearFilters = () => {
    setFilters({
      thickness: '',
      width: '',
      minQuantity: '',
      maxQuantity: ''
    });
  };

  const exportToPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('SAR - Stok Durumu', 14, 15);
    
    const tableData = filteredItems.map(item => [
      item.model && item.model.includes('Kesik') ? 'Kesilmiş' : 'Normal',
      item.thickness_mm || '',
      item.width_cm || '',
      item.length_m || '',
      item.color_name || '-',
      item.total_quantity?.toLocaleString() || '',
      item.total_square_meters?.toFixed(2) || ''
    ]);

    doc.autoTable({
      startY: 20,
      head: [['Tip', 'Kalınlık (mm)', 'En (cm)', 'Metre', 'Renk', 'Toplam Adet', 'Toplam m²']],
      body: tableData,
      styles: { fontSize: 8, font: 'helvetica' },
      headStyles: { fillColor: [79, 70, 229], textColor: 255 }
    });

    doc.save(`stok-durumu-${new Date().toLocaleDateString('tr-TR')}.pdf`);
    toast.success('PDF indirildi');
  };

  const getTotalStats = () => {
    const totalQuantity = filteredItems.reduce((sum, item) => sum + item.total_quantity, 0);
    const totalSquareMeters = filteredItems.reduce((sum, item) => sum + item.total_square_meters, 0);
    const totalModels = filteredItems.length;
    
    return { totalQuantity, totalSquareMeters, totalModels };
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full"><div className="spinner w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div></div>;
  }

  const stats = getTotalStats();

  return (
    <div className="space-y-6 fade-in" data-testid="stock-page">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Space Grotesk' }}>Stok Durumu</h1>
          <p className="text-gray-600">Üretilen mamul stok bilgileri</p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <div>
                <Label>Min Adet</Label>
                <Input
                  type="number"
                  placeholder="Minimum"
                  value={filters.minQuantity}
                  onChange={(e) => setFilters({...filters, minQuantity: e.target.value})}
                />
              </div>
              <div>
                <Label>Max Adet</Label>
                <Input
                  type="number"
                  placeholder="Maximum"
                  value={filters.maxQuantity}
                  onChange={(e) => setFilters({...filters, maxQuantity: e.target.value})}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Toplam Model Çeşidi</CardTitle>
            <Package className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.totalModels}</div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Toplam Adet</CardTitle>
            <Package className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.totalQuantity.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Toplam m²</CardTitle>
            <Package className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{stats.totalSquareMeters.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}</div>
          </CardContent>
        </Card>
      </div>

      {/* Stock Table */}
      <Card>
        <CardHeader>
          <CardTitle>Stok Listesi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium text-gray-600">Tip</th>
                  <th className="text-left p-3 font-medium text-gray-600">Kalınlık (mm)</th>
                  <th className="text-left p-3 font-medium text-gray-600">En (cm)</th>
                  <th className="text-left p-3 font-medium text-gray-600">Metre</th>
                  <th className="text-left p-3 font-medium text-gray-600">Renk</th>
                  <th className="text-left p-3 font-medium text-gray-600">Toplam Adet</th>
                  <th className="text-left p-3 font-medium text-gray-600">Toplam m²</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item, index) => {
                  const isKesik = item.model && item.model.includes('Kesik');
                  return (
                    <tr key={index} className="border-b hover:bg-gray-50" data-testid={`stock-row-${index}`}>
                      <td className="p-3">
                        {isKesik ? (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-blue-100 text-blue-800">
                            ✂️ Kesilmiş
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                            🏭 Normal
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-medium">{item.thickness_mm}</td>
                      <td className="p-3">{item.width_cm}</td>
                      <td className="p-3">{item.length_m}</td>
                      <td className="p-3">
                        {item.color_name ? (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                            {item.color_name}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="p-3 font-bold text-green-600">{item.total_quantity.toLocaleString()}</td>
                      <td className="p-3 font-medium text-indigo-600">{item.total_square_meters.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredItems.length === 0 && stockItems.length > 0 && (
              <div className="text-center py-8 text-gray-500">
                Filtreye uygun stok kaydı bulunamadı.
              </div>
            )}
            {stockItems.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Henüz stok kaydı bulunmuyor.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
