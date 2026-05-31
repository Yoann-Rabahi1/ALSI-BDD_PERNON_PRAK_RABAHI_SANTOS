CREATE TRIGGER block_delete_user
BEFORE DELETE ON compte_users
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000' 
    SET MESSAGE_TEXT = 'Interdit : Utilisez la colonne est_actif pour désactiver un compte.';
END; //
DELIMITER ;

DELIMITER //
CREATE TRIGGER block_delete_prescription
BEFORE DELETE ON prescriptions
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000' 
    SET MESSAGE_TEXT = 'Interdit : Les prescriptions médicales ne peuvent pas être supprimées.';
END; //
DELIMITER ;

DELIMITER //
CREATE TRIGGER block_delete_consultation
BEFORE DELETE ON consultations
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000' 
    SET MESSAGE_TEXT = 'Suppression interdite : les archives médicales doivent être conservées.';
END;
//
DELIMITER ;

CREATE TRIGGER block_delete_user
BEFORE DELETE ON compte_users
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000' 
    SET MESSAGE_TEXT = 'Interdit : Utilisez la colonne est_actif pour désactiver un compte.';
END; //
DELIMITER ;


DELIMITER //
CREATE TRIGGER before_veterinaire_delete
BEFORE DELETE ON veterinaires
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000' 
    SET MESSAGE_TEXT = 'Suppression impossible : Le vétérinaire est lié à des archives médicales.';
END //
DELIMITER ;

DELIMITER //
CREATE TRIGGER before_medoc_delete
BEFORE DELETE ON medicaments
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000' 
    SET MESSAGE_TEXT = 'Suppression impossible : Le medicament est lié à des archives médicales.';
END //
DELIMITER ;