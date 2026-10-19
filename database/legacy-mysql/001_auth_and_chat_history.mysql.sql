-- ====================================================================
-- JanMitra migration 001: real authentication + persistent chat history
-- --------------------------------------------------------------------
-- * Safe to run more than once (every step checks before it changes).
-- * Never drops a table and never deletes a user, scheme or peer record.
-- * Works from the mysql CLI, MySQL Workbench, and `npm run db:migrate`
--   (no DELIMITER blocks are used).
--
-- Run it against your JanMithra database, e.g.
--   mysql -u root -p JanMithra < database/migrations/001_auth_and_chat_history.sql
-- or in Workbench: select the JanMithra schema, open this file, Execute.
--
-- What it does
--   1. users       : '' emails -> NULL, unique email index, last_login_at,
--                    and clears any password_hash that is NOT a bcrypt hash
--                    (the old app stored the literal "1234" in plaintext).
--                    Those accounts are kept, but cannot sign in until a
--                    password is set with `npm run user:set-password`.
--   2. user_sessions : server-side sessions (only SHA-256 token hashes).
--   3. conversations : one row per chat thread, owned by a user.
--   4. chat_logs     : reused as the message table; gains conversation_id,
--                      client_message_id (retry de-duplication) and metadata.
-- ====================================================================

SET @db := DATABASE();
SET @old_safe_updates := @@SQL_SAFE_UPDATES;
SET SQL_SAFE_UPDATES = 0;

CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(64) PRIMARY KEY,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 1. users
-- --------------------------------------------------------------------
UPDATE users SET email = NULL WHERE email IS NOT NULL AND TRIM(email) = '';

-- 1a. last_login_at
SET @stmt := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'users' AND COLUMN_NAME = 'last_login_at') = 0,
  'ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP NULL DEFAULT NULL',
  'DO 0');
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;

-- 1b. unique email (only if no duplicate emails already exist)
SET @has_email_idx := (SELECT COUNT(*) FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'users' AND INDEX_NAME = 'uq_users_email');
SET @dup_emails := (SELECT COUNT(*) FROM (
     SELECT email FROM users WHERE email IS NOT NULL GROUP BY email HAVING COUNT(*) > 1) d);
SET @stmt := IF(@has_email_idx > 0, 'DO 0',
  IF(@dup_emails = 0,
     'ALTER TABLE users ADD UNIQUE INDEX uq_users_email (email)',
     'SELECT ''WARNING: users.email has duplicates, unique index NOT added. Resolve duplicates and re-run.'' AS migration_warning'));
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;

-- 1c. Remove plaintext / non-bcrypt passwords. Records are kept.
UPDATE users
   SET password_hash = NULL
 WHERE password_hash IS NOT NULL
   AND password_hash NOT REGEXP '^\\$2[aby]\\$[0-9]{2}\\$[./A-Za-z0-9]{53}$';

-- --------------------------------------------------------------------
-- 2. user_sessions
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_sessions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    user_agent VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    UNIQUE KEY uq_session_token (token_hash),
    INDEX idx_session_user (user_id),
    INDEX idx_session_expiry (expires_at),
    CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 3. conversations
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conversations (
    id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(160) NOT NULL DEFAULT 'New conversation',
    language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3),
    updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3),
    INDEX idx_conv_user_updated (user_id, updated_at),
    CONSTRAINT fk_conversations_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 4. chat_logs -> message table
-- --------------------------------------------------------------------
SET @stmt := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'chat_logs' AND COLUMN_NAME = 'conversation_id') = 0,
  'ALTER TABLE chat_logs ADD COLUMN conversation_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL AFTER user_id',
  'DO 0');
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;

SET @stmt := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'chat_logs' AND COLUMN_NAME = 'client_message_id') = 0,
  'ALTER TABLE chat_logs ADD COLUMN client_message_id VARCHAR(80) CHARACTER SET ascii COLLATE ascii_bin NULL AFTER conversation_id',
  'DO 0');
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;

SET @stmt := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'chat_logs' AND COLUMN_NAME = 'metadata') = 0,
  'ALTER TABLE chat_logs ADD COLUMN metadata JSON NULL AFTER language',
  'DO 0');
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;

-- Long AI document reports can exceed TEXT (64 KB) in some scripts.
SET @stmt := IF(
  (SELECT DATA_TYPE FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'chat_logs' AND COLUMN_NAME = 'message_text') = 'text',
  'ALTER TABLE chat_logs MODIFY message_text MEDIUMTEXT NOT NULL',
  'DO 0');
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;

SET @stmt := IF(
  (SELECT COUNT(*) FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'chat_logs' AND INDEX_NAME = 'idx_chat_conversation') = 0,
  'ALTER TABLE chat_logs ADD INDEX idx_chat_conversation (conversation_id, id)',
  'DO 0');
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;

-- One row per (user, client message id): a retried request never duplicates.
SET @stmt := IF(
  (SELECT COUNT(*) FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'chat_logs' AND INDEX_NAME = 'uq_chat_client_msg') = 0,
  'ALTER TABLE chat_logs ADD UNIQUE INDEX uq_chat_client_msg (user_id, client_message_id)',
  'DO 0');
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;

SET @stmt := IF(
  (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'chat_logs' AND CONSTRAINT_NAME = 'fk_chat_conversation') = 0,
  'ALTER TABLE chat_logs ADD CONSTRAINT fk_chat_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE',
  'DO 0');
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;

-- document_verifications already has user_id; nothing to change there.

INSERT IGNORE INTO schema_migrations (version) VALUES ('001_auth_and_chat_history');
SET SQL_SAFE_UPDATES = @old_safe_updates;

SELECT 'Migration 001_auth_and_chat_history applied' AS status,
       (SELECT COUNT(*) FROM users) AS users_kept,
       (SELECT COUNT(*) FROM users WHERE password_hash IS NULL) AS users_needing_password;
