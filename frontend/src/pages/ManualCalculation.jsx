import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '@/App';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator, Package, DollarSign, Scissors } from 'lucide-react';

export default function ManualCalculation() {
  const [rawMaterials, setRawMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Ana hesaplama verileri
  const [productData, setProductData] = useState({
    thickness: '',
    width: '',
    quantity: '',
    petkimPerSqm: '', // gr/m²
    selectedReel: '',
    generalExpensesPercent: '',
    profitPercent: ''
  });

  // Ebatlama verileri
  const [cuttingData, setCuttingData] = useState({
    cutWidth: '',
    cutLength: '',
    generalExpensesPercent: '',
    profitPercent: ''
  });

  // Hesaplama sonuçları
  const [calculations, setCalculations] = useState(null);
  const [cuttingCalculations, setCuttingCalculations] = useState(null);

  // Masura fiyatları
  const reelPrices = {
    'Masura 100': 12.50,
    'Masura 150': 18.75,
    'Masura 200': 25.00,
    'Masura 220': 27.50
  };

  useEffect(() => {
    fetchRawMaterials();
  }, []);

  const fetchRawMaterials = async () => {
    try {
      const response = await axios.get(`${API}/raw-materials`);
      setRawMaterials(response.data);
    } catch (error) {
      toast.error('Hammadde fiyatları yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  // Hammadde fiyatlarını al
  const getMaterialPrice = (materialName) => {
    const material = rawMaterials.find(m => 
      m.name.toLowerCase().includes(materialName.toLowerCase())
    );
    return material ? material.unit_price : 0;
  };

  // Metrekare hesaplama
  const calculateSquareMeters = () => {
    const thickness = parseFloat(productData.thickness);
    const width = parseFloat(productData.width);
    const quantity = parseInt(productData.quantity);
    
    if (thickness && width && quantity) {
      // Kalınlık mm, en cm, adet sayısı
      // Metrekare = (en_cm / 100) * (kalınlık_mm / 1000) * adet * 1000 (m² için)
      // Basitleştirilmiş: en_cm * kalınlık_mm * adet / 100
      return (width * thickness * quantity) / 100;
    }
    return 0;
  };

  // Ana hesaplamayı yap
  const performMainCalculation = () => {
    if (!productData.thickness || !productData.width || !productData.quantity || 
        !productData.petkimPerSqm || !productData.selectedReel ||
        !productData.generalExpensesPercent || !productData.profitPercent) {
      toast.error('Lütfen tüm alanları doldurun');
      return;
    }

    const squareMeters = calculateSquareMeters();
    const petkimGramPerSqm = parseFloat(productData.petkimPerSqm);
    const estolPercent = 0.03; // %3
    const talkPercent = 0.015; // %1.5
    
    // Malzeme tüketimi (kg cinsinden)
    const petkimKg = (petkimGramPerSqm * squareMeters) / 1000;
    const estolKg = petkimKg * estolPercent;
    const talkKg = petkimKg * talkPercent;
    const totalPetkimKg = petkimKg + (petkimKg * 0.1); // %10 fire payı örnek
    
    // Fiyatlar (TL/kg)
    const petkimPrice = getMaterialPrice('petkim');
    const estolPrice = getMaterialPrice('estol');
    const talkPrice = getMaterialPrice('talk');
    const gasPrice = getMaterialPrice('gaz');
    const reelPrice = reelPrices[productData.selectedReel] || 0;
    
    // Ham maliyet hesaplama
    const petkimCost = petkimKg * petkimPrice;
    const estolCost = estolKg * estolPrice;
    const talkCost = talkKg * talkPrice;
    const gasCost = (petkimKg * 0.05) * gasPrice; // %5 gaz kullanımı örnek
    const reelCost = reelPrice;
    
    const totalRawCost = petkimCost + estolCost + talkCost + gasCost + reelCost;
    const costPerSqm = totalRawCost / squareMeters;
    
    // Genel masraf ekleme
    const generalExpenses = parseFloat(productData.generalExpensesPercent);
    const costWithExpenses = totalRawCost * (1 + generalExpenses / 100);
    const costPerSqmWithExpenses = costWithExpenses / squareMeters;
    
    // Kâr payı ekleme
    const profit = parseFloat(productData.profitPercent);
    const finalCost = costWithExpenses * (1 + profit / 100);
    const finalCostPerSqm = finalCost / squareMeters;

    setCalculations({
      squareMeters,
      consumption: {
        petkimKg: petkimKg.toFixed(3),
        estolKg: estolKg.toFixed(3),
        talkKg: talkKg.toFixed(3),
        gasKg: (petkimKg * 0.05).toFixed(3),
        totalPetkimKg: totalPetkimKg.toFixed(3)
      },
      costs: {
        petkimCost: petkimCost.toFixed(2),
        estolCost: estolCost.toFixed(2),
        talkCost: talkCost.toFixed(2),
        gasCost: gasCost.toFixed(2),
        reelCost: reelCost.toFixed(2),
        totalRawCost: totalRawCost.toFixed(2),
        costPerSqm: costPerSqm.toFixed(2),
        costWithExpenses: costWithExpenses.toFixed(2),
        costPerSqmWithExpenses: costPerSqmWithExpenses.toFixed(2),
        finalCost: finalCost.toFixed(2),
        finalCostPerSqm: finalCostPerSqm.toFixed(2)
      }
    });
    
    toast.success('Hesaplama tamamlandı');
  };

  // Ebatlama hesaplama
  const performCuttingCalculation = () => {
    if (!calculations || !cuttingData.cutWidth || !cuttingData.cutLength ||
        !cuttingData.generalExpensesPercent || !cuttingData.profitPercent) {
      toast.error('Önce ana hesaplamayı yapın ve ebatlama bilgilerini girin');
      return;
    }

    const sourceWidth = parseFloat(productData.width); // cm
    const sourceThickness = parseFloat(productData.thickness); // mm
    const cutWidth = parseFloat(cuttingData.cutWidth); // cm
    const cutLength = parseFloat(cuttingData.cutLength); // cm
    
    // Bir parça metrekaresi
    const pieceSquareMeters = (cutWidth * cutLength) / 10000; // cm² to m²
    
    // Ana parçadan çıkan parça sayısı
    const piecesPerSource = Math.floor((sourceWidth * sourceThickness) / (cutWidth * cutLength)) * parseInt(productData.quantity);
    
    // Ham maliyet/parça
    const rawCostPerPiece = parseFloat(calculations.costs.totalRawCost) / piecesPerSource;
    
    // Genel masraf ekleme
    const generalExpenses = parseFloat(cuttingData.generalExpensesPercent);
    const costWithExpenses = rawCostPerPiece * (1 + generalExpenses / 100);
    
    // Kâr payı ekleme
    const profit = parseFloat(cuttingData.profitPercent);
    const finalPiecePrice = costWithExpenses * (1 + profit / 100);
    
    // Toplam satış değeri
    const totalSalesValue = finalPiecePrice * piecesPerSource;

    setCuttingCalculations({
      pieceSquareMeters: pieceSquareMeters.toFixed(4),
      piecesPerSource,
      rawCostPerPiece: rawCostPerPiece.toFixed(4),
      costWithExpenses: costWithExpenses.toFixed(4),
      finalPiecePrice: finalPiecePrice.toFixed(4),
      totalSalesValue: totalSalesValue.toFixed(2)
    });
    
    toast.success('Ebatlama hesaplama tamamlandı');
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full"><div className="spinner w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div></div>;
  }

  return (
    <div className="space-y-6 fade-in p-6">
      <div>
        <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Space Grotesk' }}>
          <Calculator className="inline-block w-10 h-10 mr-3 text-green-600" />
          Manuel Maliyet Hesaplama
        </h1>
        <p className="text-gray-600">Hammadde fiyatlarından manuel maliyet hesaplama aracı</p>
      </div>

      {/* Hammadde Fiyatları */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Güncel Hammadde Fiyatları
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Petkim</p>
              <p className="text-xl font-bold text-blue-600">{getMaterialPrice('petkim').toFixed(2)} TL/kg</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Estol</p>
              <p className="text-xl font-bold text-green-600">{getMaterialPrice('estol').toFixed(2)} TL/kg</p>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <p className="text-sm text-gray-600">Talk</p>
              <p className="text-xl font-bold text-yellow-600">{getMaterialPrice('talk').toFixed(2)} TL/kg</p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <p className="text-sm text-gray-600">Gaz</p>
              <p className="text-xl font-bold text-red-600">{getMaterialPrice('gaz').toFixed(2)} TL/kg</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ürün Bilgisi ve Hesaplama */}
      <Card>
        <CardHeader>
          <CardTitle>Ürün Bilgisi ve Maliyet Hesaplama</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Kalınlık (mm)</Label>
              <Input
                type="number"
                step="0.1"
                value={productData.thickness}
                onChange={(e) => setProductData({...productData, thickness: e.target.value})}
                placeholder="Örn: 2.5"
              />
            </div>
            <div>
              <Label>En (cm)</Label>
              <Input
                type="number"
                value={productData.width}
                onChange={(e) => setProductData({...productData, width: e.target.value})}
                placeholder="Örn: 150"
              />
            </div>
            <div>
              <Label>Adet</Label>
              <Input
                type="number"
                value={productData.quantity}
                onChange={(e) => setProductData({...productData, quantity: e.target.value})}
                placeholder="Örn: 1000"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Petkim Metrekareye Düşen Gram (gr/m²)</Label>
              <Input
                type="number"
                value={productData.petkimPerSqm}
                onChange={(e) => setProductData({...productData, petkimPerSqm: e.target.value})}
                placeholder="Örn: 2500"
              />
            </div>
            <div>
              <Label>Masura Tipi</Label>
              <Select value={productData.selectedReel} onValueChange={(value) => setProductData({...productData, selectedReel: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Masura seçin" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(reelPrices).map(([reel, price]) => (
                    <SelectItem key={reel} value={reel}>
                      {reel} - {price.toFixed(2)} TL
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Genel Masraflar (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={productData.generalExpensesPercent}
                onChange={(e) => setProductData({...productData, generalExpensesPercent: e.target.value})}
                placeholder="Örn: 15"
              />
            </div>
            <div>
              <Label>Kâr Payı (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={productData.profitPercent}
                onChange={(e) => setProductData({...productData, profitPercent: e.target.value})}
                placeholder="Örn: 30"
              />
            </div>
          </div>

          <div className="text-center pt-4">
            <div className="mb-4">
              <p className="text-lg">
                <span className="font-semibold">Toplam Metrekare: </span>
                <span className="text-blue-600 text-xl font-bold">{calculateSquareMeters().toFixed(2)} m²</span>
              </p>
            </div>
            <Button onClick={performMainCalculation} size="lg" className="w-full md:w-auto">
              <Calculator className="h-5 w-5 mr-2" />
              Hesapla
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Hesaplama Sonuçları */}
      {calculations && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Maliyet Hesaplama Sonuçları
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Malzeme Tüketimi */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Malzeme Tüketimi ({calculations.squareMeters.toFixed(2)} m²)</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Petkim</p>
                  <p className="font-bold text-blue-600">{calculations.consumption.petkimKg} kg</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">Estol (%3)</p>
                  <p className="font-bold text-green-600">{calculations.consumption.estolKg} kg</p>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-gray-600">Talk (%1.5)</p>
                  <p className="font-bold text-yellow-600">{calculations.consumption.talkKg} kg</p>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <p className="text-sm text-gray-600">Gaz (%5)</p>
                  <p className="font-bold text-red-600">{calculations.consumption.gasKg} kg</p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-600">Toplam Petkim</p>
                  <p className="font-bold text-purple-600">{calculations.consumption.totalPetkimKg} kg</p>
                </div>
              </div>
            </div>

            {/* Maliyet Özeti */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Maliyet Özeti</h3>
              <div className="space-y-3">
                <div className="flex justify-between p-3 bg-gray-50 rounded">
                  <span>Ham Maliyet (Hammadde + Masura)</span>
                  <span className="font-bold">{calculations.costs.totalRawCost} TL</span>
                </div>
                <div className="flex justify-between p-3 bg-gray-50 rounded">
                  <span>Metrekare Başı Ham Maliyet</span>
                  <span className="font-bold">{calculations.costs.costPerSqm} TL/m²</span>
                </div>
                <div className="flex justify-between p-3 bg-blue-50 rounded">
                  <span>+ %{productData.generalExpensesPercent} Genel Masraf</span>
                  <span className="font-bold text-blue-600">{calculations.costs.costWithExpenses} TL</span>
                </div>
                <div className="flex justify-between p-3 bg-blue-50 rounded">
                  <span>Metrekare Başı (Masraf Dahil)</span>
                  <span className="font-bold text-blue-600">{calculations.costs.costPerSqmWithExpenses} TL/m²</span>
                </div>
                <div className="flex justify-between p-3 bg-green-100 rounded border-2 border-green-200">
                  <span className="font-semibold">Final Fiyat (+ %{productData.profitPercent} Kâr)</span>
                  <span className="font-bold text-green-600 text-xl">{calculations.costs.finalCost} TL</span>
                </div>
                <div className="flex justify-between p-3 bg-green-100 rounded border-2 border-green-200">
                  <span className="font-semibold">Final Metrekare Fiyatı</span>
                  <span className="font-bold text-green-600 text-xl">{calculations.costs.finalCostPerSqm} TL/m²</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ebatlama Kısmı */}
      {calculations && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scissors className="h-5 w-5" />
              Ebatlama Hesaplama
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Kesilecek En (cm)</Label>
                <Input
                  type="number"
                  value={cuttingData.cutWidth}
                  onChange={(e) => setCuttingData({...cuttingData, cutWidth: e.target.value})}
                  placeholder="Örn: 75"
                />
              </div>
              <div>
                <Label>Kesilecek Boy (cm)</Label>
                <Input
                  type="number"
                  value={cuttingData.cutLength}
                  onChange={(e) => setCuttingData({...cuttingData, cutLength: e.target.value})}
                  placeholder="Örn: 100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Genel Masraflar (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={cuttingData.generalExpensesPercent}
                  onChange={(e) => setCuttingData({...cuttingData, generalExpensesPercent: e.target.value})}
                  placeholder="Örn: 15"
                />
              </div>
              <div>
                <Label>Kâr Payı (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={cuttingData.profitPercent}
                  onChange={(e) => setCuttingData({...cuttingData, profitPercent: e.target.value})}
                  placeholder="Örn: 30"
                />
              </div>
            </div>

            <div className="text-center pt-4">
              <Button onClick={performCuttingCalculation} size="lg" className="w-full md:w-auto">
                <Scissors className="h-5 w-5 mr-2" />
                Ebatlama Hesapla
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ebatlama Sonuçları */}
      {cuttingCalculations && (
        <Card>
          <CardHeader>
            <CardTitle>Ebatlama Hesaplama Sonuçları</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between p-3 bg-gray-50 rounded">
                <span>Bir Parça Metrekaresi</span>
                <span className="font-bold">{cuttingCalculations.pieceSquareMeters} m²</span>
              </div>
              <div className="flex justify-between p-3 bg-gray-50 rounded">
                <span>Ana Parçadan Çıkan Toplam Parça Adeti</span>
                <span className="font-bold">{cuttingCalculations.piecesPerSource} adet</span>
              </div>
              <div className="flex justify-between p-3 bg-gray-50 rounded">
                <span>Ham Maliyet / Parça</span>
                <span className="font-bold">{cuttingCalculations.rawCostPerPiece} TL</span>
              </div>
              <div className="flex justify-between p-3 bg-blue-50 rounded">
                <span>+ %{cuttingData.generalExpensesPercent} Genel Masraf</span>
                <span className="font-bold text-blue-600">{cuttingCalculations.costWithExpenses} TL</span>
              </div>
              <div className="flex justify-between p-3 bg-green-100 rounded border-2 border-green-200">
                <span className="font-semibold">Bir Parça Final Fiyat (+ %{cuttingData.profitPercent} Kâr)</span>
                <span className="font-bold text-green-600 text-xl">{cuttingCalculations.finalPiecePrice} TL</span>
              </div>
              <div className="flex justify-between p-3 bg-purple-100 rounded border-2 border-purple-200">
                <span className="font-semibold">Toplam Satış Değeri ({cuttingCalculations.piecesPerSource} parça)</span>
                <span className="font-bold text-purple-600 text-2xl">{cuttingCalculations.totalSalesValue} TL</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}