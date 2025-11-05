import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '@/App';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, UserPlus, Edit, Trash2, Shield, Eye } from 'lucide-react';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'viewer'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (error) {
      toast.error('Kullanıcılar yüklenemedi');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!formData.username || !formData.password) {
      toast.error('Lütfen tüm alanları doldurun');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/users`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Kullanıcı başarıyla eklendi');
      setShowAddDialog(false);
      setFormData({ username: '', password: '', role: 'viewer' });
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Kullanıcı eklenemedi');
    }
  };

  const handleEditUser = async () => {
    if (!formData.username) {
      toast.error('Lütfen kullanıcı adını girin');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const updateData = {
        username: formData.username,
        role: formData.role
      };
      
      // Şifre varsa ekle
      if (formData.password) {
        updateData.password = formData.password;
      }

      await axios.put(`${API}/users/${currentUser.id}`, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Kullanıcı güncellendi');
      setShowEditDialog(false);
      setCurrentUser(null);
      setFormData({ username: '', password: '', role: 'viewer' });
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Kullanıcı güncellenemedi');
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`${username} kullanıcısını silmek istediğinize emin misiniz?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Kullanıcı silindi');
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Kullanıcı silinemedi');
    }
  };

  const openEditDialog = (user) => {
    setCurrentUser(user);
    setFormData({
      username: user.username,
      password: '',
      role: user.role
    });
    setShowEditDialog(true);
  };

  const getRoleBadge = (role) => {
    if (role === 'admin') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
          <Shield className="h-3 w-3" />
          Admin
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
        <Eye className="h-3 w-3" />
        İzleyici
      </span>
    );
  };

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
            Kullanıcı Yönetimi
          </h1>
          <p className="text-gray-600">Sistem kullanıcılarını yönetin</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Yeni Kullanıcı Ekle
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Kullanıcılar ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kullanıcı Adı</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Kayıt Tarihi</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>{new Date(user.created_at).toLocaleDateString('tr-TR')}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(user)}
                        className="gap-1"
                      >
                        <Edit className="h-3 w-3" />
                        Düzenle
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id, user.username)}
                        className="gap-1"
                      >
                        <Trash2 className="h-3 w-3" />
                        Sil
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni Kullanıcı Ekle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="username">Kullanıcı Adı</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Kullanıcı adını girin"
              />
            </div>
            <div>
              <Label htmlFor="password">Şifre</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Şifre girin"
              />
            </div>
            <div>
              <Label htmlFor="role">Rol</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin (Tam Yetki)</SelectItem>
                  <SelectItem value="viewer">İzleyici (Sadece Görüntüleme)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>İptal</Button>
            <Button onClick={handleAddUser}>Ekle</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kullanıcı Düzenle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-username">Kullanıcı Adı</Label>
              <Input
                id="edit-username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-email">E-posta</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-password">Yeni Şifre (Opsiyonel)</Label>
              <Input
                id="edit-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Değiştirmek için yeni şifre girin"
              />
            </div>
            <div>
              <Label htmlFor="edit-role">Rol</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin (Tam Yetki)</SelectItem>
                  <SelectItem value="viewer">İzleyici (Sadece Görüntüleme)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>İptal</Button>
            <Button onClick={handleEditUser}>Güncelle</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
