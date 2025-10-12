USE [appVotaciones]
GO

PRINT 'Inserting Elections...'
DECLARE @Now DATETIME = GETUTCDATE()

INSERT INTO [Elections] (Name, StartDate, EndDate, Status) VALUES

('Eleccion Presidencial 2025', DATEADD(DAY, 7, @Now), DATEADD(HOUR, 10, DATEADD(DAY, 7, @Now)), 'Scheduled'),

('Eleccion Municipal San Jose', DATEADD(HOUR, -2, @Now), DATEADD(HOUR, 8, @Now), 'Closed'),

('Eleccion Junta Directiva Escolar', DATEADD(DAY, -30, @Now), DATEADD(HOUR, 10, DATEADD(DAY, -30, @Now)), 'Closed'),

('Referendum Reforma Constitucional', DATEADD(DAY, 15, @Now), DATEADD(HOUR, 12, DATEADD(DAY, 15, @Now)), 'Scheduled'),

('Eleccion Gobernador Provincial', DATEADD(HOUR, -1, @Now), DATEADD(HOUR, 6, @Now), 'Active')

PRINT 'Elections inserted successfully!'
GO