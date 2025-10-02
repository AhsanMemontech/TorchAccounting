-- Create trials table
CREATE TABLE IF NOT EXISTS trials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(user_id)
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stripe_session_id TEXT,
  amount INTEGER NOT NULL, -- Amount in cents
  currency TEXT DEFAULT 'usd',
  status TEXT DEFAULT 'pending', -- pending, completed, failed, canceled
  payment_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create user_subscriptions table to track user access
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subscription_type TEXT NOT NULL, -- 'trial', 'paid', 'expired'
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_trials_user_id ON trials(user_id);
CREATE INDEX IF NOT EXISTS idx_trials_is_active ON trials(is_active);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_is_active ON user_subscriptions(is_active);

-- Enable Row Level Security (RLS)
ALTER TABLE trials ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for trials table
CREATE POLICY "Users can only access their own trials" ON trials
  FOR ALL USING (auth.uid() = user_id);

-- Create policies for payments table
CREATE POLICY "Users can only access their own payments" ON payments
  FOR ALL USING (auth.uid() = user_id);

-- Create policies for user_subscriptions table
CREATE POLICY "Users can only access their own subscriptions" ON user_subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT ALL ON trials TO authenticated;
GRANT ALL ON payments TO authenticated;
GRANT ALL ON user_subscriptions TO authenticated;

-- Function to start trial for a user
CREATE OR REPLACE FUNCTION start_trial_for_user(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert or update trial
  INSERT INTO trials (user_id, start_date, end_date, is_active)
  VALUES (p_user_id, NOW(), NOW() + INTERVAL '7 days', true)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    start_date = NOW(),
    end_date = NOW() + INTERVAL '7 days',
    is_active = true,
    updated_at = NOW();
  
  -- Insert or update user subscription
  INSERT INTO user_subscriptions (user_id, subscription_type, start_date, end_date, is_active)
  VALUES (p_user_id, 'trial', NOW(), NOW() + INTERVAL '7 days', true)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    subscription_type = 'trial',
    start_date = NOW(),
    end_date = NOW() + INTERVAL '7 days',
    is_active = true,
    updated_at = NOW();
END;
$$;

-- Function to get trial status
CREATE OR REPLACE FUNCTION get_trial_status(user_id UUID)
RETURNS TABLE(
  is_trial_active BOOLEAN,
  trial_start_date TIMESTAMP WITH TIME ZONE,
  trial_end_date TIMESTAMP WITH TIME ZONE,
  days_remaining INTEGER,
  has_paid BOOLEAN,
  subscription_type TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.is_active,
    t.start_date,
    t.end_date,
    CASE 
      WHEN t.end_date > NOW() THEN 
        EXTRACT(DAY FROM (t.end_date - NOW()))
      ELSE 0
    END::INTEGER as days_remaining,
    EXISTS(SELECT 1 FROM payments p WHERE p.user_id = user_id AND p.status = 'completed'),
    us.subscription_type
  FROM trials t
  LEFT JOIN user_subscriptions us ON us.user_id = t.user_id
  WHERE t.user_id = user_id;
END;
$$;

-- Function to check if user has access
CREATE OR REPLACE FUNCTION user_has_access(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  has_paid BOOLEAN;
  trial_active BOOLEAN;
  trial_end TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Check if user has paid
  SELECT EXISTS(SELECT 1 FROM payments WHERE user_id = user_id AND status = 'completed')
  INTO has_paid;
  
  -- Check if trial is active
  SELECT is_active, end_date 
  INTO trial_active, trial_end
  FROM trials 
  WHERE user_id = user_id;
  
  RETURN has_paid OR (trial_active AND trial_end > NOW());
END;
$$;

-- Function to mark user as paid
CREATE OR REPLACE FUNCTION mark_user_as_paid(p_user_id UUID, session_id TEXT, amount INTEGER)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert payment record
  INSERT INTO payments (user_id, stripe_session_id, amount, status, payment_date)
  VALUES (p_user_id, session_id, amount, 'completed', NOW());
  
  -- Update user subscription
  INSERT INTO user_subscriptions (user_id, subscription_type, start_date, is_active)
  VALUES (p_user_id, 'paid', NOW(), true)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    subscription_type = 'paid',
    start_date = NOW(),
    end_date = NULL,
    is_active = true,
    updated_at = NOW();
  
  -- End trial
  UPDATE trials 
  SET is_active = false, updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$;

-- Function to end trial
CREATE OR REPLACE FUNCTION end_trial_for_user(user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE trials 
  SET is_active = false, updated_at = NOW()
  WHERE user_id = user_id;
  
  UPDATE user_subscriptions 
  SET is_active = false, subscription_type = 'expired', updated_at = NOW()
  WHERE user_id = user_id AND subscription_type = 'trial';
END;
$$;

-- Function to get user subscription status
CREATE OR REPLACE FUNCTION get_user_subscription_status(user_id UUID)
RETURNS TABLE(
  subscription_type TEXT,
  is_active BOOLEAN,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  days_remaining INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    us.subscription_type,
    us.is_active,
    us.start_date,
    us.end_date,
    CASE 
      WHEN us.end_date > NOW() THEN 
        EXTRACT(DAY FROM (us.end_date - NOW()))
      ELSE 0
    END::INTEGER as days_remaining
  FROM user_subscriptions us
  WHERE us.user_id = user_id;
END;
$$;

-- Grant necessary permissions for functions
GRANT EXECUTE ON FUNCTION start_trial_for_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_trial_status(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION user_has_access(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_user_as_paid(UUID, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION end_trial_for_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_subscription_status(UUID) TO authenticated; 