# Aku Mw Magang (pweb-react-A09-2026)

Aplikasi **Internship Application Tracker & Job Explorer** berbasis React + TypeScript + Tailwind CSS v4 (Vite).

---

## 1. Prasyarat & Setup Awal

Pastikan di perangkat sudah terpasang:
- **Node.js** (disarankan v20+ atau v22+)
- **npm** (bawaan Node.js)
- **Git**

### Langkah Instalasi & Menjalankan Proyek

1. **Clone repositori** (atau `git pull` jika sudah pernah clone):
   ```bash
   git clone <url-repository>
   cd pweb-react-A09-2026
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Jalankan server development**:
   ```bash
   npm run dev
   ```
   Buka URL yang muncul di terminal (biasanya `http://localhost:5173`).

4. **Perintah tambahan untuk pengecekan sebelum commit/push**:
   ```bash
   npm run lint    # Cek aturan ESLint
   npm run build   # Cek kompilasi TypeScript & build produksi
   ```

---

## 2. Struktur Folder Proyek

```text
src/
├── components/
│   ├── JobExplorer.tsx              # [Orang 1 - Selesai] Katalog lowongan, filter, & skill matcher
│   ├── ManualApplicationModal.tsx   # [Orang 1 - Selesai] Modal tambah lamaran manual
│   └── ...                          # Tambahkan komponen Orang 2 & Orang 3 di sini
├── data/
│   └── mockJobs.ts                  # Data fallback lowongan apabila API Remotive gagal/offline
├── hooks/
│   └── useLocalStorage.ts           # Custom hook sinkronisasi state dengan localStorage
├── types/
│   └── index.ts                     # Kontrak tipe data utama (Application, JobListing, dll.)
├── utils/
│   └── jobUtils.ts                  # Helper kalkulasi skill match, inferensi workMode, & cek duplikat
├── App.tsx                          # Root component, navigasi tab, & state utama
├── index.css                        # Import Tailwind CSS v4 (@import "tailwindcss";)
└── main.tsx                         # Entry point React
```

---

## 3. Kontrak Data & State Bersama (`localStorage`)

Seluruh state utama sudah diinisialisasi di `src/App.tsx` menggunakan hook `useLocalStorage` dan otomatis tersimpan di browser:

| State di `App.tsx` | Key `localStorage` | Tipe Data | Deskripsi |
| :--- | :--- | :--- | :--- |
| `kaptenSkills` | `"aku_mw_magang_skills"` | `string[]` | Daftar skill yang dimiliki pengguna (default: `["React", "TypeScript", "CSS"]`) |
| `applications` | `"aku_mw_magang_applications"` | `Application[]` | Daftar seluruh lamaran kerja/magang yang disimpan dari katalog atau dicatat manual |

### Tipe Data Utama (`src/types/index.ts`)
Gunakan tipe yang sudah didefinisikan di `src/types/index.ts` agar terhindar dari konflik tipe antar anggota:
- **`ApplicationStatus`**: `"WISHLIST" | "APPLIED" | "SCREENING" | "INTERVIEW" | "OFFER" | "REJECTED" | "GHOSTED"`
- **`WorkMode`**: `"Remote" | "Hybrid" | "Onsite"`
- **`Application`**:
  ```ts
  export interface Application {
    id: string;
    company: string;
    role: string;
    workMode: WorkMode;
    status: ApplicationStatus;
    requiredSkills: string[];
    cvVersion?: string;
    appliedDate?: string;
    interviewDateTime?: string;
    salaryOffer?: number;
    lastUpdatedAt: string;
    checklist: ChecklistItem[];
    activityLogs: ActivityLog[];
  }
  ```

---

## 4. Panduan Pengerjaan Selanjutnya (Orang 2 & Orang 3)

### Bagian yang Sudah Selesai (Orang 1)
- Navigasi utama 3 tab (`EXPLORE`, `PIPELINE`, `COMPARATOR`) di `src/App.tsx`.
- **Eksplorasi Lowongan (`JobExplorer.tsx`)**: Fetch API Remotive + fallback data lokal, manajemen Skill Kapten, kalkulasi persentase kecocokan skill & missing skills, serta tombol simpan ke Wishlist.
- **Modal Catat Lamaran Manual (`ManualApplicationModal.tsx`)**: Tambah lamaran manual ke status `WISHLIST` atau `APPLIED` beserta validasi duplikat (`company` + `role`).

---

### Panduan Setup & Integrasi untuk Orang 2 (Pipeline & Detail Lamaran)
1. **Lokasi Slot di `src/App.tsx`**:
   Cari blok `{activeTab === "PIPELINE" && ( ... )}` di `src/App.tsx` (sekitar baris 182–192).
2. **Komponen yang Perlu Dibuat**:
   Buat komponen baru di `src/components/` (misal: `ApplicationPipeline.tsx` dan `ApplicationDetailModal.tsx`).
3. **Props yang Bisa Diterima dari `App.tsx`**:
   Teruskan `applications` dan `setApplications` (atau fungsi handler update/delete) dari `App.tsx` ke komponen Pipeline:
   - Mengubah `status` lamaran (`WISHLIST` -> `APPLIED` -> `SCREENING` -> `INTERVIEW` -> `OFFER` / `REJECTED` / `GHOSTED`).
   - Mengisi/mengubah `cvVersion`, `appliedDate`, `interviewDateTime`, dan `salaryOffer` (penting saat status mencapai `OFFER` agar bisa dipakai Orang 3).
   - Mengelola `checklist` (`ChecklistItem[]`) untuk persiapan interview/dokumen.
   - Menambahkan catatan otomatis/manual ke `activityLogs` (`ActivityLog[]`) dan memperbarui `lastUpdatedAt` setiap ada perubahan.
   - Menghapus lamaran jika diperlukan.

---

### Panduan Setup & Integrasi untuk Orang 3 (Offer Comparator)
1. **Lokasi Slot di `src/App.tsx`**:
   Cari blok `{activeTab === "COMPARATOR" && ( ... )}` di `src/App.tsx` (sekitar baris 194–204).
2. **Komponen yang Perlu Dibuat**:
   Buat komponen baru di `src/components/` (misal: `OfferComparator.tsx`).
3. **Props & Data yang Digunakan**:
   - Filter `applications` yang memiliki `status === "OFFER"` (atau izinkan pengguna memilih dari lamaran yang ada/menginput simulasi gaji `salaryOffer`).
   - Gunakan `kaptenSkills` dan helper `calculateSkillMatch` dari `src/utils/jobUtils.ts` bila ingin menampilkan perbandingan kecocokan skill antar-offer.
   - Jika komponen butuh mengubah nilai `salaryOffer` atau menerima/menolak offer langsung dari halaman komparasi, teruskan callback update ke `setApplications` di `App.tsx`.

---

## 5. Alur Kerja Git (Kolaborasi Tim)

Agar tidak terjadi konflik pada `src/App.tsx`:
1. Selalu ambil perubahan terbaru sebelum mulai bekerja:
   ```bash
   git pull origin main
   ```
2. Buat branch terpisah untuk fitur masing-masing:
   ```bash
   git checkout -b feat/pipeline-lamaran     # Contoh untuk Orang 2
   git checkout -b feat/offer-comparator     # Contoh untuk Orang 3
   ```
3. Buat komponen masing-masing di file terpisah di dalam `src/components/`, sehingga perubahan di `src/App.tsx` cukup minimal (hanya mengimpor komponen dan mengganti placeholder tab).
4. Pastikan tidak ada error TypeScript sebelum membuat Pull Request / merge:
   ```bash
   npm run build
   ```
