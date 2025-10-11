USE [appVotaciones]
GO

PRINT 'Inserting Candidates...'

DECLARE @Election1 INT, @Election2 INT, @Election3 INT, @Election4 INT, @Election5 INT

SELECT @Election1 = ElectionId FROM Elections WHERE Name = 'Eleccion Presidencial 2025'
SELECT @Election2 = ElectionId FROM Elections WHERE Name = 'Eleccion Municipal San Jose'
SELECT @Election3 = ElectionId FROM Elections WHERE Name = 'Eleccion Junta Directiva Escolar'
SELECT @Election4 = ElectionId FROM Elections WHERE Name = 'Referendum Reforma Constitucional'
SELECT @Election5 = ElectionId FROM Elections WHERE Name = 'Eleccion Gobernador Provincial'

INSERT INTO [Candidates] (Name, Party, ElectionId) VALUES
('Maria Rodriguez Sanchez', 'Partido Progresista', @Election1),
('Carlos Mendez Vargas', 'Partido Conservador', @Election1),
('Ana Garcia Morales', 'Partido Liberal', @Election1),
('Jose Luis Fernandez', 'Partido Verde', @Election1),

('Pedro Martinez Castro', 'Partido Verde', @Election2),
('Laura Fernandez Lopez', 'Independiente', @Election2),
('Ricardo Solis Jimenez', 'Partido Accion Ciudadana', @Election2),

('Roberto Silva Gutierrez', 'Partido Progresista', @Election3),
('Carmen Diaz Rojas', 'Independiente', @Election3),

('A Favor de la Reforma', 'Partido Refe', @Election4),
('En Contra de la Reforma', 'Partido No Refe', @Election4),

('Fernando Alvarado Perez', 'Partido Liberal', @Election5),
('Patricia Herrera Solis', 'Partido Progresista', @Election5),
('Miguel Angel Rojas', 'Partido Conservador', @Election5)

PRINT 'Candidates inserted successfully!'
GO