-- HavenMatch AI: initial PostgreSQL schema
-- Prices are stored as whole Myanmar kyat (MMK).

CREATE TABLE IF NOT EXISTS properties (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    listing_code VARCHAR(30) NOT NULL UNIQUE,
    listing_type VARCHAR(10) NOT NULL
        CHECK (listing_type IN ('rent', 'buy', 'land')),
    property_type VARCHAR(30) NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    price_mmk BIGINT NOT NULL CHECK (price_mmk > 0),
    township VARCHAR(60) NOT NULL,
    address TEXT,
    bedrooms SMALLINT CHECK (bedrooms >= 0),
    bathrooms SMALLINT CHECK (bathrooms >= 0),
    area_sqft INTEGER CHECK (area_sqft > 0),
    distance_to_city_centre_km NUMERIC(6, 2)
        CHECK (distance_to_city_centre_km >= 0),
    main_road_access BOOLEAN NOT NULL DEFAULT FALSE,
    building_included BOOLEAN NOT NULL DEFAULT FALSE,
    parking BOOLEAN NOT NULL DEFAULT FALSE,
    security BOOLEAN NOT NULL DEFAULT FALSE,
    pet_friendly BOOLEAN NOT NULL DEFAULT FALSE,
    image_url TEXT,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS properties_listing_type_idx
    ON properties (listing_type);

CREATE INDEX IF NOT EXISTS properties_township_idx
    ON properties (township);

CREATE INDEX IF NOT EXISTS properties_price_idx
    ON properties (price_mmk);

-- Block access through Supabase's public API until explicit policies are added.
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
