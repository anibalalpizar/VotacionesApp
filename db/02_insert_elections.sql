USE [appVotaciones]
GO

PRINT 'Inserting Elections...'
DECLARE @Now DATETIME = GETUTCDATE()

INSERT INTO [Elections] (Name, StartDate, EndDate) VALUES

('Eleccion Presidencial 2025', DATEADD(DAY, 7, @Now), DATEADD(HOUR, 10, DATEADD(DAY, 7, @Now))),

('Eleccion Municipal San Jose', DATEADD(DAY, -2, @Now), DATEADD(DAY, -2, DATEADD(HOUR, 10, @Now))),

('Eleccion Junta Directiva Escolar', DATEADD(DAY, -30, @Now), DATEADD(DAY, -30, DATEADD(HOUR, 10, @Now))),

('Referendum Reforma Constitucional', DATEADD(DAY, 15, @Now), DATEADD(DAY, 15, DATEADD(HOUR, 12, @Now))),

('Eleccion Gobernador Provincial', DATEADD(HOUR, -1, @Now), DATEADD(HOUR, 6, @Now))

PRINT 'Elections inserted successfully!'
GO