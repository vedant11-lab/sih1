-- ULTIMATE FIX for RLS Policy Infinite Recursion
-- This completely removes and recreates policies to prevent any recursion

-- Step 1: Completely disable RLS and clean slate
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies (no matter the name)
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public' LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.profiles';
    END LOOP;
END $$;

-- Step 3: Create simple, non-recursive policies

-- Allow users to read their own profile (no recursion)
CREATE POLICY "users_select_own" ON public.profiles
FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile (no recursion)  
CREATE POLICY "users_update_own" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

-- Allow users to insert their own profile during signup
CREATE POLICY "users_insert_own" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow service role (bypass RLS completely for admin operations)
-- This is safer than trying to query profiles table within policies

-- Step 4: Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 5: Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- Step 6: Verify the policies
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  cmd, 
  qual as condition
FROM pg_policies 
WHERE tablename = 'profiles' AND schemaname = 'public';