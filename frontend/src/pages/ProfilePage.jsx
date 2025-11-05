import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '@/App';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Mail, Lock, Shield, Eye } from 'lucide-react';

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(response.data);
      setFormData({
        username: response.data.username,
        email: response.data.email,
        password: '',
        confirmPassword: ''
      });
    } catch (error) {
      toast.error('Profil bilgileri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    if (formData.password && formData.password !== formData.confirmPassword) {
      toast.error('Şifreler eşleşmiyor');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const updateData = {
        username: formData.username,
        email: formData.email
      };

      // Şifre varsa ekle
      if (formData.password) {
        updateData.password = formData.password;
      }

      const response = await axios.put(`${API}/profile`, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // LocalStorage'daki user bilgisini güncelle
      const user = JSON.parse(localStorage.getItem('user'));
      user.username = response.data.username;
      user.email = response.data.email;
      localStorage.setItem('user', JSON.stringify(user));

      toast.success('Profil güncellendi');
      setFormData({ ...formData, password: '', confirmPassword: '' });
      fetchProfile();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Profil güncellenemedi');
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
    <div className="space-y-6 fade-in p-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Space Grotesk' }}>
          Profil Ayarları
        </h1>
        <p className="text-gray-600">Kişisel bilgilerinizi yönetin</p>
      </div>

      {/* Profile Info Card */}
      <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-4 rounded-full">
              <User className="h-12 w-12" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{profile?.username}</h2>
              <p className="text-white/80">{profile?.email}</p>
              <div className="mt-2">
                {profile?.role === 'admin' ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-white/20">
                    <Shield className="h-3 w-3" />
                    Admin
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-white/20">
                    <Eye className="h-3 w-3" />
                    İzleyici
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Profile Form */}
      <Card>
        <CardHeader>
          <CardTitle>Bilgilerinizi Güncelleyin</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <Label htmlFor="username" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Kullanıcı Adı
              </Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Kullanıcı adınızı girin"
                required
              />
            </div>

            <div>
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                E-posta
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="E-posta adresinizi girin"
                required
              />
            </div>

            <div className="pt-4 border-t">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Şifre Değiştir (Opsiyonel)
              </h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="password">Yeni Şifre</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Yeni şifre (boş bırakılabilir)"
                  />
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Yeni Şifre (Tekrar)</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Yeni şifre tekrar"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => fetchProfile()}>
                İptal
              </Button>
              <Button type="submit">
                Değişiklikleri Kaydet
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
