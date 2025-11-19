USE [appVotaciones]
GO

PRINT 'Inserting Votes...'

DECLARE @Election2 INT, @Election3 INT
DECLARE @User2 INT, @User3 INT, @User5 INT, @User6 INT, @User7 INT, @User8 INT, @User9 INT, @User10 INT
DECLARE @Cand5 INT, @Cand6 INT, @Cand7 INT, @Cand8 INT, @Cand9 INT

SELECT @Election2 = ElectionId FROM Elections WHERE Name = 'Eleccion Municipal San Jose'
SELECT @Election3 = ElectionId FROM Elections WHERE Name = 'Eleccion Junta Directiva Escolar'

SELECT @User2 = UserId FROM Users WHERE Identification = '987654321'
SELECT @User3 = UserId FROM Users WHERE Identification = '456789123'
SELECT @User5 = UserId FROM Users WHERE Identification = '111222333'
SELECT @User6 = UserId FROM Users WHERE Identification = '444555666'
SELECT @User7 = UserId FROM Users WHERE Identification = '777888999'
SELECT @User8 = UserId FROM Users WHERE Identification = '555444333'
SELECT @User9 = UserId FROM Users WHERE Identification = '222111000'
SELECT @User10 = UserId FROM Users WHERE Identification = '999888777'

SELECT @Cand5 = CandidateId FROM Candidates WHERE Name = 'Pedro Martinez Castro'
SELECT @Cand6 = CandidateId FROM Candidates WHERE Name = 'Laura Fernandez Lopez'
SELECT @Cand7 = CandidateId FROM Candidates WHERE Name = 'Ricardo Solis Jimenez'
SELECT @Cand8 = CandidateId FROM Candidates WHERE Name = 'Roberto Silva Gutierrez'
SELECT @Cand9 = CandidateId FROM Candidates WHERE Name = 'Carmen Diaz Rojas'

INSERT INTO [Votes] (ElectionId, VoterId, CandidateId) VALUES
(@Election2, @User2, @Cand5), 
(@Election2, @User3, @Cand6), 
(@Election2, @User5, @Cand5),  
(@Election2, @User6, @Cand7),  
(@Election3, @User7, @Cand8), 
(@Election3, @User8, @Cand9),  
(@Election3, @User9, @Cand8), 
(@Election3, @User10, @Cand8)

PRINT 'Votes inserted successfully!'
GO