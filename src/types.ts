export interface Employee {
  id: number;
  nip: string;
  name: string;
  position: string;
  rank: string;
  unit: string;
  phone: string;
  email: string;
  address: string;
  status: 'ASN' | 'Calon PNS' | 'P3K Penuh Waktu' | 'P3K Paruh Waktu' | 'Aktif';
  ktp_path?: string;
  sk_pangkat_path?: string;
  sk_berkala_path?: string;
  sk_jabatan_path?: string;
  created_at: string;
}

export interface Stats {
  unitStats: { name: string; value: number }[];
  rankStats: { name: string; value: number }[];
  total: number;
}
