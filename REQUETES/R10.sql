-- R10 : Âge maximum par espèce
SELECT espece, MAX(age) AS age_maximum
FROM animaux
GROUP BY espece;