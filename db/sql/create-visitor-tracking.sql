-- Create page_visitors table for visitor tracking
CREATE TABLE IF NOT EXISTS page_visitors (
    id BIGSERIAL PRIMARY KEY,
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT,
    referrer TEXT,
    page_url TEXT NOT NULL,
    country VARCHAR(100),
    city VARCHAR(100),
    device_type VARCHAR(50),
    browser VARCHAR(100),
    os VARCHAR(100),
    language VARCHAR(10),
    screen_resolution VARCHAR(20),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    session_id VARCHAR(255),
    is_returning_visitor BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_page_visitors_timestamp ON page_visitors(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_page_visitors_ip ON page_visitors(ip_address);
CREATE INDEX IF NOT EXISTS idx_page_visitors_country ON page_visitors(country);
CREATE INDEX IF NOT EXISTS idx_page_visitors_page_url ON page_visitors(page_url);
CREATE INDEX IF NOT EXISTS idx_page_visitors_session ON page_visitors(session_id);

-- Enable Row Level Security
ALTER TABLE page_visitors ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access only
CREATE POLICY "Admin can view all visitor data" ON page_visitors
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.email = auth.jwt() ->> 'email'
        )
    );

-- Create policy for inserting visitor data (public access for tracking)
CREATE POLICY "Allow public insert for visitor tracking" ON page_visitors
    FOR INSERT WITH CHECK (true);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_page_visitors_updated_at 
    BEFORE UPDATE ON page_visitors 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
