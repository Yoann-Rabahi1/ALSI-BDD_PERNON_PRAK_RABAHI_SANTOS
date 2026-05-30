-- R9 : Poids moyen par espèce, uniquement si la moyenne dépasse 8 kg
SELECT espece, AVG(poids_kg) AS poids_moyen
FROM animaux
WHERE poids_kg IS NOT NULL
GROUP BY espece
HAVING AVG(poids_kg) > 8;