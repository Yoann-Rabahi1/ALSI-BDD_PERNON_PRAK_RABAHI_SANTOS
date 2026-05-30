-- R6 : Total dépensé en médicaments par consultation
SELECT c.id_consult, a.nom_animal, SUM(m.prix_unitaire) AS total_medicaments
FROM consultations c
INNER JOIN animaux a ON c.id_animal = a.id_animal
INNER JOIN prescriptions pr ON c.id_consult = pr.id_consult
INNER JOIN medicaments m ON pr.id_medicament = m.id_medicament
GROUP BY c.id_consult, a.nom_animal;