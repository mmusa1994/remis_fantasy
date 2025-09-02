-- USER AUTHENTICATION SYSTEM MIGRATION
-- This migration creates a complete user authentication system with subscriptions

-- Drop existing ai_usage_limits table as we'll replace it with user_ai_usage
DROP TABLE IF EXISTS ai_usage_limits;

-- Users table (main user accounts)
CREATE TABLE users (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    email varchar(255) UNIQUE NOT NULL,
    password_hash varchar(255), -- null for OAuth users
    name varchar(255) NOT NULL,
    avatar_url varchar(255),
    email_verified boolean DEFAULT false,
    provider varchar(50) DEFAULT 'email', -- 'email', 'google'
    provider_id varchar(255),
    subscription_id uuid,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    last_login timestamptz,
    is_active boolean DEFAULT true
);

-- Email verification table
CREATE TABLE email_verifications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    otp varchar(6) NOT NULL,
    expires_at timestamptz NOT NULL,
    verified_at timestamptz,
    created_at timestamptz DEFAULT now()
);

-- Subscription plans
CREATE TABLE subscription_plans (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name varchar(100) NOT NULL,
    description text,
    price_eur decimal(10,2) NOT NULL,
    ai_queries_limit integer NOT NULL,
    billing_interval varchar(20) DEFAULT 'monthly', -- 'monthly', 'yearly'
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- User subscriptions
CREATE TABLE subscriptions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    plan_id uuid REFERENCES subscription_plans(id),
    status varchar(20) DEFAULT 'active', -- 'active', 'cancelled', 'expired', 'pending'
    starts_at timestamptz DEFAULT now(),
    ends_at timestamptz,
    auto_renew boolean DEFAULT true,
    payment_method varchar(50), -- 'stripe', 'paypal'
    external_subscription_id varchar(255), -- Stripe/PayPal subscription ID
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Add foreign key constraint after subscriptions table is created
ALTER TABLE users ADD CONSTRAINT fk_users_subscription FOREIGN KEY (subscription_id) REFERENCES subscriptions(id);

-- User AI usage limits (replacing IP-based system)
CREATE TABLE user_ai_usage (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    queries_used integer DEFAULT 0,
    queries_limit integer DEFAULT 3,
    period_start timestamptz DEFAULT now(),
    period_end timestamptz DEFAULT (now() + interval '7 days'),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, period_start)
);

-- Sessions table for better session management
CREATE TABLE user_sessions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    token varchar(255) UNIQUE NOT NULL,
    expires_at timestamptz NOT NULL,
    created_at timestamptz DEFAULT now(),
    last_accessed timestamptz DEFAULT now()
);

-- Insert default subscription plans
INSERT INTO subscription_plans (name, description, price_eur, ai_queries_limit) VALUES
('Free', 'Free tier with 3 AI queries per week', 0.00, 1),
('Starter', 'Perfect for casual FPL managers', 0.99, 5),
('Pro', 'For serious FPL competitors', 2.99, 10),
('Premium', 'Unlimited access for professionals', 9.99, 30);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_provider ON users(provider, provider_id);
CREATE INDEX idx_email_verifications_user_id ON email_verifications(user_id);
CREATE INDEX idx_email_verifications_otp ON email_verifications(otp);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_user_ai_usage_user_id ON user_ai_usage(user_id);
CREATE INDEX idx_user_ai_usage_period ON user_ai_usage(period_start, period_end);
CREATE INDEX idx_user_sessions_token ON user_sessions(token);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for subscriptions table
CREATE POLICY "Users can view own subscription" ON subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for user_ai_usage table
CREATE POLICY "Users can view own AI usage" ON user_ai_usage
    FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for user_sessions table
CREATE POLICY "Users can view own sessions" ON user_sessions
    FOR SELECT USING (auth.uid() = user_id);

-- Public access to subscription_plans (read-only)
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view subscription plans" ON subscription_plans
    FOR SELECT USING (true);

-- Function to automatically create free subscription for new users
CREATE OR REPLACE FUNCTION create_user_subscription()
RETURNS TRIGGER AS $$
DECLARE
    free_plan_id uuid;
    new_subscription_id uuid;
BEGIN
    -- Get the free plan ID
    SELECT id INTO free_plan_id 
    FROM subscription_plans 
    WHERE name = 'Free' AND is_active = true 
    LIMIT 1;
    
    IF free_plan_id IS NOT NULL THEN
        -- Create a subscription for the new user
        INSERT INTO subscriptions (user_id, plan_id, status, starts_at, ends_at)
        VALUES (NEW.id, free_plan_id, 'active', now(), now() + interval '1 year')
        RETURNING id INTO new_subscription_id;
        
        -- Update user with subscription_id
        UPDATE users SET subscription_id = new_subscription_id WHERE id = NEW.id;
        
        -- Create initial AI usage record
        INSERT INTO user_ai_usage (user_id, queries_used, queries_limit, period_start, period_end)
        VALUES (NEW.id, 0, 3, now(), now() + interval '7 days');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create subscription for new users
CREATE TRIGGER on_user_created
    AFTER INSERT ON users
    FOR EACH ROW EXECUTE FUNCTION create_user_subscription();

-- Function to update subscription limits in AI usage
CREATE OR REPLACE FUNCTION sync_ai_usage_limits()
RETURNS TRIGGER AS $$
BEGIN
    -- Update current period AI usage limits based on new subscription
    UPDATE user_ai_usage 
    SET queries_limit = (
        SELECT sp.ai_queries_limit 
        FROM subscription_plans sp 
        WHERE sp.id = (
            SELECT s.plan_id 
            FROM subscriptions s 
            WHERE s.id = NEW.id
        )
    )
    WHERE user_id = NEW.user_id 
    AND period_end > now();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to sync AI limits when subscription changes
CREATE TRIGGER on_subscription_updated
    AFTER UPDATE ON subscriptions
    FOR EACH ROW 
    WHEN (OLD.plan_id IS DISTINCT FROM NEW.plan_id OR OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION sync_ai_usage_limits();