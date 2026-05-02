IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = 'backend_user')
BEGIN
    CREATE LOGIN backend_user WITH PASSWORD = 'Backend@12345';
END
ELSE
BEGIN
    ALTER LOGIN backend_user WITH PASSWORD = 'Backend@12345';
END
GO

USE BTL2;
GO

IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'backend_user')
BEGIN
    CREATE USER backend_user FOR LOGIN backend_user;
END
GO

ALTER ROLE db_owner ADD MEMBER backend_user;
GO