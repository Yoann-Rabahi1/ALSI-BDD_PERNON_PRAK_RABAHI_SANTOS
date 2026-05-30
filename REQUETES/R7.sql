-- R7 : Nombre d'animaux par espèce
SELECT espece, COUNT(*) AS nombre_animaux
FROM animaux
GROUP BY espece
ORDER BY nombre_animaux DESC;