-- Private profile documents and explicit farmer-directory consent.
CREATE TABLE IF NOT EXISTS farmer_preferences (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    share_contact BOOLEAN NOT NULL DEFAULT false
);
CREATE TABLE IF NOT EXISTS profile_documents (
    id UUID PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_name VARCHAR(180) NOT NULL,
    file_type VARCHAR(120) NOT NULL,
    file_data TEXT NOT NULL,
    analysis JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_profile_documents_owner ON profile_documents(user_id, created_at DESC);
