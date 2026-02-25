import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  LayoutDashboard, 
  Settings, 
  LogOut, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  ChevronRight,
  Building2,
  Briefcase,
  Phone,
  LogOut as LogOutIcon,
  Mail,
  MapPin,
  Filter,
  X,
  Plus,
  FileText,
  Upload,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { Employee, Stats } from './types';
import { cn } from './lib/utils';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'employees'>('dashboard');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Partial<Employee> | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState<string | null>(null);
  const [formSection, setFormSection] = useState<'personal' | 'employment' | 'documents'>('personal');

  useEffect(() => {
    fetchEmployees();
    fetchStats();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/employees');
      const data = await res.json();
      setEmployees(data);
    } catch (err) {
      console.error('Failed to fetch employees', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats', err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Pastikan kita tahu apakah ini update atau create
    const isUpdate = !!editingEmployee?.id;
    const method = isUpdate ? 'PUT' : 'POST';
    // Gunakan URL absolut jika memungkinkan untuk menghindari masalah routing di beberapa environment
    const baseUrl = window.location.origin;
    const url = isUpdate ? `${baseUrl}/api/employees/${editingEmployee.id}` : `${baseUrl}/api/employees`;

    // Bersihkan data sebelum dikirim
    const payload = { ...editingEmployee };
    if (!isUpdate) delete payload.id;

    console.log(`Attempting to save via ${method} ${url}`, payload);

    try {
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload),
      });
      
      console.log(`Response status: ${res.status} ${res.statusText}`);
      
      if (res.ok) {
        setIsModalOpen(false);
        setEditingEmployee(null);
        fetchEmployees();
        fetchStats();
      } else {
        let errorMessage = 'Terjadi kesalahan';
        try {
          const errData = await res.json();
          console.error('Server Error Data:', errData);
          
          if (errData.error) {
            errorMessage = typeof errData.error === 'object' ? JSON.stringify(errData.error) : String(errData.error);
          } else if (errData.message) {
            errorMessage = typeof errData.message === 'object' ? JSON.stringify(errData.message) : String(errData.message);
          } else {
            errorMessage = JSON.stringify(errData);
          }
        } catch (e) {
          errorMessage = `Server Error (${res.status}): Tidak dapat membaca respon server`;
        }
        alert('Gagal menyimpan: ' + errorMessage);
      }
    } catch (err) {
      console.error('Failed to save employee', err);
      alert('Terjadi kesalahan koneksi ke server');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: keyof Employee) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (e.g., 5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file terlalu besar. Maksimal 5MB.');
      return;
    }

    setIsUploading(field);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Gagal mengunggah file');
      }

      const data = await res.json();
      if (data.path) {
        setEditingEmployee(prev => ({ ...prev, [field]: data.path }));
      }
    } catch (err: any) {
      console.error('Upload failed', err);
      alert('Gagal mengunggah: ' + err.message);
    } finally {
      setIsUploading(null);
      // Reset input value so the same file can be selected again if needed
      e.target.value = '';
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus data pegawai ini?')) {
      try {
        const res = await fetch(`/api/employees/${id}`, { method: 'DELETE' });
        if (res.ok) {
          fetchEmployees();
          fetchStats();
        }
      } catch (err) {
        console.error('Failed to delete employee', err);
      }
    }
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.nip.includes(searchTerm) ||
    emp.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-zinc-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-zinc-900 text-white flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Building2 className="text-white" size={24} />
            </div>
            <div>
              <h1 className="font-bold text-sm leading-tight">KESBANGPOL</h1>
              <p className="text-[10px] text-zinc-400 uppercase tracking-widest">Database Pegawai</p>
            </div>
          </div>

          <nav className="space-y-1">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                activeTab === 'dashboard' ? "bg-emerald-500 text-white" : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
              )}
            >
              <LayoutDashboard size={18} />
              Dashboard
            </button>
            <button 
              onClick={() => setActiveTab('employees')}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                activeTab === 'employees' ? "bg-emerald-500 text-white" : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
              )}
            >
              <Users size={18} />
              Data Pegawai
            </button>
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-zinc-800">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors">
            <Settings size={18} />
            Pengaturan
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors">
            <LogOut size={18} />
            Keluar
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-bottom border-zinc-200 px-8 py-4 sticky top-0 z-10 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-zinc-800">
            {activeTab === 'dashboard' ? 'Dashboard Ringkasan' : 'Daftar Pegawai'}
          </h2>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
              <input 
                type="text" 
                placeholder="Cari NIP atau Nama..." 
                className="pl-10 pr-4 py-2 bg-zinc-100 border-none rounded-full text-sm w-64 focus:ring-2 focus:ring-emerald-500 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              onClick={() => {
                setEditingEmployee({});
                setFormSection('personal');
                setIsModalOpen(true);
              }}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <Plus size={16} />
              Tambah Pegawai
            </button>
          </div>
        </header>

        <div className="p-8">
          {activeTab === 'dashboard' ? (
            <div className="space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                      <Users size={20} />
                    </div>
                    <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">+2 bulan ini</span>
                  </div>
                  <h3 className="text-zinc-500 text-sm font-medium">Total Pegawai</h3>
                  <p className="text-3xl font-bold mt-1">{stats?.total || 0}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                      <Building2 size={20} />
                    </div>
                  </div>
                  <h3 className="text-zinc-500 text-sm font-medium">Total Bidang/Unit</h3>
                  <p className="text-3xl font-bold mt-1">{stats?.unitStats.length || 0}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                      <Briefcase size={20} />
                    </div>
                  </div>
                  <h3 className="text-zinc-500 text-sm font-medium">Jabatan Struktural</h3>
                  <p className="text-3xl font-bold mt-1">{employees.filter(e => e.position.toLowerCase().includes('kepala') || e.position.toLowerCase().includes('kabid')).length}</p>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
                  <h3 className="font-semibold mb-6">Distribusi Pegawai per Bidang</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats?.unitStats || []}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                        <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
                  <h3 className="font-semibold mb-6">Komposisi Golongan/Pangkat</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats?.rankStats || []}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {(stats?.rankStats || []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-200">
                      <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Pegawai</th>
                      <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">NIP</th>
                      <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Jabatan</th>
                      <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Pangkat/Gol</th>
                      <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Unit Kerja</th>
                      <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Dokumen</th>
                      <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {filteredEmployees.map((emp) => (
                      <motion.tr 
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        key={emp.id} 
                        className="hover:bg-zinc-50 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div 
                            className="flex items-center gap-3 cursor-pointer group/name"
                            onClick={() => {
                              setEditingEmployee(emp);
                              setFormSection('personal');
                              setIsModalOpen(true);
                            }}
                          >
                            <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-600 font-bold text-sm group-hover/name:bg-emerald-100 group-hover/name:text-emerald-600 transition-colors">
                              {emp.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-zinc-900 group-hover/name:text-emerald-600 transition-colors">{emp.name}</p>
                              <p className="text-xs text-zinc-500">{emp.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-zinc-600 font-mono">{emp.nip}</td>
                        <td className="px-6 py-4 text-sm text-zinc-600">{emp.position}</td>
                        <td className="px-6 py-4 text-sm text-zinc-600">{emp.rank}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-zinc-100 text-zinc-600 rounded-md text-[10px] font-bold uppercase tracking-wider">
                            {emp.unit}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider",
                            emp.status === 'ASN' ? "bg-emerald-100 text-emerald-700" :
                            emp.status === 'Calon PNS' ? "bg-blue-100 text-blue-700" :
                            emp.status?.includes('P3K') ? "bg-amber-100 text-amber-700" : "bg-zinc-100 text-zinc-600"
                          )}>
                            {emp.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-1">
                            {emp.ktp_path && <FileText size={14} className="text-emerald-500" title="KTP" />}
                            {emp.sk_pangkat_path && <FileText size={14} className="text-blue-500" title="SK Pangkat" />}
                            {emp.sk_berkala_path && <FileText size={14} className="text-amber-500" title="SK Berkala" />}
                            {emp.sk_jabatan_path && <FileText size={14} className="text-purple-500" title="SK Jabatan" />}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => {
                                setEditingEmployee(emp);
                                setFormSection('personal');
                                setIsModalOpen(true);
                              }}
                              className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors"
                              title="Edit Data"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={() => handleDelete(emp.id)}
                              className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                              title="Hapus Data"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal Form */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex h-[600px]"
            >
              {/* Modal Sidebar */}
              <div className="w-64 bg-zinc-50 border-r border-zinc-100 p-8 flex flex-col">
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-zinc-900">
                    {editingEmployee?.id ? 'Edit Pegawai' : 'Tambah Pegawai'}
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">Lengkapi informasi pegawai di bawah ini.</p>
                </div>

                <nav className="space-y-2">
                  {[
                    { id: 'personal', label: 'Data Diri', icon: UserPlus },
                    { id: 'employment', label: 'Kepegawaian', icon: Briefcase },
                    { id: 'documents', label: 'Dokumen', icon: FileText },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setFormSection(item.id as any)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                        formSection === item.id 
                          ? "bg-white shadow-sm border border-zinc-200 text-emerald-600" 
                          : "text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100"
                      )}
                    >
                      <item.icon size={18} />
                      {item.label}
                    </button>
                  ))}
                </nav>

                <div className="mt-auto pt-6 border-t border-zinc-100">
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="w-full px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-600 transition-colors text-left"
                  >
                    Batal & Tutup
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-8 flex-1 overflow-y-auto">
                  <form id="employeeForm" onSubmit={handleSave} className="space-y-8">
                    {formSection === 'personal' && (
                      <motion.div 
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-6"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Nama Lengkap</label>
                            <input 
                              required
                              type="text" 
                              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                              value={editingEmployee?.name || ''}
                              onChange={(e) => setEditingEmployee({...editingEmployee, name: e.target.value})}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">NIP</label>
                            <input 
                              required
                              type="text" 
                              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                              value={editingEmployee?.nip || ''}
                              onChange={(e) => setEditingEmployee({...editingEmployee, nip: e.target.value})}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Email</label>
                            <input 
                              type="email" 
                              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                              value={editingEmployee?.email || ''}
                              onChange={(e) => setEditingEmployee({...editingEmployee, email: e.target.value})}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Telepon</label>
                            <input 
                              type="text" 
                              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                              value={editingEmployee?.phone || ''}
                              onChange={(e) => setEditingEmployee({...editingEmployee, phone: e.target.value})}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Alamat</label>
                          <textarea 
                            rows={3}
                            className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                            value={editingEmployee?.address || ''}
                            onChange={(e) => setEditingEmployee({...editingEmployee, address: e.target.value})}
                          />
                        </div>
                      </motion.div>
                    )}

                    {formSection === 'employment' && (
                      <motion.div 
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-6"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Jabatan</label>
                            <input 
                              required
                              type="text" 
                              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                              value={editingEmployee?.position || ''}
                              onChange={(e) => setEditingEmployee({...editingEmployee, position: e.target.value})}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Pangkat/Golongan</label>
                            <input 
                              required
                              type="text" 
                              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                              value={editingEmployee?.rank || ''}
                              onChange={(e) => setEditingEmployee({...editingEmployee, rank: e.target.value})}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Unit Kerja</label>
                            <select 
                              required
                              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                              value={editingEmployee?.unit || ''}
                              onChange={(e) => setEditingEmployee({...editingEmployee, unit: e.target.value})}
                            >
                              <option value="">Pilih Unit Kerja</option>
                              <option value="Sekretariat">Sekretariat</option>
                              <option value="Bidang Ideologi">Bidang Ideologi</option>
                              <option value="Bidang Politik">Bidang Politik</option>
                              <option value="Bidang Ketahanan Ekonomi">Bidang Ketahanan Ekonomi</option>
                              <option value="Bidang Kewaspadaan Nasional">Bidang Kewaspadaan Nasional</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Status Kepegawaian</label>
                            <select 
                              required
                              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                              value={editingEmployee?.status || ''}
                              onChange={(e) => setEditingEmployee({...editingEmployee, status: e.target.value as any})}
                            >
                              <option value="">Pilih Status</option>
                              <option value="ASN">ASN</option>
                              <option value="Calon PNS">Calon PNS</option>
                              <option value="P3K Penuh Waktu">P3K Penuh Waktu</option>
                              <option value="P3K Paruh Waktu">P3K Paruh Waktu</option>
                            </select>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {formSection === 'documents' && (
                      <motion.div 
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-6"
                      >
                        <div className="grid grid-cols-1 gap-4">
                          {[
                            { label: 'KTP', field: 'ktp_path' },
                            { label: 'SK Pangkat Terakhir', field: 'sk_pangkat_path' },
                            { label: 'SK Berkala Terakhir', field: 'sk_berkala_path' },
                            { label: 'SK Jabatan', field: 'sk_jabatan_path' },
                          ].map((doc) => (
                            <div key={doc.field} className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="p-2 bg-white rounded-lg border border-zinc-100">
                                  <FileText className="text-zinc-400" size={20} />
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{doc.label}</p>
                                  {editingEmployee?.[doc.field as keyof Employee] ? (
                                    <div className="flex items-center gap-2 text-emerald-600 mt-1">
                                      <CheckCircle2 size={14} />
                                      <span className="text-[10px] font-medium">Terunggah</span>
                                      <a 
                                        href={editingEmployee[doc.field as keyof Employee] as string} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-zinc-400 hover:text-zinc-600"
                                      >
                                        <ExternalLink size={12} />
                                      </a>
                                    </div>
                                  ) : (
                                    <p className="text-[10px] text-zinc-400 mt-1">Belum ada file</p>
                                  )}
                                </div>
                              </div>
                              <label className={cn(
                                "cursor-pointer bg-white px-4 py-2 border border-zinc-200 rounded-lg text-xs font-bold text-zinc-600 hover:bg-zinc-50 transition-colors flex items-center gap-2",
                                isUploading === doc.field && "opacity-50 cursor-wait"
                              )}>
                                {isUploading === doc.field ? (
                                  <div className="w-3 h-3 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin" />
                                ) : (
                                  <Upload size={14} />
                                )}
                                {isUploading === doc.field ? 'Mengunggah...' : (editingEmployee?.[doc.field as keyof Employee] ? 'Ganti' : 'Pilih File')}
                                <input 
                                  type="file" 
                                  className="hidden" 
                                  accept=".pdf,image/*"
                                  disabled={isUploading !== null}
                                  onChange={(e) => handleFileUpload(e, doc.field as keyof Employee)}
                                />
                              </label>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </form>
                </div>

                <div className="p-8 border-t border-zinc-100 bg-zinc-50 flex items-center justify-between">
                  <div className="flex gap-2">
                    {formSection !== 'personal' && (
                      <button 
                        type="button"
                        onClick={() => {
                          if (formSection === 'employment') setFormSection('personal');
                          if (formSection === 'documents') setFormSection('employment');
                        }}
                        className="px-6 py-3 text-sm font-bold text-zinc-500 hover:text-zinc-700 transition-colors"
                      >
                        Sebelumnya
                      </button>
                    )}
                  </div>
                  <div className="flex gap-4">
                    {formSection !== 'documents' && (
                      <button 
                        type="button"
                        onClick={() => {
                          if (formSection === 'personal') setFormSection('employment');
                          if (formSection === 'employment') setFormSection('documents');
                        }}
                        className="px-8 py-3 bg-zinc-100 text-zinc-600 text-sm font-bold rounded-xl hover:bg-zinc-200 transition-all"
                      >
                        Selanjutnya
                      </button>
                    )}
                    <button 
                      form="employeeForm"
                      type="submit"
                      disabled={isSaving}
                      className={cn(
                        "px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2",
                        isSaving && "opacity-70 cursor-not-allowed"
                      )}
                    >
                      {isSaving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Menyimpan...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={18} />
                          Simpan Data Pegawai
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
