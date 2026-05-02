-- =====================================================================================
-- BTL2 - PHAN 2 (VIET LAI TU DAU)
-- CHAY SAU KHI DA CHAY FULL.refactored.sql
-- Bang duoc chon cho cau 2.1: EVENT
-- =====================================================================================

/*
Ly do chon EVENT:
- EVENT la bang trung tam cua nghiep vu to chuc su kien tai rap.
- De lam form Them / Sua / Xoa cho phan ung dung.
- De viet 2 thu tuc truy van lien quan truc tiep toi bang da chon.
*/

-- =====================================================================================
-- SECTION 00 - XOA OBJECT CU NEU DA TON TAI
-- =====================================================================================
IF EXISTS (SELECT 1 FROM sys.objects WHERE type = 'P' AND name = 'usp_Event_Insert')
    DROP PROCEDURE usp_Event_Insert;
GO

IF EXISTS (SELECT 1 FROM sys.objects WHERE type = 'P' AND name = 'usp_Event_Update')
    DROP PROCEDURE usp_Event_Update;
GO

IF EXISTS (SELECT 1 FROM sys.objects WHERE type = 'P' AND name = 'usp_Event_Delete')
    DROP PROCEDURE usp_Event_Delete;
GO

IF EXISTS (SELECT 1 FROM sys.objects WHERE type = 'P' AND name = 'usp_Event_List')
    DROP PROCEDURE usp_Event_List;
GO

IF EXISTS (SELECT 1 FROM sys.objects WHERE type = 'P' AND name = 'usp_Organizer_Event_Summary')
    DROP PROCEDURE usp_Organizer_Event_Summary;
GO

IF EXISTS (SELECT 1 FROM sys.objects WHERE type = 'FN' AND name = 'fn_Event_TotalConfirmedRentalFee')
    DROP FUNCTION fn_Event_TotalConfirmedRentalFee;
GO

IF EXISTS (SELECT 1 FROM sys.objects WHERE type = 'FN' AND name = 'fn_Event_CapacityCoverageLabel')
    DROP FUNCTION fn_Event_CapacityCoverageLabel;
GO

IF EXISTS (SELECT 1 FROM sys.triggers WHERE name = 'TRG_Session_Inside_Event_Date')
    DROP TRIGGER TRG_Session_Inside_Event_Date;
GO

IF EXISTS (SELECT 1 FROM sys.triggers WHERE name = 'TRG_Session_Update_ConfirmedSessionCount')
    DROP TRIGGER TRG_Session_Update_ConfirmedSessionCount;
GO

-- =====================================================================================
-- SECTION 01 - THUOC TINH DAN XUAT CHO EVENT
-- Thuoc tinh dan xuat duoc chon: ConfirmedSessionCount
-- Y nghia: So SESSION cua EVENT co SessionStatus = N'Da xac nhan'
-- =====================================================================================
IF COL_LENGTH('EVENT', 'ConfirmedSessionCount') IS NULL
BEGIN
    ALTER TABLE EVENT
    ADD ConfirmedSessionCount INT NOT NULL DEFAULT 0;
END;
GO

UPDATE EVENT
SET ConfirmedSessionCount = 0;
GO

UPDATE EVENT
SET ConfirmedSessionCount = Temp.Cnt
FROM EVENT
JOIN (
    SELECT EventID, COUNT(*) AS Cnt
    FROM SESSION
    WHERE SessionStatus = N'Đã xác nhận'
    GROUP BY EventID
) AS Temp
    ON EVENT.EventID = Temp.EventID;
GO

-- =====================================================================================
-- SECTION 02 - THU TUC THEM / SUA / XOA CHO BANG EVENT (CAU 2.1)
-- =====================================================================================
CREATE PROCEDURE usp_Event_Insert
    @EventID        VARCHAR(20),
    @OrganizerID    VARCHAR(20),
    @EventName      NVARCHAR(200),
    @EventDesc      NVARCHAR(MAX) = NULL,
    @EventStartDate DATE,
    @EventEndDate   DATE,
    @ExpectedScale  INT,
    @TotalBudget    DECIMAL(15,2),
    @EventStatus    NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @OrganizerType NVARCHAR(20);

    SET @EventID = NULLIF(LTRIM(RTRIM(@EventID)), '');
    SET @OrganizerID = NULLIF(LTRIM(RTRIM(@OrganizerID)), '');
    SET @EventName = NULLIF(LTRIM(RTRIM(@EventName)), N'');
    SET @EventStatus = NULLIF(LTRIM(RTRIM(@EventStatus)), N'');
    SET @TotalBudget = ISNULL(@TotalBudget, 0);

    IF @EventID IS NULL
    BEGIN
        RAISERROR(N'Mã sự kiện không được để trống.', 16, 1);
        RETURN;
    END;

    IF EXISTS (SELECT 1 FROM EVENT WHERE EventID = @EventID)
    BEGIN
        RAISERROR(N'Mã sự kiện đã tồn tại.', 16, 1);
        RETURN;
    END;

    IF @OrganizerID IS NULL
    BEGIN
        RAISERROR(N'Mã nhà tổ chức không được để trống.', 16, 1);
        RETURN;
    END;

    SELECT @OrganizerType = OrganizerType
    FROM ORGANIZER
    WHERE OrganizerID = @OrganizerID;

    IF @OrganizerType IS NULL
    BEGIN
        RAISERROR(N'OrganizerID không tồn tại trong bảng ORGANIZER.', 16, 1);
        RETURN;
    END;

    IF @EventName IS NULL
    BEGIN
        RAISERROR(N'Tên sự kiện không được để trống.', 16, 1);
        RETURN;
    END;

    IF @EventStartDate IS NULL OR @EventEndDate IS NULL
    BEGIN
        RAISERROR(N'Ngày bắt đầu và ngày kết thúc là bắt buộc.', 16, 1);
        RETURN;
    END;

    IF @EventEndDate < @EventStartDate
    BEGIN
        RAISERROR(N'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.', 16, 1);
        RETURN;
    END;

    IF @ExpectedScale IS NULL OR @ExpectedScale <= 0
    BEGIN
        RAISERROR(N'Quy mô dự kiến phải lớn hơn 0.', 16, 1);
        RETURN;
    END;

    IF @TotalBudget < 0
    BEGIN
        RAISERROR(N'Tổng ngân sách không được âm.', 16, 1);
        RETURN;
    END;

    IF @EventStatus NOT IN (N'Chờ duyệt', N'Đã duyệt', N'Từ chối', N'Đã hoàn thành')
    BEGIN
        RAISERROR(N'Trạng thái sự kiện không hợp lệ.', 16, 1);
        RETURN;
    END;

    IF @OrganizerType = N'Corporate'
       AND @EventStatus = N'Đã duyệt'
       AND NOT EXISTS (
            SELECT 1
            FROM CONTRACT
            WHERE CONTRACT.OrganizerID = @OrganizerID
              AND @EventStartDate >= EffectiveDate
              AND @EventEndDate <= TerminationDate
       )
    BEGIN
        RAISERROR(N'Nhà tổ chức Corporate chỉ được tạo sự kiện Đã duyệt khi thời gian sự kiện nằm trong hiệu lực hợp đồng.', 16, 1);
        RETURN;
    END;

    INSERT INTO EVENT
    (
        EventID, OrganizerID, EventName, EventDesc,
        EventStartDate, EventEndDate,
        ExpectedScale, TotalBudget, EventStatus
    )
    VALUES
    (
        @EventID, @OrganizerID, @EventName, @EventDesc,
        @EventStartDate, @EventEndDate,
        @ExpectedScale, @TotalBudget, @EventStatus
    );

    SELECT *
    FROM EVENT
    WHERE EventID = @EventID;
END;
GO

CREATE PROCEDURE usp_Event_Update
    @EventID        VARCHAR(20),
    @OrganizerID    VARCHAR(20),
    @EventName      NVARCHAR(200),
    @EventDesc      NVARCHAR(MAX) = NULL,
    @EventStartDate DATE,
    @EventEndDate   DATE,
    @ExpectedScale  INT,
    @TotalBudget    DECIMAL(15,2),
    @EventStatus    NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @CurrentOrganizerID VARCHAR(20);
    DECLARE @OrganizerType NVARCHAR(20);

    SET @EventID = NULLIF(LTRIM(RTRIM(@EventID)), '');
    SET @OrganizerID = NULLIF(LTRIM(RTRIM(@OrganizerID)), '');
    SET @EventName = NULLIF(LTRIM(RTRIM(@EventName)), N'');
    SET @EventStatus = NULLIF(LTRIM(RTRIM(@EventStatus)), N'');
    SET @TotalBudget = ISNULL(@TotalBudget, 0);

    IF @EventID IS NULL
    BEGIN
        RAISERROR(N'Mã sự kiện không được để trống khi cập nhật.', 16, 1);
        RETURN;
    END;

    SELECT @CurrentOrganizerID = OrganizerID
    FROM EVENT
    WHERE EventID = @EventID;

    IF @CurrentOrganizerID IS NULL
    BEGIN
        RAISERROR(N'Không tìm thấy sự kiện cần cập nhật.', 16, 1);
        RETURN;
    END;

    IF @OrganizerID IS NULL
    BEGIN
        RAISERROR(N'Mã nhà tổ chức không được để trống.', 16, 1);
        RETURN;
    END;

    SELECT @OrganizerType = OrganizerType
    FROM ORGANIZER
    WHERE OrganizerID = @OrganizerID;

    IF @OrganizerType IS NULL
    BEGIN
        RAISERROR(N'OrganizerID không tồn tại trong bảng ORGANIZER.', 16, 1);
        RETURN;
    END;

    IF @EventName IS NULL
    BEGIN
        RAISERROR(N'Tên sự kiện không được để trống.', 16, 1);
        RETURN;
    END;

    IF @EventStartDate IS NULL OR @EventEndDate IS NULL
    BEGIN
        RAISERROR(N'Ngày bắt đầu và ngày kết thúc là bắt buộc.', 16, 1);
        RETURN;
    END;

    IF @EventEndDate < @EventStartDate
    BEGIN
        RAISERROR(N'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.', 16, 1);
        RETURN;
    END;

    IF @ExpectedScale IS NULL OR @ExpectedScale <= 0
    BEGIN
        RAISERROR(N'Quy mô dự kiến phải lớn hơn 0.', 16, 1);
        RETURN;
    END;

    IF @TotalBudget < 0
    BEGIN
        RAISERROR(N'Tổng ngân sách không được âm.', 16, 1);
        RETURN;
    END;

    IF @EventStatus NOT IN (N'Chờ duyệt', N'Đã duyệt', N'Từ chối', N'Đã hoàn thành')
    BEGIN
        RAISERROR(N'Trạng thái sự kiện không hợp lệ.', 16, 1);
        RETURN;
    END;

    IF @CurrentOrganizerID <> @OrganizerID
       AND EXISTS (SELECT 1 FROM SESSION WHERE EventID = @EventID)
    BEGIN
        RAISERROR(N'Không được đổi nhà tổ chức khi sự kiện đã có SESSION.', 16, 1);
        RETURN;
    END;

    IF EXISTS (
        SELECT 1
        FROM SESSION
        WHERE EventID = @EventID
          AND (
                CAST(SessionStart AS DATE) < @EventStartDate
             OR CAST(SessionEnd AS DATE) > @EventEndDate
          )
    )
    BEGIN
        RAISERROR(N'Khoảng thời gian mới của EVENT không bao phủ toàn bộ SESSION đang có.', 16, 1);
        RETURN;
    END;

    IF @EventStatus = N'Từ chối'
       AND EXISTS (
            SELECT 1
            FROM SESSION
            WHERE EventID = @EventID
              AND SessionStatus = N'Đã xác nhận'
       )
    BEGIN
        RAISERROR(N'Không thể chuyển sự kiện sang Từ chối khi đã có SESSION ở trạng thái Đã xác nhận.', 16, 1);
        RETURN;
    END;

    IF @OrganizerType = N'Corporate'
       AND @EventStatus = N'Đã duyệt'
       AND NOT EXISTS (
            SELECT 1
            FROM CONTRACT
            WHERE CONTRACT.OrganizerID = @OrganizerID
              AND @EventStartDate >= EffectiveDate
              AND @EventEndDate <= TerminationDate
       )
    BEGIN
        RAISERROR(N'Nhà tổ chức Corporate chỉ được cập nhật sang Đã duyệt khi thời gian sự kiện nằm trong hiệu lực hợp đồng.', 16, 1);
        RETURN;
    END;

    UPDATE EVENT
    SET OrganizerID = @OrganizerID,
        EventName = @EventName,
        EventDesc = @EventDesc,
        EventStartDate = @EventStartDate,
        EventEndDate = @EventEndDate,
        ExpectedScale = @ExpectedScale,
        TotalBudget = @TotalBudget,
        EventStatus = @EventStatus
    WHERE EventID = @EventID;

    SELECT *
    FROM EVENT
    WHERE EventID = @EventID;
END;
GO

CREATE PROCEDURE usp_Event_Delete
    @EventID VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @EventStatus NVARCHAR(20);

    SET @EventID = NULLIF(LTRIM(RTRIM(@EventID)), '');

    IF @EventID IS NULL
    BEGIN
        RAISERROR(N'Mã sự kiện không được để trống khi xóa.', 16, 1);
        RETURN;
    END;

    SELECT @EventStatus = EventStatus
    FROM EVENT
    WHERE EventID = @EventID;

    IF @EventStatus IS NULL
    BEGIN
        RAISERROR(N'Không tìm thấy sự kiện cần xóa.', 16, 1);
        RETURN;
    END;

    IF EXISTS (SELECT 1 FROM SESSION WHERE EventID = @EventID)
    BEGIN
        RAISERROR(N'Không được xóa sự kiện vì đã phát sinh SESSION. Chỉ nên xóa hồ sơ nhập sai hoặc chưa triển khai để tránh mất lịch sử nghiệp vụ.', 16, 1);
        RETURN;
    END;

    IF @EventStatus NOT IN (N'Chờ duyệt', N'Từ chối')
    BEGIN
        RAISERROR(N'Chỉ được xóa sự kiện ở trạng thái Chờ duyệt hoặc Từ chối.', 16, 1);
        RETURN;
    END;

    DELETE FROM EVENT
    WHERE EventID = @EventID;

    SELECT N'Đã xóa sự kiện thành công.' AS Message, @EventID AS EventID;
END;
GO

-- =====================================================================================
-- SECTION 03 - TRIGGER RANG BUOC NGHIEP VU (CAU 2.2.1)
-- Rang buoc duoc chon:
-- Moi SESSION phai nam trong khoang ngay cua EVENT cha.
-- DML co the vi pham: INSERT, UPDATE tren SESSION.
-- =====================================================================================
CREATE TRIGGER TRG_Session_Inside_Event_Date
ON SESSION
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (
        SELECT 1
        FROM inserted
        JOIN EVENT ON inserted.EventID = EVENT.EventID
        WHERE CAST(inserted.SessionStart AS DATE) < EVENT.EventStartDate
           OR CAST(inserted.SessionEnd AS DATE) > EVENT.EventEndDate
    )
    BEGIN
        RAISERROR(N'SESSION phải nằm trong khoảng ngày của EVENT.', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END;
END;
GO

-- =====================================================================================
-- SECTION 04 - TRIGGER THUOC TINH DAN XUAT (CAU 2.2.2)
-- Thuoc tinh dan xuat: EVENT.ConfirmedSessionCount
-- Cac DML lam thay doi gia tri: INSERT / UPDATE / DELETE tren SESSION
-- =====================================================================================
CREATE TRIGGER TRG_Session_Update_ConfirmedSessionCount
ON SESSION
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE EVENT
    SET ConfirmedSessionCount = 0
    WHERE EventID IN (
        SELECT EventID FROM inserted WHERE EventID IS NOT NULL
        UNION
        SELECT EventID FROM deleted WHERE EventID IS NOT NULL
    );

    UPDATE EVENT
    SET ConfirmedSessionCount = Temp.Cnt
    FROM EVENT
    JOIN (
        SELECT EventID, COUNT(*) AS Cnt
        FROM SESSION
        WHERE SessionStatus = N'Đã xác nhận'
          AND EventID IN (
                SELECT EventID FROM inserted WHERE EventID IS NOT NULL
                UNION
                SELECT EventID FROM deleted WHERE EventID IS NOT NULL
          )
        GROUP BY EventID
    ) AS Temp
        ON EVENT.EventID = Temp.EventID;
END;
GO

-- =====================================================================================
-- SECTION 05 - HAI THU TUC CHI TRUY VAN (CAU 2.3)
-- =====================================================================================
-- Thu tuc 1:
-- - Join 2 bang tro len
-- - Co WHERE, ORDER BY
-- - Lien quan truc tiep den bang EVENT da chon o cau 2.1
CREATE PROCEDURE usp_Event_List
    @Keyword NVARCHAR(200) = NULL,
    @EventStatus NVARCHAR(20) = NULL,
    @FromDate DATE = NULL,
    @ToDate DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SET @Keyword = NULLIF(LTRIM(RTRIM(@Keyword)), N'');
    SET @EventStatus = NULLIF(LTRIM(RTRIM(@EventStatus)), N'');

    SELECT
        EVENT.EventID,
        EVENT.EventName,
        EVENT.EventStartDate,
        EVENT.EventEndDate,
        EVENT.EventStatus,
        EVENT.ExpectedScale,
        EVENT.TotalBudget,
        EVENT.ConfirmedSessionCount,
        ORGANIZER.OrgName,
        ORGANIZER.OrganizerType
    FROM EVENT
    JOIN ORGANIZER ON EVENT.OrganizerID = ORGANIZER.OrganizerID
    WHERE (@Keyword IS NULL
            OR EVENT.EventID LIKE '%' + @Keyword + '%'
            OR EVENT.EventName LIKE N'%' + @Keyword + N'%'
            OR ORGANIZER.OrgName LIKE N'%' + @Keyword + N'%')
      AND (@EventStatus IS NULL OR EVENT.EventStatus = @EventStatus)
      AND (@FromDate IS NULL OR EVENT.EventStartDate >= @FromDate)
      AND (@ToDate IS NULL OR EVENT.EventStartDate <= @ToDate)
    ORDER BY EVENT.EventStartDate ASC, EVENT.EventName ASC;
END;
GO

-- Thu tuc 2:
-- - Join 2 bang tro len
-- - Co aggregate, GROUP BY, HAVING, WHERE, ORDER BY
CREATE PROCEDURE usp_Organizer_Event_Summary
    @EventStatus NVARCHAR(20) = NULL,
    @BudgetFloor DECIMAL(15,2) = 0,
    @MinEventCount INT = 1,
    @MinConfirmedRentalFee DECIMAL(15,2) = 0
AS
BEGIN
    SET NOCOUNT ON;

    SET @EventStatus = NULLIF(LTRIM(RTRIM(@EventStatus)), N'');
    SET @BudgetFloor = ISNULL(@BudgetFloor, 0);
    SET @MinEventCount = ISNULL(@MinEventCount, 1);
    SET @MinConfirmedRentalFee = ISNULL(@MinConfirmedRentalFee, 0);

    SELECT
        ORGANIZER.OrganizerID,
        ORGANIZER.OrgName,
        ORGANIZER.OrganizerType,
        COUNT(DISTINCT EVENT.EventID) AS EventCount,
        SUM(ISNULL(EVENT.TotalBudget, 0)) AS TotalPlannedBudget,
        SUM(CASE WHEN SESSION.SessionStatus = N'Đã xác nhận' THEN ISNULL(SESSION.RentalFee, 0) ELSE 0 END) AS TotalConfirmedRentalFee,
        SUM(CASE WHEN SESSION.SessionStatus = N'Đã xác nhận' THEN 1 ELSE 0 END) AS TotalConfirmedSessionCount
    FROM ORGANIZER
    JOIN EVENT ON ORGANIZER.OrganizerID = EVENT.OrganizerID
    LEFT JOIN SESSION ON EVENT.EventID = SESSION.EventID
    WHERE (@EventStatus IS NULL OR EVENT.EventStatus = @EventStatus)
      AND ISNULL(EVENT.TotalBudget, 0) >= @BudgetFloor
    GROUP BY ORGANIZER.OrganizerID, ORGANIZER.OrgName, ORGANIZER.OrganizerType
    HAVING COUNT(DISTINCT EVENT.EventID) >= @MinEventCount
       AND SUM(CASE WHEN SESSION.SessionStatus = N'Đã xác nhận' THEN ISNULL(SESSION.RentalFee, 0) ELSE 0 END) >= @MinConfirmedRentalFee
    ORDER BY TotalConfirmedRentalFee DESC, EventCount DESC, ORGANIZER.OrgName ASC;
END;
GO

-- =====================================================================================
-- SECTION 06 - HAI HAM (CAU 2.4)
-- Yeu cau: co IF / LOOP / CURSOR / truy van / kiem tra tham so dau vao
-- =====================================================================================
CREATE FUNCTION fn_Event_TotalConfirmedRentalFee
(
    @EventID VARCHAR(20)
)
RETURNS DECIMAL(15,2)
AS
BEGIN
    DECLARE @Tong DECIMAL(15,2);
    DECLARE @Tien DECIMAL(12,2);

    SET @Tong = 0;
    SET @EventID = NULLIF(LTRIM(RTRIM(@EventID)), '');

    IF @EventID IS NULL
        RETURN NULL;

    IF NOT EXISTS (SELECT 1 FROM EVENT WHERE EventID = @EventID)
        RETURN NULL;

    DECLARE cur_Tien CURSOR LOCAL FAST_FORWARD FOR
        SELECT ISNULL(RentalFee, 0)
        FROM SESSION
        WHERE EventID = @EventID
          AND SessionStatus = N'Đã xác nhận'
        ORDER BY SessionStart, SessionID;

    OPEN cur_Tien;
    FETCH NEXT FROM cur_Tien INTO @Tien;

    WHILE @@FETCH_STATUS = 0
    BEGIN
        SET @Tong = @Tong + ISNULL(@Tien, 0);
        FETCH NEXT FROM cur_Tien INTO @Tien;
    END;

    CLOSE cur_Tien;
    DEALLOCATE cur_Tien;

    RETURN @Tong;
END;
GO

CREATE FUNCTION fn_Event_CapacityCoverageLabel
(
    @EventID VARCHAR(20)
)
RETURNS NVARCHAR(100)
AS
BEGIN
    DECLARE @ExpectedScale INT;
    DECLARE @TotalCapacity INT;
    DECLARE @OneCapacity INT;
    DECLARE @Coverage DECIMAL(10,2);

    SET @TotalCapacity = 0;
    SET @EventID = NULLIF(LTRIM(RTRIM(@EventID)), '');

    IF @EventID IS NULL
        RETURN N'Mã sự kiện không hợp lệ';

    SELECT @ExpectedScale = ExpectedScale
    FROM EVENT
    WHERE EventID = @EventID;

    IF @ExpectedScale IS NULL
        RETURN N'Không tìm thấy sự kiện';

    DECLARE cur_Capacity CURSOR LOCAL FAST_FORWARD FOR
        SELECT ISNULL(MaxGuests, 0)
        FROM SESSION
        WHERE EventID = @EventID
          AND SessionStatus <> N'Hủy'
        ORDER BY SessionStart, SessionID;

    OPEN cur_Capacity;
    FETCH NEXT FROM cur_Capacity INTO @OneCapacity;

    WHILE @@FETCH_STATUS = 0
    BEGIN
        SET @TotalCapacity = @TotalCapacity + ISNULL(@OneCapacity, 0);
        FETCH NEXT FROM cur_Capacity INTO @OneCapacity;
    END;

    CLOSE cur_Capacity;
    DEALLOCATE cur_Capacity;

    IF @TotalCapacity = 0
        RETURN N'Chưa có phiên sự kiện';

    SET @Coverage = CAST(@TotalCapacity * 100.0 / NULLIF(@ExpectedScale, 0) AS DECIMAL(10,2));

    IF @Coverage < 70
        RETURN N'Thấp (' + CAST(@Coverage AS NVARCHAR(20)) + N'%)';

    IF @Coverage < 100
        RETURN N'Gần đạt (' + CAST(@Coverage AS NVARCHAR(20)) + N'%)';

    RETURN N'Đạt hoặc vượt (' + CAST(@Coverage AS NVARCHAR(20)) + N'%)';
END;
GO

-- =====================================================================================
-- SECTION 07 - LENH DEMO / MINH HOA KHI BAO CAO
-- =====================================================================================
-- DEMO 1 - Them thanh cong
BEGIN TRAN;

EXEC usp_Event_Insert
    @EventID = 'EVT_DEMO_01',
    @OrganizerID = 'ORG003',
    @EventName = N'BTL2 Demo Event',
    @EventDesc = N'Sự kiện dùng để demo phần thêm dữ liệu',
    @EventStartDate = '2026-06-08',
    @EventEndDate = '2026-06-09',
    @ExpectedScale = 180,
    @TotalBudget = 42000000,
    @EventStatus = N'Chờ duyệt';

SELECT EventID, EventName, EventStatus
FROM EVENT
WHERE EventID = 'EVT_DEMO_01';

ROLLBACK TRAN;
GO

-- DEMO 2 - Sua thanh cong
BEGIN TRAN;

EXEC usp_Event_Insert
    @EventID = 'EVT_DEMO_02',
    @OrganizerID = 'ORG003',
    @EventName = N'BTL2 Demo Event Update',
    @EventDesc = N'Sự kiện dùng để demo phần cập nhật',
    @EventStartDate = '2026-06-08',
    @EventEndDate = '2026-06-09',
    @ExpectedScale = 180,
    @TotalBudget = 42000000,
    @EventStatus = N'Chờ duyệt';

EXEC usp_Event_Update
    @EventID = 'EVT_DEMO_02',
    @OrganizerID = 'ORG003',
    @EventName = N'BTL2 Demo Event Update - Da sua',
    @EventDesc = N'Đã sửa thông tin sự kiện',
    @EventStartDate = '2026-06-08',
    @EventEndDate = '2026-06-09',
    @ExpectedScale = 220,
    @TotalBudget = 45000000,
    @EventStatus = N'Đã duyệt';

SELECT EventID, EventName, EventStatus, ExpectedScale, TotalBudget
FROM EVENT
WHERE EventID = 'EVT_DEMO_02';

ROLLBACK TRAN;
GO

-- DEMO 3 - Xoa thanh cong
EXEC usp_Event_Insert
    @EventID = 'EVT_DEMO_DEL',
    @OrganizerID = 'ORG006',
    @EventName = N'BTL2 Demo Delete',
    @EventDesc = N'Sự kiện nháp để demo xóa',
    @EventStartDate = '2026-05-24',
    @EventEndDate = '2026-05-24',
    @ExpectedScale = 50,
    @TotalBudget = 5000000,
    @EventStatus = N'Chờ duyệt';
GO

EXEC usp_Event_Delete @EventID = 'EVT_DEMO_DEL';
GO

-- DEMO 4 - Trigger nghiep vu
BEGIN TRY
    INSERT INTO SESSION
    (
        SessionID, EventID, RoomNumber, CinemaID,
        SessionStart, SessionEnd, MaxGuests, RentalFee, SessionStatus
    )
    VALUES
    (
        'SES_DEMO_EVTWIN',
        'EV010',
        'R_VVK_02',
        'CINE_VVK',
        '2026-04-16 09:00:00',
        '2026-04-16 11:00:00',
        90,
        9000000,
        N'Chờ xác nhận'
    );
END TRY
BEGIN CATCH
    SELECT ERROR_MESSAGE() AS ErrorMessage;
END CATCH;
GO

DELETE FROM SESSION WHERE SessionID = 'SES_DEMO_EVTWIN';
GO

-- DEMO 5 - Trigger thuoc tinh dan xuat
BEGIN TRAN;

SELECT EventID, EventName, ConfirmedSessionCount
FROM EVENT
WHERE EventID = 'EV010';

UPDATE SESSION
SET SessionStatus = N'Hủy'
WHERE SessionID = 'SES020';

SELECT EventID, EventName, ConfirmedSessionCount
FROM EVENT
WHERE EventID = 'EV010';

UPDATE SESSION
SET SessionStatus = N'Đã xác nhận'
WHERE SessionID = 'SES020';

SELECT EventID, EventName, ConfirmedSessionCount
FROM EVENT
WHERE EventID = 'EV010';

ROLLBACK TRAN;
GO

-- DEMO 6 - Hai thu tuc truy van
EXEC usp_Event_List
    @Keyword = N'Magic',
    @EventStatus = N'Đã duyệt',
    @FromDate = '2026-04-01',
    @ToDate = '2026-07-31';
GO

EXEC usp_Organizer_Event_Summary
    @EventStatus = N'Đã duyệt',
    @BudgetFloor = 10000000,
    @MinEventCount = 1,
    @MinConfirmedRentalFee = 10000000;
GO

-- DEMO 7 - Hai ham
SELECT dbo.fn_Event_TotalConfirmedRentalFee('EV003') AS TotalConfirmedRentalFee_EV003;
GO

SELECT dbo.fn_Event_CapacityCoverageLabel('EV007') AS CapacityCoverage_EV007;
GO
