-- Migration 008: Add phone column to sales table
ALTER TABLE sales ADD COLUMN IF NOT EXISTS phone text;
