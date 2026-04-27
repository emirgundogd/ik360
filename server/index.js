import express from "express";
import cors from "cors";
import sqlite3 from "sqlite3";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const sqlite = sqlite3.verbose();

async function startServer() {
  console.log("[ik360-SERVER] Starting production-mode server with full API...");
  const app = express();
  const PORT = 3000;
  const JWT_SECRET = process.env.JWT_SECRET || 'pdks-secure-key-2025';

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));

  const dbPath = path.resolve(process.cwd(), 'server', 'pdks.sqlite');
  const db = new sqlite.Database(dbPath);

  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS app_state (id INTEGER PRIMARY KEY, data TEXT, version INTEGER)`);
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, 
      username TEXT UNIQUE, 
      password_hash TEXT, 
      role TEXT, 
      is_active INTEGER DEFAULT 1,
      permitted_modules TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    // Ensure columns exist if table was already created
    db.run("ALTER TABLE users ADD COLUMN permitted_modules TEXT", (err) => {});
    db.run("ALTER TABLE users ADD COLUMN created_at DATETIME", (err) => {
      if (!err) {
        db.run("UPDATE users SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL");
      }
    });
    db.run("ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 1", (err) => {});
    db.run(`CREATE TABLE IF NOT EXISTS payroll_parameters (
      id TEXT PRIMARY KEY,
      version_name TEXT,
      effective_from TEXT,
      payload_json TEXT,
      status TEXT DEFAULT 'ACTIVE',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS payroll_employee_configs (
      employee_id TEXT PRIMARY KEY,
      calculation_type TEXT DEFAULT 'GROSS',
      base_wage REAL DEFAULT 0,
      employment_type TEXT DEFAULT 'STANDARD',
      incentive_code TEXT DEFAULT '5510',
      is_deleted INTEGER DEFAULT 0
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS payroll_attendance (
      id TEXT PRIMARY KEY,
      period_id TEXT,
      employee_id TEXT,
      work_days INTEGER DEFAULT 30,
      overtime_50_hours REAL DEFAULT 0,
      overtime_100_hours REAL DEFAULT 0,
      unpaid_leave_days INTEGER DEFAULT 0,
      report_days INTEGER DEFAULT 0,
      meal_days INTEGER DEFAULT 0,
      UNIQUE(period_id, employee_id)
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS payroll_results (
      period_id TEXT,
      employee_id TEXT,
      param_version_id TEXT,
      gross_total REAL,
      net_pay REAL,
      employer_total_cost REAL,
      full_result_json TEXT,
      calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY(period_id, employee_id)
    )`);
    db.get("SELECT count(*) as count FROM payroll_parameters", (err, row) => {
      if (row && row.count === 0) {
        const initialParams = {
          sgk_employee_rate: 0.14,
          unemployment_employee_rate: 0.01,
          sgk_employer_rate: 0.205,
          unemployment_employer_rate: 0.02,
          five_percent_incentive: 0.05,
          income_tax_brackets: [
            { limit: 110000, rate: 0.15 },
            { limit: 230000, rate: 0.20 },
            { limit: 580000, rate: 0.27 },
            { limit: 3000000, rate: 0.35 },
            { limit: 999999999, rate: 0.40 }
          ],
          stamp_tax_rate: 0.00759,
          min_wage_gross: 20002.50,
          sgk_ceiling: 150018.90
        };
        db.run("INSERT INTO payroll_parameters (id, version_name, effective_from, payload_json) VALUES (?, ?, ?, ?)", 
          ['v2024-01', '2024 Genel Mevzuat', '2024-01-01', JSON.stringify(initialParams)]);
      }
    });

    // Initial admin user
    db.get("SELECT count(*) as count FROM users", (err, row) => {
      console.log(`[ik360-SERVER] Current user count in DB: ${row?.count || 0}`);
      if (row && row.count === 0) {
        const hash = bcrypt.hashSync('admin123', 10);
        db.run("INSERT INTO users (id, username, password_hash, role, is_active) VALUES (?, ?, ?, ?, ?)",
          ['admin-id', 'admin', hash, 'ADMIN', 1]);
        console.log("[ik360-SERVER] Created initial admin user.");
      }
    });
  });

  // --- API ROUTES ---
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), db: 'connected' });
  });

  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
      if (err || !user) return res.status(401).json({ error: 'Kullanıcı bulunamadı' });
      const valid = bcrypt.compareSync(password, user.password_hash);
      if (!valid) return res.status(401).json({ error: 'Hatalı şifre' });
      const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
      res.json({ 
        token, 
        user: { 
          id: user.id, 
          username: user.username, 
          role: user.role,
          permittedModules: user.permitted_modules ? JSON.parse(user.permitted_modules) : undefined
        } 
      });
    });
  });

  app.post('/api/auth/change-password', (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Yetkisiz erişim' });

    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      db.get("SELECT * FROM users WHERE id = ?", [decoded.id], (err, user) => {
        if (err || !user) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
        
        const valid = bcrypt.compareSync(currentPassword, user.password_hash);
        if (!valid) return res.status(401).json({ error: 'Mevcut şifre hatalı' });

        const newHash = bcrypt.hashSync(newPassword, 10);
        db.run("UPDATE users SET password_hash = ? WHERE id = ?", [newHash, decoded.id], (err) => {
          if (err) return res.status(500).json({ error: 'Şifre güncellenemedi' });
          res.json({ success: true });
        });
      });
    } catch (e) {
      res.status(401).json({ error: 'Geçersiz token' });
    }
  });

  app.get('/api/debug/users', (req, res) => {
    db.all("SELECT * FROM users", (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });

  app.get('/api/admin/users', (req, res) => {
    console.log("[ik360-SERVER] Fetching users list...");
    db.all("SELECT id, username, role, is_active as isActive, permitted_modules as permittedModules, created_at as createdAt FROM users", (err, rows) => {
      if (err) {
        console.error("[ik360-SERVER] Error fetching users:", err);
        return res.status(500).json({ error: 'Kullanıcılar alınamadı' });
      }
      console.log(`[ik360-SERVER] Found ${rows?.length || 0} users in DB`);
      const results = (rows || []).map(r => ({
        ...r,
        isActive: r.isActive === 1,
        permittedModules: r.permittedModules ? JSON.parse(r.permittedModules) : undefined,
        createdAt: r.createdAt || new Date().toISOString()
      }));
      res.json(results);
    });
  });

  app.post('/api/admin/users', (req, res) => {
    const { username, password, role, permittedModules } = req.body;
    if (!username || !password || !role) return res.status(400).json({ error: 'Eksik bilgi' });

    const id = Date.now().toString();
    const hash = bcrypt.hashSync(password, 10);
    db.run("INSERT INTO users (id, username, password_hash, role, is_active, permitted_modules) VALUES (?, ?, ?, ?, ?, ?)",
      [id, username, hash, role, 1, JSON.stringify(permittedModules || [])],
      (err) => {
        if (err) {
          if (err.message.includes('UNIQUE')) return res.status(400).json({ error: 'Bu kullanıcı adı zaten kullanımda' });
          return res.status(500).json({ error: 'Kullanıcı oluşturulamadı' });
        }
        res.json({ success: true, id });
      });
  });

  app.put('/api/admin/users/:id', (req, res) => {
    const { username, role, isActive, password, permittedModules } = req.body;
    const id = req.params.id;

    if (password) {
      const hash = bcrypt.hashSync(password, 10);
      db.run("UPDATE users SET username = ?, role = ?, is_active = ?, password_hash = ?, permitted_modules = ? WHERE id = ?",
        [username, role, isActive ? 1 : 0, hash, JSON.stringify(permittedModules || []), id],
        (err) => {
          if (err) return res.status(500).json({ error: 'Güncelleme başarısız' });
          res.json({ success: true });
        });
    } else {
      db.run("UPDATE users SET username = ?, role = ?, is_active = ?, permitted_modules = ? WHERE id = ?",
        [username, role, isActive ? 1 : 0, JSON.stringify(permittedModules || []), id],
        (err) => {
          if (err) return res.status(500).json({ error: 'Güncelleme başarısız' });
          res.json({ success: true });
        });
    }
  });

  app.delete('/api/admin/users/:id', (req, res) => {
    db.run("DELETE FROM users WHERE id = ?", [req.params.id], (err) => {
      if (err) return res.status(500).json({ error: 'Silme başarısız' });
      res.json({ success: true });
    });
  });

  app.get('/api/payroll/params', (req, res) => {
    db.all("SELECT * FROM payroll_parameters ORDER BY effective_from DESC", (err, rows) => res.json(rows || []));
  });

  app.get('/api/payroll/configs', (req, res) => {
    db.all("SELECT * FROM payroll_employee_configs", (err, rows) => res.json(rows || []));
  });

  app.post('/api/payroll/configs', (req, res) => {
    const { employee_id, calculation_type, base_wage, employment_type } = req.body;
    db.run(`INSERT INTO payroll_employee_configs (employee_id, calculation_type, base_wage, employment_type) 
            VALUES (?, ?, ?, ?) ON CONFLICT(employee_id) DO UPDATE SET 
            calculation_type=excluded.calculation_type, base_wage=excluded.base_wage, employment_type=excluded.employment_type`,
      [employee_id, calculation_type, base_wage, employment_type],
      () => res.json({ success: true }));
  });

  app.get('/api/payroll/attendance/:periodId', (req, res) => {
    db.all("SELECT * FROM payroll_attendance WHERE period_id = ?", [req.params.periodId], (err, rows) => res.json(rows || []));
  });

  app.post('/api/payroll/attendance', (req, res) => {
    const { period_id, employee_id, work_days, overtime_50_hours } = req.body;
    const id = `${period_id}_${employee_id}`;
    db.run(`INSERT INTO payroll_attendance (id, period_id, employee_id, work_days, overtime_50_hours) 
            VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET work_days=excluded.work_days, overtime_50_hours=excluded.overtime_50_hours`,
      [id, period_id, employee_id, work_days, overtime_50_hours],
      () => res.json({ success: true }));
  });

  app.get('/api/payroll/results/:periodId', (req, res) => {
    db.all("SELECT * FROM payroll_results WHERE period_id = ?", [req.params.periodId], (err, rows) => res.json(rows || []));
  });

  app.post('/api/payroll/results', (req, res) => {
    const { period_id, employee_id, gross_total, net_pay, full_result_json, param_version_id } = req.body;
    db.run(`INSERT INTO payroll_results (period_id, employee_id, gross_total, net_pay, full_result_json, param_version_id) 
            VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(period_id, employee_id) DO UPDATE SET 
            gross_total=excluded.gross_total, net_pay=excluded.net_pay, full_result_json=excluded.full_result_json`,
      [period_id, employee_id, gross_total, net_pay, JSON.stringify(full_result_json), param_version_id],
      () => res.json({ success: true }));
  });

  app.get('/api/sync', (req, res) => {
    db.get("SELECT data, version FROM app_state WHERE id = 1", (err, row) => {
      res.json({ data: row ? JSON.parse(row.data) : null, version: row ? row.version : 0 });
    });
  });

  app.post('/api/sync', (req, res) => {
    const { data, version } = req.body;
    db.run(`INSERT INTO app_state (id, data, version) VALUES (1, ?, ?) 
            ON CONFLICT(id) DO UPDATE SET data=excluded.data, version=excluded.version`,
      [JSON.stringify(data), version],
      () => res.json({ success: true, version }));
  });

  // --- SERVE BUILD OR VITE MIDDLEWARE ---
  if (process.env.NODE_ENV !== 'production') {
    console.log("[ik360-SERVER] Setting up Vite middleware for development...");
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    app.get('*', async (req, res, next) => {
      if (req.originalUrl.startsWith('/api')) return res.status(404).json({ error: 'API route not found' });
      try {
        let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      console.log("[ik360-SERVER] Serving static files from:", distPath);
      app.use(express.static(distPath));
      
      // SPA fallback
      app.get('*', (req, res) => {
        if (req.originalUrl.startsWith('/api')) return res.status(404).json({ error: 'API route not found' });
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    } else {
      console.error("[ik360-SERVER] Dist folder not found!");
      app.get('*', (req, res) => {
        res.status(500).send("Application build missing.");
      });
    }
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[ik360-SERVER] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("[ik360-SERVER] Failed to start server:", err);
});
