-- R12 : Animaux dont toutes les consultations ont au moins une prescription
SELECT a.id_animal, a.nom_animal
FROM animaux a
WHERE EXISTS (
    SELECT 1
    FROM consultations c
    WHERE c.id_animal = a.id_animal
)
AND NOT EXISTS (
    SELECT 1
    FROM consultations c
    WHERE c.id_animal = a.id_animal
    AND NOT EXISTS (
        SELECT 1
        FROM prescriptions pr
        WHERE pr.id_consult = c.id_consult
    )
);