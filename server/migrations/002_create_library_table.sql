-- Create library_items table for community scripts, node packs, templates
CREATE TABLE IF NOT EXISTS library_items (
    id TEXT PRIMARY KEY,
    type VARCHAR(20) NOT NULL CHECK (type IN ('script', 'node_pack', 'template')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    tags TEXT[] DEFAULT '{}',
    author VARCHAR(255) NOT NULL,
    graph JSONB NOT NULL,
    target_languages TEXT[] DEFAULT '{}',
    node_count INTEGER DEFAULT 0,
    rating FLOAT DEFAULT 0.0,
    downloads INTEGER DEFAULT 0,
    version VARCHAR(20) DEFAULT '1.0.0',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    license_id VARCHAR(50),
    github_url TEXT,
    CONSTRAINT title_length CHECK (length(title) >= 3),
    CONSTRAINT author_length CHECK (length(author) >= 1)
);

-- Indexes for common queries
CREATE INDEX idx_library_type ON library_items(type);
CREATE INDEX idx_library_author ON library_items(author);
CREATE INDEX idx_library_created ON library_items(created_at DESC);
CREATE INDEX idx_library_downloads ON library_items(downloads DESC);
CREATE INDEX idx_library_rating ON library_items(rating DESC);
CREATE INDEX idx_library_tags ON library_items USING GIN(tags);
CREATE INDEX idx_library_languages ON library_items USING GIN(target_languages);

-- Full-text search index
CREATE INDEX idx_library_search ON library_items USING GIN(
    to_tsvector('english', title || ' ' || COALESCE(description, ''))
);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_library_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER library_update_timestamp
BEFORE UPDATE ON library_items
FOR EACH ROW
EXECUTE FUNCTION update_library_updated_at();

-- Table for ratings (one per user per item)
CREATE TABLE IF NOT EXISTS library_ratings (
    id SERIAL PRIMARY KEY,
    item_id TEXT NOT NULL REFERENCES library_items(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(item_id, user_id)
);

CREATE INDEX idx_library_ratings_item ON library_ratings(item_id);
CREATE INDEX idx_library_ratings_user ON library_ratings(user_id);
