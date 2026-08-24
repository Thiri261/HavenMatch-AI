-- Fictional development data only. Replace or verify it before production use.
-- 1 lakh = 100,000 MMK.

INSERT INTO properties (
    listing_code,
    listing_type,
    property_type,
    title,
    description,
    price_mmk,
    township,
    address,
    bedrooms,
    bathrooms,
    area_sqft,
    distance_to_city_centre_km,
    main_road_access,
    building_included,
    parking,
    security,
    pet_friendly,
    image_url
) VALUES
    (
        'RENT-001', 'rent', 'apartment',
        'Two-bedroom apartment in Bahan',
        'Fictional apartment for matching demonstrations.',
        750000, 'bahan', 'Sample address, Bahan',
        2, 1, 900, 4.5, FALSE, TRUE, TRUE, TRUE, FALSE,
        '/images/two-bedroom.png'
    ),
    (
        'RENT-002', 'rent', 'shared_apartment',
        'Affordable shared apartment in Hlaing',
        'Fictional shared home near public transport.',
        350000, 'hlaing', 'Sample address, Hlaing',
        1, 1, 500, 8.0, TRUE, TRUE, FALSE, TRUE, TRUE,
        '/images/shared-apartment.png'
    ),
    (
        'RENT-003', 'rent', 'apartment',
        'One-bedroom apartment in Sanchaung',
        'Fictional central apartment for a single resident or couple.',
        550000, 'sanchaung', 'Sample address, Sanchaung',
        1, 1, 620, 3.5, FALSE, TRUE, FALSE, TRUE, TRUE,
        '/images/one-bedroom.png'
    ),
    (
        'BUY-001', 'buy', 'condominium',
        'Three-bedroom condominium in Mayangone',
        'Fictional condominium with parking and security.',
        480000000, 'mayangone', 'Sample address, Mayangone',
        3, 2, 1450, 10.0, TRUE, TRUE, TRUE, TRUE, FALSE,
        '/images/two-bedroom.png'
    ),
    (
        'BUY-002', 'buy', 'house',
        'Family house in South Okkalapa',
        'Fictional detached home on a quiet side road.',
        650000000, 'south_okkalapa', 'Sample address, South Okkalapa',
        4, 3, 2400, 12.0, FALSE, TRUE, TRUE, FALSE, TRUE,
        '/images/one-bedroom.png'
    ),
    (
        'LAND-001', 'land', 'vacant_land',
        'Vacant land outside the city centre',
        'Fictional entry-level plot located far from central Yangon.',
        60000000, 'east_dagon', 'Sample address, East Dagon',
        NULL, NULL, 2400, 24.0, FALSE, FALSE, FALSE, FALSE, FALSE,
        '/images/yangon-city-hero.png'
    ),
    (
        'LAND-002', 'land', 'vacant_land',
        'Road-access land in North Dagon',
        'Fictional vacant plot with direct road access.',
        100000000, 'north_dagon', 'Sample address, North Dagon',
        NULL, NULL, 3000, 18.0, TRUE, FALSE, FALSE, FALSE, FALSE,
        '/images/yangon-city-hero.png'
    ),
    (
        'LAND-003', 'land', 'land_with_building',
        'Large main-road commercial land with building',
        'Fictional premium listing used to test high-budget matching.',
        10000000000, 'bahan', 'Sample main-road address, Bahan',
        NULL, NULL, 12000, 4.0, TRUE, TRUE, TRUE, TRUE, FALSE,
        '/images/yangon-city-hero.png'
    )
ON CONFLICT (listing_code) DO NOTHING;

