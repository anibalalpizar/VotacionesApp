USE [appVotaciones]
GO

PRINT 'Inserting Users...'

INSERT INTO [Users] (Identification, FullName, Email, PasswordHash, Role, TemporalPassword) VALUES
('123456789', 'Admin Principal', 'admin@votaciones.com', '$2a$11$vMB/lNF3mWeqKIdSfqsqTuW4eq5H4jmpCxnjXyw0HFFal5YJ835G6', 'Admin', NULL),
('987654321', 'Juan Perez Voter', 'juan.perez@example.com', '$2a$11$vMB/lNF3mWeqKIdSfqsqTuW4eq5H4jmpCxnjXyw0HFFal5YJ835G6', 'Voter', NULL),
('456789123', 'Maria Gonzalez Voter', 'maria.gonzalez@example.com', '$2a$11$vMB/lNF3mWeqKIdSfqsqTuW4eq5H4jmpCxnjXyw0HFFal5YJ835G6', 'Voter', NULL),
('789123456', 'Carlos Auditor', 'carlos.auditor@votaciones.com', '$2a$11$vMB/lNF3mWeqKIdSfqsqTuW4eq5H4jmpCxnjXyw0HFFal5YJ835G6', 'Auditor', NULL),
('111222333', 'Ana Torres Voter', 'ana.torres@example.com', '$2a$11$vMB/lNF3mWeqKIdSfqsqTuW4eq5H4jmpCxnjXyw0HFFal5YJ835G6', 'Voter', NULL),
('444555666', 'Pedro Ramirez Voter', 'pedro.ramirez@example.com', '$2a$11$vMB/lNF3mWeqKIdSfqsqTuW4eq5H4jmpCxnjXyw0HFFal5YJ835G6', 'Voter', NULL),
('777888999', 'Laura Fernandez Voter', 'laura.fernandez@example.com', '$2a$11$vMB/lNF3mWeqKIdSfqsqTuW4eq5H4jmpCxnjXyw0HFFal5YJ835G6', 'Voter', NULL),
('555444333', 'Roberto Silva Voter', 'roberto.silva@example.com', '$2a$11$vMB/lNF3mWeqKIdSfqsqTuW4eq5H4jmpCxnjXyw0HFFal5YJ835G6', 'Voter', NULL),
('222111000', 'Sofia Morales Voter', 'sofia.morales@example.com', '$2a$11$vMB/lNF3mWeqKIdSfqsqTuW4eq5H4jmpCxnjXyw0HFFal5YJ835G6', 'Voter', NULL),
('999888777', 'Diego Castro Voter', 'diego.castro@example.com', '$2a$11$vMB/lNF3mWeqKIdSfqsqTuW4eq5H4jmpCxnjXyw0HFFal5YJ835G6', 'Voter', NULL)

PRINT 'Users inserted successfully!'
GO