-- Create dishes table
CREATE TABLE IF NOT EXISTS dishes (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  acceptable_guesses TEXT[],
  country TEXT NOT NULL,
  image_url TEXT,
  ingredients TEXT[],
  blurb TEXT,
  fun_fact TEXT,
  protein_per_serving INTEGER DEFAULT 0,
  recipe JSONB,
  tags TEXT[],
  release_date DATE NOT NULL,
  coordinates TEXT,
  region TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_dishes_release_date ON dishes(release_date);
CREATE INDEX IF NOT EXISTS idx_dishes_country ON dishes(country);

-- Create storage bucket for dish images (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('dish-images', 'dish-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for dish tiles (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('dish-tiles', 'dish-tiles', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for public access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects'
    AND policyname = 'Public Access dish-images'
  ) THEN
    CREATE POLICY "Public Access dish-images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'dish-images');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects'
    AND policyname = 'Public Access dish-tiles'
  ) THEN
    CREATE POLICY "Public Access dish-tiles"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'dish-tiles');
  END IF;
END $$;
