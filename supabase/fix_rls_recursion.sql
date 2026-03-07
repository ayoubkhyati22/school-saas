-- =============================================================
-- FIX: Infinite RLS recursion on profiles table
-- Run this in Supabase Dashboard → SQL Editor
-- =============================================================

-- Step 1: Create SECURITY DEFINER helper functions
-- These bypass RLS so the policies themselves don't recurse.

CREATE OR REPLACE FUNCTION public.get_auth_user_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role::TEXT FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_auth_user_school_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT school_id FROM public.profiles WHERE id = auth.uid();
$$;

-- Step 2: Drop the recursive policies
DROP POLICY IF EXISTS "Super admin full access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles in their school" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Step 3: Recreate policies without recursion

-- Anyone authenticated can view their own profile row (no subquery needed)
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Super admin can see and manage all profiles
CREATE POLICY "Super admin full access to profiles"
  ON public.profiles FOR ALL
  TO authenticated
  USING (public.get_auth_user_role() = 'super_admin');

-- Users can see other profiles in their school
CREATE POLICY "Users can view profiles in their school"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (school_id = public.get_auth_user_school_id());

-- Users can insert their own profile (needed for signup/setup)
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- =============================================================
-- Also fix other tables that have the same recursion pattern
-- =============================================================

-- Fix schools policies
DROP POLICY IF EXISTS "Super admin can manage all schools" ON public.schools;
DROP POLICY IF EXISTS "Users can view their own school" ON public.schools;

CREATE POLICY "Super admin can manage all schools"
  ON public.schools FOR ALL
  TO authenticated
  USING (public.get_auth_user_role() = 'super_admin');

CREATE POLICY "Users can view their own school"
  ON public.schools FOR SELECT
  TO authenticated
  USING (id = public.get_auth_user_school_id());

-- Fix classes policies
DROP POLICY IF EXISTS "Users can view classes in their school" ON public.classes;
DROP POLICY IF EXISTS "School admins and teachers can manage classes" ON public.classes;

CREATE POLICY "Users can view classes in their school"
  ON public.classes FOR SELECT
  TO authenticated
  USING (school_id = public.get_auth_user_school_id());

CREATE POLICY "School admins and teachers can manage classes"
  ON public.classes FOR ALL
  TO authenticated
  USING (
    school_id = public.get_auth_user_school_id()
    AND public.get_auth_user_role() IN ('school_admin', 'teacher')
  );

-- Allow super_admin to manage ref tables without recursion
DROP POLICY IF EXISTS "Reference subjects writable by super admin" ON public.ref_subjects;
DROP POLICY IF EXISTS "Reference levels writable by super admin" ON public.ref_levels;

CREATE POLICY "Reference subjects writable by super admin"
  ON public.ref_subjects FOR ALL
  TO authenticated
  USING (public.get_auth_user_role() = 'super_admin');

CREATE POLICY "Reference levels writable by super admin"
  ON public.ref_levels FOR ALL
  TO authenticated
  USING (public.get_auth_user_role() = 'super_admin');
