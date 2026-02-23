import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("kesbangpol.db");

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Configure Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nip TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    position TEXT NOT NULL,
    rank TEXT NOT NULL,
    unit TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    status TEXT DEFAULT 'ASN',
    ktp_path TEXT,
    sk_pangkat_path TEXT,
    sk_berkala_path TEXT,
    sk_jabatan_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Check if columns exist (for migration if needed)
const tableInfo = db.prepare("PRAGMA table_info(employees)").all() as any[];
const columns = tableInfo.map(c => c.name);
if (!columns.includes('ktp_path')) {
  db.exec("ALTER TABLE employees ADD COLUMN ktp_path TEXT");
  db.exec("ALTER TABLE employees ADD COLUMN sk_pangkat_path TEXT");
  db.exec("ALTER TABLE employees ADD COLUMN sk_berkala_path TEXT");
  db.exec("ALTER TABLE employees ADD COLUMN sk_jabatan_path TEXT");
}

// Seed data if empty
const count = db.prepare("SELECT COUNT(*) as count FROM employees").get() as { count: number };
if (count.count === 0) {
  const insert = db.prepare(`
    INSERT INTO employees (nip, name, position, rank, unit, phone, email, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const seedData = [
    ['198501012010011001', 'Budi Santoso, S.Sos', 'Kepala Badan', 'Pembina Utama Muda (IV/c)', 'Pimpinan', '08123456789', 'budi@example.com', 'Aktif'],
    ['198705122012012003', 'Siti Aminah, M.Si', 'Sekretaris', 'Pembina (IV/a)', 'Sekretariat', '08123456780', 'siti@example.com', 'Aktif'],
    ['199003152015031002', 'Agus Setiawan, S.T', 'Kabid Ideologi', 'Penata Tk. I (III/d)', 'Bidang Ideologi', '08123456781', 'agus@example.com', 'Aktif'],
    ['199208202018012005', 'Dewi Lestari, S.H', 'Analis Politik', 'Penata (III/c)', 'Bidang Politik', '08123456782', 'dewi@example.com', 'Aktif'],
    ['199511302020011004', 'Rizky Pratama, S.Kom', 'Pranata Komputer', 'Penata Muda (III/a)', 'Sekretariat', '08123456783', 'rizky@example.com', 'Aktif'],
  ];

  seedData.forEach(row => insert.run(...row));
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use("/uploads", express.static(uploadDir));

  // API Routes
  app.get("/api/employees", (req, res) => {
    const employees = db.prepare("SELECT * FROM employees ORDER BY name ASC").all();
    res.json(employees);
  });

  app.post("/api/upload", upload.single("file"), (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    res.json({ path: `/uploads/${req.file.filename}` });
  });

  app.get("/api/employees/:id", (req, res) => {
    const employee = db.prepare("SELECT * FROM employees WHERE id = ?").get(req.params.id);
    if (employee) {
      res.json(employee);
    } else {
      res.status(404).json({ error: "Employee not found" });
    }
  });

  app.post("/api/employees", (req, res) => {
    const { nip, name, position, rank, unit, phone, email, address, status, ktp_path, sk_pangkat_path, sk_berkala_path, sk_jabatan_path } = req.body;
    
    if (!nip || !name) {
      return res.status(400).json({ error: "NIP dan Nama wajib diisi" });
    }

    try {
      const info = db.prepare(`
        INSERT INTO employees (nip, name, position, rank, unit, phone, email, address, status, ktp_path, sk_pangkat_path, sk_berkala_path, sk_jabatan_path)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        nip, 
        name, 
        position || '', 
        rank || '', 
        unit || '', 
        phone || '', 
        email || '', 
        address || '', 
        status || 'ASN', 
        ktp_path || null, 
        sk_pangkat_path || null, 
        sk_berkala_path || null, 
        sk_jabatan_path || null
      );
      res.status(201).json({ id: info.lastInsertRowid });
    } catch (err: any) {
      console.error("Database Error:", err);
      res.status(400).json({ error: err.message });
    }
  });

  app.put("/api/employees/:id", (req, res) => {
    const { nip, name, position, rank, unit, phone, email, address, status, ktp_path, sk_pangkat_path, sk_berkala_path, sk_jabatan_path } = req.body;
    
    if (!nip || !name) {
      return res.status(400).json({ error: "NIP dan Nama wajib diisi" });
    }

    try {
      const result = db.prepare(`
        UPDATE employees 
        SET nip = ?, name = ?, position = ?, rank = ?, unit = ?, phone = ?, email = ?, address = ?, status = ?, ktp_path = ?, sk_pangkat_path = ?, sk_berkala_path = ?, sk_jabatan_path = ?
        WHERE id = ?
      `).run(
        nip, 
        name, 
        position || '', 
        rank || '', 
        unit || '', 
        phone || '', 
        email || '', 
        address || '', 
        status || 'ASN', 
        ktp_path || null, 
        sk_pangkat_path || null, 
        sk_berkala_path || null, 
        sk_jabatan_path || null, 
        req.params.id
      );
      
      if (result.changes === 0) {
        res.status(404).json({ error: "Pegawai tidak ditemukan" });
      } else {
        res.json({ success: true });
      }
    } catch (err: any) {
      console.error("Database Error:", err);
      res.status(400).json({ error: err.message });
    }
  });

  app.delete("/api/employees/:id", (req, res) => {
    db.prepare("DELETE FROM employees WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/stats", (req, res) => {
    const unitStats = db.prepare("SELECT unit as name, COUNT(*) as value FROM employees GROUP BY unit").all();
    const rankStats = db.prepare("SELECT rank as name, COUNT(*) as value FROM employees GROUP BY rank").all();
    const total = db.prepare("SELECT COUNT(*) as count FROM employees").get() as { count: number };
    res.json({ unitStats, rankStats, total: total.count });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
