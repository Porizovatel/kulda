/*
  # User Roles and Permissions
  
  1. New Types
    - user_role: Enum for user role types (admin, manager, reader)
  
  2. New Tables
    - users: Store user information and roles
  
  3. Security
    - Enable RLS on users table
    - Add policies for role-based access
    - Update existing table policies for role-based access
  
  4. Triggers
    - Add trigger for new user signup
*/

-- Create roles enum type
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'reader');

-- Create users table to store additional user information
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'reader',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Everyone can read users
CREATE POLICY "Users are viewable by everyone" 
  ON users FOR SELECT 
  USING (true);

-- Only admins can update users' roles
CREATE POLICY "Only admins can update users' roles" 
  ON users FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, email, role)
  VALUES (NEW.id, NEW.email, 'reader');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function when a new user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update team policies
CREATE POLICY "Teams are editable by admins and managers" 
  ON teams FOR ALL 
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager')));

-- Update player policies
CREATE POLICY "Players are editable by admins and managers" 
  ON players FOR ALL 
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager')));

-- Update matches policies
CREATE POLICY "Matches are editable by admins and managers" 
  ON matches FOR ALL 
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager')));

-- Update player_performances policies
CREATE POLICY "Player performances are editable by admins and managers" 
  ON player_performances FOR ALL 
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager')));

-- Update team_performances policies
CREATE POLICY "Team performances are editable by admins and managers" 
  ON team_performances FOR ALL 
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager')));

-- Update seasons policies
CREATE POLICY "Seasons are editable by admins" 
  ON seasons FOR ALL 
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Update player_history policies
CREATE POLICY "Player history is editable by admins and managers" 
  ON player_history FOR ALL 
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager')));