USE [appVotaciones]
GO

PRINT 'Inserting Audit Logs...'

DECLARE @User1 INT, @User2 INT, @User3 INT, @User4 INT, @User5 INT, @User6 INT

SELECT @User1 = UserId FROM Users WHERE Identification = '123456789'
SELECT @User2 = UserId FROM Users WHERE Identification = '987654321'
SELECT @User3 = UserId FROM Users WHERE Identification = '456789123'
SELECT @User4 = UserId FROM Users WHERE Identification = '789123456'
SELECT @User5 = UserId FROM Users WHERE Identification = '111222333'
SELECT @User6 = UserId FROM Users WHERE Identification = '444555666'

INSERT INTO [AuditLog] (UserId, Action, Details) VALUES
(@User1, 'LOGIN', 'Admin logged in from IP 192.168.1.100'),
(@User1, 'CREATE_ELECTION', 'Created election: Eleccion Presidencial 2025'),
(@User1, 'CREATE_CANDIDATE', 'Added candidate: Maria Rodriguez Sanchez'),
(@User2, 'LOGIN', 'User logged in from IP 192.168.1.105'),
(@User2, 'CAST_VOTE', 'Voted in election: Municipal San Jose'),
(@User3, 'LOGIN', 'User logged in from IP 192.168.1.110'),
(@User3, 'CAST_VOTE', 'Voted in election: Municipal San Jose'),
(@User4, 'LOGIN', 'Auditor logged in from IP 192.168.1.115'),
(@User4, 'VIEW_RESULTS', 'Viewed results for election: Junta Directiva Escolar'),
(@User1, 'UPDATE_ELECTION', 'Updated election status: Municipal San Jose to Active'),
(@User5, 'LOGIN', 'User logged in from IP 192.168.1.120'),
(@User5, 'CAST_VOTE', 'Voted in election: Municipal San Jose'),
(@User1, 'CLOSE_ELECTION', 'Closed election: Junta Directiva Escolar'),
(@User4, 'EXPORT_REPORT', 'Exported audit report for date range'),
(@User6, 'LOGIN', 'User logged in from IP 192.168.1.125')

PRINT 'Audit Logs inserted successfully!'
GO