import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '@/App';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, TrendingUp, Package, Filter, FileDown, X } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ProductionCostAnalysis() {
  const [costData, setCostData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    thickness: '',
    width: '',
    minCost: '',
    maxCost: ''
  });

  useEffect(() => {
    fetchProductionCostAnalysis();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [costData, filters]);

  const fetchProductionCostAnalysis = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/costs/production-analysis`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCostData(response.data);
    } catch (error) {
      console.error('Maliyet analizi hatası:', error);
      toast.error('Maliyet verileri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...costData];

    if (filters.thickness) {
      filtered = filtered.filter(item => item.thickness_mm === parseFloat(filters.thickness));
    }
    if (filters.width) {
      filtered = filtered.filter(item => item.width_cm === parseFloat(filters.width));
    }
    if (filters.minCost) {
      filtered = filtered.filter(item => item.total_cost >= parseFloat(filters.minCost));
    }
    if (filters.maxCost) {
      filtered = filtered.filter(item => item.total_cost <= parseFloat(filters.maxCost));
    }

    setFilteredData(filtered);
  };

  const clearFilters = () => {
    setFilters({
      thickness: '',
      width: '',
      minCost: '',
      maxCost: ''
    });
  };

  const exportToPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('SAR - Production Cost Analysis', 14, 15);
    
    const tableData = filteredData.map(item => [
      `${item.thickness_mm}mm x ${item.width_cm}cm x ${item.length_m}m`,
      item.quantity?.toLocaleString() || '',
      item.square_meters?.toFixed(2) || '',
      `${item.material_cost?.toFixed(2)} TL` || '',
      `${item.total_cost?.toFixed(2)} TL` || '',
      `${item.cost_per_sqm?.toFixed(2)} TL` || '',
      `${item.cost_per_unit?.toFixed(4)} TL` || ''
    ]);

    autoTable(doc, {
      startY: 20,
      head: [['Product', 'Qty', 'm2', 'Material Cost', 'Total Cost', 'Cost/m2', 'Cost/Unit']],
      body: tableData,
      styles: { fontSize: 8, font: 'helvetica' },
      headStyles: { fillColor: [79, 70, 229], textColor: 255 }
    });

    doc.save(`production-cost-analysis-${new Date().toLocaleDateString('tr-TR')}.pdf`);
    toast.success('PDF indirildi');
  };

  const totalCost = filteredData.reduce((sum, item) => sum + item.total_cost, 0);
  const totalSqm = filteredData.reduce((sum, item) => sum + item.square_meters, 0);
  const totalQuantity = filteredData.reduce((sum, item) => sum + item.quantity, 0);

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
            Üretim Maliyet Analizi
          </h1>
          <p className="text-gray-600">Ürün bazında detaylı maliyet hesaplamaları</p>
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
                <Label>Min Maliyet (TL)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Minimum"
                  value={filters.minCost}
                  onChange={(e) => setFilters({...filters, minCost: e.target.value})}
                />
              </div>
              <div>
                <Label>Max Maliyet (TL)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Maximum"
                  value={filters.maxCost}
                  onChange={(e) => setFilters({...filters, maxCost: e.target.value})}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Toplam Maliyet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalCost.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</p>
            <p className="text-sm text-white/80 mt-2">{costData.length} üretim kaydı</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-teal-600 text-white">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Toplam m²
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalSqm.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</p>
            <p className="text-sm text-white/80 mt-2">Ort. {(totalCost / totalSqm).toFixed(2)} TL/m²</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-red-600 text-white">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Package className="h-5 w-5" />
              Toplam Adet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalQuantity.toLocaleString('tr-TR')}</p>
            <p className="text-sm text-white/80 mt-2">Ort. {(totalCost / totalQuantity).toFixed(2)} TL/adet</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detaylı Maliyet Tablosu</CardTitle>
        </CardHeader>
        <CardContent>
          {costData.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>Henüz maliyet verisi bulunamıyor</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Makine</TableHead>
                    <TableHead className="text-right">Kalınlık (mm)</TableHead>
                    <TableHead className="text-right">En (cm)</TableHead>
                    <TableHead className="text-right">Metre</TableHead>
                    <TableHead className="text-right">Adet</TableHead>
                    <TableHead className="text-right">m²</TableHead>
                    <TableHead className="text-right">Petkim (kg)</TableHead>
                    <TableHead className="text-right">Estol (kg)</TableHead>
                    <TableHead className="text-right">Talk (kg)</TableHead>
                    <TableHead className="text-right">Gaz (kg)</TableHead>
                    <TableHead>Masura Tipi</TableHead>
                    <TableHead className="text-right">Masura Adet</TableHead>
                    <TableHead className="text-right">Petkim (TL)</TableHead>
                    <TableHead className="text-right">Estol (TL)</TableHead>
                    <TableHead className="text-right">Talk (TL)</TableHead>
                    <TableHead className="text-right">Gaz (TL)</TableHead>
                    <TableHead className="text-right">Masura (TL)</TableHead>
                    <TableHead className="text-right font-bold">Toplam (TL)</TableHead>
                    <TableHead className="text-right bg-indigo-50 font-bold">TL/m²</TableHead>
                    <TableHead className="text-right bg-purple-50 font-bold">TL/Adet</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {costData.map((row) => (
                    <TableRow key={row.production_id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{row.row_number}</TableCell>
                      <TableCell>{new Date(row.date).toLocaleDateString('tr-TR')}</TableCell>
                      <TableCell>{row.machine}</TableCell>
                      <TableCell className="text-right">{row.thickness_mm}</TableCell>
                      <TableCell className="text-right">{row.width_cm}</TableCell>
                      <TableCell className="text-right">{row.length_m}</TableCell>
                      <TableCell className="text-right">{row.quantity}</TableCell>
                      <TableCell className="text-right font-medium">{row.square_meters.toLocaleString('tr-TR')}</TableCell>
                      <TableCell className="text-right text-sm">{row.allocated_petkim.toFixed(2)}</TableCell>
                      <TableCell className="text-right text-sm">{row.allocated_estol.toFixed(2)}</TableCell>
                      <TableCell className="text-right text-sm">{row.allocated_talk.toFixed(2)}</TableCell>
                      <TableCell className="text-right text-sm">{row.gas_share.toFixed(2)}</TableCell>
                      <TableCell className="text-sm">{row.masura_type}</TableCell>
                      <TableCell className="text-right">{row.masura_quantity}</TableCell>
                      <TableCell className="text-right text-sm">{row.petkim_cost.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-right text-sm">{row.estol_cost.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-right text-sm">{row.talk_cost.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-right text-sm">{row.gas_cost.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-right text-sm">{row.masura_cost.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-right font-bold text-indigo-700">
                        {row.total_cost.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right font-bold text-indigo-600 bg-indigo-50">
                        {row.cost_per_sqm.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right font-bold text-purple-600 bg-purple-50">
                        {row.cost_per_unit.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
