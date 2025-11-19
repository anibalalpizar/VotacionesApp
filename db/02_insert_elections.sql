USE [appVotaciones]
GO

PRINT 'Inserting Elections...'
DECLARE @Now DATETIMEOFFSET = SYSDATETIMEOFFSET()

INSERT INTO [Elections] (Name, StartDate, EndDate) VALUES

('Eleccion Presidencial 2025', DATEADD(DAY, 7, @Now), DATEADD(HOUR, 10, DATEADD(DAY, 7, @Now))),

('Eleccion Municipal San Jose', DATEADD(DAY, -2, @Now), DATEADD(HOUR, 10, DATEADD(DAY, -2, @Now))),
('Eleccion Junta Directiva Escolar', DATEADD(DAY, -30, @Now), DATEADD(HOUR, 10, DATEADD(DAY, -30, @Now))),

('Referendum Reforma Constitucional', DATEADD(DAY, 15, @Now), DATEADD(HOUR, 12, DATEADD(DAY, 15, @Now))),


('Eleccion Gobernador Provincial', DATEADD(MINUTE, -30, @Now), DATEADD(HOUR, 6, @Now))

PRINT 'Elections inserted successfully!'
GO