USE [appVotaciones]
GO

PRINT 'Inserting Users...'

INSERT INTO [Users] (Identification, FullName, Email, PasswordHash, Role, TemporalPassword) VALUES
('123456789', 'Admin Principal', 'admin@votaciones.com', '$2a$11$vMB/lNF3mWeqKIdSfqsqTuW4eq5H4jmpCxnjXyw0HFFal5YJ835G6', 'Admin', NULL),
('789123456', 'Carlos Auditor', 'carlos.auditor@votaciones.com', '$2a$11$vMB/lNF3mWeqKIdSfqsqTuW4eq5H4jmpCxnjXyw0HFFal5YJ835G6', 'Auditor', NULL),
('987654321', 'Juan Perez Voter', 'juan.perez@example.com', '$2a$11$vMB/lNF3mWeqKIdSfqsqTuW4eq5H4jmpCxnjXyw0HFFal5YJ835G6', 'Voter', NULL),
('456789123', 'Maria Gonzalez Voter', 'maria.gonzalez@example.com', '$2a$11$vMB/lNF3mWeqKIdSfqsqTuW4eq5H4jmpCxnjXyw0HFFal5YJ835G6', 'Voter', NULL),
('111222333', 'Ana Torres Voter', 'ana.torres@example.com', '$2a$11$vMB/lNF3mWeqKIdSfqsqTuW4eq5H4jmpCxnjXyw0HFFal5YJ835G6', 'Voter', NULL),
('444555666', 'Pedro Ramirez Voter', 'pedro.ramirez@example.com', '$2a$11$vMB/lNF3mWeqKIdSfqsqTuW4eq5H4jmpCxnjXyw0HFFal5YJ835G6', 'Voter', NULL),
('777888999', 'Laura Fernandez Voter', 'laura.fernandez@example.com', '$2a$11$vMB/lNF3mWeqKIdSfqsqTuW4eq5H4jmpCxnjXyw0HFFal5YJ835G6', 'Voter', NULL),
('555444333', 'Roberto Silva Voter', 'roberto.silva@example.com', '$2a$11$vMB/lNF3mWeqKIdSfqsqTuW4eq5H4jmpCxnjXyw0HFFal5YJ835G6', 'Voter', NULL),
('222111000', 'Sofia Morales Voter', 'sofia.morales@example.com', '$2a$11$vMB/lNF3mWeqKIdSfqsqTuW4eq5H4jmpCxnjXyw0HFFal5YJ835G6', 'Voter', NULL),
('999888777', 'Diego Castro Voter', 'diego.castro@example.com', '$2a$11$vMB/lNF3mWeqKIdSfqsqTuW4eq5H4jmpCxnjXyw0HFFal5YJ835G6', 'Voter', NULL);

PRINT 'Base users inserted successfully!'

DECLARE @MaxUsers INT = 500;

DECLARE @Counter INT = 1;
DECLARE @Identification VARCHAR(20);
DECLARE @FullName VARCHAR(100);
DECLARE @Email VARCHAR(100);
DECLARE @PasswordHash VARCHAR(255) = '$2a$11$vMB/lNF3mWeqKIdSfqsqTuW4eq5H4jmpCxnjXyw0HFFal5YJ835G6'; -- Admin123!

PRINT '============================================'
PRINT 'Creating ' + CAST(@MaxUsers AS VARCHAR) + ' additional voters...'
PRINT '============================================'

WHILE @Counter <= @MaxUsers
BEGIN
    SET @Identification = '1' + RIGHT('00000000' + CAST(@Counter AS VARCHAR), 8);
    SET @FullName = 'Voter ' + RIGHT('00000' + CAST(@Counter AS VARCHAR), 5);
    SET @Email = 'voter' + RIGHT('00000' + CAST(@Counter AS VARCHAR), 5) + '@k6test.com';
    
    INSERT INTO [Users] (Identification, FullName, Email, PasswordHash, Role, TemporalPassword)
    VALUES (@Identification, @FullName, @Email, @PasswordHash, 'Voter', NULL);
    
    SET @Counter = @Counter + 1;
END