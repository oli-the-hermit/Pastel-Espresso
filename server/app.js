// KEEP IN SYNC with src-tauri/src/backend/ (the desktop app's Rust port of this API).
// Routes, validation, status codes and error codes must match in both. Limits come
// from shared/limits.json; errors are codes (server/errors.js), never sentences.
// `npm run test:parity` runs shared/api-scenarios.json against both; add a step there
// for any route or rule you change.
import express from 'express';
import { getDb } from './db.js';
import { hashPassword, verifyPassword, generateToken, hashToken } from './crypto.js';
import { LIMITS, USERNAME_RE, SESSION_TTL_MS, LOCKOUT_MS } from './limits.js';
import { E, fail, ApiFailure } from './errors.js';
import { securityHeaders } from './security.js';

const MAX_BLOB_BYTES = LIMITS.maxBlobBytes; // encrypted data blob cap
const LOGIN_FAIL_DELAY_MS = LIMITS.login.failDelayMs;

// ── Validation helpers ───────────────────────────────────────────
const inRange = (n, { min, max }) => n >= min && n <= max;

function validateUsername(v) {
  return typeof v === 'string' && inRange(v.length, LIMITS.username) && USERNAME_RE.test(v);
}
function validateDisplayName(v) {
  return typeof v === 'string' && inRange(v.trim().length, LIMITS.displayName);
}
function validatePassword(v) {
  return typeof v === 'string' && inRange(v.length, LIMITS.password);
}
/**
 * Decodes standard base64 with optional padding, or returns null. Buffer.from alone
 * skips characters it doesn't know (and accepts base64url), so the input must also
 * be exactly what re-encoding produces, like the Rust port's strict decoder.
 */
function decodeBase64(v) {
  const buf = Buffer.from(v, 'base64');
  const canonical = buf.toString('base64');
  return v === canonical || v === canonical.replace(/=+$/, '') ? buf : null;
}
function validateIv(v) {
  if (typeof v !== 'string' || v.length === 0 || v.length > 24) return false;
  return decodeBase64(v)?.length === 12;
}
function validateCipher(v) {
  if (typeof v !== 'string' || v.length === 0 || v.length > MAX_BLOB_BYTES * 2) return false;
  const buf = decodeBase64(v);
  return buf !== null && buf.length <= MAX_BLOB_BYTES;
}
/** An avatar is empty (no photo) or a PNG, JPEG or WebP image as a base64 data URL. */
function validateAvatarFormat(v) {
  return v === '' || /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(v);
}
function validateSalt(v) {
  if (typeof v !== 'string' || v.length !== 32) return false;
  return Buffer.from(v, 'hex').length === 16;
}
// Notes: lowercase UUID v4 ids, chosen by the client so imports and new notes can name themselves.
const DOC_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
function validateDocId(v) {
  return typeof v === 'string' && DOC_ID_RE.test(v);
}
/** A sealed record `{ iv, cipher }`: 'ok', 'invalid', or 'tooLarge' past maxBytes of ciphertext. */
function checkSealed(v, maxBytes) {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return 'invalid';
  if (!validateIv(v.iv) || typeof v.cipher !== 'string' || v.cipher.length === 0) return 'invalid';
  if (v.cipher.length > Math.ceil(maxBytes / 3) * 4) return 'tooLarge';
  const buf = decodeBase64(v.cipher);
  if (buf === null) return 'invalid';
  return buf.length > maxBytes ? 'tooLarge' : 'ok';
}
/** A document's sealed parts; the body may be left out (null or absent) only when not required. */
function checkDocParts(meta, body, bodyRequired) {
  const m = checkSealed(meta, LIMITS.documents.maxMetaBytes);
  const b = body == null && !bodyRequired ? 'ok' : checkSealed(body, LIMITS.documents.maxBytes);
  if (m === 'invalid' || b === 'invalid') return [400, E.SAVE_FAILED];
  if (m === 'tooLarge' || b === 'tooLarge') return [413, E.DOCUMENT_TOO_LARGE];
  return null;
}

// ── Brute-force limiter (in-memory) ──────────────────────────────
const attempts = new Map(); // key -> { count, blockedUntil }

function getAttemptKey(req, username) {
  return `${req.ip}:${String(username).toLowerCase()}`;
}
function isBlocked(key) {
  const entry = attempts.get(key);
  if (!entry) return false;
  if (entry.blockedUntil && entry.blockedUntil > Date.now()) return true;
  if (entry.blockedUntil && entry.blockedUntil <= Date.now()) attempts.delete(key);
  return false;
}
function recordFailure(key) {
  const entry = attempts.get(key) || { count: 0, blockedUntil: null };
  entry.count += 1;
  if (entry.count >= LIMITS.login.maxFailures) {
    entry.blockedUntil = Date.now() + LOCKOUT_MS;
    entry.count = 0;
  }
  attempts.set(key, entry);
}
function recordSuccess(key) {
  attempts.delete(key);
}
function delay(ms) {
  return new Promise(res => setTimeout(res, ms));
}

// Cleanup expired lockouts periodically to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of attempts.entries()) {
    if (entry.blockedUntil && entry.blockedUntil <= now) {
      attempts.delete(key);
    }
  }
}, 60_000).unref();

// ── Middleware ───────────────────────────────────────────────────
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return fail(res, 401, E.SESSION_EXPIRED);

  const row = getDb()
    .prepare(
      `SELECT s.token_hash, s.expires_at, p.id, p.username, p.display_name, p.avatar, p.role
       FROM sessions s JOIN profiles p ON p.id = s.profile_id
       WHERE s.token_hash = ?`
    )
    .get(hashToken(token));

  if (!row) return fail(res, 401, E.SESSION_EXPIRED);
  if (row.expires_at < Date.now()) {
    getDb().prepare('DELETE FROM sessions WHERE token_hash = ?').run(row.token_hash);
    return fail(res, 401, E.SESSION_EXPIRED);
  }

  // Sliding expiry
  getDb()
    .prepare('UPDATE sessions SET expires_at = ? WHERE token_hash = ?')
    .run(Date.now() + SESSION_TTL_MS, row.token_hash);

  req.profile = {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    avatar: row.avatar,
    role: row.role
  };
  req.tokenHash = row.token_hash;
  next();
}

function requireOwner(req, res, next) {
  if (req.profile.role !== 'owner') {
    return fail(res, 403, E.OWNER_ONLY);
  }
  next();
}

// ── Shape helpers ────────────────────────────────────────────────
function publicProfile(row) {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    avatar: row.avatar,
    role: row.role,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

/** A document as the list returns it: its sealed metadata and times, never the body. */
function docSummary(row) {
  return {
    id: row.id,
    meta: { iv: row.meta_iv, cipher: row.meta_cipher },
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function createSession(profileId) {
  const token = generateToken();
  const now = Date.now();
  getDb()
    .prepare('INSERT INTO sessions (token_hash, profile_id, created_at, expires_at) VALUES (?, ?, ?, ?)')
    .run(hashToken(token), profileId, now, now + SESSION_TTL_MS);
  return token;
}

function assertUniqueUsername(username) {
  const exists = getDb().prepare('SELECT id FROM profiles WHERE username = ? COLLATE NOCASE').get(username);
  if (exists) throw new ApiFailure(409, E.USERNAME_TAKEN);
}

// ── App ──────────────────────────────────────────────────────────
function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(securityHeaders);
  app.use(express.json({ limit: '2mb' }));

  // ── Health / bootstrap ────────────────────────────────────────
  app.get('/api/health', (req, res) => {
    const count = getDb().prepare('SELECT COUNT(*) AS n FROM profiles').get().n;
    res.json({ ok: true, requiresSetup: count === 0 });
  });

  // ── Auth ──────────────────────────────────────────────────────
  app.post('/api/auth/setup', async (req, res, next) => {
    try {
      const { username, displayName, password } = req.body || {};
      if (!validateUsername(username)) return fail(res, 400, E.INVALID_USERNAME);
      if (!validateDisplayName(displayName)) return fail(res, 400, E.INVALID_DISPLAY_NAME);
      if (!validatePassword(password)) return fail(res, 400, E.INVALID_PASSWORD);

      const db = getDb();
      const existing = db.prepare('SELECT COUNT(*) AS n FROM profiles').get().n;
      if (existing > 0) return fail(res, 409, E.ALREADY_SET_UP);

      const { salt, hash } = await hashPassword(password);
      const now = Date.now();
      const info = db
        .prepare(
          `INSERT INTO profiles (username, display_name, role, salt, password_hash, created_at, updated_at)
           VALUES (?, ?, 'owner', ?, ?, ?, ?)`
        )
        .run(username, displayName.trim(), salt, hash, now, now);

      const profile = publicProfile(db.prepare('SELECT * FROM profiles WHERE id = ?').get(info.lastInsertRowid));
      const token = createSession(profile.id);
      res.status(201).json({ token, profile, data: { salt, iv: '', cipher: '' } });
    } catch (err) {
      next(err);
    }
  });

  app.post('/api/auth/login', async (req, res, next) => {
    try {
      const { username, password } = req.body || {};
      if (typeof username !== 'string' || typeof password !== 'string') {
        return fail(res, 400, E.CREDENTIALS_REQUIRED);
      }

      const key = getAttemptKey(req, username);
      if (isBlocked(key)) return fail(res, 429, E.TOO_MANY_ATTEMPTS);

      const row = getDb().prepare('SELECT * FROM profiles WHERE username = ? COLLATE NOCASE').get(username);
      
      let ok = false;
      if (row) {
        ok = await verifyPassword(password, row.salt, row.password_hash);
      } else {
        // Dummy hash to normalize response timing and prevent user enumeration
        await hashPassword(password, '00000000000000000000000000000000');
      }

      if (!ok) {
        recordFailure(key);
        await delay(LOGIN_FAIL_DELAY_MS);
        return fail(res, 401, E.INVALID_CREDENTIALS);
      }

      recordSuccess(key);
      const token = createSession(row.id);
      const profile = publicProfile(row);
      res.json({
        token,
        profile,
        data: { salt: row.salt, iv: row.data_iv, cipher: row.data_cipher }
      });
    } catch (err) {
      next(err);
    }
  });

  app.post('/api/auth/logout', requireAuth, (req, res) => {
    getDb().prepare('DELETE FROM sessions WHERE token_hash = ?').run(req.tokenHash);
    res.status(204).end();
  });

  app.get('/api/auth/me', requireAuth, (req, res) => {
    res.json({ profile: req.profile });
  });

  // ── Encrypted per-profile data ────────────────────────────────
  app.get('/api/data', requireAuth, (req, res) => {
    const row = getDb().prepare('SELECT salt, data_iv, data_cipher FROM profiles WHERE id = ?').get(req.profile.id);
    res.json(
      row.data_cipher
        ? { salt: row.salt, iv: row.data_iv, cipher: row.data_cipher }
        : { salt: row.salt, iv: '', cipher: '' }
    );
  });

  app.put('/api/data', requireAuth, (req, res, next) => {
    try {
      const { iv, cipher } = req.body || {};
      if (!validateIv(iv) || !validateCipher(cipher)) {
        return fail(res, 400, E.SAVE_FAILED);
      }
      getDb()
        .prepare('UPDATE profiles SET data_iv = ?, data_cipher = ?, updated_at = ? WHERE id = ?')
        .run(iv, cipher, Date.now(), req.profile.id);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  });

  // ── Notes: one sealed record per document ─────────────────────
  // The list carries metadata only, newest first; a body loads when its note opens.
  app.get('/api/documents', requireAuth, (req, res) => {
    const rows = getDb()
      .prepare('SELECT id, meta_iv, meta_cipher, created_at, updated_at FROM documents WHERE profile_id = ? ORDER BY updated_at DESC, id')
      .all(req.profile.id);
    res.json({ documents: rows.map(docSummary) });
  });

  app.get('/api/documents/:id', requireAuth, (req, res) => {
    const { id } = req.params;
    const row = validateDocId(id)
      ? getDb().prepare('SELECT * FROM documents WHERE profile_id = ? AND id = ?').get(req.profile.id, id)
      : undefined;
    if (!row) return fail(res, 404, E.DOCUMENT_NOT_FOUND);
    res.json({ document: { ...docSummary(row), body: { iv: row.body_iv, cipher: row.body_cipher } } });
  });

  // Creates (201, body required) or updates (200; leave the body out to change only the metadata).
  app.put('/api/documents/:id', requireAuth, (req, res, next) => {
    try {
      const { id } = req.params;
      const { meta, body } = req.body || {};
      if (!validateDocId(id)) return fail(res, 400, E.SAVE_FAILED);
      const partsError = checkDocParts(meta, body, false);
      if (partsError) return fail(res, ...partsError);

      const db = getDb();
      const existing = db.prepare('SELECT created_at FROM documents WHERE profile_id = ? AND id = ?').get(req.profile.id, id);
      const now = Date.now();
      if (!existing) {
        if (body == null) return fail(res, 400, E.SAVE_FAILED);
        const { n } = db.prepare('SELECT COUNT(*) AS n FROM documents WHERE profile_id = ?').get(req.profile.id);
        if (n >= LIMITS.documents.maxPerProfile) return fail(res, 409, E.DOCUMENT_LIMIT);
        db.prepare(
          `INSERT INTO documents (profile_id, id, meta_iv, meta_cipher, body_iv, body_cipher, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(req.profile.id, id, meta.iv, meta.cipher, body.iv, body.cipher, now, now);
        return res.status(201).json({ document: { id, createdAt: now, updatedAt: now } });
      }
      if (body == null) {
        db.prepare('UPDATE documents SET meta_iv = ?, meta_cipher = ?, updated_at = ? WHERE profile_id = ? AND id = ?')
          .run(meta.iv, meta.cipher, now, req.profile.id, id);
      } else {
        db.prepare(
          `UPDATE documents SET meta_iv = ?, meta_cipher = ?, body_iv = ?, body_cipher = ?, updated_at = ?
           WHERE profile_id = ? AND id = ?`
        ).run(meta.iv, meta.cipher, body.iv, body.cipher, now, req.profile.id, id);
      }
      res.json({ document: { id, createdAt: existing.created_at, updatedAt: now } });
    } catch (err) {
      next(err);
    }
  });

  // Import: every document is new, all of them or none. The client splits big imports.
  app.post('/api/documents/batch', requireAuth, (req, res, next) => {
    try {
      const docs = req.body?.documents;
      if (!Array.isArray(docs) || docs.length === 0) return fail(res, 400, E.SAVE_FAILED);
      if (docs.length > LIMITS.documents.maxBatch) return fail(res, 400, E.BATCH_TOO_LARGE);
      const seen = new Set();
      for (const d of docs) {
        if (!d || typeof d !== 'object' || !validateDocId(d.id) || seen.has(d.id)) return fail(res, 400, E.SAVE_FAILED);
        seen.add(d.id);
        const partsError = checkDocParts(d.meta, d.body, true);
        if (partsError) return fail(res, ...partsError);
      }

      const db = getDb();
      const exists = db.prepare('SELECT 1 FROM documents WHERE profile_id = ? AND id = ?');
      if (docs.some(d => exists.get(req.profile.id, d.id))) return fail(res, 409, E.DOCUMENT_EXISTS);
      const { n } = db.prepare('SELECT COUNT(*) AS n FROM documents WHERE profile_id = ?').get(req.profile.id);
      if (n + docs.length > LIMITS.documents.maxPerProfile) return fail(res, 409, E.DOCUMENT_LIMIT);

      const now = Date.now();
      const insert = db.prepare(
        `INSERT INTO documents (profile_id, id, meta_iv, meta_cipher, body_iv, body_cipher, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      );
      db.transaction(() => {
        for (const d of docs) insert.run(req.profile.id, d.id, d.meta.iv, d.meta.cipher, d.body.iv, d.body.cipher, now, now);
      })();
      res.status(201).json({ documents: docs.map(d => ({ id: d.id, createdAt: now, updatedAt: now })) });
    } catch (err) {
      next(err);
    }
  });

  // Bulk move, label, pin, trash or restore: new metadata for notes that exist, all of them or none.
  app.post('/api/documents/meta', requireAuth, (req, res, next) => {
    try {
      const docs = req.body?.documents;
      if (!Array.isArray(docs) || docs.length === 0) return fail(res, 400, E.SAVE_FAILED);
      if (docs.length > LIMITS.documents.maxBatch) return fail(res, 400, E.BATCH_TOO_LARGE);
      const seen = new Set();
      for (const d of docs) {
        if (!d || typeof d !== 'object' || !validateDocId(d.id) || seen.has(d.id)) return fail(res, 400, E.SAVE_FAILED);
        seen.add(d.id);
        const partsError = checkDocParts(d.meta, null, false);
        if (partsError) return fail(res, ...partsError);
      }

      const db = getDb();
      const created = db.prepare('SELECT created_at FROM documents WHERE profile_id = ? AND id = ?');
      const createdAt = docs.map(d => created.get(req.profile.id, d.id)?.created_at);
      if (createdAt.includes(undefined)) return fail(res, 404, E.DOCUMENT_NOT_FOUND);

      const now = Date.now();
      const update = db.prepare('UPDATE documents SET meta_iv = ?, meta_cipher = ?, updated_at = ? WHERE profile_id = ? AND id = ?');
      db.transaction(() => {
        for (const d of docs) update.run(d.meta.iv, d.meta.cipher, now, req.profile.id, d.id);
      })();
      res.json({ documents: docs.map((d, i) => ({ id: d.id, createdAt: createdAt[i], updatedAt: now })) });
    } catch (err) {
      next(err);
    }
  });

  // Deleting for good (Trash is a flag inside the sealed metadata). Unknown ids just don't count.
  app.post('/api/documents/purge', requireAuth, (req, res, next) => {
    try {
      const ids = req.body?.ids;
      if (!Array.isArray(ids) || ids.length === 0) return fail(res, 400, E.SAVE_FAILED);
      if (ids.length > LIMITS.documents.maxBatch) return fail(res, 400, E.BATCH_TOO_LARGE);
      if (!ids.every(validateDocId)) return fail(res, 400, E.SAVE_FAILED);
      const db = getDb();
      const del = db.prepare('DELETE FROM documents WHERE profile_id = ? AND id = ?');
      const deleted = db.transaction(() => ids.reduce((sum, id) => sum + del.run(req.profile.id, id).changes, 0))();
      res.json({ deleted });
    } catch (err) {
      next(err);
    }
  });

  // ── Self profile management ───────────────────────────────────
  app.put('/api/profile', requireAuth, (req, res, next) => {
    try {
      const { displayName, username, avatar } = req.body || {};
      const db = getDb();
      const row = db.prepare('SELECT * FROM profiles WHERE id = ?').get(req.profile.id);

      const patch = {};
      if (displayName !== undefined) {
        if (!validateDisplayName(displayName)) return fail(res, 400, E.INVALID_DISPLAY_NAME);
        patch.display_name = displayName.trim();
      }
      if (username !== undefined) {
        if (!validateUsername(username)) return fail(res, 400, E.INVALID_USERNAME);
        if (username.toLowerCase() !== row.username.toLowerCase()) {
          assertUniqueUsername(username);
        }
        patch.username = username;
      }
      if (avatar !== undefined) {
        if (typeof avatar !== 'string' || avatar.length > LIMITS.avatar.maxChars) {
          return fail(res, 400, E.AVATAR_TOO_LARGE);
        }
        if (!validateAvatarFormat(avatar)) return fail(res, 400, E.INVALID_AVATAR);
        patch.avatar = avatar;
      }

      if (Object.keys(patch).length === 0) return fail(res, 400, E.NO_CHANGES);

      const sets = Object.keys(patch).map(k => `${k} = ?`).join(', ');
      const values = Object.values(patch);
      db.prepare(`UPDATE profiles SET ${sets}, updated_at = ? WHERE id = ?`).run(...values, Date.now(), req.profile.id);
      const updated = db.prepare('SELECT * FROM profiles WHERE id = ?').get(req.profile.id);
      res.json({ profile: publicProfile(updated) });
    } catch (err) {
      next(err);
    }
  });

  app.put('/api/profile/password', requireAuth, async (req, res, next) => {
    try {
      const { currentPassword, newPassword, salt, iv, cipher } = req.body || {};
      if (typeof currentPassword !== 'string') {
        return fail(res, 400, E.CURRENT_PASSWORD_REQUIRED);
      }
      const db = getDb();
      const row = db.prepare('SELECT * FROM profiles WHERE id = ?').get(req.profile.id);

      const isCurrentValid = await verifyPassword(currentPassword || '', row.salt, row.password_hash);
      if (!isCurrentValid) {
        await delay(LOGIN_FAIL_DELAY_MS);
        return fail(res, 401, E.WRONG_CURRENT_PASSWORD);
      }
      if (!validatePassword(newPassword)) {
        return fail(res, 400, E.INVALID_NEW_PASSWORD);
      }
      if (!validateSalt(salt) || !validateIv(iv) || !validateCipher(cipher)) {
        return fail(res, 400, E.SAVE_FAILED);
      }

      const { hash } = await hashPassword(newPassword, salt);
      db.prepare('UPDATE profiles SET salt = ?, password_hash = ?, data_iv = ?, data_cipher = ?, updated_at = ? WHERE id = ?')
        .run(salt, hash, iv, cipher, Date.now(), row.id);

      // Invalidate other sessions so old passwords stop working elsewhere
      db.prepare('DELETE FROM sessions WHERE profile_id = ?').run(row.id);
      const token = createSession(row.id);

      const updated = db.prepare('SELECT * FROM profiles WHERE id = ?').get(row.id);
      res.json({ token, profile: publicProfile(updated) });
    } catch (err) {
      next(err);
    }
  });

  app.delete('/api/profile', requireAuth, async (req, res, next) => {
    try {
      const { password } = req.body || {};
      if (typeof password !== 'string') {
        return fail(res, 400, E.PASSWORD_REQUIRED);
      }
      if (req.profile.role === 'owner') {
        return fail(res, 403, E.OWNER_UNDELETABLE);
      }
      const row = getDb().prepare('SELECT * FROM profiles WHERE id = ?').get(req.profile.id);
      
      const isPasswordValid = await verifyPassword(password || '', row.salt, row.password_hash);
      if (!isPasswordValid) {
        await delay(LOGIN_FAIL_DELAY_MS);
        return fail(res, 401, E.WRONG_PASSWORD);
      }
      getDb().prepare('DELETE FROM profiles WHERE id = ?').run(row.id); // cascades sessions
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  });

  // ── Owner profile management ──────────────────────────────────
  app.get('/api/profiles', requireAuth, requireOwner, (req, res) => {
    const rows = getDb().prepare('SELECT * FROM profiles ORDER BY role DESC, created_at ASC').all();
    res.json({ profiles: rows.map(publicProfile) });
  });

  app.post('/api/profiles', requireAuth, requireOwner, async (req, res, next) => {
    try {
      const { username, displayName, password } = req.body || {};
      if (!validateUsername(username)) return fail(res, 400, E.INVALID_USERNAME);
      if (!validateDisplayName(displayName)) return fail(res, 400, E.INVALID_DISPLAY_NAME);
      if (!validatePassword(password)) return fail(res, 400, E.INVALID_PASSWORD);

      const db = getDb();
      const count = db.prepare('SELECT COUNT(*) AS n FROM profiles').get().n;
      if (count >= LIMITS.maxProfiles) {
        return fail(res, 409, E.PROFILE_LIMIT);
      }
      assertUniqueUsername(username);

      const { salt, hash } = await hashPassword(password);
      const now = Date.now();
      const info = db
        .prepare(
          `INSERT INTO profiles (username, display_name, role, salt, password_hash, created_at, updated_at)
           VALUES (?, ?, 'user', ?, ?, ?, ?)`
        )
        .run(username, displayName.trim(), salt, hash, now, now);

      const profile = publicProfile(db.prepare('SELECT * FROM profiles WHERE id = ?').get(info.lastInsertRowid));
      res.status(201).json({ profile });
    } catch (err) {
      next(err);
    }
  });

  app.put('/api/profiles/:id', requireAuth, requireOwner, (req, res, next) => {
    try {
      const { displayName } = req.body || {};
      if (!validateDisplayName(displayName)) {
        return fail(res, 400, E.INVALID_DISPLAY_NAME);
      }
      const db = getDb();
      const row = db.prepare('SELECT * FROM profiles WHERE id = ?').get(req.params.id);
      if (!row) return fail(res, 404, E.PROFILE_NOT_FOUND);

      db.prepare('UPDATE profiles SET display_name = ?, updated_at = ? WHERE id = ?')
        .run(displayName.trim(), Date.now(), row.id);
      const updated = db.prepare('SELECT * FROM profiles WHERE id = ?').get(row.id);
      res.json({ profile: publicProfile(updated) });
    } catch (err) {
      next(err);
    }
  });

  app.delete('/api/profiles/:id', requireAuth, requireOwner, (req, res) => {
    const db = getDb();
    const row = db.prepare('SELECT * FROM profiles WHERE id = ?').get(req.params.id);
    if (!row) return fail(res, 404, E.PROFILE_NOT_FOUND);
    if (row.id === req.profile.id) {
      return fail(res, 400, E.OWNER_UNDELETABLE);
    }
    db.prepare('DELETE FROM profiles WHERE id = ?').run(row.id); // cascades sessions
    res.status(204).end();
  });

  // ── Danger zone: reset all non-owner profiles ─────────────────
  app.post('/api/reset-profiles', requireAuth, requireOwner, async (req, res, next) => {
    try {
      const { password } = req.body || {};
      if (typeof password !== 'string') {
        return fail(res, 400, E.PASSWORD_REQUIRED);
      }
      const db = getDb();
      const row = db.prepare('SELECT * FROM profiles WHERE id = ?').get(req.profile.id);
      
      const isPasswordValid = await verifyPassword(password || '', row.salt, row.password_hash);
      if (!isPasswordValid) {
        await delay(LOGIN_FAIL_DELAY_MS);
        return fail(res, 401, E.WRONG_PASSWORD);
      }

      const reset = db.transaction(() => {
        const info = db.prepare("DELETE FROM profiles WHERE role = 'user'").run();
        return info.changes;
      });
      const deleted = reset();
      res.json({ deleted });
    } catch (err) {
      next(err);
    }
  });

  // Unknown API routes answer in JSON, like the desktop backend (not Express's HTML page).
  app.use('/api', (req, res) => fail(res, 404, E.NOT_FOUND));

  // ── Error handler ─────────────────────────────────────────────
  // Express only treats a handler as an error handler when it declares all four arguments.
  app.use((err, req, res, _next) => {
    if (err instanceof ApiFailure) return fail(res, err.status, err.code);
    // body-parser errors carry a status and an English message; map them to codes.
    // (entity.too.large used to fall through to its raw "request entity too large" text.)
    if (err.type === 'entity.too.large') return fail(res, 413, E.PAYLOAD_TOO_LARGE);
    if (err.status >= 400 && err.status < 500) return fail(res, err.status, E.SAVE_FAILED);
    console.error('Unhandled error:', err);
    fail(res, 500, E.INTERNAL);
  });

  return app;
}

export { createApp };