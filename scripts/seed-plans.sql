-- Seed subscription plans for testing
INSERT INTO subscription_plans (name, description, price_eur, ai_queries_limit, billing_interval, is_active) 
VALUES 
  ('Free', 'Perfect for getting started with basic features', 0.00, 3, 'weekly', true),
  ('Basic', 'Great for casual fantasy managers', 4.99, 10, 'monthly', true),
  ('Premium', 'Advanced features for serious fantasy managers', 9.99, 15, 'monthly', true),
  ('Pro', 'Professional tools for dedicated managers', 14.99, 50, 'monthly', true)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  price_eur = EXCLUDED.price_eur,
  ai_queries_limit = EXCLUDED.ai_queries_limit,
  billing_interval = EXCLUDED.billing_interval,
  is_active = EXCLUDED.is_active;