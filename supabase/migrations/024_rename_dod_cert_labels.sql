-- Replace legacy "DOD UXO Tech I/II/III" labels with "UXO Technician I/II/III"
-- in existing dod_certs arrays to eliminate duplicates on the cert tracker
UPDATE tech_profiles
SET dod_certs = array_replace(dod_certs, 'DOD UXO Tech I', 'UXO Technician I')
WHERE 'DOD UXO Tech I' = ANY(dod_certs);

UPDATE tech_profiles
SET dod_certs = array_replace(dod_certs, 'DOD UXO Tech II', 'UXO Technician II')
WHERE 'DOD UXO Tech II' = ANY(dod_certs);

UPDATE tech_profiles
SET dod_certs = array_replace(dod_certs, 'DOD UXO Tech III', 'UXO Technician III')
WHERE 'DOD UXO Tech III' = ANY(dod_certs);

-- Also update job_posts required/preferred certs
UPDATE job_posts SET required_certs = array_replace(required_certs, 'DOD UXO Tech I', 'UXO Technician I') WHERE 'DOD UXO Tech I' = ANY(required_certs);
UPDATE job_posts SET required_certs = array_replace(required_certs, 'DOD UXO Tech II', 'UXO Technician II') WHERE 'DOD UXO Tech II' = ANY(required_certs);
UPDATE job_posts SET required_certs = array_replace(required_certs, 'DOD UXO Tech III', 'UXO Technician III') WHERE 'DOD UXO Tech III' = ANY(required_certs);
UPDATE job_posts SET preferred_certs = array_replace(preferred_certs, 'DOD UXO Tech I', 'UXO Technician I') WHERE 'DOD UXO Tech I' = ANY(preferred_certs);
UPDATE job_posts SET preferred_certs = array_replace(preferred_certs, 'DOD UXO Tech II', 'UXO Technician II') WHERE 'DOD UXO Tech II' = ANY(preferred_certs);
UPDATE job_posts SET preferred_certs = array_replace(preferred_certs, 'DOD UXO Tech III', 'UXO Technician III') WHERE 'DOD UXO Tech III' = ANY(preferred_certs);
