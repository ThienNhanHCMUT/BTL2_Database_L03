-- ==============================================================================================
-- SQL SERVER CINEMA SCRIPT
-- ==============================================================================================
CREATE DATABASE BTL2
GO


USE BTL2;
GO

-- ==============================================================================================
-- SECTION 01 - CREATE TABLE
-- ==============================================================================================
-- Bảng CINEMA

CREATE TABLE CINEMA (
    CinemaID            VARCHAR(20)         PRIMARY KEY,
    CinemaName          NVARCHAR(200)       NOT NULL,
    OperatingOpen       TIME                NOT NULL,
    OperatingClose      TIME                NOT NULL,
    CinemaType          NVARCHAR(30)        NOT NULL,
    CinemaStatus        NVARCHAR(20)        NOT NULL
        CHECK (CinemaStatus IN (N'Đang hoạt động', N'Tạm ngưng', N'Bảo trì')),
    ManagerID           VARCHAR(20),
    CinemaHouseNo       NVARCHAR(20),
    CinemaStreet        NVARCHAR(100),
    CinemaWard          NVARCHAR(100),
    CinemaCity          NVARCHAR(100)
);


-- Bảng CINEMA_PHONE

CREATE TABLE CINEMA_PHONE (
    CinemaID            VARCHAR(20)         NOT NULL
        REFERENCES CINEMA(CinemaID) ON DELETE CASCADE ON UPDATE CASCADE,
    CinemaPhoneNum      VARCHAR(11)         NOT NULL
        CHECK (LEN(CinemaPhoneNum) = 10 OR LEN(CinemaPhoneNum) = 11),

    PRIMARY KEY (CinemaID, CinemaPhoneNum)
);


-- Bảng ROOM

CREATE TABLE ROOM (
    RoomNumber          VARCHAR(20)         NOT NULL,
    CinemaID            VARCHAR(20)         NOT NULL
        REFERENCES CINEMA(CinemaID) ON DELETE CASCADE ON UPDATE CASCADE,
    RoomType            NVARCHAR(20)        NOT NULL,
    AudioSystem         NVARCHAR(50),
    MaxCapacity         INT                 NOT NULL 
        CHECK (MaxCapacity > 0),
    RoomTechStatus      NVARCHAR(20)        NOT NULL
        CHECK (RoomTechStatus IN (N'Sẵn sàng', N'Bảo trì')),
    SeatLayout          NVARCHAR(MAX)       NOT NULL
        CHECK (ISJSON(SeatLayout) = 1),

    PRIMARY KEY (RoomNumber, CinemaID)
);


-- Bảng ROOM_SUPPORTED_SCREEN

CREATE TABLE ROOM_SUPPORTED_SCREEN (
    RoomNumber          VARCHAR(20)         NOT NULL,
    CinemaID            VARCHAR(20)         NOT NULL,
    ScreenType          NVARCHAR(20)        NOT NULL,

    PRIMARY KEY (RoomNumber, CinemaID, ScreenType),
    FOREIGN KEY (RoomNumber, CinemaID)
        REFERENCES ROOM(RoomNumber, CinemaID) ON DELETE CASCADE ON UPDATE CASCADE
);


-- Bảng SEAT

CREATE TABLE SEAT (
    RowIndex            VARCHAR(5)          NOT NULL,
    ColumnNumber        INT                 NOT NULL,
    RoomNumber          VARCHAR(20)         NOT NULL,
    CinemaID            VARCHAR(20)         NOT NULL,
    SeatType            NVARCHAR(20)        NOT NULL,
    SeatStatus          NVARCHAR(20)        NOT NULL
        CHECK (SeatStatus IN (N'Hoạt động', N'Hỏng')),
    SurchargeMultiplier DECIMAL(5,2)        NOT NULL DEFAULT 1.00,
    Zone                NVARCHAR(20),

    PRIMARY KEY (RowIndex, ColumnNumber, RoomNumber, CinemaID),
    FOREIGN KEY (RoomNumber, CinemaID)
        REFERENCES ROOM(RoomNumber, CinemaID) ON DELETE CASCADE ON UPDATE CASCADE
);


-- Bảng MOVIE

CREATE TABLE MOVIE (
    MovieID             VARCHAR(20)         PRIMARY KEY,
    VnTitle             NVARCHAR(300)       NOT NULL,
    OriginTitle         NVARCHAR(300),
    MovieDuration       INT                 NOT NULL 
        CHECK (MovieDuration > 0),
    MovieReleaseDate    DATE                NOT NULL,
    MovieEndDate        DATE,
    AgeRating           VARCHAR(5)          NOT NULL
        CHECK (AgeRating IN ('P','K','T13','T16','T18','C')),
    Country             NVARCHAR(100),
    ProductionYear      INT,
    MovieDesc           NVARCHAR(MAX),
    PosterTrailer       NVARCHAR(500),
    ReleaseStatus       NVARCHAR(20)        NOT NULL
        CHECK (ReleaseStatus IN (N'Sắp chiếu', N'Đang chiếu', N'Ngừng chiếu'))
);


-- Bảng MOVIE_SUPPORTED_FORMAT

CREATE TABLE MOVIE_SUPPORTED_FORMAT (
    MovieID             VARCHAR(20)         NOT NULL
        REFERENCES MOVIE(MovieID) ON DELETE CASCADE ON UPDATE CASCADE,
    SupportedFormat     NVARCHAR(20)        NOT NULL,

    PRIMARY KEY (MovieID, SupportedFormat)
);


-- Bảng GENRE

CREATE TABLE GENRE (
    GenreID             VARCHAR(20)         PRIMARY KEY,
    GenreName           NVARCHAR(50)        NOT NULL UNIQUE,
    GenreDesc           NVARCHAR(MAX)
);


-- Bảng MOVIE_GENRE

CREATE TABLE MOVIE_GENRE (
    MovieID             VARCHAR(20)         NOT NULL
        REFERENCES MOVIE(MovieID) ON DELETE CASCADE ON UPDATE CASCADE,
    GenreID             VARCHAR(20)         NOT NULL
        REFERENCES GENRE(GenreID) ON DELETE CASCADE ON UPDATE CASCADE,

    PRIMARY KEY (MovieID, GenreID)
);


-- Bảng ACTOR

CREATE TABLE ACTOR (
    ActorID             VARCHAR(20)         PRIMARY KEY,
    ActorName           NVARCHAR(100)       NOT NULL,
    ActorNationality    NVARCHAR(50)
);


-- Bảng MOVIE_ACTOR

CREATE TABLE MOVIE_ACTOR (
    MovieID             VARCHAR(20)         NOT NULL
        REFERENCES MOVIE(MovieID) ON DELETE CASCADE ON UPDATE CASCADE,
    ActorID             VARCHAR(20)         NOT NULL
        REFERENCES ACTOR(ActorID) ON DELETE CASCADE ON UPDATE CASCADE,
    RoleName NVARCHAR(100),

    PRIMARY KEY (MovieID, ActorID)
);


-- Bảng DIRECTOR

CREATE TABLE DIRECTOR (
    DirectorID          VARCHAR(20)         PRIMARY KEY,
    DirectorName        NVARCHAR(100)       NOT NULL,
    DirectorNationality NVARCHAR(50)
);


-- Bảng MOVIE_DIRECTOR

CREATE TABLE MOVIE_DIRECTOR (
    MovieID             VARCHAR(20)         NOT NULL
        REFERENCES MOVIE(MovieID) ON DELETE CASCADE ON UPDATE CASCADE,
    DirectorID          VARCHAR(20)         NOT NULL
        REFERENCES DIRECTOR(DirectorID) ON DELETE CASCADE ON UPDATE CASCADE,

    PRIMARY KEY (MovieID, DirectorID)
);


-- Bảng PRICING_POLICY

CREATE TABLE PRICING_POLICY (
    PolicyID            VARCHAR(20)         PRIMARY KEY,
    DayType             NVARCHAR(20)        NOT NULL
        CHECK (DayType IN (N'Thường', N'Cuối tuần', N'Ngày lễ')),
    TimeFrame           NVARCHAR(50)        NOT NULL,
    TargetAudience      NVARCHAR(100),
    PriceMultiplier     DECIMAL(5,2)        NOT NULL DEFAULT 1.00 
        CHECK (PriceMultiplier > 0),
    ValidFrom           DATE                NOT NULL,
    ValidTo             DATE                NOT NULL,

    CHECK (ValidTo > ValidFrom)
);


-- Bảng SHOWTIME

CREATE TABLE SHOWTIME (
    ShowtimeID          VARCHAR(20)         PRIMARY KEY,
    MovieID             VARCHAR(20)         NOT NULL
        REFERENCES MOVIE(MovieID) ON UPDATE CASCADE,
    RoomNumber          VARCHAR(20)         NOT NULL,
    CinemaID            VARCHAR(20)         NOT NULL,
    PolicyID            VARCHAR(20)
        REFERENCES PRICING_POLICY(PolicyID) ON UPDATE CASCADE,
    ShowStartTime       DATETIME            NOT NULL,
    BasePrice           DECIMAL(10,2)       NOT NULL 
        CHECK (BasePrice >= 0),
    ShowLanguage        NVARCHAR(30)        NOT NULL
        CHECK (ShowLanguage IN (N'Lồng tiếng', N'Phụ đề Việt', N'Phụ đề Anh')),
    ShowFormat          NVARCHAR(20)        NOT NULL
        CHECK (ShowFormat IN (N'2D', N'3D', N'IMAX', N'4DX')),
    ShowStatus          NVARCHAR(20)        NOT NULL
        CHECK (ShowStatus IN (N'Mở bán', N'Đã đầy', N'Ngừng bán', N'Hủy')),

    FOREIGN KEY (RoomNumber, CinemaID)
        REFERENCES ROOM(RoomNumber, CinemaID) ON UPDATE CASCADE
);


-- Bảng ORGANIZER

CREATE TABLE ORGANIZER (
    OrganizerID         VARCHAR(20)         PRIMARY KEY,
    OrganizerType       NVARCHAR(20)        NOT NULL
        CHECK (OrganizerType IN (N'Individual', N'Corporate')),
    OrgName             NVARCHAR(100)       NOT NULL,
    OrgPhone            VARCHAR(11)
        CHECK (LEN(OrgPhone) >= 10 AND LEN(OrgPhone) <= 11),
    OrgEmail            NVARCHAR(100),
    OrgAddress          NVARCHAR(300)
);


-- Bảng INDIVIDUAL_ORGANIZER

CREATE TABLE INDIVIDUAL_ORGANIZER (
    OrganizerID         VARCHAR(20)         PRIMARY KEY
        REFERENCES ORGANIZER(OrganizerID) ON DELETE CASCADE ON UPDATE CASCADE,
    CitizenID           CHAR(12)            NOT NULL
        CHECK (LEN(CitizenID) = 12),
    IssueDate           DATE                NOT NULL,
    IssuePlace          NVARCHAR(200)
);


-- Bảng CORPORATE_ORGANIZER

CREATE TABLE CORPORATE_ORGANIZER (
    OrganizerID    VARCHAR(20)   PRIMARY KEY
        REFERENCES ORGANIZER(OrganizerID) ON DELETE CASCADE ON UPDATE CASCADE,
    TaxID          CHAR(13)      NOT NULL UNIQUE
        CHECK (LEN(TaxID) = 10 OR LEN(TaxID) = 13),
    LegalName      NVARCHAR(200) NOT NULL,
    Representative NVARCHAR(100)
);


-- Bảng CONTRACT

CREATE TABLE CONTRACT (
    ContractNumber      VARCHAR(20)         PRIMARY KEY,
    OrganizerID         VARCHAR(20)         NOT NULL
        REFERENCES ORGANIZER(OrganizerID) ON UPDATE CASCADE,
    CinemaID            VARCHAR(20)         NOT NULL
        REFERENCES CINEMA(CinemaID) ON UPDATE CASCADE,
    SignDate            DATE                NOT NULL,
    EffectiveDate       DATE                NOT NULL,
    TerminationDate     DATE                NOT NULL,
    ContractValue       DECIMAL(15,2)  
        CHECK (ContractValue >= 0),
    PaymentMethod       NVARCHAR(100),
    Terms               NVARCHAR(MAX),

    CHECK (TerminationDate > EffectiveDate),
    CHECK (EffectiveDate >= SignDate)
);


-- Bảng EVENT

CREATE TABLE EVENT (
    EventID             VARCHAR(20)         PRIMARY KEY,
    OrganizerID         VARCHAR(20)         NOT NULL
        REFERENCES ORGANIZER(OrganizerID) ON UPDATE CASCADE,
    EventName           NVARCHAR(200)       NOT NULL,
    EventDesc           NVARCHAR(MAX),
    EventStartDate      DATE                NOT NULL,
    EventEndDate        DATE                NOT NULL,
    ExpectedScale       INT            
        CHECK (ExpectedScale > 0),
    TotalBudget         DECIMAL(15,2)  
        CHECK (TotalBudget >= 0),
    EventStatus         NVARCHAR(20)        NOT NULL
        CHECK (EventStatus IN (N'Chờ duyệt', N'Đã duyệt', N'Từ chối', N'Đã hoàn thành')),

    CHECK (EventEndDate >= EventStartDate)
);


-- Bảng SESSION

CREATE TABLE SESSION (
    SessionID           VARCHAR(20)         PRIMARY KEY,
    EventID             VARCHAR(20)         NOT NULL
        REFERENCES EVENT(EventID) ON DELETE CASCADE ON UPDATE CASCADE,
    RoomNumber          VARCHAR(20)         NOT NULL,
    CinemaID            VARCHAR(20)         NOT NULL,
    SessionStart        DATETIME            NOT NULL,
    SessionEnd          DATETIME            NOT NULL,
    MaxGuests           INT                 NOT NULL 
        CHECK (MaxGuests > 0),
    RentalFee           DECIMAL(12,2)  
        CHECK (RentalFee >= 0),
    SessionStatus       NVARCHAR(20)        NOT NULL
        CHECK (SessionStatus IN (N'Chờ xác nhận', N'Đã xác nhận', N'Hủy')),

    CHECK (SessionEnd > SessionStart),
    FOREIGN KEY (RoomNumber, CinemaID)
        REFERENCES ROOM(RoomNumber, CinemaID) ON UPDATE CASCADE
);


-- Bảng PERSON

CREATE TABLE PERSON (
    PersonID            VARCHAR(20)         PRIMARY KEY,
    FName               NVARCHAR(50)        NOT NULL,
    Minit               NVARCHAR(50),
    LName               NVARCHAR(50)        NOT NULL,
    PersonDOB           DATE,
    PersonGender        NVARCHAR(10),
    PersonEmail         NVARCHAR(100),
    PersonPhone         VARCHAR(10)
        CHECK (LEN(PersonPhone) = 10),
    PersonHouseNo       NVARCHAR(20),
    PersonStreet        NVARCHAR(100),
    PersonWard          NVARCHAR(100),
    PersonCity          NVARCHAR(100)
);


-- Bảng EMPLOYEE

CREATE TABLE EMPLOYEE (
    EmployeeID          VARCHAR(20)         PRIMARY KEY,
    PersonID            VARCHAR(20)         NOT NULL UNIQUE
        REFERENCES PERSON(PersonID) ON UPDATE CASCADE,
    CinemaID            VARCHAR(20)         NOT NULL
        REFERENCES CINEMA(CinemaID) ON UPDATE CASCADE,
    SupervisorID        VARCHAR(20)
        REFERENCES EMPLOYEE(EmployeeID),
    EmpRole             NVARCHAR(100),
    Department          NVARCHAR(50)
        CHECK (Department IN (N'Vận hành', N'Kỹ thuật', N'Bán vé', N'Kinh doanh', N'Chăm sóc khách hàng')),
    BaseSalary          DECIMAL(12,2)  
        CHECK (BaseSalary >= 0),
    SalaryMultiplier    DECIMAL(5,2)        NOT NULL DEFAULT 1.00,
    HireDate            DATE                NOT NULL,
    EmploymentStatus    NVARCHAR(20)        NOT NULL
        CHECK (EmploymentStatus IN (N'Đang làm', N'Nghỉ phép', N'Nghỉ việc'))
);

-- Bảng DEPENDENT

CREATE TABLE DEPENDENT (
    DepName             NVARCHAR(100)       NOT NULL,
    DepDOB              DATE                NOT NULL,
    EmployeeID          VARCHAR(20)         NOT NULL
        REFERENCES EMPLOYEE(EmployeeID) ON DELETE CASCADE ON UPDATE CASCADE,
    DepGender           NVARCHAR(10),
    Relationship        NVARCHAR(50)
        CHECK (Relationship IN (N'Vợ', N'Chồng', N'Con', N'Cha', N'Mẹ', N'Anh', N'Chị', N'Em')),
    InsuranceInfo       NVARCHAR(20)
        CHECK (InsuranceInfo IN (N'Đang hưởng', N'Không hưởng')),

    PRIMARY KEY (DepName, DepDOB, EmployeeID)
);


-- Bảng SHIFT

CREATE TABLE SHIFT (
    ShiftID             VARCHAR(20)         PRIMARY KEY,
    ShiftType           NVARCHAR(10)        NOT NULL
        CHECK (ShiftType IN (N'Sáng', N'Chiều', N'Tối', N'Đêm')),
    ShiftStart          TIME                NOT NULL,
    ShiftEnd            TIME                NOT NULL,
    ShiftAllowance      DECIMAL(10,2)       DEFAULT 0,

    CHECK (ShiftEnd > ShiftStart)
);


-- Bảng WORK_ASSIGNMENT

CREATE TABLE WORK_ASSIGNMENT (
    EmployeeID          VARCHAR(20)         NOT NULL
        REFERENCES EMPLOYEE(EmployeeID) ON UPDATE CASCADE,
    ShiftID             VARCHAR(20)         NOT NULL
        REFERENCES SHIFT(ShiftID) ON UPDATE CASCADE,
    WorkDate            DATE                NOT NULL,
    WorkedHours         DECIMAL(5,2),
    AttendanceStatus    NVARCHAR(20)
        CHECK (AttendanceStatus IN (N'Đúng giờ', N'Đi trễ', N'Vắng mặt', N'Nghỉ phép')),
    Notes               NVARCHAR(MAX),

    PRIMARY KEY (EmployeeID, ShiftID, WorkDate)
);


-- Bảng SHOWTIME_ASSIGNMENT

CREATE TABLE SHOWTIME_ASSIGNMENT (
    EmployeeID          VARCHAR(20)         NOT NULL
        REFERENCES EMPLOYEE(EmployeeID),
    ShowtimeID          VARCHAR(20)         NOT NULL
        REFERENCES SHOWTIME(ShowtimeID),
    AssignRole          NVARCHAR(50)        NOT NULL
        CHECK (AssignRole IN (N'Soát vé', N'Kỹ thuật viên', N'Hỗ trợ khách hàng')),

    PRIMARY KEY (EmployeeID, ShowtimeID)
);
GO


-- ==============================================================================================
-- SECTION 01B - CUSTOMER / ORDER / REVIEW / PAYMENT TABLES
-- ==============================================================================================
CREATE TABLE CUSTOMER (
	PersonID VARCHAR(20) PRIMARY KEY,
	CustomerID VARCHAR(20) UNIQUE,

	FOREIGN KEY (PersonID) REFERENCES PERSON(PersonID)
);

CREATE TABLE REGISTERED_CUSTOMER (
	PersonID VARCHAR(20) PRIMARY KEY,
	Username VARCHAR(20) UNIQUE NOT NULL,
	Email VARCHAR(100) UNIQUE NOT NULL,
	Password VARCHAR(255) NOT NULL,
	RegistrationDate DATE,
	CurrentPoints INT CHECK (CurrentPoints >= 0),
	AccountStatus BIT,
	CreatedAt DATE,

	FOREIGN KEY (PersonID) REFERENCES CUSTOMER(PersonID)
);

CREATE TABLE GUEST_CUSTOMER (
	PersonID VARCHAR(20) PRIMARY KEY,

	FOREIGN KEY (PersonID) REFERENCES CUSTOMER(PersonID)
);

CREATE TABLE [ORDER] (
	OrderID VARCHAR(20) PRIMARY KEY,
	OrderStatus BIT,
	OrderDate DATE,
	OrderNote NVARCHAR(255),
	TotalAmount INT CHECK (TotalAmount >= 0),
	PersonID VARCHAR(20) NOT NULL,

	FOREIGN KEY (PersonID) REFERENCES CUSTOMER(PersonID)
);

CREATE TABLE ONLINE_ORDER (
	OrderID VARCHAR(20) PRIMARY KEY,
	TicketIssuedAt DATE,
	BookingPlatform NVARCHAR(50),
	DeliveryMethod NVARCHAR(50),

	FOREIGN KEY (OrderID) REFERENCES [ORDER](OrderID)
);

CREATE TABLE IN_STORE_ORDER (
	OrderID VARCHAR(20) PRIMARY KEY,

	FOREIGN KEY (OrderID) REFERENCES [ORDER](OrderID)
);

CREATE TABLE TICKET_PRINT_INFO (
	OrderID VARCHAR(20),
	PrintCount INT,
	PrintTime DATE,
	PrintReason NVARCHAR(255),
	PrintStatus BIT,
	PersonID VARCHAR(20),

	PRIMARY KEY (OrderID, PrintCount),

	FOREIGN KEY (OrderID) REFERENCES [ORDER](OrderID),
	FOREIGN KEY (PersonID) REFERENCES EMPLOYEE(PersonID),

	CHECK (PrintCount > 0)
);




-- cum order - chi tiet order

CREATE TABLE REFUND_EXCHANGE_REQUEST (
    RequestID                                VARCHAR(20)    PRIMARY KEY,
    RequestType                              NVARCHAR(30)   NOT NULL,
    RequestReason                            NVARCHAR(500),
    RequestProcessTime                       DATETIME,
    RequestStatus                            NVARCHAR(30)   NOT NULL,
    RequestActualRefundAmount                DECIMAL(12,2)
        CHECK (RequestActualRefundAmount IS NULL OR RequestActualRefundAmount >= 0),

    PersonID                                 VARCHAR(20)    NOT NULL,

    FOREIGN KEY (PersonID) REFERENCES PERSON(PersonID)
);

CREATE TABLE ORDER_DETAIL (
    OrderDetailID            VARCHAR(20)    PRIMARY KEY,
    OrderDetailQuantity      INT            NOT NULL
        CHECK (OrderDetailQuantity > 0),
    OrderDetailUnitPrice     DECIMAL(12,2)  NOT NULL
        CHECK (OrderDetailUnitPrice >= 0),
    OrderDetailSubtotal      DECIMAL(12,2)  NOT NULL
        CHECK (OrderDetailSubtotal >= 0),

    OrderID                  VARCHAR(20)    NOT NULL,
    RequestID                VARCHAR(20)    NULL,

    FOREIGN KEY (OrderID) REFERENCES [ORDER](OrderID),
    FOREIGN KEY (RequestID) REFERENCES REFUND_EXCHANGE_REQUEST(RequestID)
);

CREATE TABLE PRODUCT (
    ProductID               VARCHAR(20)    PRIMARY KEY,
    ProductStatus           NVARCHAR(30)   NOT NULL,
    BasePrice               DECIMAL(12,2)  NOT NULL
        CHECK (BasePrice >= 0),
    ProductName             NVARCHAR(100)  NOT NULL,
    ProductType             NVARCHAR(50)   NOT NULL
);

CREATE TABLE TICKET_DETAIL (
    OrderDetailID                VARCHAR(20)    PRIMARY KEY,
    TicketDetailTicketType       NVARCHAR(50)   NOT NULL,
    TicketDetailTicketPrice      DECIMAL(12,2)  NOT NULL
        CHECK (TicketDetailTicketPrice >= 0),

    ShowtimeID                   VARCHAR(20)    NULL,

    FOREIGN KEY (OrderDetailID) REFERENCES ORDER_DETAIL(OrderDetailID),
    FOREIGN KEY (ShowtimeID) REFERENCES SHOWTIME(ShowtimeID)
);

CREATE TABLE PRODUCT_DETAIL (
    OrderDetailID                VARCHAR(20)    PRIMARY KEY,
    ProductDetailProductNote     NVARCHAR(255),
    ProductDetailSizeOption      NVARCHAR(30),
    ProductID                    VARCHAR(20)    NULL,

    FOREIGN KEY (OrderDetailID) REFERENCES ORDER_DETAIL(OrderDetailID),
    FOREIGN KEY (ProductID) REFERENCES PRODUCT(ProductID)
);

CREATE TABLE E_TICKET (
    TicketID                 VARCHAR(20)    PRIMARY KEY,
    ETicketQRCode            NVARCHAR(255)  NOT NULL,
    ETicketStatus            NVARCHAR(30)   NOT NULL,
    ETicketCheckinTime       DATETIME,
    OrderDetailID            VARCHAR(20)    NOT NULL,
    RowIndex                 VARCHAR(5)     NOT NULL,
    ColumnNumber             INT            NOT NULL,
    RoomNumber               VARCHAR(20)    NULL,
    CinemaID                 VARCHAR(20)    NULL,

    FOREIGN KEY (OrderDetailID) REFERENCES TICKET_DETAIL(OrderDetailID),
     FOREIGN KEY (RowIndex, ColumnNumber, RoomNumber, CinemaID) REFERENCES SEAT(RowIndex, ColumnNumber, RoomNumber, CinemaID)
);


-- thanh toán và hoàn trả



CREATE TABLE PAYMENT_TRANSACTION (
    TransactionID                            VARCHAR(20)    PRIMARY KEY,
    PaymentTransactionAmount                 DECIMAL(12,2)  NOT NULL
        CHECK (PaymentTransactionAmount >= 0),
    PaymentTransactionPaymentTime            DATETIME,
    PaymentTransactionPaymentStatus          NVARCHAR(30)   NOT NULL,
    PaymentTransactionStatus                 NVARCHAR(30),
    PaymentTransactionMethod                 NVARCHAR(50)   NOT NULL,
    PaymentTransactionReferenceID            VARCHAR(100),

    OrderID                                  VARCHAR(20)    NOT NULL,

    FOREIGN KEY (OrderID) REFERENCES [ORDER](OrderID)
);






-- TABLE NAM

-- Review cụm 3
CREATE TABLE REVIEW (
    ReviewID                 VARCHAR(20)    PRIMARY KEY,
    PersonID                 VARCHAR(20)    NOT NULL,
    Content                 NVARCHAR(1000),
    ReviewTime               DATETIME       NOT NULL DEFAULT GETDATE(),
    ReviewNumOfStars         INT            NOT NULL
        CHECK (ReviewNumOfStars BETWEEN 1 AND 5),

    FOREIGN KEY (PersonID) REFERENCES PERSON(PersonID)
);

CREATE TABLE PRODUCT_REVIEW (
    ReviewID                 VARCHAR(20)    PRIMARY KEY,
    ProductID                VARCHAR(20)    NOT NULL,

    FOREIGN KEY (ReviewID) REFERENCES REVIEW(ReviewID),
    FOREIGN KEY (ProductID) REFERENCES PRODUCT(ProductID)
);

CREATE TABLE ORDER_REVIEW (
    ReviewID                 VARCHAR(20)    PRIMARY KEY,
    OrderID                  VARCHAR(20)    NOT NULL,

    FOREIGN KEY (ReviewID) REFERENCES REVIEW(ReviewID),
    FOREIGN KEY (OrderID) REFERENCES [ORDER](OrderID)
);


-- 4 bang duoi - history, vouche, apply
CREATE TABLE POINT_HISTORY (
    HistoryID           VARCHAR(20)     PRIMARY KEY,
    PointChange         INT             NOT NULL,
    PointReason         NVARCHAR(255)   NOT NULL,
    PointTimeStamp      DATETIME,
    PersonID            VARCHAR(20)     NOT NULL,
    OrderID             VARCHAR(20),

    CHECK (PointChange <> 0),
    FOREIGN KEY (PersonID) REFERENCES PERSON(PersonID),
    FOREIGN KEY (OrderID) REFERENCES [ORDER](OrderID)
);

CREATE TABLE VOUCHER (
    VoucherID               VARCHAR(20)     PRIMARY KEY,
    VoucherDiscountType     NVARCHAR(20)    NOT NULL,
    VoucherValue            DECIMAL(10,2)   NOT NULL,
    VoucherApplyCondition   NVARCHAR(255),
    VoucherExpiresAt        DATETIME        NOT NULL,
    VoucherStatus           NVARCHAR(20)    NOT NULL,

    CHECK (VoucherDiscountType IN (N'Percent', N'FixedAmount')),
    CHECK (VoucherValue > 0),
    CHECK (VoucherStatus IN (N'Active', N'Expired', N'Disabled'))
);

CREATE TABLE APPLY (
    VoucherID           VARCHAR(20)     NOT NULL,
    OrderID             VARCHAR(20)     NOT NULL,
    DiscountAmount      DECIMAL(10,2)   NOT NULL,

    PRIMARY KEY (VoucherID, OrderID),
    CHECK (DiscountAmount >= 0),
    FOREIGN KEY (VoucherID) REFERENCES VOUCHER(VoucherID),
    FOREIGN KEY (OrderID) REFERENCES [ORDER](OrderID)
);

-- request  in seat

CREATE TABLE SERVICE_REQUEST (
    ServiceRequestID    VARCHAR(20)     PRIMARY KEY,
    RowIndex            VARCHAR(5),
    ColumnNumber        INT,
    OrderID             VARCHAR(20)     NOT NULL,
    Note                NVARCHAR(500),
    Status              NVARCHAR(30)    NOT NULL,
    [Time]              DATETIME,
    RoomNumber          VARCHAR(20)     NULL,
    CinemaID            VARCHAR(20)     NULL,

    CHECK (Status IN (N'Pending', N'InProgress', N'Completed', N'Canceled')),
    CHECK (RowIndex BETWEEN 'A' AND 'O'),
    CHECK (ColumnNumber BETWEEN 1 AND 10),

    FOREIGN KEY (OrderID) REFERENCES [ORDER](OrderID),
     FOREIGN KEY (RowIndex, ColumnNumber, RoomNumber, CinemaID) REFERENCES SEAT(RowIndex, ColumnNumber, RoomNumber, CinemaID)
);
GO

-- ==============================================================================================
-- SECTION 02 - ALTER TABLE / FOREIGN KEY BO SUNG
-- ==============================================================================================
-- Thêm ràng buộc khóa ngoại của ManagerID

ALTER TABLE CINEMA
    ADD CONSTRAINT FK_Cinema_Manager
    FOREIGN KEY (ManagerID) REFERENCES EMPLOYEE(EmployeeID);
GO

-- ==============================================================================================
-- SECTION 03 - VIEW
-- ==============================================================================================
-- ============================================================
-- VIEWS
-- ============================================================

CREATE VIEW V_CINEMAROOMCOUNT AS
SELECT c.CinemaID, c.CinemaName, COUNT(r.RoomNumber) AS RoomCount
FROM   CINEMA c
LEFT JOIN ROOM r ON r.CinemaID = c.CinemaID
GROUP BY c.CinemaID, c.CinemaName;
GO

CREATE VIEW V_SHOWTIMEWITHENDTIME AS
SELECT s.*,
       DATEADD(MINUTE, m.MovieDuration + 15, s.ShowStartTime) AS EndTime
FROM   SHOWTIME s
JOIN   MOVIE m ON m.MovieID = s.MovieID;
GO

CREATE VIEW V_EMPLOYEESENIORITY AS
SELECT EmployeeID,
       DATEDIFF(MONTH, HireDate, GETDATE()) AS SeniorityMonths
FROM   EMPLOYEE;
GO

CREATE VIEW V_SHIFTTOTALHOURS AS
SELECT ShiftID,
       DATEDIFF(SECOND, ShiftStart, ShiftEnd) / 3600.0 AS TotalHours
FROM   SHIFT;
GO

-- ==============================================================================================
-- SECTION 04 - TRIGGER NGHIEP VU
-- ==============================================================================================
-- ============================================================
-- TRIGGERS
-- ============================================================

CREATE TRIGGER TRG_SeatCapacity_Insert
ON SEAT
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (
        SELECT 1
        FROM (
            SELECT s.RoomNumber, s.CinemaID, COUNT(*) AS ActiveCount
            FROM   SEAT s
            WHERE  s.SeatStatus = N'Hoạt động'
              AND  EXISTS (SELECT 1 FROM inserted i WHERE i.RoomNumber = s.RoomNumber AND i.CinemaID = s.CinemaID)
            GROUP BY s.RoomNumber, s.CinemaID
        ) a
        JOIN ROOM r ON r.RoomNumber = a.RoomNumber AND r.CinemaID = a.CinemaID
        WHERE a.ActiveCount > r.MaxCapacity
    )
    BEGIN
        RAISERROR(N'Số ghế hoạt động vượt sức chứa phòng chiếu', 16, 1);
        ROLLBACK TRANSACTION;
    END
END;
GO

CREATE TRIGGER TRG_SeatCapacity_Update
ON SEAT
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (
        SELECT 1
        FROM (
            SELECT s.RoomNumber, s.CinemaID, COUNT(*) AS ActiveCount
            FROM   SEAT s
            WHERE  s.SeatStatus = N'Hoạt động'
              AND  EXISTS (SELECT 1 FROM inserted i WHERE i.RoomNumber = s.RoomNumber AND i.CinemaID = s.CinemaID)
            GROUP BY s.RoomNumber, s.CinemaID
        ) a
        JOIN ROOM r ON r.RoomNumber = a.RoomNumber AND r.CinemaID = a.CinemaID
        WHERE a.ActiveCount > r.MaxCapacity
    )
    BEGIN
        RAISERROR(N'Số ghế hoạt động vượt sức chứa phòng chiếu', 16, 1);
        ROLLBACK TRANSACTION;
    END
END;
GO

CREATE TRIGGER TRG_RoomSeatLayout_Validate
ON ROOM
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (
        SELECT 1
        FROM inserted i
        WHERE i.SeatLayout IS NULL
           OR ISJSON(i.SeatLayout) <> 1
    )
    BEGIN
        RAISERROR(N'SeatLayout phải là JSON hợp lệ.', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END;

    IF EXISTS (
        SELECT 1
        FROM inserted i
        WHERE JSON_VALUE(i.SeatLayout, '$.roomNumber') <> i.RoomNumber
           OR JSON_VALUE(i.SeatLayout, '$.cinemaID') <> i.CinemaID
           OR TRY_CONVERT(INT, JSON_VALUE(i.SeatLayout, '$.maxCapacity')) <> i.MaxCapacity
           OR JSON_VALUE(i.SeatLayout, '$.coordinateSystem.rowStart') <> 'A'
           OR JSON_VALUE(i.SeatLayout, '$.coordinateSystem.rowEnd') <> 'O'
           OR TRY_CONVERT(INT, JSON_VALUE(i.SeatLayout, '$.coordinateSystem.columnStart')) <> 1
           OR TRY_CONVERT(INT, JSON_VALUE(i.SeatLayout, '$.coordinateSystem.columnEnd')) <> 10
           OR JSON_QUERY(i.SeatLayout, '$.seats') IS NULL
    )
    BEGIN
        RAISERROR(N'SeatLayout phải chứa đúng metadata phòng và hệ tọa độ A-O / 1-10.', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END;

    DECLARE @LayoutSeats TABLE (
        RoomNumber          VARCHAR(20),
        CinemaID            VARCHAR(20),
        RowIndex            VARCHAR(5),
        ColumnNumber        INT,
        SeatType            NVARCHAR(20),
        SeatStatus          NVARCHAR(20),
        SurchargeMultiplier DECIMAL(5,2),
        Zone                NVARCHAR(20)
    );

    INSERT INTO @LayoutSeats (RoomNumber, CinemaID, RowIndex, ColumnNumber, SeatType, SeatStatus, SurchargeMultiplier, Zone)
    SELECT
        i.RoomNumber,
        i.CinemaID,
        JSON_VALUE(js.value, '$.row') AS RowIndex,
        TRY_CONVERT(INT, JSON_VALUE(js.value, '$.number')) AS ColumnNumber,
        JSON_VALUE(js.value, '$.seatType') AS SeatType,
        JSON_VALUE(js.value, '$.seatStatus') AS SeatStatus,
        TRY_CONVERT(DECIMAL(5,2), JSON_VALUE(js.value, '$.surchargeMultiplier')) AS SurchargeMultiplier,
        JSON_VALUE(js.value, '$.zone') AS Zone
    FROM inserted i
    CROSS APPLY OPENJSON(i.SeatLayout, '$.seats') js;

    IF EXISTS (
        SELECT 1
        FROM @LayoutSeats ls
        WHERE ls.RowIndex IS NULL
           OR LEN(ls.RowIndex) <> 1
           OR ls.RowIndex NOT LIKE '[A-O]'
           OR ls.ColumnNumber NOT BETWEEN 1 AND 10
           OR ls.SeatType IS NULL
           OR ls.SeatStatus NOT IN (N'Hoạt động', N'Hỏng')
           OR ls.SurchargeMultiplier IS NULL
           OR ls.SurchargeMultiplier <= 0
    )
    BEGIN
        RAISERROR(N'SeatLayout chứa ghế không hợp lệ theo hệ tọa độ A-O / 1-10 hoặc thiếu thuộc tính bắt buộc.', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END;

    IF EXISTS (
        SELECT 1
        FROM inserted i
        LEFT JOIN (
            SELECT RoomNumber, CinemaID, COUNT(*) AS LayoutSeatCount
            FROM @LayoutSeats
            GROUP BY RoomNumber, CinemaID
        ) lc
            ON lc.RoomNumber = i.RoomNumber
           AND lc.CinemaID = i.CinemaID
        WHERE ISNULL(lc.LayoutSeatCount, 0) <> i.MaxCapacity
    )
    BEGIN
        RAISERROR(N'SeatLayout phải có đúng số ghế bằng MaxCapacity của ROOM.', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END;

    IF EXISTS (
        SELECT 1
        FROM @LayoutSeats
        GROUP BY RoomNumber, CinemaID, RowIndex, ColumnNumber
        HAVING COUNT(*) > 1
    )
    BEGIN
        RAISERROR(N'SeatLayout không được chứa tọa độ ghế trùng nhau trong cùng một phòng.', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END;

    IF EXISTS (
        SELECT 1
        FROM inserted i
        WHERE EXISTS (
            SELECT 1
            FROM SEAT s
            WHERE s.RoomNumber = i.RoomNumber
              AND s.CinemaID = i.CinemaID
        )
          AND (
                EXISTS (
                    SELECT ls.RowIndex, ls.ColumnNumber, ls.SeatType, ls.SeatStatus, ls.SurchargeMultiplier, ISNULL(ls.Zone, N'')
                    FROM @LayoutSeats ls
                    WHERE ls.RoomNumber = i.RoomNumber
                      AND ls.CinemaID = i.CinemaID
                    EXCEPT
                    SELECT s.RowIndex, s.ColumnNumber, s.SeatType, s.SeatStatus, CAST(s.SurchargeMultiplier AS DECIMAL(5,2)), ISNULL(s.Zone, N'')
                    FROM SEAT s
                    WHERE s.RoomNumber = i.RoomNumber
                      AND s.CinemaID = i.CinemaID
                )
                OR EXISTS (
                    SELECT s.RowIndex, s.ColumnNumber, s.SeatType, s.SeatStatus, CAST(s.SurchargeMultiplier AS DECIMAL(5,2)), ISNULL(s.Zone, N'')
                    FROM SEAT s
                    WHERE s.RoomNumber = i.RoomNumber
                      AND s.CinemaID = i.CinemaID
                    EXCEPT
                    SELECT ls.RowIndex, ls.ColumnNumber, ls.SeatType, ls.SeatStatus, ls.SurchargeMultiplier, ISNULL(ls.Zone, N'')
                    FROM @LayoutSeats ls
                    WHERE ls.RoomNumber = i.RoomNumber
                      AND ls.CinemaID = i.CinemaID
                )
          )
    )
    BEGIN
        RAISERROR(N'SeatLayout của ROOM phải khớp 1-1 với dữ liệu SEAT hiện có của đúng phòng.', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END;
END;
GO

CREATE TRIGGER TRG_SeatLayoutSync_IUD
ON SEAT
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @AffectedRooms TABLE (
        RoomNumber VARCHAR(20),
        CinemaID   VARCHAR(20),
        PRIMARY KEY (RoomNumber, CinemaID)
    );

    INSERT INTO @AffectedRooms (RoomNumber, CinemaID)
    SELECT DISTINCT RoomNumber, CinemaID
    FROM inserted
    WHERE RoomNumber IS NOT NULL
      AND CinemaID IS NOT NULL;

    INSERT INTO @AffectedRooms (RoomNumber, CinemaID)
    SELECT DISTINCT d.RoomNumber, d.CinemaID
    FROM deleted d
    WHERE d.RoomNumber IS NOT NULL
      AND d.CinemaID IS NOT NULL
      AND NOT EXISTS (
            SELECT 1
            FROM @AffectedRooms ar
            WHERE ar.RoomNumber = d.RoomNumber
              AND ar.CinemaID = d.CinemaID
      );

    IF NOT EXISTS (SELECT 1 FROM @AffectedRooms)
    BEGIN
        RETURN;
    END;

    DECLARE @LayoutSeats TABLE (
        RoomNumber          VARCHAR(20),
        CinemaID            VARCHAR(20),
        RowIndex            VARCHAR(5),
        ColumnNumber        INT,
        SeatType            NVARCHAR(20),
        SeatStatus          NVARCHAR(20),
        SurchargeMultiplier DECIMAL(5,2),
        Zone                NVARCHAR(20)
    );

    INSERT INTO @LayoutSeats (RoomNumber, CinemaID, RowIndex, ColumnNumber, SeatType, SeatStatus, SurchargeMultiplier, Zone)
    SELECT
        r.RoomNumber,
        r.CinemaID,
        JSON_VALUE(js.value, '$.row') AS RowIndex,
        TRY_CONVERT(INT, JSON_VALUE(js.value, '$.number')) AS ColumnNumber,
        JSON_VALUE(js.value, '$.seatType') AS SeatType,
        JSON_VALUE(js.value, '$.seatStatus') AS SeatStatus,
        TRY_CONVERT(DECIMAL(5,2), JSON_VALUE(js.value, '$.surchargeMultiplier')) AS SurchargeMultiplier,
        JSON_VALUE(js.value, '$.zone') AS Zone
    FROM ROOM r
    JOIN @AffectedRooms ar
      ON ar.RoomNumber = r.RoomNumber
     AND ar.CinemaID = r.CinemaID
    CROSS APPLY OPENJSON(r.SeatLayout, '$.seats') js;

    IF EXISTS (
        SELECT 1
        FROM ROOM r
        JOIN @AffectedRooms ar
          ON ar.RoomNumber = r.RoomNumber
         AND ar.CinemaID = r.CinemaID
        LEFT JOIN (
            SELECT RoomNumber, CinemaID, COUNT(*) AS ActualSeatCount
            FROM SEAT
            GROUP BY RoomNumber, CinemaID
        ) sc
          ON sc.RoomNumber = r.RoomNumber
         AND sc.CinemaID = r.CinemaID
        WHERE ISNULL(sc.ActualSeatCount, 0) <> r.MaxCapacity
    )
    BEGIN
        RAISERROR(N'Dữ liệu SEAT phải có đúng số lượng ghế bằng MaxCapacity của ROOM.', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END;

    IF EXISTS (
        SELECT 1
        FROM @AffectedRooms ar
        WHERE EXISTS (
            SELECT ls.RowIndex, ls.ColumnNumber, ls.SeatType, ls.SeatStatus, ls.SurchargeMultiplier, ISNULL(ls.Zone, N'')
            FROM @LayoutSeats ls
            WHERE ls.RoomNumber = ar.RoomNumber
              AND ls.CinemaID = ar.CinemaID
            EXCEPT
            SELECT s.RowIndex, s.ColumnNumber, s.SeatType, s.SeatStatus, CAST(s.SurchargeMultiplier AS DECIMAL(5,2)), ISNULL(s.Zone, N'')
            FROM SEAT s
            WHERE s.RoomNumber = ar.RoomNumber
              AND s.CinemaID = ar.CinemaID
        )
           OR EXISTS (
            SELECT s.RowIndex, s.ColumnNumber, s.SeatType, s.SeatStatus, CAST(s.SurchargeMultiplier AS DECIMAL(5,2)), ISNULL(s.Zone, N'')
            FROM SEAT s
            WHERE s.RoomNumber = ar.RoomNumber
              AND s.CinemaID = ar.CinemaID
            EXCEPT
            SELECT ls.RowIndex, ls.ColumnNumber, ls.SeatType, ls.SeatStatus, ls.SurchargeMultiplier, ISNULL(ls.Zone, N'')
            FROM @LayoutSeats ls
            WHERE ls.RoomNumber = ar.RoomNumber
              AND ls.CinemaID = ar.CinemaID
        )
    )
    BEGIN
        RAISERROR(N'Dữ liệu SEAT phải khớp 1-1 với SeatLayout JSON của ROOM.', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END;
END;
GO

CREATE TRIGGER TRG_ShowtimeOverlap_Insert
ON SHOWTIME
INSTEAD OF INSERT
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (
        SELECT 1
        FROM inserted i
        CROSS APPLY (
            SELECT DATEADD(MINUTE, m.MovieDuration + 15, i.ShowStartTime) AS NewEnd
            FROM MOVIE m WHERE m.MovieID = i.MovieID
        ) calc
        WHERE EXISTS (
            SELECT 1
            FROM V_SHOWTIMEWITHENDTIME e
            WHERE e.RoomNumber = i.RoomNumber
              AND e.CinemaID   = i.CinemaID
              AND e.ShowtimeID <> i.ShowtimeID
              AND e.ShowStatus <> N'Hủy'
              AND NOT (e.EndTime <= i.ShowStartTime OR calc.NewEnd <= e.ShowStartTime)
        )
    )
    BEGIN
        RAISERROR(N'Suất chiếu bị chồng lấn tại phòng chiếu', 16, 1);
        RETURN;
    END

    INSERT INTO SHOWTIME (ShowtimeID, MovieID, RoomNumber, CinemaID, PolicyID, ShowStartTime, BasePrice, ShowLanguage, ShowFormat, ShowStatus)
    SELECT ShowtimeID, MovieID, RoomNumber, CinemaID, PolicyID, ShowStartTime, BasePrice, ShowLanguage, ShowFormat, ShowStatus
    FROM inserted;
END;
GO

CREATE TRIGGER TRG_ShowtimeFormatCompat_Insert
ON SHOWTIME
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (
        SELECT 1
        FROM inserted i
        WHERE NOT EXISTS (
            SELECT 1 FROM ROOM_SUPPORTED_SCREEN rs
            WHERE rs.RoomNumber = i.RoomNumber
              AND rs.CinemaID   = i.CinemaID
              AND rs.ScreenType = i.ShowFormat
        )
    )
    BEGIN
        RAISERROR(N'Phòng chiếu không hỗ trợ định dạng này', 16, 1);
        ROLLBACK TRANSACTION;
    END
END;
GO

CREATE TRIGGER TRG_ShowtimeStatusRoom_Insert
ON SHOWTIME
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (
        SELECT 1
        FROM inserted i
        JOIN ROOM r ON r.RoomNumber = i.RoomNumber AND r.CinemaID = i.CinemaID
        WHERE i.ShowStatus = N'Mở bán' AND r.RoomTechStatus <> N'Sẵn sàng'
    )
    BEGIN
        RAISERROR(N'Không thể mở bán khi phòng chiếu chưa sẵn sàng', 16, 1);
        ROLLBACK TRANSACTION;
    END
END;
GO

CREATE TRIGGER TRG_SessionOverlap_Insert
ON SESSION
INSTEAD OF INSERT
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (
        SELECT 1
        FROM inserted i
        WHERE EXISTS (
            SELECT 1
            FROM SESSION s
            WHERE s.RoomNumber = i.RoomNumber
              AND s.CinemaID   = i.CinemaID
              AND s.SessionID <> i.SessionID
              AND s.SessionStatus <> N'Hủy'
              AND NOT (s.SessionEnd <= i.SessionStart OR i.SessionEnd <= s.SessionStart)
        )
        OR EXISTS (
            SELECT 1
            FROM V_SHOWTIMEWITHENDTIME st
            WHERE st.RoomNumber = i.RoomNumber
              AND st.CinemaID   = i.CinemaID
              AND st.ShowStatus <> N'Hủy'
              AND NOT (st.EndTime <= i.SessionStart OR i.SessionEnd <= st.ShowStartTime)
        )
    )
    BEGIN
        RAISERROR(N'Phiên sự kiện bị chồng lấn thời gian tại phòng chiếu', 16, 1);
        RETURN;
    END

    INSERT INTO SESSION (SessionID, EventID, RoomNumber, CinemaID, SessionStart, SessionEnd, MaxGuests, RentalFee, SessionStatus)
    SELECT SessionID, EventID, RoomNumber, CinemaID, SessionStart, SessionEnd, MaxGuests, RentalFee, SessionStatus
    FROM inserted;
END;
GO

CREATE TRIGGER TRG_WorkspaceCheck_Insert
ON SHOWTIME_ASSIGNMENT
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (
        SELECT 1
        FROM inserted i
        JOIN EMPLOYEE e ON e.EmployeeID = i.EmployeeID
        JOIN SHOWTIME s ON s.ShowtimeID = i.ShowtimeID
        WHERE e.CinemaID <> s.CinemaID
    )
    BEGIN
        RAISERROR(N'Nhân viên không thể được phân công tại rạp khác', 16, 1);
        ROLLBACK TRANSACTION;
    END
END;
GO

CREATE TRIGGER TRG_ManagerQualif_Insert
ON CINEMA
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (
        SELECT 1
        FROM inserted i
        JOIN EMPLOYEE e ON e.EmployeeID = i.ManagerID
        WHERE i.ManagerID IS NOT NULL
          AND (e.Department <> N'Vận hành' OR DATEDIFF(MONTH, e.HireDate, GETDATE()) < 12)
    )
    BEGIN
        RAISERROR(N'Quản lý phải thuộc bộ phận Vận hành và có ít nhất 12 tháng thâm niên', 16, 1);
        ROLLBACK TRANSACTION;
    END
END;
GO

CREATE TRIGGER TRG_NoSelfSupervision_Insert
ON EMPLOYEE
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (
        SELECT 1 FROM inserted
        WHERE SupervisorID IS NOT NULL AND SupervisorID = EmployeeID
    )
    BEGIN
        RAISERROR(N'Nhân viên không thể tự giám sát chính mình', 16, 1);
        ROLLBACK TRANSACTION;
    END
END;
GO

CREATE TRIGGER TRG_WorkedHoursCheck_Insert
ON WORK_ASSIGNMENT
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (
        SELECT 1
        FROM inserted i
        JOIN SHIFT s ON s.ShiftID = i.ShiftID
        WHERE i.WorkedHours IS NOT NULL
          AND i.WorkedHours > DATEDIFF(SECOND, s.ShiftStart, s.ShiftEnd) / 3600.0
    )
    BEGIN
        RAISERROR(N'Giờ thực tế vượt giờ quy định ca', 16, 1);
        ROLLBACK TRANSACTION;
    END
END;
GO

CREATE TRIGGER TRG_DependentLimit_Insert
ON DEPENDENT
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (
        SELECT d.EmployeeID
        FROM   DEPENDENT d
        WHERE  d.InsuranceInfo = N'Đang hưởng'
          AND  (DATEDIFF(YEAR, d.DepDOB, GETDATE()) < 18 OR DATEDIFF(YEAR, d.DepDOB, GETDATE()) > 60)
          AND  EXISTS (SELECT 1 FROM inserted i WHERE i.EmployeeID = d.EmployeeID)
        GROUP BY d.EmployeeID
        HAVING COUNT(*) > 3
    )
    BEGIN
        RAISERROR(N'Nhân viên đã đăng ký đủ 3 người thân phụ thuộc tối đa', 16, 1);
        ROLLBACK TRANSACTION;
    END
END;
GO

CREATE TRIGGER TRG_IssueDateCheck_Insert
ON INDIVIDUAL_ORGANIZER
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (
        SELECT 1 FROM inserted WHERE IssueDate > CAST(GETDATE() AS DATE)
    )
    BEGIN
        RAISERROR(N'Ngày cấp CCCD phải nhỏ hơn hoặc bằng ngày hiện tại', 16, 1);
        ROLLBACK TRANSACTION;
    END
END;
GO

CREATE TRIGGER TRG_ContractPeriodEvent_Insert
ON EVENT
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (
        SELECT 1
        FROM inserted i
        JOIN ORGANIZER o ON o.OrganizerID = i.OrganizerID
        WHERE i.EventStatus = N'Đã duyệt'
          AND o.OrganizerType = N'Corporate'
          AND NOT EXISTS (
              SELECT 1
              FROM CONTRACT c
              WHERE c.OrganizerID = i.OrganizerID
                AND i.EventStartDate >= c.EffectiveDate
                AND i.EventEndDate   <= c.TerminationDate
          )
    )
    BEGIN
        RAISERROR(N'Thời gian sự kiện nằm ngoài hiệu lực hợp đồng', 16, 1);
        ROLLBACK TRANSACTION;
    END
END;
GO

-- ==============================================================================================
-- SECTION 05 - SEED MASTER DATA
-- ==============================================================================================
-- NOTE: Thu tu seed duoc sap xep lai de tranh loi FK khi chay full script tren database moi.

-- ORGANIZER / ORGANIZER SUBTYPE
-- Dữ liệu cho ORGANIZER

INSERT INTO ORGANIZER (OrganizerID, OrganizerType, OrgName, OrgPhone, OrgEmail, OrgAddress)
VALUES 
('ORG001', N'Corporate', N'Công ty CP Phim Thiên Ngân (Galaxy)', '02439746122', 'supports@galaxy.com.vn', N'số 63a Võ Văn Tần, Phường Xuân Hòa, Thành phố Hồ Chí Minh'),
('ORG002', N'Corporate', N'Công ty TNHH LotteCinema Việt Nam', '02837752527', 'lottecultureworks.vn@gmail.com', N'Tầng 3, TTTM Lotte, số 469, đường Nguyễn Hữu Thọ, Phường Tân Hưng, Thành phố Hồ Chí Minh'),
('ORG003', N'Corporate', N'Công ty TNHH Bình Hạnh Đan (BHD)', '02439434133', 'bhdvn@bhd.vn', N'Tầng 11, tòa nhà Hồng Hà Center, số 25 Lý Thường Kiệt, Phường Cửa Nam, Thành phố Hà Nội'),
('ORG004', N'Corporate', N'Công ty CP tập đoàn VNG', '02839623888', 'info@vng.com.vn', N'Z06 Đường số 13, Phường Tân Thuận, Thành phố Hồ Chí Minh'),
('ORG005', N'Corporate', N'Công ty TNHH Mega GS Entertainment', '02862823737', 'ngocmai@megags.vn', N'212 Lý Chính Thắng, Phường Nhiêu Lộc, Thành phố Hồ Chí Minh'),
('ORG006', N'Individual', N'Lê Hoàng Nam', '0913456789', 'nam.le@gmail.com', N'15 Tràng Tiền, Phường Cửa Nam, Thành phố Hà Nội'),
('ORG007', N'Individual', N'Nguyễn Minh Thư', '0938123456', 'thu.minh@yahoo.com', N'782 Phan Chu Trinh, Phường Hương Trà, Thành phố Đà Nẵng'),
('ORG008', N'Individual', N'Phạm Thành Long', '0944998877', 'long.pham@outlook.com', N'45 Hai Bà Trưng, Phường Thủ Dầu Một, Thành phố Hồ Chí Minh'),
('ORG009', N'Individual', N'Hoàng Thanh Trúc', '0977665544', 'truc.hoang@gmail.com', N'120 Nguyễn Văn Cừ, Phường Cái Khế, Thành phố Cần Thơ'),
('ORG010', N'Individual', N'Đỗ Quốc Bảo', '0902112233', 'bao.do@hotmail.com', N'56 Lê Thánh Tôn, Phường Nha Trang, Tỉnh Khánh Hòa');


INSERT INTO CORPORATE_ORGANIZER (OrganizerID, TaxID, LegalName, Representative)
VALUES 
('ORG001', '0101595681', N'Công ty Cổ phần Phim Thiên Ngân', N'Nguyễn Thị Mai Hoa'),
('ORG002', '0302575928', N'Công ty TNHH LotteCinema Việt Nam', N'LIM KIWAN'),
('ORG003', '0100511375', N'Công ty TNHH Bình Hạnh Đan', N'Vũ Thị Bích Lộc'),
('ORG004', '0303490096', N'Công ty Cổ phần tập đoàn VNG', N'Lê Hồng Minh'),
('ORG005', '0312667335', N'Công ty TNHH Mega GS Entertainment', N'Vũ Thị Bích Liên');


INSERT INTO INDIVIDUAL_ORGANIZER (OrganizerID, CitizenID, IssueDate, IssuePlace)
VALUES 
('ORG006', '001088001234', '2021-02-10', N'Cục Cảnh sát QLHC về TTXH'),
('ORG007', '048195005678', '2022-06-15', N'Cục Cảnh sát QLHC về TTXH'),
('ORG008', '079090009012', '2021-12-20', N'Cục Cảnh sát QLHC về TTXH'),
('ORG009', '092302003456', '2023-01-05', N'Cục Cảnh sát QLHC về TTXH'),
('ORG010', '056082007890', '2021-08-12', N'Cục Cảnh sát QLHC về TTXH');

-- CINEMA / CINEMA PHONE
-- ============================================================
-- THÊM DỮ LIỆU BẢNG CINEMA
-- ============================================================
INSERT INTO CINEMA (CinemaID, CinemaName, OperatingOpen, OperatingClose, CinemaType, CinemaStatus, ManagerID, CinemaHouseNo, CinemaStreet, CinemaWard, CinemaCity)
VALUES
('CINE_QT', N'MovieTicket Quốc Thanh', '08:00:00', '23:59:00', N'Cụm rạp tiêu chuẩn', N'Đang hoạt động', NULL, N'271', N'Nguyễn Trãi', N'Cầu Ông Lãnh', N'Hồ Chí Minh'),
('CINE_SV', N'MovieTicket Sinh Viên', '08:00:00', '23:30:00', N'Cụm rạp tiêu chuẩn', N'Đang hoạt động', NULL, N'Nhà Văn Hóa', N'Đông Hòa', N'Đông Hòa', N'Hồ Chí Minh'),
('CINE_VVK', N'MovieTicket Võ Văn Kiệt', '08:00:00', '23:59:00', N'Cụm rạp tiêu chuẩn', N'Đang hoạt động', NULL, N'1466', N'Võ Văn Kiệt', N'Phường 3', N'Hồ Chí Minh'),
('CINE_HBT', N'MovieTicket Hai Bà Trưng', '08:00:00', '23:59:00', N'Cụm rạp cao cấp', N'Đang hoạt động', NULL, N'135', N'Hai Bà Trưng', N'Bến Nghé', N'Hồ Chí Minh'),
('CINE_Q7', N'MovieTicket Quận 7', '07:30:00', '23:30:00', N'Cụm rạp tiêu chuẩn', N'Đang hoạt động', NULL, N'1058', N'Nguyễn Văn Linh', N'Tân Phong', N'Hồ Chí Minh');
GO

-- ============================================================
-- THÊM DỮ LIỆU BẢNG CINEMAPHONE
-- ============================================================
INSERT INTO CINEMA_PHONE (CinemaID, CinemaPhoneNum)
VALUES
('CINE_QT', '0281900085'),
('CINE_QT', '0987654321'),  -- Số điện thoại phụ trợ
('CINE_SV', '0281900085'),
('CINE_VVK', '0281900085'),
('CINE_HBT', '0281900085'),
('CINE_Q7', '0281900085');  -- Đã cập nhật ID và dùng đầu số mã vùng HCM
GO

-- PERSON
-- Dữ liệu cho PERSON

INSERT INTO PERSON (PersonID, FName, Minit, LName, PersonDOB, PersonGender, PersonEmail, PersonPhone, PersonHouseNo, PersonStreet, PersonWard, PersonCity)
VALUES 
('P001', N'Lan', N'Thị', N'Nguyễn', '1990-05-15', N'Nữ', 'lan.nguyen@gmail.com', '0903123456', N'12', N'Lý Tự Trọng', N'Phường Sài Gòn', N'Thành phố Hồ Chí Minh'),
('P002', N'Hùng', N'Văn', N'Trần', '1995-10-20', N'Nam', 'hung.tran@gmail.com', '0385678901', N'45', N'Cách Mạng Tháng 8', N'Phường Nhiêu Lộc', N'Thành phố Hồ Chí Minh'),
('P003', N'Tuấn', N'Minh', N'Lê', '1998-03-12', N'Nam', 'tuan.le@gmail.com', '0812345678', N'78', N'Phan Đăng Lưu', N'Phường Cầu Kiệu', N'Thành phố Hồ Chí Minh'),
('P004', N'Nam', N'Hoàng', N'Phạm', '1992-07-25', N'Nam', 'nam.pham@gmail.com', '0567890123', N'101', N'Nguyễn Trãi', N'Phường Chợ Quán', N'Thành phố Hồ Chí Minh'),
('P005', N'Hương', N'Thu', N'Đặng', '2000-01-05', N'Nữ', 'huong.dang@gmail.com', '0868112233', N'22', N'Trần Hưng Đạo', N'Phường Bến Thành', N'Thành phố Hồ Chí Minh'),
('P006', N'Trâm', N'Nguyễn Bảo', N'Phan', '2001-08-15', N'Nữ', 'tram.pn_bao@gmail.com', '0701122334', N'55', N'Lê Lợi', N'Phường Bến Thành', N'Thành phố Hồ Chí Minh'),
('P007', N'Cầm', N'Thụy Bích', N'Khúc', '1999-11-22', N'Nữ', 'camktb.dev@gmail.com', '0399887766', N'112', N'Tôn Thất Thuyết', N'Phường Vĩnh Hội', N'Thành phố Hồ Chí Minh'),
('P008', N'Bảo', N'Lê Tôn Gia', N'Nguyễn', '1996-02-28', N'Nam', 'giabao.nlt96@gmail.com', '0891234567', N'88A', N'Trần Phú', N'Phường Chợ Quán', N'Thành phố Hồ Chí Minh'),
('P009', N'My', N'Đồ Kiều Diễm', N'Hoàng', '2002-09-09', N'Nữ', 'diemmy_hoangdo@gmail.com', '0793344556', N'334', N'Hậu Giang', N'Phường Bình Tây', N'Thành phố Hồ Chí Minh'),
('P010', N'Phát', N'Lương Tấn', N'Châu', '1994-12-01', N'Nam', 'phat.chault.work@gmail.com', '0834455667', N'99', N'Lâm Văn Bền', N'Phường Tân Hưng', N'Thành phố Hồ Chí Minh'),
('P011', N'Thành', N'Chí', N'Nguyễn', '1995-04-12', N'Nam', 'chithanh.ng@gmail.com', '0901112233', N'12A', N'Pasteur', N'Phường Sài Gòn', N'Thành phố Hồ Chí Minh'),
('P012', N'Hùng', N'Văn', N'Phạm', '1988-08-25', N'Nam', 'hung.phamvan@gmail.com', '0934567890', N'45', N'Lê Duẩn', N'Phường Tân Định', N'Thành phố Hồ Chí Minh'),
('P013', N'Thảo', N'Thị Thanh', N'Võ', '2000-01-15', N'Nữ', 'thanhthao.vo9x@gmail.com', '0987654321', N'78/2', N'Nguyễn Đình Chiểu', N'Phường Bàn Cờ', N'Thành phố Hồ Chí Minh'),
('P014', N'Duy', N'Phan', N'Nguyễn', '1999-11-05', N'Nam', 'duy.nguyenp@gmail.com', '0971234567', N'102', N'Trần Hưng Đạo', N'Phường Cầu Ông Lãnh', N'Thành phố Hồ Chí Minh'),
('P015', N'Long', N'Thành', N'Lê', '1997-07-20', N'Nam', 'long.lt99@gmail.com', '0969876543', N'55B', N'Nguyễn Tất Thành', N'Phường Xóm Chiếu', N'Thành phố Hồ Chí Minh'),
('P016', N'Sung', N'Đình', N'Tạ', '1992-03-18', N'Nam', 'sung.ta@gmail.com', '0861122334', N'89', N'Tôn Đản', N'Phường Vĩnh Hội', N'Thành phố Hồ Chí Minh'),
('P017', N'Ly', N'Ngọc', N'Hồ', '2001-09-09', N'Nữ', 'ngocly.ho@gmail.com', '0322334455', N'115', N'An Dương Vương', N'Phường An Đông', N'Thành phố Hồ Chí Minh'),
('P018', N'Thắng', N'Minh', N'Nguyễn', '1994-12-30', N'Nam', 'thang.nm@gmail.com', '0333445566', N'220', N'Hồng Bàng', N'Phường Chợ Lớn', N'Thành phố Hồ Chí Minh'),
('P019', N'Tâm', N'Hồng', N'Trần', '1996-05-22', N'Nữ', 'hongtam.tran@gmail.com', '0344556677', N'34', N'Kinh Dương Vương', N'Phường Phú Lâm', N'Thành phố Hồ Chí Minh'),
('P020', N'Bảo', N'Chia Thiên', N'Nguyễn', '1998-02-14', N'Nam', 'thienbao.nc@gmail.com', '0355667788', N'67', N'Hậu Giang', N'Phường Bình Tây', N'Thành phố Hồ Chí Minh'),
('P021', N'Hoàng', N'Thái', N'Huỳnh', '1991-10-10', N'Nam', 'thaihoang.h@gmail.com', '0911223344', N'90', N'Nguyễn Văn Linh', N'Phường Tân Thuận', N'Thành phố Hồ Chí Minh'),
('P022', N'Yến', N'Thị', N'Phạm', '2002-06-05', N'Nữ', 'thyen.pham@gmail.com', '0942345678', N'128', N'Huỳnh Tấn Phát', N'Phường Phú Thuận', N'Thành phố Hồ Chí Minh'),
('P023', N'Dũng', N'Ngọc', N'Vũ', '1989-11-11', N'Nam', 'dung.vu@gmail.com', '0883456789', N'256', N'Phạm Thế Hiển', N'Phường Chánh Hưng', N'Thành phố Hồ Chí Minh'),
('P024', N'Thuận', N'Duy', N'Đào', '1993-01-25', N'Nam', 'thuan.daoduy@gmail.com', '0814567890', N'11', N'Tạ Quang Bửu', N'Phường Bình Đông', N'Thành phố Hồ Chí Minh'),
('P025', N'Giang', N'Hoài', N'Lã', '1997-08-08', N'Nữ', 'hoaigiang.la@gmail.com', '0825678901', N'404', N'3 Tháng 2', N'Phường Vườn Lài', N'Thành phố Hồ Chí Minh'),
('P026', N'Sơn', N'Đình Trường', N'Lê', '1995-12-12', N'Nam', 'truongson.le@gmail.com', '0836789012', N'550', N'Tô Hiến Thành', N'Phường Hòa Hưng', N'Thành phố Hồ Chí Minh'),
('P027', N'Huy', N'Thanh', N'Hoàng', '2000-04-30', N'Nam', 'thanhhuy.hoang@gmail.com', '0847890123', N'66/5', N'Lạc Long Quân', N'Phường Minh Phụng', N'Thành phố Hồ Chí Minh'),
('P028', N'Tâm', N'Văn', N'Phan', '1990-07-27', N'Nam', 'vantam.phan@gmail.com', '0858901234', N'77', N'Hòa Bình', N'Phường Hòa Bình', N'Thành phố Hồ Chí Minh'),
('P029', N'Quang', N'Vinh', N'Nguyễn', '1996-09-02', N'Nam', 'vinhquang.nguyen@gmail.com', '0929012345', N'88C', N'Trường Chinh', N'Phường Đông Hưng Thuận', N'Thành phố Hồ Chí Minh'),
('P030', N'Tuyên', N'Minh', N'Huỳnh', '1998-11-20', N'Nam', 'minhtuyen.huynh@gmail.com', '0560123456', N'999', N'Quang Trung', N'Phường Hạnh Thông', N'Thành phố Hồ Chí Minh'),
('P031', N'Duy', N'Thế', N'Nguyễn', '1998-02-14', N'Nam', 'duy.nguyenthe@gmail.com', '0905000031', N'15', N'Lê Duẩn', N'Phường Sài Gòn', N'Thành phố Hồ Chí Minh'),
('P032', N'Tường', N'Vĩnh', N'Lý', '1995-06-22', N'Nam', 'tuong.lyvinh@gmail.com', '0935000032', N'22', N'Hai Bà Trưng', N'Phường Tân Định', N'Thành phố Hồ Chí Minh'),
('P033', N'Truyền', N'Thanh', N'Nguyễn', '1999-11-11', N'Nam', 'truyen.nguyenthanh@gmail.com', '0985000033', N'45A', N'Nguyễn Thị Minh Khai', N'Phường Bến Thành', N'Thành phố Hồ Chí Minh'),
('P034', N'Kiên', N'Trung', N'Phạm', '1992-08-08', N'Nam', 'kien.phamtrung@gmail.com', '0865000034', N'112', N'Đề Thám', N'Phường Cầu Ông Lãnh', N'Thành phố Hồ Chí Minh'),
('P035', N'Đức', N'Trung', N'Dương', '1997-12-05', N'Nam', 'duc.duongtrung@gmail.com', '0325000035', N'77', N'Điện Biên Phủ', N'Phường Bàn Cờ', N'Thành phố Hồ Chí Minh'),
('P036', N'Anh', N'Hoàng', N'Lê', '2000-03-15', N'Nam', 'anh.lehoang@gmail.com', '0915000036', N'88/2', N'Võ Thị Sáu', N'Phường Xuân Hòa', N'Thành phố Hồ Chí Minh'),
('P037', N'Lâm', N'Thanh', N'Nguyễn', '1994-07-22', N'Nam', 'lam.nguyenthanh@gmail.com', '0885000037', N'99', N'Lê Văn Sỹ', N'Phường Nhiêu Lộc', N'Thành phố Hồ Chí Minh'),
('P038', N'Phúc', N'Hữu', N'Trần', '1991-09-30', N'Nam', 'phuc.tranhuu@gmail.com', '0815000038', N'15', N'Đoàn Văn Bơ', N'Phường Xóm Chiếu', N'Thành phố Hồ Chí Minh'),
('P039', N'Hạnh', N'Đức', N'Nguyễn', '1989-01-18', N'Nam', 'hanh.nguyenduc@gmail.com', '0825000039', N'45', N'Hoàng Diệu', N'Phường Khánh Hội', N'Thành phố Hồ Chí Minh'),
('P040', N'Thịnh', N'Anh', N'Trần', '2001-05-12', N'Nam', 'thinh.trananh@gmail.com', '0835000040', N'66', N'Bến Vân Đồn', N'Phường Vĩnh Hội', N'Thành phố Hồ Chí Minh'),
('P041', N'Minh', N'Phước', N'Lê', '1996-10-05', N'Nam', 'minh.lephuoc@gmail.com', '0845000041', N'102', N'Trần Bình Trọng', N'Phường Chợ Quán', N'Thành phố Hồ Chí Minh'),
('P042', N'Hải', N'Sơn', N'Đỗ', '1993-04-19', N'Nam', 'hai.doson@gmail.com', '0855000042', N'115', N'An Dương Vương', N'Phường An Đông', N'Thành phố Hồ Chí Minh'),
('P043', N'Uyên', N'Thị Phương', N'Tống', '2002-09-02', N'Nữ', 'uyen.tongthi@gmail.com', '0895000043', N'220', N'Châu Văn Liêm', N'Phường Chợ Lớn', N'Thành phố Hồ Chí Minh'),
('P044', N'Lâm', N'Thanh', N'Võ', '1990-11-20', N'Nam', 'lam.vothanh@gmail.com', '0925000044', N'33', N'Hậu Giang', N'Phường Bình Tây', N'Thành phố Hồ Chí Minh'),
('P045', N'Dũng', N'Thành', N'Phan', '1988-12-12', N'Nam', 'dung.phanthanh@gmail.com', '0945000045', N'76', N'Minh Phụng', N'Phường Bình Tiên', N'Thành phố Hồ Chí Minh'),
('P046', N'Tiên', N'Kim', N'Võ', '1999-01-01', N'Nữ', 'tien.vokim@gmail.com', '0965000046', N'55', N'Kinh Dương Vương', N'Phường Bình Phú', N'Thành phố Hồ Chí Minh'),
('P047', N'Ngân', N'Hữu', N'Nguyễn', '1997-08-08', N'Nữ', 'ngan.nguyenhuu@gmail.com', '0975000047', N'89', N'Bà Hom', N'Phường Phú Lâm', N'Thành phố Hồ Chí Minh'),
('P048', N'Chương', N'Cần', N'Lâm', '1994-03-25', N'Nam', 'chuong.lamcan@gmail.com', '0995000048', N'11', N'Nguyễn Văn Linh', N'Phường Tân Thuận', N'Thành phố Hồ Chí Minh'),
('P049', N'Sơn', N'Ngọc Thái', N'Châu', '2001-07-07', N'Nam', 'son.chaungoc@gmail.com', '0335000049', N'12', N'Huỳnh Tấn Phát', N'Phường Phú Thuận', N'Thành phố Hồ Chí Minh'),
('P050', N'Tài', N'Đặng Thành', N'La', '1995-05-15', N'Nam', 'tai.ladang@gmail.com', '0345000050', N'67', N'Nguyễn Thị Thập', N'Phường Tân Mỹ', N'Thành phố Hồ Chí Minh'),
('P051', N'Hiền', N'Thị Thu', N'Nguyễn', '1992-02-28', N'Nữ', 'hien.nguyenthi@gmail.com', '0355000051', N'90', N'Lê Văn Lương', N'Phường Tân Hưng', N'Thành phố Hồ Chí Minh'),
('P052', N'Quý', N'Ngọc', N'Đinh', '1987-10-10', N'Nam', 'quy.dinhngoc@gmail.com', '0365000052', N'123', N'Phạm Thế Hiển', N'Phường Chánh Hưng', N'Thành phố Hồ Chí Minh'),
('P053', N'Hoàng', N'Minh', N'Bùi', '1996-04-14', N'Nam', 'hoang.buiminh@gmail.com', '0375000053', N'45', N'Bến Bình Đông', N'Phường Phú Định', N'Thành phố Hồ Chí Minh'),
('P054', N'Luân', N'Đình', N'Phan', '2000-08-20', N'Nam', 'luan.phandinh@gmail.com', '0385000054', N'66/5', N'Tùng Thiện Vương', N'Phường Bình Đông', N'Thành phố Hồ Chí Minh'),
('P055', N'Sỹ', N'Duy', N'Nguyễn', '1993-01-25', N'Nam', 'sy.nguyenduy@gmail.com', '0395000055', N'77', N'Ngô Gia Tự', N'Phường Diên Hồng', N'Thành phố Hồ Chí Minh'),
('P056', N'Triều', N'Đặng Hải', N'Nhan', '1998-11-05', N'Nam', 'trieu.nhandang@gmail.com', '0705000056', N'88C', N'Lý Thái Tổ', N'Phường Vườn Lài', N'Thành phố Hồ Chí Minh'),
('P057', N'Khôi', N'Hoàng', N'Nguyễn', '1991-07-16', N'Nam', 'khoi.nguyenhoang@gmail.com', '0795000057', N'99', N'Tô Hiến Thành', N'Phường Hòa Hưng', N'Thành phố Hồ Chí Minh'),
('P058', N'Linh', N'Xuân', N'Tăng', '2002-12-12', N'Nam', 'linh.tangxuan@gmail.com', '0785000058', N'11A', N'Lạc Long Quân', N'Phường Minh Phụng', N'Thành phố Hồ Chí Minh'),
('P059', N'Sen', N'Thị Hồng', N'Ngô', '1990-03-03', N'Nữ', 'sen.ngothi@gmail.com', '0775000059', N'22B', N'Ông Ích Khiêm', N'Phường Bình Thới', N'Thành phố Hồ Chí Minh'),
('P060', N'Lượng', N'Văn', N'Ngô', '1985-06-06', N'Nam', 'luong.ngovan@gmail.com', '0765000060', N'33', N'Hòa Bình', N'Phường Hòa Bình', N'Thành phố Hồ Chí Minh'),
('P061', N'Ninh', N'Xuân', N'Bùi', '1994-09-09', N'Nam', 'ninh.buixuan@gmail.com', '0565000061', N'44', N'Trường Chinh', N'Phường Đông Hưng Thuận', N'Thành phố Hồ Chí Minh'),
('P062', N'Lâm', N'Minh', N'Trần', '1999-05-18', N'Nam', 'lam.tranminh@gmail.com', '0585000062', N'55C', N'Nguyễn Ảnh Thủ', N'Phường Trung Mỹ Tây', N'Thành phố Hồ Chí Minh'),
('P063', N'Hạnh', N'Hữu', N'Đoàn', '1997-10-22', N'Nam', 'hanh.doanhuu@gmail.com', '0595000063', N'66', N'Lê Văn Khương', N'Phường Tân Thới Hiệp', N'Thành phố Hồ Chí Minh'),
('P064', N'Nhi', N'Hoài', N'Trần', '2001-01-28', N'Nữ', 'nhi.tranhoai@gmail.com', '0906000064', N'77', N'Tô Ngọc Vân', N'Phường Thới An', N'Thành phố Hồ Chí Minh'),
('P065', N'Ngân', N'Thị Kim', N'Lê', '1996-08-14', N'Nữ', 'ngan.lethi@gmail.com', '0916000065', N'88', N'Quốc Lộ 1A', N'Phường An Phú Đông', N'Thành phố Hồ Chí Minh'),
('P066', N'Loan', N'Thị Thúy', N'Lê', '1992-12-05', N'Nữ', 'loan.lethi@gmail.com', '0926000066', N'99A', N'Kinh Dương Vương', N'Phường An Lạc', N'Thành phố Hồ Chí Minh'),
('P067', N'Dương', N'Minh', N'Nguyễn', '1989-04-30', N'Nam', 'duong.nguyenminh@gmail.com', '0936000067', N'102', N'Tân Kỳ Tân Quý', N'Phường Bình Tân', N'Thành phố Hồ Chí Minh'),
('P068', N'Đạt', N'Tuấn', N'Quang', '1998-07-21', N'Nam', 'dat.quangtuan@gmail.com', '0946000068', N'115', N'Bình Trị Đông', N'Phường Bình Trị Đông', N'Thành phố Hồ Chí Minh'),
('P069', N'Duy', N'Hoàng', N'Cao', '1995-11-15', N'Nam', 'duy.caohoang@gmail.com', '0956000069', N'12', N'Lê Trọng Tấn', N'Phường Bình Hưng Hòa', N'Thành phố Hồ Chí Minh'),
('P070', N'Lâm', N'Đình', N'Lê', '2000-02-28', N'Nam', 'lam.ledinh@gmail.com', '0966000070', N'34', N'Phan Đăng Lưu', N'Phường Gia Định', N'Thành phố Hồ Chí Minh'),
('P071', N'Nguyên', N'Lê Minh', N'Trần', '1993-05-09', N'Nam', 'nguyen.tranle@gmail.com', '0976000071', N'45', N'Bạch Đằng', N'Phường Bình Thạnh', N'Thành phố Hồ Chí Minh'),
('P072', N'Minh', N'Ngọc', N'Lê', '1997-09-17', N'Nam', 'minh.lengoc@gmail.com', '0986000072', N'56', N'Nơ Trang Long', N'Phường Bình Lợi Trung', N'Thành phố Hồ Chí Minh'),
('P073', N'Phú', N'Văn', N'Đặng', '1991-12-25', N'Nam', 'phu.dangvan@gmail.com', '0996000073', N'67', N'Xô Viết Nghệ Tĩnh', N'Phường Thạnh Mỹ Tây', N'Thành phố Hồ Chí Minh'),
('P074', N'Huyền', N'Thanh', N'Phan', '2002-06-11', N'Nữ', 'huyen.phanthanh@gmail.com', '0816000074', N'78', N'Bình Quới', N'Phường Bình Quới', N'Thành phố Hồ Chí Minh'),
('P075', N'Tài', N'Thành', N'Nguyễn', '1988-03-22', N'Nam', 'tai.nguyenthanh@gmail.com', '0826000075', N'89', N'Nguyễn Oanh', N'Phường Hạnh Thông', N'Thành phố Hồ Chí Minh'),
('P076', N'Linh', N'Hoài', N'Trần', '1994-08-08', N'Nữ', 'linh.tranhoai@gmail.com', '0836000076', N'90', N'Quang Trung', N'Phường An Nhơn', N'Thành phố Hồ Chí Minh'),
('P077', N'Hương', N'Thị', N'Phạm', '1999-10-10', N'Nữ', 'huong.phamthi@gmail.com', '0846000077', N'11A', N'Phan Văn Trị', N'Phường Gò Vấp', N'Thành phố Hồ Chí Minh'),
('P078', N'Doanh', N'Nguyễn Ngọc', N'Phạm', '1996-01-15', N'Nữ', 'doanh.phamnguyen@gmail.com', '0856000078', N'22', N'Thống Nhất', N'Phường An Hội Đông', N'Thành phố Hồ Chí Minh'),
('P079', N'Nhi', N'Thị Yến', N'Đặng', '2001-04-04', N'Nữ', 'nhi.dangthi@gmail.com', '0866000079', N'33', N'Cây Trâm', N'Phường Thông Tây Hội', N'Thành phố Hồ Chí Minh'),
('P080', N'Hưng', N'Nguyễn Minh', N'Trần', '1992-07-07', N'Nam', 'hung.trannguyen@gmail.com', '0886000080', N'44', N'Lê Đức Thọ', N'Phường An Hội Tây', N'Thành phố Hồ Chí Minh'),
('P081', N'Hải', N'Gia', N'Mai', '1998-11-20', N'Nam', 'hai.maigia@gmail.com', '0896000081', N'55', N'Nguyễn Kiệm', N'Phường Đức Nhuận', N'Thành phố Hồ Chí Minh'),
('P082', N'Hoàng', N'Thiện', N'Nguyễn', '1990-02-14', N'Nam', 'hoang.nguyenthien@gmail.com', '0326000082', N'66', N'Phan Đình Phùng', N'Phường Cầu Kiệu', N'Thành phố Hồ Chí Minh'),
('P083', N'Tiến', N'Viết', N'Nguyễn', '1995-06-18', N'Nam', 'tien.nguyenviet@gmail.com', '0336000083', N'77', N'Huỳnh Văn Bánh', N'Phường Phú Nhuận', N'Thành phố Hồ Chí Minh'),
('P084', N'Toàn', N'Minh', N'Hồ', '2000-09-09', N'Nam', 'toan.hominh@gmail.com', '0346000084', N'88', N'Hoàng Văn Thụ', N'Phường Tân Sơn Hòa', N'Thành phố Hồ Chí Minh'),
('P085', N'Hưng', N'Quốc', N'Nguyễn', '1997-12-12', N'Nam', 'hung.nguyenquoc@gmail.com', '0356000085', N'99', N'Phổ Quang', N'Phường Tân Sơn Nhất', N'Thành phố Hồ Chí Minh'),
('P086', N'Linh', N'Trọng Duy', N'Hoàng', '1993-03-25', N'Nam', 'linh.hoangtrong@gmail.com', '0366000086', N'101', N'Lý Thường Kiệt', N'Phường Tân Hòa', N'Thành phố Hồ Chí Minh'),
('P087', N'Khang', N'Hữu', N'Đặng', '1998-05-05', N'Nam', 'khang.danghuu@gmail.com', '0376000087', N'22', N'Cách Mạng Tháng Tám', N'Phường Bảy Hiền', N'Thành phố Hồ Chí Minh'),
('P088', N'Nguyên', N'Hồng', N'Nguyễn', '1991-08-16', N'Nam', 'nguyen.nguyenhong@gmail.com', '0386000088', N'33', N'Cộng Hòa', N'Phường Tân Bình', N'Thành phố Hồ Chí Minh'),
('P089', N'Phú', N'Ngọc Thanh', N'Huỳnh', '2001-10-20', N'Nam', 'phu.huynhngoc@gmail.com', '0396000089', N'44', N'Trường Chinh', N'Phường Tân Sơn', N'Thành phố Hồ Chí Minh'),
('P090', N'Chi', N'Đỗ Kim', N'Phạm', '1996-01-30', N'Nữ', 'chi.phamdo@gmail.com', '0706000090', N'55', N'Tây Thạnh', N'Phường Tây Thạnh', N'Thành phố Hồ Chí Minh'),
('P091', N'Huy', N'Ngọc', N'Trịnh', '1989-04-12', N'Nam', 'huy.trinhngoc@gmail.com', '0796000091', N'66', N'Tân Sơn Nhì', N'Phường Tân Sơn Nhì', N'Thành phố Hồ Chí Minh'),
('P092', N'Duy', N'Ngọc Minh', N'Chung', '1994-07-28', N'Nam', 'duy.chungngoc@gmail.com', '0786000092', N'77', N'Phú Thọ Hòa', N'Phường Phú Thọ Hòa', N'Thành phố Hồ Chí Minh'),
('P093', N'Tiên', N'Hạnh', N'Nguyễn', '2002-11-11', N'Nữ', 'tien.nguyenhanh@gmail.com', '0776000093', N'88', N'Âu Cơ', N'Phường Tân Phú', N'Thành phố Hồ Chí Minh'),
('P094', N'Toàn', N'Duy', N'Nguyễn', '1990-02-02', N'Nam', 'toan.nguyenduy@gmail.com', '0766000094', N'99', N'Thoại Ngọc Hầu', N'Phường Phú Thạnh', N'Thành phố Hồ Chí Minh'),
('P095', N'Nguyên', N'Thanh', N'Phạm', '1995-06-06', N'Nam', 'nguyen.phamthanh@gmail.com', '0566000095', N'10', N'Phạm Văn Đồng', N'Phường Hiệp Bình', N'Thành phố Hồ Chí Minh'),
('P096', N'Huy', N'Đức', N'Huỳnh', '1999-09-19', N'Nam', 'huy.huynhduc@gmail.com', '0586000096', N'20', N'Võ Văn Ngân', N'Phường Thủ Đức', N'Thành phố Hồ Chí Minh'),
('P097', N'Bằng', N'Phương', N'Nguyễn', '1997-12-22', N'Nam', 'bang.nguyenphuong@gmail.com', '0596000097', N'30', N'Tô Ngọc Vân', N'Phường Tam Bình', N'Thành phố Hồ Chí Minh'),
('P098', N'Dự', N'Văn Kỳ', N'Lê', '1992-03-08', N'Nam', 'du.levan@gmail.com', '0816000098', N'40', N'Quốc Lộ 1K', N'Phường Linh Xuân', N'Thành phố Hồ Chí Minh'),
('P099', N'Anh', N'Lan', N'Nghiêm', '2000-08-14', N'Nữ', 'anh.nghiemlan@gmail.com', '0826000099', N'50', N'Lê Văn Việt', N'Phường Tăng Nhơn Phú', N'Thành phố Hồ Chí Minh'),
('P100', N'Hiển', N'Hoàng', N'Đỗ', '1988-10-30', N'Nam', 'hien.dohoang@gmail.com', '0836000100', N'60', N'Nguyễn Xiển', N'Phường Long Bình', N'Thành phố Hồ Chí Minh');


-- Dữ liệu cho EMPLOYEE

-- EMPLOYEE
INSERT INTO EMPLOYEE (EmployeeID, PersonID, CinemaID, SupervisorID, EmpRole, Department, BaseSalary, SalaryMultiplier, HireDate, EmploymentStatus)
VALUES 

-- ĐỘI NGŨ RẠP CINE_HBT - Quản lý: E001

('E001', 'P001', 'CINE_HBT', NULL, N'Quản lý rạp', N'Vận hành', 20000000, 1.5, '2023-01-15', N'Đang làm'),
('E002', 'P002', 'CINE_HBT', 'E001', N'Trưởng ca Kỹ thuật', N'Kỹ thuật', 12000000, 1.2, '2024-05-10', N'Đang làm'),
('E003', 'P003', 'CINE_HBT', 'E001', N'Trưởng ca Bán vé', N'Bán vé', 10000000, 1.2, '2024-06-20', N'Đang làm'),
('E004', 'P004', 'CINE_HBT', 'E001', N'Trưởng ca CSKH', N'Chăm sóc khách hàng', 10000000, 1.2, '2024-08-01', N'Đang làm'),
('E005', 'P005', 'CINE_HBT', 'E002', N'Kỹ thuật viên', N'Kỹ thuật', 8000000, 1.0, '2025-01-10', N'Đang làm'),
('E006', 'P006', 'CINE_HBT', 'E002', N'Kỹ thuật viên', N'Kỹ thuật', 8000000, 1.0, '2025-02-15', N'Đang làm'),
('E007', 'P007', 'CINE_HBT', 'E002', N'Kỹ thuật viên', N'Kỹ thuật', 8000000, 1.0, '2025-03-20', N'Nghỉ phép'),
('E008', 'P008', 'CINE_HBT', 'E002', N'Kỹ thuật viên', N'Kỹ thuật', 8000000, 1.0, '2025-10-05', N'Đang làm'),
('E009', 'P009', 'CINE_HBT', 'E003', N'Nhân viên bán vé', N'Bán vé', 7000000, 1.0, '2025-05-01', N'Đang làm'),
('E010', 'P010', 'CINE_HBT', 'E003', N'Nhân viên bán vé', N'Bán vé', 7000000, 1.0, '2025-06-15', N'Đang làm'),
('E011', 'P011', 'CINE_HBT', 'E003', N'Nhân viên bán vé', N'Bán vé', 7000000, 1.0, '2025-07-20', N'Đang làm'),
('E012', 'P012', 'CINE_HBT', 'E003', N'Nhân viên bán vé', N'Bán vé', 7000000, 1.0, '2026-01-10', N'Đang làm'),
('E013', 'P013', 'CINE_HBT', 'E003', N'Nhân viên bán vé', N'Bán vé', 7000000, 1.0, '2026-02-28', N'Đang làm'),
('E014', 'P014', 'CINE_HBT', 'E003', N'Nhân viên bán vé', N'Bán vé', 7000000, 1.0, '2026-03-05', N'Đang làm'),
('E015', 'P015', 'CINE_HBT', 'E004', N'Nhân viên CSKH', N'Chăm sóc khách hàng', 7500000, 1.0, '2025-09-10', N'Đang làm'),
('E016', 'P016', 'CINE_HBT', 'E004', N'Nhân viên CSKH', N'Chăm sóc khách hàng', 7500000, 1.0, '2025-11-20', N'Đang làm'),
('E017', 'P017', 'CINE_HBT', 'E004', N'Nhân viên CSKH', N'Chăm sóc khách hàng', 7500000, 1.0, '2025-12-05', N'Đang làm'),
('E018', 'P018', 'CINE_HBT', 'E004', N'Nhân viên CSKH', N'Chăm sóc khách hàng', 7500000, 1.0, '2026-01-15', N'Nghỉ việc'),
('E019', 'P019', 'CINE_HBT', 'E004', N'Nhân viên CSKH', N'Chăm sóc khách hàng', 7500000, 1.0, '2026-02-20', N'Đang làm'),
('E020', 'P020', 'CINE_HBT', 'E004', N'Nhân viên CSKH', N'Chăm sóc khách hàng', 7500000, 1.0, '2026-04-01', N'Đang làm'),


-- ĐỘI NGŨ RẠP CINE_Q7 - Quản lý: E021

('E021', 'P021', 'CINE_Q7', NULL, N'Quản lý rạp', N'Vận hành', 19000000, 1.5, '2023-03-10', N'Đang làm'),
('E022', 'P022', 'CINE_Q7', 'E021', N'Trưởng ca Kỹ thuật', N'Kỹ thuật', 12000000, 1.2, '2024-01-20', N'Đang làm'),
('E023', 'P023', 'CINE_Q7', 'E021', N'Trưởng ca Bán vé', N'Bán vé', 10000000, 1.2, '2024-04-15', N'Đang làm'),
('E024', 'P024', 'CINE_Q7', 'E021', N'Trưởng ca CSKH', N'Chăm sóc khách hàng', 10000000, 1.2, '2024-06-10', N'Đang làm'),
('E025', 'P025', 'CINE_Q7', 'E022', N'Kỹ thuật viên', N'Kỹ thuật', 8000000, 1.0, '2025-05-05', N'Đang làm'),
('E026', 'P026', 'CINE_Q7', 'E022', N'Kỹ thuật viên', N'Kỹ thuật', 8000000, 1.0, '2025-07-15', N'Đang làm'),
('E027', 'P027', 'CINE_Q7', 'E022', N'Kỹ thuật viên', N'Kỹ thuật', 8000000, 1.0, '2025-08-20', N'Đang làm'),
('E028', 'P028', 'CINE_Q7', 'E022', N'Kỹ thuật viên', N'Kỹ thuật', 8000000, 1.0, '2025-11-10', N'Đang làm'),
('E029', 'P029', 'CINE_Q7', 'E023', N'Nhân viên bán vé', N'Bán vé', 7000000, 1.0, '2025-02-15', N'Đang làm'),
('E030', 'P030', 'CINE_Q7', 'E023', N'Nhân viên bán vé', N'Bán vé', 7000000, 1.0, '2025-04-05', N'Đang làm'),
('E031', 'P031', 'CINE_Q7', 'E023', N'Nhân viên bán vé', N'Bán vé', 7000000, 1.0, '2025-06-20', N'Đang làm'),
('E032', 'P032', 'CINE_Q7', 'E023', N'Nhân viên bán vé', N'Bán vé', 7000000, 1.0, '2025-09-10', N'Nghỉ việc'),
('E033', 'P033', 'CINE_Q7', 'E023', N'Nhân viên bán vé', N'Bán vé', 7000000, 1.0, '2026-01-15', N'Đang làm'),
('E034', 'P034', 'CINE_Q7', 'E023', N'Nhân viên bán vé', N'Bán vé', 7000000, 1.0, '2026-02-05', N'Đang làm'),
('E035', 'P035', 'CINE_Q7', 'E024', N'Nhân viên CSKH', N'Chăm sóc khách hàng', 7500000, 1.0, '2025-03-20', N'Đang làm'),
('E036', 'P036', 'CINE_Q7', 'E024', N'Nhân viên CSKH', N'Chăm sóc khách hàng', 7500000, 1.0, '2025-08-15', N'Đang làm'),
('E037', 'P037', 'CINE_Q7', 'E024', N'Nhân viên CSKH', N'Chăm sóc khách hàng', 7500000, 1.0, '2025-10-10', N'Đang làm'),
('E038', 'P038', 'CINE_Q7', 'E024', N'Nhân viên CSKH', N'Chăm sóc khách hàng', 7500000, 1.0, '2025-12-05', N'Đang làm'),
('E039', 'P039', 'CINE_Q7', 'E024', N'Nhân viên CSKH', N'Chăm sóc khách hàng', 7500000, 1.0, '2026-02-25', N'Đang làm'),
('E040', 'P040', 'CINE_Q7', 'E024', N'Nhân viên CSKH', N'Chăm sóc khách hàng', 7500000, 1.0, '2026-03-15', N'Đang làm'),


-- ĐỘI NGŨ RẠP CINE_QT - Quản lý: E041

('E041', 'P041', 'CINE_QT', NULL, N'Quản lý rạp', N'Vận hành', 22000000, 1.5, '2022-11-15', N'Đang làm'),
('E042', 'P042', 'CINE_QT', 'E041', N'Trưởng ca Kỹ thuật', N'Kỹ thuật', 13000000, 1.2, '2023-05-10', N'Đang làm'),
('E043', 'P043', 'CINE_QT', 'E041', N'Trưởng ca Bán vé', N'Bán vé', 11000000, 1.2, '2023-08-20', N'Đang làm'),
('E044', 'P044', 'CINE_QT', 'E041', N'Trưởng ca CSKH', N'Chăm sóc khách hàng', 11000000, 1.2, '2024-02-15', N'Đang làm'),
('E045', 'P045', 'CINE_QT', 'E042', N'Kỹ thuật viên', N'Kỹ thuật', 8500000, 1.0, '2025-01-10', N'Đang làm'),
('E046', 'P046', 'CINE_QT', 'E042', N'Kỹ thuật viên', N'Kỹ thuật', 8500000, 1.0, '2025-04-05', N'Đang làm'),
('E047', 'P047', 'CINE_QT', 'E042', N'Kỹ thuật viên', N'Kỹ thuật', 8500000, 1.0, '2025-06-15', N'Đang làm'),
('E048', 'P048', 'CINE_QT', 'E042', N'Kỹ thuật viên', N'Kỹ thuật', 8500000, 1.0, '2025-09-20', N'Nghỉ phép'),
('E049', 'P049', 'CINE_QT', 'E043', N'Nhân viên bán vé', N'Bán vé', 7500000, 1.0, '2025-03-10', N'Đang làm'),
('E050', 'P050', 'CINE_QT', 'E043', N'Nhân viên bán vé', N'Bán vé', 7500000, 1.0, '2025-05-25', N'Đang làm'),
('E051', 'P051', 'CINE_QT', 'E043', N'Nhân viên bán vé', N'Bán vé', 7500000, 1.0, '2025-08-15', N'Đang làm'),
('E052', 'P052', 'CINE_QT', 'E043', N'Nhân viên bán vé', N'Bán vé', 7500000, 1.0, '2025-11-05', N'Đang làm'),
('E053', 'P053', 'CINE_QT', 'E043', N'Nhân viên bán vé', N'Bán vé', 7500000, 1.0, '2026-01-20', N'Đang làm'),
('E054', 'P054', 'CINE_QT', 'E043', N'Nhân viên bán vé', N'Bán vé', 7500000, 1.0, '2026-03-10', N'Đang làm'),
('E055', 'P055', 'CINE_QT', 'E044', N'Nhân viên CSKH', N'Chăm sóc khách hàng', 8000000, 1.0, '2025-02-20', N'Đang làm'),
('E056', 'P056', 'CINE_QT', 'E044', N'Nhân viên CSKH', N'Chăm sóc khách hàng', 8000000, 1.0, '2025-07-10', N'Đang làm'),
('E057', 'P057', 'CINE_QT', 'E044', N'Nhân viên CSKH', N'Chăm sóc khách hàng', 8000000, 1.0, '2025-10-15', N'Đang làm'),
('E058', 'P058', 'CINE_QT', 'E044', N'Nhân viên CSKH', N'Chăm sóc khách hàng', 8000000, 1.0, '2025-12-20', N'Đang làm'),
('E059', 'P059', 'CINE_QT', 'E044', N'Nhân viên CSKH', N'Chăm sóc khách hàng', 8000000, 1.0, '2026-01-05', N'Nghỉ việc'),
('E060', 'P060', 'CINE_QT', 'E044', N'Nhân viên CSKH', N'Chăm sóc khách hàng', 8000000, 1.0, '2026-02-28', N'Đang làm'),


-- ĐỘI NGŨ RẠP CINE_SV - Quản lý: E061

('E061', 'P061', 'CINE_SV', NULL, N'Quản lý rạp', N'Vận hành', 18500000, 1.5, '2023-06-10', N'Đang làm'),
('E062', 'P062', 'CINE_SV', 'E061', N'Trưởng ca Kỹ thuật', N'Kỹ thuật', 12000000, 1.2, '2024-02-15', N'Đang làm'),
('E063', 'P063', 'CINE_SV', 'E061', N'Trưởng ca Bán vé', N'Bán vé', 10000000, 1.2, '2024-05-20', N'Đang làm'),
('E064', 'P064', 'CINE_SV', 'E061', N'Trưởng ca CSKH', N'Chăm sóc khách hàng', 10000000, 1.2, '2024-09-10', N'Đang làm'),
('E065', 'P065', 'CINE_SV', 'E062', N'Kỹ thuật viên', N'Kỹ thuật', 8000000, 1.0, '2025-01-20', N'Đang làm'),
('E066', 'P066', 'CINE_SV', 'E062', N'Kỹ thuật viên', N'Kỹ thuật', 8000000, 1.0, '2025-03-15', N'Đang làm'),
('E067', 'P067', 'CINE_SV', 'E062', N'Kỹ thuật viên', N'Kỹ thuật', 8000000, 1.0, '2025-06-10', N'Đang làm'),
('E068', 'P068', 'CINE_SV', 'E062', N'Kỹ thuật viên', N'Kỹ thuật', 8000000, 1.0, '2025-11-25', N'Đang làm'),
('E069', 'P069', 'CINE_SV', 'E063', N'Nhân viên bán vé', N'Bán vé', 7000000, 1.0, '2025-04-10', N'Đang làm'),
('E070', 'P070', 'CINE_SV', 'E063', N'Nhân viên bán vé', N'Bán vé', 7000000, 1.0, '2025-07-05', N'Đang làm'),
('E071', 'P071', 'CINE_SV', 'E063', N'Nhân viên bán vé', N'Bán vé', 7000000, 1.0, '2025-09-20', N'Đang làm'),
('E072', 'P072', 'CINE_SV', 'E063', N'Nhân viên bán vé', N'Bán vé', 7000000, 1.0, '2025-12-15', N'Đang làm'),
('E073', 'P073', 'CINE_SV', 'E063', N'Nhân viên bán vé', N'Bán vé', 7000000, 1.0, '2026-02-10', N'Đang làm'),
('E074', 'P074', 'CINE_SV', 'E063', N'Nhân viên bán vé', N'Bán vé', 7000000, 1.0, '2026-03-25', N'Đang làm'),
('E075', 'P075', 'CINE_SV', 'E064', N'Nhân viên CSKH', N'Chăm sóc khách hàng', 7500000, 1.0, '2025-05-15', N'Đang làm'),
('E076', 'P076', 'CINE_SV', 'E064', N'Nhân viên CSKH', N'Chăm sóc khách hàng', 7500000, 1.0, '2025-08-20', N'Nghỉ phép'),
('E077', 'P077', 'CINE_SV', 'E064', N'Nhân viên CSKH', N'Chăm sóc khách hàng', 7500000, 1.0, '2025-11-10', N'Đang làm'),
('E078', 'P078', 'CINE_SV', 'E064', N'Nhân viên CSKH', N'Chăm sóc khách hàng', 7500000, 1.0, '2026-01-05', N'Đang làm'),
('E079', 'P079', 'CINE_SV', 'E064', N'Nhân viên CSKH', N'Chăm sóc khách hàng', 7500000, 1.0, '2026-02-15', N'Đang làm'),
('E080', 'P080', 'CINE_SV', 'E064', N'Nhân viên CSKH', N'Chăm sóc khách hàng', 7500000, 1.0, '2026-04-05', N'Đang làm'),


-- ĐỘI NGŨ RẠP CINE_VVK - Quản lý: E081

('E081', 'P081', 'CINE_VVK', NULL, N'Quản lý rạp', N'Vận hành', 20000000, 1.5, '2023-04-20', N'Đang làm'),
('E082', 'P082', 'CINE_VVK', 'E081', N'Trưởng ca Kỹ thuật', N'Kỹ thuật', 12500000, 1.2, '2024-03-10', N'Đang làm'),
('E083', 'P083', 'CINE_VVK', 'E081', N'Trưởng ca Bán vé', N'Bán vé', 10500000, 1.2, '2024-06-15', N'Đang làm'),
('E084', 'P084', 'CINE_VVK', 'E081', N'Trưởng ca CSKH', N'Chăm sóc khách hàng', 10500000, 1.2, '2024-10-05', N'Đang làm'),
('E085', 'P085', 'CINE_VVK', 'E082', N'Kỹ thuật viên', N'Kỹ thuật', 8200000, 1.0, '2025-02-25', N'Đang làm'),
('E086', 'P086', 'CINE_VVK', 'E082', N'Kỹ thuật viên', N'Kỹ thuật', 8200000, 1.0, '2025-05-20', N'Đang làm'),
('E087', 'P087', 'CINE_VVK', 'E082', N'Kỹ thuật viên', N'Kỹ thuật', 8200000, 1.0, '2025-08-10', N'Đang làm'),
('E088', 'P088', 'CINE_VVK', 'E082', N'Kỹ thuật viên', N'Kỹ thuật', 8200000, 1.0, '2025-12-15', N'Đang làm'),
('E089', 'P089', 'CINE_VVK', 'E083', N'Nhân viên bán vé', N'Bán vé', 7200000, 1.0, '2025-03-05', N'Đang làm'),
('E090', 'P090', 'CINE_VVK', 'E083', N'Nhân viên bán vé', N'Bán vé', 7200000, 1.0, '2025-06-10', N'Đang làm'),
('E091', 'P091', 'CINE_VVK', 'E083', N'Nhân viên bán vé', N'Bán vé', 7200000, 1.0, '2025-09-25', N'Nghỉ việc'),
('E092', 'P092', 'CINE_VVK', 'E083', N'Nhân viên bán vé', N'Bán vé', 7200000, 1.0, '2025-11-20', N'Đang làm'),
('E093', 'P093', 'CINE_VVK', 'E083', N'Nhân viên bán vé', N'Bán vé', 7200000, 1.0, '2026-01-10', N'Đang làm'),
('E094', 'P094', 'CINE_VVK', 'E083', N'Nhân viên bán vé', N'Bán vé', 7200000, 1.0, '2026-03-15', N'Đang làm'),
('E095', 'P095', 'CINE_VVK', 'E084', N'Nhân viên CSKH', N'Chăm sóc khách hàng', 7800000, 1.0, '2025-04-20', N'Đang làm'),
('E096', 'P096', 'CINE_VVK', 'E084', N'Nhân viên CSKH', N'Chăm sóc khách hàng', 7800000, 1.0, '2025-07-15', N'Đang làm'),
('E097', 'P097', 'CINE_VVK', 'E084', N'Nhân viên CSKH', N'Chăm sóc khách hàng', 7800000, 1.0, '2025-10-10', N'Đang làm'),
('E098', 'P098', 'CINE_VVK', 'E084', N'Nhân viên CSKH', N'Chăm sóc khách hàng', 7800000, 1.0, '2026-01-25', N'Đang làm'),
('E099', 'P099', 'CINE_VVK', 'E084', N'Nhân viên CSKH', N'Chăm sóc khách hàng', 7800000, 1.0, '2026-02-10', N'Đang làm'),
('E100', 'P100', 'CINE_VVK', 'E084', N'Nhân viên CSKH', N'Chăm sóc khách hàng', 7800000, 1.0, '2026-04-10', N'Đang làm');

-- CAP NHAT QUAN LY RAP SAU KHI EMPLOYEE DA CO DU LIEU
-- CẬP NHẬT QUẢN LÝ CHO 5 RẠP
UPDATE CINEMA SET ManagerID = 'E001' WHERE CinemaID = 'CINE_HBT';
UPDATE CINEMA SET ManagerID = 'E021' WHERE CinemaID = 'CINE_Q7';
UPDATE CINEMA SET ManagerID = 'E041' WHERE CinemaID = 'CINE_QT';
UPDATE CINEMA SET ManagerID = 'E061' WHERE CinemaID = 'CINE_SV';
UPDATE CINEMA SET ManagerID = 'E081' WHERE CinemaID = 'CINE_VVK';

-- SHIFT
-- Dữ liệu cho SHIFT

INSERT INTO SHIFT (ShiftID, ShiftType, ShiftStart, ShiftEnd, ShiftAllowance)
VALUES 
('S01', N'Sáng', '08:00:00', '12:00:00', 20000),
('S02', N'Chiều', '12:00:00', '16:00:00', 20000),
('S03', N'Tối', '16:00:00', '20:00:00', 50000),
('S04', N'Đêm', '20:00:00', '23:59:00', 80000);

-- DEPENDENT
-- ======================================================================
-- BẢNG 8: DEPENDENT (Người thân nhân viên) - ĐÃ FIX CHECK CONSTRAINT
-- InsuranceInfo: Chỉ nhận (N'Đang hưởng', N'Không hưởng')
-- ======================================================================
INSERT INTO DEPENDENT (DepName, DepDOB, EmployeeID, DepGender, Relationship, InsuranceInfo)
VALUES 
-- Người thân của E001 (Quản lý CINE_HBT)
(N'Nguyễn Thế Anh', '2018-05-12', 'E001', N'Nam', N'Con', N'Đang hưởng'),
(N'Trần Thị Mai', '1972-02-15', 'E001', N'Nữ', N'Mẹ', N'Đang hưởng'),

-- Người thân của E002
(N'Lý Vĩnh Phát', '2020-11-20', 'E002', N'Nam', N'Con', N'Đang hưởng'),

-- Người thân của E006 (Quản lý CINE_Q7)
(N'Nguyễn Thị Thu', '1995-11-11', 'E006', N'Nữ', N'Vợ', N'Không hưởng'),
(N'La Đặng Thành Vinh', '2022-01-05', 'E006', N'Nam', N'Con', N'Đang hưởng'),

-- Người thân của E010
(N'Trần Anh Tuấn', '1968-09-30', 'E010', N'Nam', N'Cha', N'Đang hưởng'),

-- Người thân của E021 (Quản lý CINE_QT)
(N'Nguyễn Thị Hồng', '1992-03-14', 'E021', N'Nữ', N'Vợ', N'Đang hưởng'),
(N'Đinh Ngọc Bảo', '2017-08-22', 'E021', N'Nam', N'Con', N'Đang hưởng'),

-- Người thân của E025
(N'Dương Trung Kiên', '2021-06-10', 'E025', N'Nam', N'Con', N'Đang hưởng'),

-- Người thân của E030
(N'Ngô Văn Hùng', '1960-01-01', 'E030', N'Nam', N'Cha', N'Đang hưởng'),
(N'Bùi Xuân Lan', '1963-12-25', 'E030', N'Nữ', N'Mẹ', N'Đang hưởng'),

-- Người thân của E041 (Quản lý CINE_SV)
(N'Trần Minh Khôi', '2019-04-30', 'E041', N'Nam', N'Con', N'Đang hưởng'),
(N'Lê Ngọc Diệp', '1996-07-21', 'E041', N'Nữ', N'Vợ', N'Không hưởng'),

-- Người thân của E045
(N'Phan Thành Công', '2022-09-15', 'E045', N'Nam', N'Con', N'Đang hưởng'),

-- Người thân của E050
(N'Phạm Thị Tuyết', '1975-05-05', 'E050', N'Nữ', N'Mẹ', N'Đang hưởng'),

-- Bổ sung đa dạng các nhân viên khác
(N'Lê Phước Bình', '2016-02-14', 'E011', N'Nam', N'Con', N'Đang hưởng'),
(N'Đỗ Sơn Tùng', '2020-03-03', 'E012', N'Nam', N'Con', N'Đang hưởng'),
(N'Tống Thị Mỹ', '1978-08-08', 'E013', N'Nữ', N'Mẹ', N'Đang hưởng'),
(N'Võ Thanh Sang', '2015-10-10', 'E014', N'Nam', N'Con', N'Đang hưởng'),
(N'Phan Thành Nhân', '2019-12-12', 'E015', N'Nam', N'Con', N'Đang hưởng'),
(N'Nguyễn Hữu Đạt', '2021-01-20', 'E017', N'Nam', N'Con', N'Đang hưởng'),
(N'Châu Ngọc Hà', '1998-05-05', 'E019', N'Nữ', N'Vợ', N'Không hưởng'),
(N'Nguyễn Thị Sen', '1973-07-07', 'E022', N'Nữ', N'Mẹ', N'Đang hưởng'),
(N'Trần Minh Tâm', '2020-09-09', 'E032', N'Nam', N'Con', N'Đang hưởng'),
(N'Đoàn Hữu Nghĩa', '2017-11-11', 'E033', N'Nam', N'Con', N'Đang hưởng'),
(N'Lê Thị Thảo', '1994-02-02', 'E036', N'Nữ', N'Vợ', N'Đang hưởng'),
(N'Nguyễn Minh Khang', '2022-04-04', 'E037', N'Nam', N'Con', N'Đang hưởng'),
(N'Quang Tuấn Tú', '2018-06-06', 'E038', N'Nam', N'Con', N'Đang hưởng'),
(N'Cao Hoàng Nam', '2020-08-08', 'E039', N'Nam', N'Con', N'Đang hưởng'),
(N'Lê Đình Bắc', '2015-10-10', 'E040', N'Nam', N'Con', N'Đang hưởng');

-- MOVIE CATALOG - BATCH 01
-- ============================================================
-- 1. THÊM DỮ LIỆU BẢNG GENRE (THỂ LOẠI)
-- ============================================================
INSERT INTO GENRE (GenreID, GenreName, GenreDesc) VALUES
('G_TC', N'Tình Cảm', N'Thể loại phim tập trung vào tình yêu và các mối quan hệ lãng mạn.'),
('G_TL', N'Tâm Lý (Drama)', N'Khai thác sâu vào nội tâm, mâu thuẫn và cảm xúc của nhân vật.'),
('G_ST', N'Sử Thi', N'Phim có bối cảnh lịch sử, thường mang quy mô hoành tráng.'),
('G_HH', N'Hồi Hộp', N'Tạo cảm giác căng thẳng, hồi hộp cho người xem.'),
('G_KD', N'Kinh Dị', N'Chứa các yếu tố đáng sợ, ma quái, rùng rợn.'),
('G_HAI', N'Hài', N'Mang lại tiếng cười và sự giải trí nhẹ nhàng.'),
('G_HOAT', N'Hoạt hình', N'Phim sử dụng kỹ xảo đồ họa máy tính hoặc vẽ tay.'),
('G_PL', N'Phiêu Lưu', N'Hành trình khám phá những vùng đất hoặc thử thách mới.');
GO

-- ============================================================
-- 2. THÊM DỮ LIỆU BẢNG MOVIE (PHIM)
-- ============================================================
INSERT INTO MOVIE (MovieID, VnTitle, OriginTitle, MovieDuration, MovieReleaseDate, MovieEndDate, AgeRating, Country, ProductionYear, MovieDesc, PosterTrailer, ReleaseStatus) VALUES
('M_001', N'Hẹn Em Ngày Nhật Thực', N'Hẹn Em Ngày Nhật Thực', 118, '2026-03-30', DATEADD(MONTH, 1, CAST('2026-03-30' AS DATE)), 'T16', N'Việt Nam', 2026,
N'Năm 1995, khi đang đứng trước một quyết định quan trọng của cuộc đời, Ân bất ngờ bị kéo trở lại quá khứ bởi những bức thư tình chưa từng trao tay. Hành trình tìm gặp Thiên - mối tình đầu từng khắc sâu trong tim - đưa cô về lại thôn xóm Trà Mây năm xưa...', 'https://www.youtube.com/watch?v=8fRszUyt_YQ', N'Đang chiếu'),

('M_002', N'Bẫy Tiền', N'Bẫy Tiền', 113, '2026-04-10', DATEADD(MONTH, 1, CAST('2026-04-10' AS DATE)), 'T16', N'Việt Nam', 2026,
N'Khi một vụ lừa đảo qua điện thoại bất ngờ ập đến, Đăng Thức tưởng chừng nắm trong tay cuộc sống ổn định bỗng bị cuốn vào vòng xoáy nguy hiểm giữa tiền bạc, tình thân và niềm tin.', 'https://www.youtube.com/watch?v=oRUSnFHQU2I', N'Đang chiếu'),

('M_003', N'Dưới Bóng Điện Hạ', N'The King''s Shadow', 117, '2026-04-10', DATEADD(MONTH, 1, CAST('2026-04-10' AS DATE)), 'T16', N'Hàn Quốc', 2026,
N'Lấy mốc năm 1457 dưới triều đại Joseon, Dưới Bóng Điện Hạ khắc họa số phận nghiệt ngã của vua Danjong - vị quân vương thứ sáu của triều đại. Lên ngôi khi tuổi đời còn non trẻ, Danjong nhanh chóng trở thành quân cờ trong vòng xoáy quyền lực...', 'https://www.youtube.com/watch?v=aPsEOR-WK6U', N'Đang chiếu'),

('M_004', N'Ta Khon Quỷ Đội Lốt Người', N'Phi Ta Khon', 99, '2026-04-10', DATEADD(MONTH, 1, CAST('2026-04-10' AS DATE)), 'T18', N'Thái Lan', 2026,
N'Khi ngôi nhà mới được xây trên mảnh đất của thần linh, gia đình Joi đã phải lập tức đối mặt với cơn thịnh nộ của Phi Ta Khon (Quỷ Đội Lốt Người). Để giải cứu chính mình và em gái khỏi lời nguyền, Joi quyết tâm lật mở sự thật.', 'https://www.youtube.com/watch?v=g6BumUNQl1U', N'Đang chiếu'),
('M_005', N'Song Hỷ Lâm Nguy', N'Song Hỷ Lâm Nguy', 113, '2026-04-03', DATEADD(MONTH, 1, CAST('2026-04-03' AS DATE)), 'T13', N'Việt Nam', 2026,
N'Hai lễ cưới, một sang trọng sa hoa, một đạm bạc dân dã, đáng lý sẽ được tổ chức đối diện nhau. Rắc rối bắt đầu khi đội ngũ tổ chức phát hiện ra danh sách khách mời của hai bên là giống nhau.', 'https://www.youtube.com/watch?v=tqaPZSVHff4', N'Đang chiếu'),

('M_006', N'Quỷ Dữ Từ Luyện Ngục', N'Hellish Evil', 101, '2026-04-10', DATEADD(MONTH, 1, CAST('2026-04-10' AS DATE)), 'T18', N'Thái Lan', 2026,
N'Kingkaew – một phụ nữ mắc bệnh tâm thần – bị kết án tử hình trong một vụ án chấn động dù luôn kêu oan. Sau khi chết, linh hồn cô quay lại nhà tù để báo thù, gieo rắc nỗi ám ảnh.', 'https://www.youtube.com/watch?v=KDp0mN0fDOw', N'Đang chiếu'),

('M_007', N'Trò Chơi Của Quỷ 2', N'Ready or Not 2', 108, '2026-04-10', DATEADD(MONTH, 1, CAST('2026-04-10' AS DATE)), 'T18', N'Hoa Kỳ', 2026,
N'Chỉ ít phút sau khi sống sót qua cuộc tấn công từ gia tộc Le Domas, Grace phát hiện mình đã bước sang cấp độ tiếp theo của trò chơi ác mộng - và lần này, cô có người em gái xa cách Faith đồng hành.', 'https://www.youtube.com/watch?v=tJqHUGqSqzE', N'Đang chiếu'),

('M_008', N'Cú Sốc', N'The Drama', 105, '2026-04-10', DATEADD(MONTH, 1, CAST('2026-04-10' AS DATE)), 'T18', N'Hoa Kỳ', 2026,
N'Chuyện tình hoàn hảo của Emma và Charlie bỗng vỡ vụn ngay trước thềm đám cưới. Một biến cố đen tối đột ngột ập đến bóc trần những dối trá kinh hoàng, đẩy cả hai vào mê cung của sự hoang mang.', 'https://www.youtube.com/watch?v=7btv5ZqHh7g', N'Đang chiếu'),

('M_009', N'Phim Super Mario Thiên Hà', N'Super Mario Galaxy', 99, '2026-04-01', DATEADD(MONTH, 1, CAST('2026-04-01' AS DATE)), 'P', N'Hoa Kỳ', 2026,
N'Anh em Mario và Luigi đã ở lại để giúp Công chúa Peach trông nom Vương Quốc Nấm, còn rùa phản diện Bowser thì bị thu nhỏ và nhốt trong tòa lâu đài đồ chơi. Kế hoạch giải cứu từ con trai Bowser đã mở ra cuộc phiêu lưu mới.', 'https://www.youtube.com/watch?v=LX9kXRRJlPw', N'Đang chiếu'),

('M_010', N'Ánh Dương Của Mẹ', N'Mother''s Sunshine', 135, '2026-04-03', DATEADD(MONTH, 1, CAST('2026-04-03' AS DATE)), 'T13', N'Đài Loan', 2026,
N'Trong không gian ngột ngạt của một nhà tù nữ, một mầm sống mới đã nảy mầm: một bé gái chào đời giữa tiếng hát mừng sinh nhật và vòng tay của bốn nữ tù nhân...', 'https://www.youtube.com/watch?v=CT_CETdvEKQ', N'Đang chiếu');
GO

-- ============================================================
-- 3. THÊM DỮ LIỆU BẢNG MOVIEGENRE (PHÂN LOẠI PHIM)
-- ============================================================
INSERT INTO MOVIE_GENRE (MovieID, GenreID) VALUES
('M_001', 'G_TC'),   -- Hẹn Em Ngày Nhật Thực: Tình Cảm
('M_002', 'G_TL'),   -- Bẫy Tiền: Drama
('M_003', 'G_ST'),   -- Dưới Bóng Điện Hạ: Sử Thi
('M_004', 'G_HH'),   -- Ta Khon: Hồi Hộp
('M_004', 'G_KD'),   -- Ta Khon: Kinh Dị
('M_005', 'G_TC'),   -- Song Hỷ Lâm Nguy: Tình Cảm
('M_005', 'G_HAI'),  -- Song Hỷ Lâm Nguy: Hài
('M_006', 'G_KD'),   -- Quỷ Dữ Từ Luyện Ngục: Kinh Dị
('M_007', 'G_KD'),   -- Trò Chơi Của Quỷ 2: Kinh Dị
('M_008', 'G_TC'),   -- Cú Sốc: Tình Cảm
('M_008', 'G_HAI'),  -- Cú Sốc: Hài
('M_009', 'G_HOAT'), -- Super Mario: Hoạt Hình
('M_009', 'G_PL'),   -- Super Mario: Phiêu Lưu
('M_010', 'G_TL');   -- Ánh Dương Của Mẹ: Drama
GO

-- ============================================================
-- 4. THÊM DỮ LIỆU BẢNG DIRECTOR (ĐẠO DIỄN)
-- ============================================================
INSERT INTO DIRECTOR (DirectorID, DirectorName, DirectorNationality) VALUES
('D_001', N'Lê Thiện Viễn', N'Việt Nam'),
('D_002', N'Oscar Dương', N'Việt Nam'),
('D_003', N'Chang Hang-jun', N'Hàn Quốc'),
('D_004', N'Puwadon Naosopa', N'Thái Lan'),
('D_005', N'Vũ Hà', N'Việt Nam'),
('D_006', N'Ekkachai Srivichai', N'Thái Lan'),
('D_007', N'Matt Bettinelli-Olpin', N'Hoa Kỳ'),
('D_008', N'Tyler Gillett', N'Hoa Kỳ'),
('D_009', N'Kristoffer Borgli', N'Hoa Kỳ'),
('D_010', N'Aaron Horvath', N'Hoa Kỳ'),
('D_011', N'Gavin LIN', N'Đài Loan');
GO

-- ============================================================
-- 5. THÊM DỮ LIỆU BẢNG MOVIEDIRECTOR 
-- ============================================================
INSERT INTO MOVIE_DIRECTOR (MovieID, DirectorID) VALUES
('M_001', 'D_001'),
('M_002', 'D_002'),
('M_003', 'D_003'),
('M_004', 'D_004'),
('M_005', 'D_005'),
('M_006', 'D_006'),
('M_007', 'D_007'),
('M_007', 'D_008'), -- Phim có 2 đạo diễn
('M_008', 'D_009'),
('M_009', 'D_010'),
('M_010', 'D_011');
GO

-- ============================================================
-- 6. THÊM MỘT SỐ DIỄN VIÊN ĐIỂN HÌNH (ACTOR) & PHÂN VAI
-- ============================================================
INSERT INTO ACTOR (ActorID, ActorName, ActorNationality) VALUES
('A_001', N'Đoàn Thiên Ân', N'Việt Nam'),
('A_002', N'Khương Lê', N'Việt Nam'),
('A_003', N'Liên Bỉnh Phát', N'Việt Nam'),
('A_004', N'Tam Triều Dâng', N'Việt Nam'),
('A_005', N'Park Ji-hoon', N'Hàn Quốc'),
('A_006', N'Dustin Nguyễn', N'Việt Nam'),
('A_007', N'Zendaya', N'Hoa Kỳ'),
('A_008', N'Robert Pattinson', N'Anh Quốc');
GO

INSERT INTO MOVIE_ACTOR (MovieID, ActorID, RoleName) VALUES
('M_001', 'A_001', N'Ân'),
('M_001', 'A_002', N'Thiên'),
('M_002', 'A_003', N'Đăng Thức'),
('M_002', 'A_004', NULL),
('M_003', 'A_005', N'Vua Danjong'),
('M_005', 'A_006', NULL),
('M_008', 'A_007', N'Emma'),
('M_008', 'A_008', N'Charlie');
GO

-- MOVIE CATALOG - BATCH 02 (BO SUNG, KHONG TRUNG ID)
-- ============================================================
-- 1. BỔ SUNG THỂ LOẠI MỚI (NẾU CẦN) VÀ PHIM MỚI TỪ ẢNH
-- ============================================================
INSERT INTO GENRE (GenreID, GenreName, GenreDesc) VALUES
('G_HD', N'Hành Động', N'Chứa các pha hành động kịch tính, đua xe, võ thuật.'),
('G_GD', N'Gia đình', N'Phim phù hợp cho cả gia đình cùng xem.');


INSERT INTO MOVIE (MovieID, VnTitle, OriginTitle, MovieDuration, MovieReleaseDate, MovieEndDate, AgeRating, Country, ProductionYear, MovieDesc, PosterTrailer, ReleaseStatus) VALUES
('M_011', N'Phi Vụ Cuối Cùng', N'The Last Heist', 113, '2026-04-10', DATEADD(MONTH, 1, CAST('2026-04-10' AS DATE)), 'T18', N'Hoa Kỳ', 2026, N'Một phi vụ thế kỷ đánh cược bằng cả mạng sống.', 'https://www.youtube.com/watch?v=RvAlik264To', N'Đang chiếu'),
('M_012', N'Cú Nhảy Kỳ Diệu', N'Magic Jump', 105, '2026-04-10', DATEADD(MONTH, 1, CAST('2026-04-10' AS DATE)), 'P', N'Khác', 2026, N'Hành trình diệu kỳ của những nhân vật dễ thương.', 'https://www.youtube.com/watch?v=mRSpJwMp6LM', N'Đang chiếu'),
('M_013', N'Quỷ Nhập Tràng 2', N'Quỷ Nhập Tràng 2', 126, '2026-04-10', DATEADD(MONTH, 1, CAST('2026-04-10' AS DATE)), 'T18', N'Việt Nam', 2026, N'Cơn ác mộng kinh hoàng trở lại vùng quê hẻo lánh.', 'https://www.youtube.com/watch?v=zO18gS2BDfw', N'Đang chiếu');


INSERT INTO MOVIE_GENRE (MovieID, GenreID) VALUES
('M_011', 'G_HD'), ('M_011', 'G_TL'),
('M_012', 'G_HOAT'), ('M_012', 'G_HAI'), ('M_012', 'G_GD'), ('M_012', 'G_PL'),
('M_013', 'G_KD');

-- MOVIE SUPPORTED FORMAT
-- ============================================================
-- 1. THÊM DỮ LIỆU BẢNG MOVIESUPPORTEDFORMAT
-- Định nghĩa các chuẩn màn hình mà phim hỗ trợ (2D, 3D, IMAX...)
-- ============================================================
INSERT INTO MOVIE_SUPPORTED_FORMAT (MovieID, SupportedFormat) VALUES
('M_001', '2D'),
('M_002', '2D'),
('M_003', '2D'),
('M_004', '2D'), ('M_004', 'IMAX'), -- Ta Khon hỗ trợ chiếu cả IMAX
('M_005', '2D'),
('M_006', '2D'), ('M_006', 'IMAX'),
('M_007', '2D'), ('M_007', '4DX'),  -- Phim hành động/kinh dị hỗ trợ 4DX
('M_008', '2D'),
('M_009', '2D'), ('M_009', 'IMAX'), ('M_009', '3D'), -- Hoạt hình Mario đa định dạng
('M_010', '2D'),
('M_011', '2D'), ('M_011', 'IMAX'),
('M_012', '2D'), ('M_012', 'IMAX'),
('M_013', '2D'), ('M_013', 'IMAX');
GO

-- PRICING POLICY
-- ============================================================
-- 2. THÊM DỮ LIỆU BẢNG PRICINGPOLICY (CHÍNH SÁCH GIÁ VÉ)
-- ============================================================
INSERT INTO PRICING_POLICY (PolicyID, DayType, TimeFrame, TargetAudience, PriceMultiplier, ValidFrom, ValidTo) VALUES
-- Chính sách giá vé Ngày thường (Base price x 1.0)
('POL_NORMAL', N'Thường', N'Cả ngày', N'Khách hàng phổ thông', 1.00, '2026-01-01', '2026-12-31'),

-- Chính sách giá vé Sinh viên / Học sinh giảm giá (Base price x 0.8)
('POL_STUDENT', N'Thường', N'Trước 17:00', N'Học sinh - Sinh viên (U22)', 0.80, '2026-01-01', '2026-12-31'),

-- Chính sách giá vé Cuối tuần phụ thu thêm 20% (Base price x 1.2)
('POL_WEEKEND', N'Cuối tuần', N'Cả ngày', N'Khách hàng phổ thông', 1.20, '2026-01-01', '2026-12-31'),

-- Chính sách giá Lễ/Tết phụ thu thêm 50% (Base price x 1.5)
('POL_HOLIDAY', N'Ngày lễ', N'Cả ngày', N'Tất cả khách hàng', 1.50, '2026-04-30', '2026-05-02');
GO

-- ROOM / ROOM SUPPORTED SCREEN - CINE_QT
-- ============================================================
-- 2. TẠO DỮ LIỆU PHÒNG CHIẾU (ROOM) CHO RẠP QUỐC THANH
-- ============================================================
-- Phòng 1-7 là Standard, Phòng 8-9 là Deluxe
;WITH RoomSeed AS (
    SELECT *
    FROM (VALUES
        ('R01', 'CINE_QT', N'Standard', N'Dolby Atmos', 120, N'Sẵn sàng'),
        ('R02', 'CINE_QT', N'Standard', N'Dolby Atmos', 120, N'Sẵn sàng'),
        ('R03', 'CINE_QT', N'Standard', N'Dolby Atmos', 100, N'Sẵn sàng'),
        ('R04', 'CINE_QT', N'Standard', N'Dolby 7.1', 100, N'Sẵn sàng'),
        ('R05', 'CINE_QT', N'Standard', N'Dolby 7.1', 80, N'Sẵn sàng'),
        ('R06', 'CINE_QT', N'Standard', N'Dolby 7.1', 80, N'Sẵn sàng'),
        ('R07', 'CINE_QT', N'Standard', N'Dolby 7.1', 80, N'Sẵn sàng'),
        ('R08', 'CINE_QT', N'Deluxe', N'IMAX Laser', 150, N'Sẵn sàng'),
        ('R09', 'CINE_QT', N'Deluxe', N'IMAX Laser', 150, N'Sẵn sàng')
    ) v (RoomNumber, CinemaID, RoomType, AudioSystem, MaxCapacity, RoomTechStatus)
),
NumberSequence AS (
    SELECT 1 AS SeatNum
    UNION ALL
    SELECT SeatNum + 1
    FROM NumberSequence
    WHERE SeatNum < 150
)
INSERT INTO ROOM (RoomNumber, CinemaID, RoomType, AudioSystem, MaxCapacity, RoomTechStatus, SeatLayout)
SELECT
    rs.RoomNumber,
    rs.CinemaID,
    rs.RoomType,
    rs.AudioSystem,
    rs.MaxCapacity,
    rs.RoomTechStatus,
    (
        SELECT
            rs.RoomNumber AS roomNumber,
            rs.CinemaID AS cinemaID,
            rs.MaxCapacity AS maxCapacity,
            JSON_QUERY((
                SELECT
                    'A' AS rowStart,
                    'O' AS rowEnd,
                    1 AS columnStart,
                    10 AS columnEnd
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            )) AS coordinateSystem,
            JSON_QUERY((
                SELECT
                    CHAR(64 + ((n.SeatNum - 1) / 10) + 1) AS [row],
                    ((n.SeatNum - 1) % 10) + 1 AS [number],
                    CASE
                        WHEN n.SeatNum > (rs.MaxCapacity - 20) THEN N'VIP'
                        ELSE N'Thường'
                    END AS seatType,
                    CASE
                        WHEN rs.RoomNumber = 'R01'
                         AND rs.CinemaID = 'CINE_QT'
                         AND CHAR(64 + ((n.SeatNum - 1) / 10) + 1) = 'A'
                         AND ((n.SeatNum - 1) % 10) + 1 IN (1, 10)
                            THEN N'Hỏng'
                        ELSE N'Hoạt động'
                    END AS seatStatus,
                    CAST(
                        CASE
                            WHEN n.SeatNum > (rs.MaxCapacity - 20) THEN 1.20
                            ELSE 1.00
                        END AS DECIMAL(5,2)
                    ) AS surchargeMultiplier,
                    N'Khu trung tâm' AS zone
                FROM NumberSequence n
                WHERE n.SeatNum <= rs.MaxCapacity
                ORDER BY n.SeatNum
                FOR JSON PATH
            )) AS seats
        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
    ) AS SeatLayout
FROM RoomSeed rs
OPTION (MAXRECURSION 150);
INSERT INTO ROOM_SUPPORTED_SCREEN (RoomNumber, CinemaID, ScreenType) VALUES
('R01', 'CINE_QT', '2D'), ('R02', 'CINE_QT', '2D'),
('R03', 'CINE_QT', '2D'), ('R04', 'CINE_QT', '2D'),
('R05', 'CINE_QT', '2D'), ('R06', 'CINE_QT', '2D'),
('R07', 'CINE_QT', '2D'),
('R08', 'CINE_QT', 'IMAX'), ('R09', 'CINE_QT', 'IMAX');

-- ROOM / ROOM SUPPORTED SCREEN - CINE_SV
-- ============================================================
-- 1. TẠO DỮ LIỆU PHÒNG CHIẾU CHO RẠP MOVIETICKET SINH VIÊN (CINE_SV)
-- ============================================================
;WITH RoomSeed AS (
    SELECT *
    FROM (VALUES
        ('R_SV_01', 'CINE_SV', N'Standard', N'Dolby 7.1', 120, N'Sẵn sàng'),
        ('R_SV_02', 'CINE_SV', N'Standard', N'Dolby 7.1', 120, N'Sẵn sàng'),
        ('R_SV_03', 'CINE_SV', N'Standard', N'Dolby 7.1', 100, N'Sẵn sàng'),
        ('R_SV_04', 'CINE_SV', N'Standard', N'Dolby 7.1', 100, N'Sẵn sàng'),
        ('R_SV_05', 'CINE_SV', N'Standard', N'Dolby 7.1', 80, N'Sẵn sàng')
    ) v (RoomNumber, CinemaID, RoomType, AudioSystem, MaxCapacity, RoomTechStatus)
),
NumberSequence AS (
    SELECT 1 AS SeatNum
    UNION ALL
    SELECT SeatNum + 1
    FROM NumberSequence
    WHERE SeatNum < 150
)
INSERT INTO ROOM (RoomNumber, CinemaID, RoomType, AudioSystem, MaxCapacity, RoomTechStatus, SeatLayout)
SELECT
    rs.RoomNumber,
    rs.CinemaID,
    rs.RoomType,
    rs.AudioSystem,
    rs.MaxCapacity,
    rs.RoomTechStatus,
    (
        SELECT
            rs.RoomNumber AS roomNumber,
            rs.CinemaID AS cinemaID,
            rs.MaxCapacity AS maxCapacity,
            JSON_QUERY((
                SELECT
                    'A' AS rowStart,
                    'O' AS rowEnd,
                    1 AS columnStart,
                    10 AS columnEnd
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            )) AS coordinateSystem,
            JSON_QUERY((
                SELECT
                    CHAR(64 + ((n.SeatNum - 1) / 10) + 1) AS [row],
                    ((n.SeatNum - 1) % 10) + 1 AS [number],
                    CASE
                        WHEN n.SeatNum > (rs.MaxCapacity - 20) THEN N'VIP'
                        ELSE N'Thường'
                    END AS seatType,
                    N'Hoạt động' AS seatStatus,
                    CAST(
                        CASE
                            WHEN n.SeatNum > (rs.MaxCapacity - 20) THEN 1.20
                            ELSE 1.00
                        END AS DECIMAL(5,2)
                    ) AS surchargeMultiplier,
                    N'Khu trung tâm' AS zone
                FROM NumberSequence n
                WHERE n.SeatNum <= rs.MaxCapacity
                ORDER BY n.SeatNum
                FOR JSON PATH
            )) AS seats
        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
    ) AS SeatLayout
FROM RoomSeed rs
OPTION (MAXRECURSION 150);
GO

-- Gắn định dạng màn hình 2D cho toàn bộ phòng rạp Sinh Viên
INSERT INTO ROOM_SUPPORTED_SCREEN (RoomNumber, CinemaID, ScreenType) VALUES
('R_SV_01', 'CINE_SV', '2D'),
('R_SV_02', 'CINE_SV', '2D'),
('R_SV_03', 'CINE_SV', '2D'),
('R_SV_04', 'CINE_SV', '2D'),
('R_SV_05', 'CINE_SV', '2D');
GO

-- ROOM / ROOM SUPPORTED SCREEN - CINE_VVK / CINE_HBT / CINE_Q7
-- ============================================================
-- 1. TẠO PHÒNG CHIẾU (ROOM) & SCREEN CHO CÁC RẠP CÒN LẠI
-- ============================================================
-- Rạp Võ Văn Kiệt (CINE_VVK): 5 phòng Standard
;WITH RoomSeed AS (
    SELECT *
    FROM (VALUES
        ('R_VVK_01', 'CINE_VVK', N'Standard', N'Dolby 7.1', 100, N'Sẵn sàng'),
        ('R_VVK_02', 'CINE_VVK', N'Standard', N'Dolby 7.1', 100, N'Sẵn sàng'),
        ('R_VVK_03', 'CINE_VVK', N'Standard', N'Dolby 7.1', 100, N'Sẵn sàng'),
        ('R_VVK_04', 'CINE_VVK', N'Standard', N'Dolby 7.1', 80, N'Sẵn sàng'),
        ('R_VVK_05', 'CINE_VVK', N'Standard', N'Dolby 7.1', 80, N'Sẵn sàng'),
        ('R_HBT_01', 'CINE_HBT', N'Standard', N'Dolby Atmos', 120, N'Sẵn sàng'),
        ('R_HBT_02', 'CINE_HBT', N'Standard', N'Dolby Atmos', 120, N'Sẵn sàng'),
        ('R_HBT_03', 'CINE_HBT', N'Standard', N'Dolby Atmos', 100, N'Sẵn sàng'),
        ('R_HBT_04', 'CINE_HBT', N'Deluxe', N'IMAX Laser', 150, N'Sẵn sàng'),
        ('R_HBT_05', 'CINE_HBT', N'Deluxe', N'IMAX Laser', 150, N'Sẵn sàng'),
        ('R_Q7_01', 'CINE_Q7', N'Standard', N'Dolby 7.1', 100, N'Sẵn sàng'),
        ('R_Q7_02', 'CINE_Q7', N'Standard', N'Dolby 7.1', 100, N'Sẵn sàng'),
        ('R_Q7_03', 'CINE_Q7', N'Standard', N'Dolby 7.1', 100, N'Sẵn sàng'),
        ('R_Q7_04', 'CINE_Q7', N'Standard', N'Dolby 7.1', 100, N'Sẵn sàng'),
        ('R_Q7_05', 'CINE_Q7', N'Standard', N'Dolby 7.1', 100, N'Sẵn sàng')
    ) v (RoomNumber, CinemaID, RoomType, AudioSystem, MaxCapacity, RoomTechStatus)
),
NumberSequence AS (
    SELECT 1 AS SeatNum
    UNION ALL
    SELECT SeatNum + 1
    FROM NumberSequence
    WHERE SeatNum < 150
)
INSERT INTO ROOM (RoomNumber, CinemaID, RoomType, AudioSystem, MaxCapacity, RoomTechStatus, SeatLayout)
SELECT
    rs.RoomNumber,
    rs.CinemaID,
    rs.RoomType,
    rs.AudioSystem,
    rs.MaxCapacity,
    rs.RoomTechStatus,
    (
        SELECT
            rs.RoomNumber AS roomNumber,
            rs.CinemaID AS cinemaID,
            rs.MaxCapacity AS maxCapacity,
            JSON_QUERY((
                SELECT
                    'A' AS rowStart,
                    'O' AS rowEnd,
                    1 AS columnStart,
                    10 AS columnEnd
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            )) AS coordinateSystem,
            JSON_QUERY((
                SELECT
                    CHAR(64 + ((n.SeatNum - 1) / 10) + 1) AS [row],
                    ((n.SeatNum - 1) % 10) + 1 AS [number],
                    CASE
                        WHEN n.SeatNum > (rs.MaxCapacity - 20) THEN N'VIP'
                        ELSE N'Thường'
                    END AS seatType,
                    N'Hoạt động' AS seatStatus,
                    CAST(
                        CASE
                            WHEN n.SeatNum > (rs.MaxCapacity - 20) THEN 1.20
                            ELSE 1.00
                        END AS DECIMAL(5,2)
                    ) AS surchargeMultiplier,
                    N'Khu trung tâm' AS zone
                FROM NumberSequence n
                WHERE n.SeatNum <= rs.MaxCapacity
                ORDER BY n.SeatNum
                FOR JSON PATH
            )) AS seats
        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
    ) AS SeatLayout
FROM RoomSeed rs
OPTION (MAXRECURSION 150);
INSERT INTO ROOM_SUPPORTED_SCREEN (RoomNumber, CinemaID, ScreenType) VALUES
('R_VVK_01', 'CINE_VVK', '2D'), ('R_VVK_02', 'CINE_VVK', '2D'), ('R_VVK_03', 'CINE_VVK', '2D'), ('R_VVK_04', 'CINE_VVK', '2D'), ('R_VVK_05', 'CINE_VVK', '2D'),
('R_HBT_01', 'CINE_HBT', '2D'), ('R_HBT_02', 'CINE_HBT', '2D'), ('R_HBT_03', 'CINE_HBT', '2D'), ('R_HBT_04', 'CINE_HBT', 'IMAX'), ('R_HBT_05', 'CINE_HBT', 'IMAX'),
('R_Q7_01', 'CINE_Q7', '2D'), ('R_Q7_02', 'CINE_Q7', '2D'), ('R_Q7_03', 'CINE_Q7', '2D'), ('R_Q7_04', 'CINE_Q7', '2D'), ('R_Q7_05', 'CINE_Q7', '2D');

-- SEAT - CANONICAL SEED BLOCK
-- NOTE: Day la batch SEAT chuan duoc giu lai tu nguon goc. Batch trung lap duoc dua xuong TEST / DEMO o cuoi file.
-- ============================================================
-- Seed SEAT truc tiep tu ROOM.SeatLayout JSON de dam bao dong bo 1-1 voi so do ghe cua tung phong.
-- Hai ghe A1 va A10 cua phong R01 / CINE_QT da duoc danh dau Hong ngay trong JSON seed.
-- ============================================================
INSERT INTO SEAT (RowIndex, ColumnNumber, RoomNumber, CinemaID, SeatType, SeatStatus, SurchargeMultiplier, Zone)
SELECT
    JSON_VALUE(js.value, '$.row') AS RowIndex,
    TRY_CONVERT(INT, JSON_VALUE(js.value, '$.number')) AS ColumnNumber,
    r.RoomNumber,
    r.CinemaID,
    JSON_VALUE(js.value, '$.seatType') AS SeatType,
    JSON_VALUE(js.value, '$.seatStatus') AS SeatStatus,
    TRY_CONVERT(DECIMAL(5,2), JSON_VALUE(js.value, '$.surchargeMultiplier')) AS SurchargeMultiplier,
    JSON_VALUE(js.value, '$.zone') AS Zone
FROM ROOM r
CROSS APPLY OPENJSON(r.SeatLayout, '$.seats') js;
GO
-- ==============================================================================================
-- SECTION 06 - SEED TRANSACTIONAL DATA
-- ==============================================================================================
-- CONTRACT / EVENT duoc seed truoc SESSION de dam bao trigger kiem tra hieu luc hop dong.

-- CONTRACT
-- ======================================================================
-- BẢNG 9: CONTRACT (Thời hạn ngắn hạn chuẩn Event)
-- ======================================================================
INSERT INTO CONTRACT (ContractNumber, OrganizerID, CinemaID, SignDate, EffectiveDate, TerminationDate, ContractValue, PaymentMethod, Terms)
VALUES 
('HD001', 'ORG001', 'CINE_HBT', '2026-03-20', '2026-04-15', '2026-04-30', 250000000, N'Chuyển khoản', N'Thuê sảnh và phòng chiếu ra mắt phim Marvel'),
('HD002', 'ORG002', 'CINE_Q7',  '2026-04-01', '2026-05-05', '2026-05-15', 150000000, N'Chuyển khoản', N'Trải nghiệm công nghệ VR Apple Vision Pro'),
('HD003', 'ORG003', 'CINE_QT',  '2026-05-01', '2026-06-05', '2026-06-20', 120000000, N'Chuyển khoản', N'Watch Party Valorant Champions 2026'),
('HD004', 'ORG004', 'CINE_SV',  '2026-03-15', '2026-04-20', '2026-04-25', 80000000, N'Tiền mặt', N'Hội nghị AI & Robotics Vietnam'),
('HD005', 'ORG005', 'CINE_VVK', '2026-05-10', '2026-06-01', '2026-06-10', 300000000, N'Chuyển khoản', N'Showcase tuyển chọn K-Pop Global'),
('HD006', 'ORG006', 'CINE_HBT', '2026-04-15', '2026-05-18', '2026-05-25', 100000000, N'Chuyển khoản', N'Triển lãm NFT Art & Digital'),
('HD007', 'ORG007', 'CINE_Q7',  '2026-05-20', '2026-06-12', '2026-06-18', 40000000, N'Tiền mặt', N'Offline cộng đồng game thủ HoYoverse'),
('HD008', 'ORG008', 'CINE_QT',  '2026-06-01', '2026-06-25', '2026-07-05', 180000000, N'Chuyển khoản', N'Trình diễn thời trang công nghệ in 3D'),
('HD009', 'ORG009', 'CINE_SV',  '2026-07-01', '2026-08-05', '2026-08-20', 500000000, N'Chuyển khoản', N'Sự kiện ra mắt xe điện thông minh Tesla'),
('HD010', 'ORG010', 'CINE_VVK', '2026-03-25', '2026-04-12', '2026-04-18', 35000000, N'Tiền mặt', N'Hòa nhạc phim Studio Ghibli');

-- EVENT
-- ======================================================================
-- BẢNG 6: EVENT (Thời gian diễn ra sát thực tế)
-- ======================================================================
INSERT INTO EVENT (EventID, OrganizerID, EventName, EventDesc, EventStartDate, EventEndDate, ExpectedScale, TotalBudget, EventStatus)
VALUES 
('EV001', 'ORG001', N'Marvel Multiverse Night', N'Công chiếu bom tấn và giao lưu fan', '2026-04-20', '2026-04-21', 500, 100000000, N'Đã duyệt'),
('EV002', 'ORG002', N'Spatial Cinema Experience', N'Xem phim 8K với kính thực tế ảo', '2026-05-10', '2026-05-12', 200, 50000000, N'Đã duyệt'),
('EV003', 'ORG003', N'Valorant Champions Hype', N'Tiệc xem chung Chung kết Thế giới', '2026-06-12', '2026-06-15', 300, 40000000, N'Đã duyệt'),
('EV004', 'ORG004', N'Vietnam AI Day 2026', N'Trình diễn giải pháp AI mới nhất', '2026-04-22', '2026-04-23', 400, 30000000, N'Đã duyệt'),
('EV005', 'ORG005', N'K-Pop Trainee Showcase', N'Biểu diễn tuyển chọn thực tập sinh', '2026-06-05', '2026-06-07', 800, 150000000, N'Đã duyệt'),
('EV006', 'ORG006', N'Cyberpunk NFT Gallery', N'Không gian triển lãm nghệ thuật số', '2026-05-20', '2026-05-22', 150, 25000000, N'Đã duyệt'),
('EV007', 'ORG007', N'Teyvat Journey Offline', N'Ngày hội cộng đồng Genshin Impact', '2026-06-15', '2026-06-15', 1000, 20000000, N'Đã duyệt'),
('EV008', 'ORG008', N'Future Fashion Show', N'Trình diễn thời trang công nghệ', '2026-07-01', '2026-07-02', 400, 80000000, N'Đã duyệt'),
('EV009', 'ORG009', N'Tesla Future Drive', N'Lễ ra mắt dòng xe điện thông minh', '2026-08-10', '2026-08-15', 1200, 200000000, N'Đã duyệt'),
('EV010', 'ORG010', N'Ghibli Magic Melodies', N'Hòa nhạc các bản nhạc phim huyền thoại', '2026-04-15', '2026-04-15', 300, 15000000, N'Đã duyệt');

-- SHOWTIME - CINE_QT
-- ============================================================
-- 3. THÊM LỊCH CHIẾU (SHOWTIME) - Lấy mốc ngày 10/04/2026
-- Đã tính toán phân bổ phòng hợp lý, chừa đủ 15p dọn phòng
-- ============================================================
INSERT INTO SHOWTIME (ShowtimeID, MovieID, RoomNumber, CinemaID, PolicyID, ShowStartTime, BasePrice, ShowLanguage, ShowFormat, ShowStatus) VALUES
-- DƯỚI BÓNG ĐIỆN HẠ (T16) - M_003 | Standard (2D) | Phụ đề
('ST_QT_001', 'M_003', 'R01', 'CINE_QT', NULL, '2026-04-10 09:00:00', 80000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_QT_002', 'M_003', 'R02', 'CINE_QT', NULL, '2026-04-10 10:30:00', 80000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_QT_003', 'M_003', 'R01', 'CINE_QT', NULL, '2026-04-10 11:30:00', 80000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_QT_004', 'M_003', 'R02', 'CINE_QT', NULL, '2026-04-10 13:00:00', 80000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_QT_005', 'M_003', 'R01', 'CINE_QT', NULL, '2026-04-10 14:00:00', 80000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_QT_006', 'M_003', 'R02', 'CINE_QT', NULL, '2026-04-10 15:30:00', 80000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_QT_007', 'M_003', 'R01', 'CINE_QT', NULL, '2026-04-10 16:30:00', 80000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_QT_008', 'M_003', 'R02', 'CINE_QT', NULL, '2026-04-10 18:00:00', 80000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_QT_009', 'M_003', 'R01', 'CINE_QT', NULL, '2026-04-10 19:00:00', 80000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_QT_010', 'M_003', 'R02', 'CINE_QT', NULL, '2026-04-10 20:30:00', 80000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_QT_011', 'M_003', 'R01', 'CINE_QT', NULL, '2026-04-10 21:15:00', 80000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_QT_012', 'M_003', 'R02', 'CINE_QT', NULL, '2026-04-10 23:00:00', 80000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_QT_013', 'M_003', 'R01', 'CINE_QT', NULL, '2026-04-10 23:45:00', 80000, N'Phụ đề Việt', '2D', N'Mở bán'),

-- BẪY TIỀN (T16) - M_002 | Standard (2D) | Phim VN (Lồng tiếng)
('ST_QT_014', 'M_002', 'R03', 'CINE_QT', NULL, '2026-04-10 08:30:00', 80000, N'Lồng tiếng', '2D', N'Mở bán'),
('ST_QT_015', 'M_002', 'R03', 'CINE_QT', NULL, '2026-04-10 11:00:00', 80000, N'Lồng tiếng', '2D', N'Mở bán'),
('ST_QT_016', 'M_002', 'R03', 'CINE_QT', NULL, '2026-04-10 13:30:00', 80000, N'Lồng tiếng', '2D', N'Mở bán'),
('ST_QT_017', 'M_002', 'R03', 'CINE_QT', NULL, '2026-04-10 16:00:00', 80000, N'Lồng tiếng', '2D', N'Mở bán'),
('ST_QT_018', 'M_002', 'R03', 'CINE_QT', NULL, '2026-04-10 18:30:00', 80000, N'Lồng tiếng', '2D', N'Mở bán'),
('ST_QT_019', 'M_002', 'R03', 'CINE_QT', NULL, '2026-04-10 20:45:00', 80000, N'Lồng tiếng', '2D', N'Mở bán'),
('ST_QT_020', 'M_002', 'R03', 'CINE_QT', NULL, '2026-04-10 23:10:00', 80000, N'Lồng tiếng', '2D', N'Mở bán'),

-- PHI VỤ CUỐI CÙNG (T18) - M_011 | Standard (2D) | Phụ đề
('ST_QT_021', 'M_011', 'R05', 'CINE_QT', NULL, '2026-04-10 11:50:00', 80000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_QT_022', 'M_011', 'R05', 'CINE_QT', NULL, '2026-04-10 14:30:00', 80000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_QT_023', 'M_011', 'R05', 'CINE_QT', NULL, '2026-04-10 18:20:00', 80000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_QT_024', 'M_011', 'R06', 'CINE_QT', NULL, '2026-04-10 18:50:00', 80000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_QT_025', 'M_011', 'R06', 'CINE_QT', NULL, '2026-04-10 23:20:00', 80000, N'Phụ đề Việt', '2D', N'Mở bán'),

-- ÁNH DƯƠNG CỦA MẸ (T13) - M_010 | Standard (2D) | Phụ đề
('ST_QT_026', 'M_010', 'R04', 'CINE_QT', NULL, '2026-04-10 08:00:00', 80000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_QT_027', 'M_010', 'R04', 'CINE_QT', NULL, '2026-04-10 12:20:00', 80000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_QT_028', 'M_010', 'R04', 'CINE_QT', NULL, '2026-04-10 16:50:00', 80000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_QT_029', 'M_010', 'R04', 'CINE_QT', NULL, '2026-04-10 21:30:00', 80000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_QT_030', 'M_010', 'R05', 'CINE_QT', NULL, '2026-04-10 23:40:00', 80000, N'Phụ đề Việt', '2D', N'Mở bán'),

-- TA KHON QUỶ ĐỘI LỐT NGƯỜI (T18) - M_004 | Standard & Deluxe | Phụ đề
('ST_QT_031', 'M_004', 'R07', 'CINE_QT', NULL, '2026-04-10 09:50:00', 80000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_QT_032', 'M_004', 'R08', 'CINE_QT', NULL, '2026-04-10 22:00:00', 120000, N'Phụ đề Việt', 'IMAX', N'Mở bán'),
('ST_QT_033', 'M_004', 'R09', 'CINE_QT', NULL, '2026-04-10 23:59:00', 120000, N'Phụ đề Việt', 'IMAX', N'Mở bán'),

-- SONG HỶ LÂM NGUY (T13) - M_005 | Standard (2D) | Phim VN
('ST_QT_034', 'M_005', 'R06', 'CINE_QT', NULL, '2026-04-10 10:15:00', 80000, N'Lồng tiếng', '2D', N'Mở bán'),
('ST_QT_035', 'M_005', 'R06', 'CINE_QT', NULL, '2026-04-10 14:15:00', 80000, N'Lồng tiếng', '2D', N'Mở bán'),
('ST_QT_036', 'M_005', 'R07', 'CINE_QT', NULL, '2026-04-10 16:20:00', 80000, N'Lồng tiếng', '2D', N'Mở bán'),

-- SUPER MARIO THIÊN HÀ (P) - M_009 | Standard & Deluxe | Lồng Tiếng
('ST_QT_037', 'M_009', 'R06', 'CINE_QT', NULL, '2026-04-10 07:45:00', 80000, N'Lồng tiếng', '2D', N'Mở bán'),
('ST_QT_038', 'M_009', 'R09', 'CINE_QT', NULL, '2026-04-10 19:50:00', 120000, N'Lồng tiếng', 'IMAX', N'Mở bán'),

-- QUỶ NHẬP TRÀNG 2 (T18) - M_013 | Standard & Deluxe | Phim VN
('ST_QT_039', 'M_013', 'R05', 'CINE_QT', NULL, '2026-04-10 08:10:00', 80000, N'Lồng tiếng', '2D', N'Mở bán'),
('ST_QT_040', 'M_013', 'R05', 'CINE_QT', NULL, '2026-04-10 21:00:00', 80000, N'Lồng tiếng', '2D', N'Mở bán'),
('ST_QT_041', 'M_013', 'R08', 'CINE_QT', NULL, '2026-04-10 17:30:00', 120000, N'Lồng tiếng', 'IMAX', N'Mở bán'),

-- QUỶ DỮ TỪ LUYỆN NGỤC (T18) - M_006 | Deluxe (IMAX) | Phụ đề
('ST_QT_042', 'M_006', 'R08', 'CINE_QT', NULL, '2026-04-10 07:50:00', 120000, N'Phụ đề Việt', 'IMAX', N'Mở bán'),
('ST_QT_043', 'M_006', 'R08', 'CINE_QT', NULL, '2026-04-10 12:50:00', 120000, N'Phụ đề Việt', 'IMAX', N'Mở bán'),

-- CÚ NHẢY KỲ DIỆU (P) - M_012 | Deluxe (IMAX) | Lồng tiếng
('ST_QT_044', 'M_012', 'R08', 'CINE_QT', NULL, '2026-04-10 15:10:00', 120000, N'Lồng tiếng', 'IMAX', N'Mở bán');


-- ============================================================
-- THÊM LỊCH CHIẾU (SHOWTIME) CHO NGÀY 11/04/2026 TẠI RẠP QUỐC THANH
-- Đã phân bổ phòng hợp lý để tránh Overlap Trigger (Thời lượng phim + 15p dọn rạp)
-- Mốc ID suất chiếu bắt đầu từ 101 để không trùng với ngày 10/04
-- ============================================================
INSERT INTO SHOWTIME (ShowtimeID, MovieID, RoomNumber, CinemaID, PolicyID, ShowStartTime, BasePrice, ShowLanguage, ShowFormat, ShowStatus) VALUES

-- DƯỚI BÓNG ĐIỆN HẠ (T16) - M_003 | Standard (2D) | Phụ đề Việt | Phân bổ vào R01, R02 & R04
('ST_QT_101', 'M_003', 'R01', 'CINE_QT', NULL, '2026-04-11 08:30:00', 80000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_QT_102', 'M_003', 'R02', 'CINE_QT', NULL, '2026-04-11 10:00:00', 80000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_QT_103', 'M_003', 'R01', 'CINE_QT', NULL, '2026-04-11 11:00:00', 80000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_QT_104', 'M_003', 'R02', 'CINE_QT', NULL, '2026-04-11 12:30:00', 80000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_QT_105', 'M_003', 'R01', 'CINE_QT', NULL, '2026-04-11 13:30:00', 80000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_QT_106', 'M_003', 'R02', 'CINE_QT', NULL, '2026-04-11 15:00:00', 80000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_QT_107', 'M_003', 'R01', 'CINE_QT', NULL, '2026-04-11 16:00:00', 80000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_QT_108', 'M_003', 'R02', 'CINE_QT', NULL, '2026-04-11 17:30:00', 80000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_QT_109', 'M_003', 'R01', 'CINE_QT', NULL, '2026-04-11 19:00:00', 80000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_QT_110', 'M_003', 'R02', 'CINE_QT', NULL, '2026-04-11 20:00:00', 80000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_QT_111', 'M_003', 'R04', 'CINE_QT', NULL, '2026-04-11 20:55:00', 80000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_QT_112', 'M_003', 'R01', 'CINE_QT', NULL, '2026-04-11 22:30:00', 80000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_QT_113', 'M_003', 'R02', 'CINE_QT', NULL, '2026-04-11 23:20:00', 80000, N'Phụ đề Việt', '2D', N'Mở bán'),

-- BẪY TIỀN (T16) - M_002 | Standard (2D) | Lồng tiếng | Gắn trọn bộ vào R03
('ST_QT_114', 'M_002', 'R03', 'CINE_QT', NULL, '2026-04-11 09:00:00', 80000, N'Lồng tiếng', '2D', N'Mở bán'),
('ST_QT_115', 'M_002', 'R03', 'CINE_QT', NULL, '2026-04-11 11:30:00', 80000, N'Lồng tiếng', '2D', N'Mở bán'),
('ST_QT_116', 'M_002', 'R03', 'CINE_QT', NULL, '2026-04-11 14:00:00', 80000, N'Lồng tiếng', '2D', N'Mở bán'),
('ST_QT_117', 'M_002', 'R03', 'CINE_QT', NULL, '2026-04-11 16:30:00', 80000, N'Lồng tiếng', '2D', N'Mở bán'),
('ST_QT_118', 'M_002', 'R03', 'CINE_QT', NULL, '2026-04-11 19:20:00', 80000, N'Lồng tiếng', '2D', N'Mở bán'),
('ST_QT_119', 'M_002', 'R03', 'CINE_QT', NULL, '2026-04-11 23:30:00', 80000, N'Lồng tiếng', '2D', N'Mở bán'),

-- PHI VỤ CUỐI CÙNG (T18) - M_011 | Standard (2D) | Phụ đề Việt | R04, R05
('ST_QT_120', 'M_011', 'R05', 'CINE_QT', NULL, '2026-04-11 11:55:00', 80000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_QT_121', 'M_011', 'R05', 'CINE_QT', NULL, '2026-04-11 14:40:00', 80000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_QT_122', 'M_011', 'R04', 'CINE_QT', NULL, '2026-04-11 17:00:00', 80000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_QT_123', 'M_011', 'R05', 'CINE_QT', NULL, '2026-04-11 18:40:00', 80000, N'Phụ đề Việt', '2D', N'Mở bán'),

-- SUPER MARIO THIÊN HÀ (P) - M_009 | Standard (2D) | Lồng tiếng | R04
('ST_QT_124', 'M_009', 'R04', 'CINE_QT', NULL, '2026-04-11 07:45:00', 80000, N'Lồng tiếng', '2D', N'Mở bán'),
('ST_QT_125', 'M_009', 'R04', 'CINE_QT', NULL, '2026-04-11 10:10:00', 80000, N'Lồng tiếng', '2D', N'Mở bán'),

-- SONG HỶ LÂM NGUY (T13) - M_005 | Standard (2D) | Lồng tiếng | R06
('ST_QT_126', 'M_005', 'R06', 'CINE_QT', NULL, '2026-04-11 08:00:00', 80000, N'Lồng tiếng', '2D', N'Mở bán'),

-- QUỶ NHẬP TRÀNG 2 (T18) - M_013 | Standard (2D) | Lồng tiếng | R04, R05, R06, R07
('ST_QT_127', 'M_013', 'R04', 'CINE_QT', NULL, '2026-04-11 12:20:00', 80000, N'Lồng tiếng', '2D', N'Mở bán'),
('ST_QT_128', 'M_013', 'R07', 'CINE_QT', NULL, '2026-04-11 16:20:00', 80000, N'Lồng tiếng', '2D', N'Mở bán'),
('ST_QT_129', 'M_013', 'R06', 'CINE_QT', NULL, '2026-04-11 21:00:00', 80000, N'Lồng tiếng', '2D', N'Mở bán'),
('ST_QT_130', 'M_013', 'R05', 'CINE_QT', NULL, '2026-04-11 21:30:00', 80000, N'Lồng tiếng', '2D', N'Mở bán'),

-- TA KHON QUỶ ĐỘI LỐT NGƯỜI (T18) - M_004 | Standard (2D) | Phụ đề Việt | R04, R07
('ST_QT_131', 'M_004', 'R07', 'CINE_QT', NULL, '2026-04-11 09:50:00', 80000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_QT_132', 'M_004', 'R04', 'CINE_QT', NULL, '2026-04-11 23:50:00', 80000, N'Phụ đề Việt', '2D', N'Mở bán'),

-- ÁNH DƯƠNG CỦA MẸ (T13) - M_010 | Standard (2D) | Phụ đề Việt | R05, R06, R07
('ST_QT_133', 'M_010', 'R05', 'CINE_QT', NULL, '2026-04-11 08:00:00', 80000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_QT_134', 'M_010', 'R06', 'CINE_QT', NULL, '2026-04-11 14:15:00', 80000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_QT_135', 'M_010', 'R07', 'CINE_QT', NULL, '2026-04-11 21:45:00', 80000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_QT_136', 'M_010', 'R06', 'CINE_QT', NULL, '2026-04-11 23:55:00', 80000, N'Phụ đề Việt', '2D', N'Mở bán');

-- SHOWTIME - CINE_SV (NGAY 10/04)
-- ============================================================
-- 2. THÊM LỊCH CHIẾU (SHOWTIME) CHO RẠP SINH VIÊN - NGÀY 10/04/2026
-- Dữ liệu đã được phân bổ luân phiên giữa 5 phòng để tránh dính Trigger Overlap
-- ============================================================
INSERT INTO SHOWTIME (ShowtimeID, MovieID, RoomNumber, CinemaID, PolicyID, ShowStartTime, BasePrice, ShowLanguage, ShowFormat, ShowStatus) VALUES

-- DƯỚI BÓNG ĐIỆN HẠ (T16) - M_003 | Standard (2D) | Phụ đề
('ST_SV_001', 'M_003', 'R_SV_04', 'CINE_SV', NULL, '2026-04-10 09:00:00', 70000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_SV_002', 'M_003', 'R_SV_02', 'CINE_SV', NULL, '2026-04-10 10:20:00', 70000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_SV_003', 'M_003', 'R_SV_04', 'CINE_SV', NULL, '2026-04-10 11:25:00', 70000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_SV_004', 'M_003', 'R_SV_01', 'CINE_SV', NULL, '2026-04-10 12:45:00', 70000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_SV_005', 'M_003', 'R_SV_01', 'CINE_SV', NULL, '2026-04-10 15:10:00', 70000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_SV_006', 'M_003', 'R_SV_04', 'CINE_SV', NULL, '2026-04-10 16:35:00', 70000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_SV_007', 'M_003', 'R_SV_01', 'CINE_SV', NULL, '2026-04-10 17:35:00', 70000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_SV_008', 'M_003', 'R_SV_04', 'CINE_SV', NULL, '2026-04-10 19:00:00', 70000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_SV_009', 'M_003', 'R_SV_01', 'CINE_SV', NULL, '2026-04-10 20:00:00', 70000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_SV_010', 'M_003', 'R_SV_04', 'CINE_SV', NULL, '2026-04-10 21:25:00', 70000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_SV_011', 'M_003', 'R_SV_01', 'CINE_SV', NULL, '2026-04-10 22:25:00', 70000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_SV_012', 'M_003', 'R_SV_03', 'CINE_SV', NULL, '2026-04-10 23:25:00', 70000, N'Phụ đề Việt', '2D', N'Mở bán'),

-- BẪY TIỀN (T16) - M_002 | Standard (2D) | Lồng tiếng
('ST_SV_013', 'M_002', 'R_SV_03', 'CINE_SV', NULL, '2026-04-10 11:00:00', 70000, N'Lồng tiếng', '2D', N'Mở bán'),
('ST_SV_014', 'M_002', 'R_SV_03', 'CINE_SV', NULL, '2026-04-10 13:50:00', 70000, N'Lồng tiếng', '2D', N'Mở bán'),
('ST_SV_015', 'M_002', 'R_SV_02', 'CINE_SV', NULL, '2026-04-10 18:05:00', 70000, N'Lồng tiếng', '2D', N'Mở bán'),
('ST_SV_016', 'M_002', 'R_SV_03', 'CINE_SV', NULL, '2026-04-10 21:00:00', 70000, N'Lồng tiếng', '2D', N'Mở bán'),

-- PHI VỤ CUỐI CÙNG (T18) - M_011 | Standard (2D) | Phụ đề
('ST_SV_017', 'M_011', 'R_SV_03', 'CINE_SV', NULL, '2026-04-10 08:40:00', 70000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_SV_018', 'M_011', 'R_SV_05', 'CINE_SV', NULL, '2026-04-10 12:10:00', 70000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_SV_019', 'M_011', 'R_SV_02', 'CINE_SV', NULL, '2026-04-10 13:25:00', 70000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_SV_020', 'M_011', 'R_SV_02', 'CINE_SV', NULL, '2026-04-10 15:45:00', 70000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_SV_021', 'M_011', 'R_SV_02', 'CINE_SV', NULL, '2026-04-10 20:30:00', 70000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_SV_022', 'M_011', 'R_SV_02', 'CINE_SV', NULL, '2026-04-10 22:50:00', 70000, N'Phụ đề Việt', '2D', N'Mở bán'),

-- SUPER MARIO THIÊN HÀ (P) - M_009 | Standard (2D) | Lồng tiếng
('ST_SV_023', 'M_009', 'R_SV_02', 'CINE_SV', NULL, '2026-04-10 08:10:00', 70000, N'Lồng tiếng', '2D', N'Mở bán'),

-- QUỶ NHẬP TRÀNG 2 (T18) - M_013 | Standard (2D) | Lồng tiếng
('ST_SV_024', 'M_013', 'R_SV_03', 'CINE_SV', NULL, '2026-04-10 16:15:00', 70000, N'Lồng tiếng', '2D', N'Mở bán'),

-- QUỶ DỮ TỪ LUYỆN NGỤC (T18) - M_006 | Standard (2D) | Phụ đề
('ST_SV_025', 'M_006', 'R_SV_03', 'CINE_SV', NULL, '2026-04-10 18:40:00', 70000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_SV_026', 'M_006', 'R_SV_04', 'CINE_SV', NULL, '2026-04-10 23:50:00', 70000, N'Phụ đề Việt', '2D', N'Mở bán'),

-- TA KHON QUỶ ĐỘI LỐT NGƯỜI (T18) - M_004 | Standard (2D) | Phụ đề
('ST_SV_027', 'M_004', 'R_SV_01', 'CINE_SV', NULL, '2026-04-10 08:00:00', 70000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_SV_028', 'M_004', 'R_SV_04', 'CINE_SV', NULL, '2026-04-10 14:30:00', 70000, N'Phụ đề Việt', '2D', N'Mở bán'),

-- ÁNH DƯƠNG CỦA MẸ (T13) - M_010 | Standard (2D) | Phụ đề
('ST_SV_029', 'M_010', 'R_SV_01', 'CINE_SV', NULL, '2026-04-10 10:05:00', 70000, N'Phụ đề Việt', '2D', N'Mở bán');

-- SHOWTIME - CINE_SV (NGAY 11/04) / CINE_VVK / CINE_HBT / CINE_Q7
-- ============================================================
-- 2. DUMMY DỮ LIỆU SUẤT CHIẾU (SHOWTIME) 
-- ============================================================
INSERT INTO SHOWTIME (ShowtimeID, MovieID, RoomNumber, CinemaID, PolicyID, ShowStartTime, BasePrice, ShowLanguage, ShowFormat, ShowStatus) VALUES

-- ------------------------------------------------------------
-- [1] CINE_SV (SINH VIÊN) - CHỈ NGÀY 11/04/2026 (Base Price: 70k)
-- ------------------------------------------------------------
-- Phòng 1: M_003 (Dưới Bóng Điện Hạ)
('ST_SV_101', 'M_003', 'R_SV_01', 'CINE_SV', NULL, '2026-04-11 08:30:00', 70000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_SV_102', 'M_003', 'R_SV_01', 'CINE_SV', NULL, '2026-04-11 11:30:00', 70000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_SV_103', 'M_003', 'R_SV_01', 'CINE_SV', NULL, '2026-04-11 14:30:00', 70000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_SV_104', 'M_003', 'R_SV_01', 'CINE_SV', NULL, '2026-04-11 17:30:00', 70000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_SV_105', 'M_003', 'R_SV_01', 'CINE_SV', NULL, '2026-04-11 20:30:00', 70000, N'Phụ đề Việt', '2D', N'Mở bán'),
-- Phòng 2: M_002 (Bẫy Tiền)
('ST_SV_106', 'M_002', 'R_SV_02', 'CINE_SV', NULL, '2026-04-11 08:30:00', 70000, N'Lồng tiếng', '2D', N'Mở bán'),
('ST_SV_107', 'M_002', 'R_SV_02', 'CINE_SV', NULL, '2026-04-11 11:30:00', 70000, N'Lồng tiếng', '2D', N'Mở bán'),
('ST_SV_108', 'M_002', 'R_SV_02', 'CINE_SV', NULL, '2026-04-11 14:30:00', 70000, N'Lồng tiếng', '2D', N'Mở bán'),
('ST_SV_109', 'M_002', 'R_SV_02', 'CINE_SV', NULL, '2026-04-11 17:30:00', 70000, N'Lồng tiếng', '2D', N'Mở bán'),
('ST_SV_110', 'M_002', 'R_SV_02', 'CINE_SV', NULL, '2026-04-11 20:30:00', 70000, N'Lồng tiếng', '2D', N'Mở bán'),
-- Phòng 3: M_011 (Phi Vụ Cuối Cùng)
('ST_SV_111', 'M_011', 'R_SV_03', 'CINE_SV', NULL, '2026-04-11 08:30:00', 70000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_SV_112', 'M_011', 'R_SV_03', 'CINE_SV', NULL, '2026-04-11 11:30:00', 70000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_SV_113', 'M_011', 'R_SV_03', 'CINE_SV', NULL, '2026-04-11 14:30:00', 70000, N'Phụ đề Việt', '2D', N'Mở bán'),
-- Phòng 4: Phim hoạt hình (Sáng) & Kinh dị (Tối)
('ST_SV_114', 'M_009', 'R_SV_04', 'CINE_SV', NULL, '2026-04-11 08:30:00', 70000, N'Lồng tiếng', '2D', N'Mở bán'),
('ST_SV_115', 'M_009', 'R_SV_04', 'CINE_SV', NULL, '2026-04-11 11:30:00', 70000, N'Lồng tiếng', '2D', N'Mở bán'),
('ST_SV_116', 'M_013', 'R_SV_04', 'CINE_SV', NULL, '2026-04-11 17:30:00', 70000, N'Lồng tiếng', '2D', N'Mở bán'),
('ST_SV_117', 'M_013', 'R_SV_04', 'CINE_SV', NULL, '2026-04-11 20:30:00', 70000, N'Lồng tiếng', '2D', N'Mở bán'),

-- ------------------------------------------------------------
-- [2] CINE_VVK (VÕ VĂN KIỆT) - NGÀY 10/04 & 11/04 (Base Price: 80k)
-- ------------------------------------------------------------
-- NGÀY 10/04
('ST_VK_001', 'M_003', 'R_VVK_01', 'CINE_VVK', NULL, '2026-04-10 08:30:00', 80000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_VK_002', 'M_003', 'R_VVK_01', 'CINE_VVK', NULL, '2026-04-10 11:30:00', 80000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_VK_003', 'M_003', 'R_VVK_01', 'CINE_VVK', NULL, '2026-04-10 14:30:00', 80000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_VK_004', 'M_002', 'R_VVK_02', 'CINE_VVK', NULL, '2026-04-10 08:30:00', 80000, N'Lồng tiếng', '2D', N'Mở bán'),
('ST_VK_005', 'M_002', 'R_VVK_02', 'CINE_VVK', NULL, '2026-04-10 11:30:00', 80000, N'Lồng tiếng', '2D', N'Mở bán'),
('ST_VK_006', 'M_004', 'R_VVK_03', 'CINE_VVK', NULL, '2026-04-10 17:30:00', 80000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_VK_007', 'M_004', 'R_VVK_03', 'CINE_VVK', NULL, '2026-04-10 20:30:00', 80000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_VK_008', 'M_011', 'R_VVK_04', 'CINE_VVK', NULL, '2026-04-10 14:30:00', 80000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_VK_009', 'M_011', 'R_VVK_04', 'CINE_VVK', NULL, '2026-04-10 17:30:00', 80000, N'Phụ đề Việt', '2D', N'Mở bán'),
-- NGÀY 11/04
('ST_VK_101', 'M_003', 'R_VVK_01', 'CINE_VVK', NULL, '2026-04-11 08:30:00', 80000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_VK_102', 'M_003', 'R_VVK_01', 'CINE_VVK', NULL, '2026-04-11 11:30:00', 80000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_VK_103', 'M_003', 'R_VVK_01', 'CINE_VVK', NULL, '2026-04-11 14:30:00', 80000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_VK_104', 'M_002', 'R_VVK_02', 'CINE_VVK', NULL, '2026-04-11 08:30:00', 80000, N'Lồng tiếng', '2D', N'Mở bán'),
('ST_VK_105', 'M_002', 'R_VVK_02', 'CINE_VVK', NULL, '2026-04-11 11:30:00', 80000, N'Lồng tiếng', '2D', N'Mở bán'),
('ST_VK_106', 'M_013', 'R_VVK_03', 'CINE_VVK', NULL, '2026-04-11 17:30:00', 80000, N'Lồng tiếng', '2D', N'Mở bán'),
('ST_VK_107', 'M_013', 'R_VVK_03', 'CINE_VVK', NULL, '2026-04-11 20:30:00', 80000, N'Lồng tiếng', '2D', N'Mở bán'),
('ST_VK_108', 'M_011', 'R_VVK_04', 'CINE_VVK', NULL, '2026-04-11 14:30:00', 80000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_VK_109', 'M_011', 'R_VVK_04', 'CINE_VVK', NULL, '2026-04-11 17:30:00', 80000, N'Phụ đề Việt', '2D', N'Mở bán'),

-- ------------------------------------------------------------
-- [3] CINE_HBT (HAI BÀ TRƯNG) - NGÀY 10/04 & 11/04 (Base Price: 100k, IMAX: 150k)
-- ------------------------------------------------------------
-- NGÀY 10/04
('ST_HB_001', 'M_003', 'R_HBT_01', 'CINE_HBT', NULL, '2026-04-10 08:30:00', 100000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_HB_002', 'M_003', 'R_HBT_01', 'CINE_HBT', NULL, '2026-04-10 11:30:00', 100000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_HB_003', 'M_002', 'R_HBT_02', 'CINE_HBT', NULL, '2026-04-10 14:30:00', 100000, N'Lồng tiếng', '2D', N'Mở bán'),
('ST_HB_004', 'M_002', 'R_HBT_02', 'CINE_HBT', NULL, '2026-04-10 17:30:00', 100000, N'Lồng tiếng', '2D', N'Mở bán'),
-- IMAX Rooms
('ST_HB_005', 'M_004', 'R_HBT_04', 'CINE_HBT', NULL, '2026-04-10 14:30:00', 150000, N'Phụ đề Việt', 'IMAX', N'Mở bán'),
('ST_HB_006', 'M_004', 'R_HBT_04', 'CINE_HBT', NULL, '2026-04-10 17:30:00', 150000, N'Phụ đề Việt', 'IMAX', N'Mở bán'),
('ST_HB_007', 'M_006', 'R_HBT_05', 'CINE_HBT', NULL, '2026-04-10 20:30:00', 150000, N'Phụ đề Việt', 'IMAX', N'Mở bán'),
-- NGÀY 11/04
('ST_HB_101', 'M_003', 'R_HBT_01', 'CINE_HBT', NULL, '2026-04-11 08:30:00', 100000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_HB_102', 'M_003', 'R_HBT_01', 'CINE_HBT', NULL, '2026-04-11 11:30:00', 100000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_HB_103', 'M_002', 'R_HBT_02', 'CINE_HBT', NULL, '2026-04-11 14:30:00', 100000, N'Lồng tiếng', '2D', N'Mở bán'),
('ST_HB_104', 'M_002', 'R_HBT_02', 'CINE_HBT', NULL, '2026-04-11 17:30:00', 100000, N'Lồng tiếng', '2D', N'Mở bán'),
-- IMAX Rooms
('ST_HB_105', 'M_004', 'R_HBT_04', 'CINE_HBT', NULL, '2026-04-11 14:30:00', 150000, N'Phụ đề Việt', 'IMAX', N'Mở bán'),
('ST_HB_106', 'M_004', 'R_HBT_04', 'CINE_HBT', NULL, '2026-04-11 17:30:00', 150000, N'Phụ đề Việt', 'IMAX', N'Mở bán'),
('ST_HB_107', 'M_006', 'R_HBT_05', 'CINE_HBT', NULL, '2026-04-11 20:30:00', 150000, N'Phụ đề Việt', 'IMAX', N'Mở bán'),

-- ------------------------------------------------------------
-- [4] CINE_Q7 (QUẬN 7) - NGÀY 10/04 & 11/04 (Base Price: 85k)
-- ------------------------------------------------------------
-- NGÀY 10/04
('ST_Q7_001', 'M_003', 'R_Q7_01', 'CINE_Q7', NULL, '2026-04-10 08:30:00', 85000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_Q7_002', 'M_003', 'R_Q7_01', 'CINE_Q7', NULL, '2026-04-10 11:30:00', 85000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_Q7_003', 'M_002', 'R_Q7_02', 'CINE_Q7', NULL, '2026-04-10 14:30:00', 85000, N'Lồng tiếng', '2D', N'Mở bán'),
('ST_Q7_004', 'M_002', 'R_Q7_02', 'CINE_Q7', NULL, '2026-04-10 17:30:00', 85000, N'Lồng tiếng', '2D', N'Mở bán'),
('ST_Q7_005', 'M_005', 'R_Q7_03', 'CINE_Q7', NULL, '2026-04-10 08:30:00', 85000, N'Lồng tiếng', '2D', N'Mở bán'),
('ST_Q7_006', 'M_005', 'R_Q7_03', 'CINE_Q7', NULL, '2026-04-10 11:30:00', 85000, N'Lồng tiếng', '2D', N'Mở bán'),
('ST_Q7_007', 'M_011', 'R_Q7_04', 'CINE_Q7', NULL, '2026-04-10 17:30:00', 85000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_Q7_008', 'M_011', 'R_Q7_04', 'CINE_Q7', NULL, '2026-04-10 20:30:00', 85000, N'Phụ đề Việt', '2D', N'Mở bán'),
-- NGÀY 11/04
('ST_Q7_101', 'M_003', 'R_Q7_01', 'CINE_Q7', NULL, '2026-04-11 08:30:00', 85000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_Q7_102', 'M_003', 'R_Q7_01', 'CINE_Q7', NULL, '2026-04-11 11:30:00', 85000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_Q7_103', 'M_002', 'R_Q7_02', 'CINE_Q7', NULL, '2026-04-11 14:30:00', 85000, N'Lồng tiếng', '2D', N'Mở bán'),
('ST_Q7_104', 'M_002', 'R_Q7_02', 'CINE_Q7', NULL, '2026-04-11 17:30:00', 85000, N'Lồng tiếng', '2D', N'Mở bán'),
('ST_Q7_105', 'M_005', 'R_Q7_03', 'CINE_Q7', NULL, '2026-04-11 08:30:00', 85000, N'Lồng tiếng', '2D', N'Mở bán'),
('ST_Q7_106', 'M_005', 'R_Q7_03', 'CINE_Q7', NULL, '2026-04-11 11:30:00', 85000, N'Lồng tiếng', '2D', N'Mở bán'),
('ST_Q7_107', 'M_011', 'R_Q7_04', 'CINE_Q7', NULL, '2026-04-11 17:30:00', 85000, N'Phụ đề Việt', '2D', N'Mở bán'),
('ST_Q7_108', 'M_011', 'R_Q7_04', 'CINE_Q7', NULL, '2026-04-11 20:30:00', 85000, N'Phụ đề Việt', '2D', N'Mở bán');

-- GAN PRICING POLICY CHO SHOWTIME DA SEED
-- Luu y: logic DATEPART(dw, ...) duoc giu nguyen theo file nguon.
-- Cập nhật PolicyID cho các suất chiếu đã tạo trước đó để test
UPDATE SHOWTIME 
SET PolicyID = 'POL_NORMAL' 
WHERE DATEPART(dw, ShowStartTime) IN (2, 3, 4, 5, 6); -- Ngày thường (Thứ 2 đến Thứ 6)

UPDATE SHOWTIME 
SET PolicyID = 'POL_WEEKEND' 
WHERE DATEPART(dw, ShowStartTime) IN (1, 7); -- Cuối tuần (Thứ 7, CN)
GO

-- SESSION
-- ======================================================================
-- BẢNG 10: SESSION (Phiên sự kiện - Bản cập nhật khớp mã ROOM và EVENT)
-- ======================================================================
INSERT INTO SESSION (SessionID, EventID, RoomNumber, CinemaID, SessionStart, SessionEnd, MaxGuests, RentalFee, SessionStatus)
VALUES 
-- 1. Marvel Multiverse (CINE_HBT): Dùng 2 phòng Deluxe cao cấp nhất
('SES001', 'EV001', 'R_HBT_04', 'CINE_HBT', '2026-04-20 18:00:00', '2026-04-20 21:00:00', 150, 25000000, N'Đã xác nhận'),
('SES002', 'EV001', 'R_HBT_05', 'CINE_HBT', '2026-04-20 18:00:00', '2026-04-20 21:00:00', 150, 25000000, N'Đã xác nhận'),

-- 2. VR Experience (CINE_Q7): Quy mô 200 khách, chia làm 2 phòng Standard
('SES003', 'EV002', 'R_Q7_01', 'CINE_Q7', '2026-05-10 09:00:00', '2026-05-10 12:00:00', 100, 10000000, N'Đã xác nhận'),
('SES004', 'EV002', 'R_Q7_02', 'CINE_Q7', '2026-05-10 09:00:00', '2026-05-10 12:00:00', 100, 10000000, N'Đã xác nhận'),

-- 3. Valorant Champions (CINE_QT): Dùng 2 phòng Deluxe IMAX Laser cực đỉnh cho Esports
('SES005', 'EV003', 'R08', 'CINE_QT', '2026-06-12 14:00:00', '2026-06-12 18:00:00', 150, 20000000, N'Đã xác nhận'),
('SES006', 'EV003', 'R09', 'CINE_QT', '2026-06-12 14:00:00', '2026-06-12 18:00:00', 150, 20000000, N'Đã xác nhận'),

-- 4. AI Day (CINE_SV): Quy mô 400 khách, dùng 4 phòng Standard chạy song song
('SES007', 'EV004', 'R_SV_01', 'CINE_SV', '2026-04-22 08:30:00', '2026-04-22 16:30:00', 120, 15000000, N'Đã xác nhận'),
('SES008', 'EV004', 'R_SV_02', 'CINE_SV', '2026-04-22 08:30:00', '2026-04-22 16:30:00', 120, 15000000, N'Đã xác nhận'),
('SES009', 'EV004', 'R_SV_03', 'CINE_SV', '2026-04-22 08:30:00', '2026-04-22 16:30:00', 100, 15000000, N'Đã xác nhận'),

-- 5. K-Pop Showcase (CINE_VVK): Bao trọn 5 phòng để đạt quy mô 800 khách (chia 2 đợt sáng/chiều)
('SES010', 'EV005', 'R_VVK_01', 'CINE_VVK', '2026-06-05 14:00:00', '2026-06-05 17:00:00', 100, 12000000, N'Đã xác nhận'),
('SES011', 'EV005', 'R_VVK_02', 'CINE_VVK', '2026-06-05 14:00:00', '2026-06-05 17:00:00', 100, 12000000, N'Đã xác nhận'),

-- 6. NFT Gallery (CINE_HBT): Dùng phòng Standard để triển lãm
('SES012', 'EV006', 'R_HBT_01', 'CINE_HBT', '2026-05-20 10:00:00', '2026-05-20 17:00:00', 120, 15000000, N'Đã xác nhận'),

-- 7. Genshin Impact Offline (CINE_Q7): 1000 người - Dùng toàn bộ 5 phòng của rạp Q7
('SES013', 'EV007', 'R_Q7_01', 'CINE_Q7', '2026-06-15 13:00:00', '2026-06-15 18:00:00', 100, 10000000, N'Đã xác nhận'),
('SES014', 'EV007', 'R_Q7_02', 'CINE_Q7', '2026-06-15 13:00:00', '2026-06-15 18:00:00', 100, 10000000, N'Đã xác nhận'),
('SES015', 'EV007', 'R_Q7_03', 'CINE_Q7', '2026-06-15 13:00:00', '2026-06-15 18:00:00', 100, 10000000, N'Đã xác nhận'),

-- 8. Future Fashion (CINE_QT): Dùng 3 phòng Standard
('SES016', 'EV008', 'R01', 'CINE_QT', '2026-07-01 19:00:00', '2026-07-01 22:00:00', 120, 15000000, N'Đã xác nhận'),
('SES017', 'EV008', 'R02', 'CINE_QT', '2026-07-01 19:00:00', '2026-07-01 22:00:00', 120, 15000000, N'Đã xác nhận'),

-- 9. Tesla Drive (CINE_SV): 1200 người - Thuê toàn bộ cụm rạp SV trong nhiều ngày
('SES018', 'EV009', 'R_SV_01', 'CINE_SV', '2026-08-10 08:00:00', '2026-08-10 18:00:00', 120, 20000000, N'Đã xác nhận'),
('SES019', 'EV009', 'R_SV_02', 'CINE_SV', '2026-08-10 08:00:00', '2026-08-10 18:00:00', 120, 20000000, N'Đã xác nhận'),

-- 10. Ghibli Melodies (CINE_VVK): Dùng 3 phòng Standard
('SES020', 'EV010', 'R_VVK_01', 'CINE_VVK', '2026-04-15 19:00:00', '2026-04-15 21:30:00', 100, 10000000, N'Đã xác nhận'),
('SES021', 'EV010', 'R_VVK_02', 'CINE_VVK', '2026-04-15 19:00:00', '2026-04-15 21:30:00', 100, 10000000, N'Đã xác nhận');

-- WORK_ASSIGNMENT - GIU BAN INSERT CHUAN, BO LEGACY DELETE RESET KHOI LUONG CHINH
-- ======================================================================
-- BẢNG 12: WORK_ASSIGNMENT (CHỈ PHÂN CÔNG NHÓM TRỰC SẢNH/QUẦY - 60 NGƯỜI)
-- AttendanceStatus: Đúng giờ, Đi trễ, Vắng mặt, Nghỉ phép
-- Phân bổ: Đúng vai trò Quản lý, Bán vé, CSKH. Để trống nhóm Kỹ thuật/Soát vé cho Showtime.
-- ======================================================================
INSERT INTO WORK_ASSIGNMENT (EmployeeID, ShiftID, WorkDate, WorkedHours, AttendanceStatus, Notes)
VALUES 
-- --- RẠP CINE_HBT (Lấy E001 -> E012 trực Sảnh) ---
('E001', 'S01', '2026-04-10', 4.0, N'Đúng giờ', N'Quản lý: Mở cửa rạp & Giám sát ca sáng'),
('E003', 'S01', '2026-04-10', 4.0, N'Đúng giờ', N'Bán vé: Trực quầy vé 01'),
('E004', 'S01', '2026-04-10', 4.0, N'Đúng giờ', N'CSKH: Trực sảnh hướng dẫn khách'),
('E008', 'S02', '2026-04-10', 4.0, N'Đi trễ', N'Bán vé: Trực quầy Popcorn'),
('E009', 'S02', '2026-04-10', 4.0, N'Đúng giờ', N'Bán vé: Trực quầy Popcorn'),
('E010', 'S03', '2026-04-10', 4.0, N'Đúng giờ', N'CSKH: Hỗ trợ sảnh tối'),
('E001', 'S01', '2026-04-11', 4.0, N'Đúng giờ', N'Quản lý: Giám sát rạp HBT'),
('E003', 'S02', '2026-04-11', 4.0, N'Nghỉ phép', N'Bán vé: Nghỉ phép gia đình'),
('E004', 'S02', '2026-04-11', 4.0, N'Đúng giờ', N'CSKH: Trực quầy thông tin'),
('E012', 'S03', '2026-04-11', 4.0, N'Đúng giờ', N'Bán vé: Quầy vé tối'),

-- --- RẠP CINE_Q7 (Lấy E021 -> E032 trực Sảnh) ---
('E021', 'S01', '2026-04-10', 4.0, N'Đúng giờ', N'Quản lý: Giám sát ca sáng Q7'),
('E023', 'S01', '2026-04-10', 4.0, N'Đúng giờ', N'Bán vé: Quầy vé 01'),
('E024', 'S02', '2026-04-10', 4.0, N'Đúng giờ', N'Bán vé: Quầy Popcorn'),
('E029', 'S03', '2026-04-10', 4.0, N'Đúng giờ', N'CSKH: Trực sảnh tối'),
('E030', 'S03', '2026-04-10', 4.0, N'Vắng mặt', N'CSKH: Nghỉ không phép'),
('E031', 'S01', '2026-04-11', 4.0, N'Đúng giờ', N'Bán vé: Trực quầy vé sáng'),
('E032', 'S02', '2026-04-11', 4.0, N'Đúng giờ', N'Bán vé: Trực quầy Popcorn'),

-- --- RẠP CINE_QT (Lấy E041 -> E052 trực Sảnh) ---
('E041', 'S01', '2026-04-10', 4.0, N'Đúng giờ', N'Quản lý: Mở rạp Quốc Thanh'),
('E043', 'S01', '2026-04-10', 4.0, N'Đúng giờ', N'Bán vé: Quầy vé 01'),
('E044', 'S02', '2026-04-10', 4.0, N'Đi trễ', N'Bán vé: Trễ do kẹt xe'),
('E049', 'S03', '2026-04-10', 4.0, N'Đúng giờ', N'CSKH: Trực sảnh tối'),
('E050', 'S03', '2026-04-10', 4.0, N'Đúng giờ', N'CSKH: Trực sảnh tối'),
('E051', 'S01', '2026-04-11', 4.0, N'Đúng giờ', N'Bán vé: Trực quầy sáng'),
('E052', 'S02', '2026-04-11', 4.0, N'Nghỉ phép', N'Bán vé: Nghỉ phép năm'),

-- --- RẠP CINE_SV (Lấy E061 -> E072 trực Sảnh) ---
('E061', 'S01', '2026-04-10', 4.0, N'Đúng giờ', N'Quản lý: Giám sát Sư Vạn Hạnh'),
('E063', 'S01', '2026-04-10', 4.0, N'Đúng giờ', N'Bán vé: Quầy vé 01'),
('E064', 'S02', '2026-04-10', 4.0, N'Đúng giờ', N'Bán vé: Quầy Popcorn'),
('E067', 'S02', '2026-04-10', 4.0, N'Đúng giờ', N'Bán vé: Quầy Popcorn'),
('E068', 'S03', '2026-04-10', 4.0, N'Đúng giờ', N'CSKH: Trực sảnh tối'),
('E069', 'S03', '2026-04-10', 4.0, N'Đúng giờ', N'CSKH: Hỗ trợ khách'),
('E070', 'S01', '2026-04-11', 4.0, N'Đúng giờ', N'CSKH: Trực sảnh sáng'),
('E071', 'S02', '2026-04-11', 4.0, N'Đúng giờ', N'Bán vé: Trực quầy chiều'),

-- --- RẠP CINE_VVK (Lấy E081 -> E092 trực Sảnh) ---
('E081', 'S01', '2026-04-10', 4.0, N'Đúng giờ', N'Quản lý: Giám sát Võ Văn Kiệt'),
('E083', 'S01', '2026-04-10', 4.0, N'Đúng giờ', N'Bán vé: Quầy vé 01'),
('E084', 'S02', '2026-04-10', 4.0, N'Đúng giờ', N'Bán vé: Quầy Popcorn'),
('E088', 'S02', '2026-04-10', 4.0, N'Đúng giờ', N'Bán vé: Quầy bắp nước'),
('E089', 'S03', '2026-04-10', 4.0, N'Đúng giờ', N'CSKH: Trực sảnh tối'),
('E090', 'S03', '2026-04-10', 4.0, N'Đúng giờ', N'CSKH: Trực sảnh tối'),
('E091', 'S01', '2026-04-11', 4.0, N'Đúng giờ', N'Bán vé: Trực quầy sáng'),
('E092', 'S01', '2026-04-11', 4.0, N'Nghỉ phép', N'Bán vé: Nghỉ phép'),

-- --- TĂNG CƯỜNG SỰ KIỆN MARVEL (Ngày 20/04 - Chỉ lấy team Lobby) ---
('E001', 'S03', '2026-04-20', 4.0, N'Đúng giờ', N'Quản lý: Tổng điều phối sự kiện'),
('E003', 'S03', '2026-04-20', 4.0, N'Đúng giờ', N'Bán vé: Quầy vé thảm đỏ'),
('E004', 'S03', '2026-04-20', 4.0, N'Đúng giờ', N'CSKH: Hướng dẫn khách mời VIP'),
('E008', 'S03', '2026-04-20', 4.0, N'Đúng giờ', N'Bán vé: Quầy bắp Marvel'),
('E009', 'S03', '2026-04-20', 4.0, N'Đúng giờ', N'Bán vé: Quầy bắp Marvel'),
('E010', 'S03', '2026-04-20', 4.0, N'Đúng giờ', N'CSKH: Điều phối sảnh thảm đỏ'),
('E012', 'S03', '2026-04-20', 4.0, N'Đúng giờ', N'Bán vé: Hỗ trợ quầy vé'),

-- --- TĂNG CƯỜNG SỰ KIỆN TESLA (Ngày 10/08 - Team Lobby SV) ---
('E061', 'S01', '2026-08-10', 4.0, N'Đúng giờ', N'Quản lý: Giám sát sự kiện Tesla'),
('E063', 'S01', '2026-08-10', 4.0, N'Đúng giờ', N'Bán vé: Đăng ký lái thử'),
('E064', 'S01', '2026-08-10', 4.0, N'Đúng giờ', N'Bán vé: Đăng ký lái thử'),
('E068', 'S01', '2026-08-10', 4.0, N'Đúng giờ', N'CSKH: Đón tiếp đại diện Tesla'),
('E069', 'S01', '2026-08-10', 4.0, N'Đúng giờ', N'CSKH: Quầy thông tin xe'),
('E070', 'S01', '2026-08-10', 4.0, N'Đúng giờ', N'CSKH: Điều phối khách tham quan'),
('E071', 'S01', '2026-08-10', 4.0, N'Đúng giờ', N'Bán vé: Hỗ trợ Teabreak');

-- SHOWTIME_ASSIGNMENT
-- ======================================================================
-- BẢNG 13: SHOWTIME_ASSIGNMENT (PHÂN CÔNG NHÂN VIÊN TRỰC PHÒNG CHIẾU)
-- Điều kiện: Không trùng lặp với nhân sự trực Sảnh (WORK_ASSIGNMENT)
-- Phân bổ: 40 nhân viên còn lại cho các suất chiếu ngày 10/04 và 11/04
-- ======================================================================
INSERT INTO SHOWTIME_ASSIGNMENT (EmployeeID, ShowtimeID, AssignRole)
VALUES 
-- --- RẠP QUỐC THANH (CINE_QT) - Suất chiếu ngày 10/04 & 11/04 ---
('E042', 'ST_QT_001', N'Kỹ thuật viên'), ('E045', 'ST_QT_001', N'Soát vé'),
('E046', 'ST_QT_014', N'Kỹ thuật viên'), ('E047', 'ST_QT_014', N'Soát vé'),
('E048', 'ST_QT_032', N'Kỹ thuật viên'), ('E053', 'ST_QT_032', N'Soát vé'), -- Suất IMAX
('E054', 'ST_QT_101', N'Kỹ thuật viên'), ('E055', 'ST_QT_101', N'Soát vé'),
('E056', 'ST_QT_114', N'Kỹ thuật viên'), ('E057', 'ST_QT_114', N'Soát vé'),
('E058', 'ST_QT_131', N'Kỹ thuật viên'), ('E059', 'ST_QT_131', N'Soát vé'),
('E060', 'ST_QT_042', N'Kỹ thuật viên'),

-- --- RẠP SINH VIÊN (CINE_SV) - Suất chiếu ngày 10/04 & 11/04 ---
('E062', 'ST_SV_001', N'Kỹ thuật viên'), ('E065', 'ST_SV_001', N'Soát vé'),
('E066', 'ST_SV_013', N'Kỹ thuật viên'), ('E072', 'ST_SV_013', N'Soát vé'),
('E073', 'ST_SV_027', N'Kỹ thuật viên'), ('E074', 'ST_SV_027', N'Soát vé'),
('E075', 'ST_SV_101', N'Kỹ thuật viên'), ('E076', 'ST_SV_101', N'Soát vé'),
('E077', 'ST_SV_111', N'Kỹ thuật viên'), ('E078', 'ST_SV_111', N'Soát vé'),
('E079', 'ST_SV_114', N'Kỹ thuật viên'), ('E080', 'ST_SV_114', N'Soát vé'),

-- --- RẠP VÕ VĂN KIỆT (CINE_VVK) - Suất chiếu ngày 10/04 & 11/04 ---
('E082', 'ST_VK_001', N'Kỹ thuật viên'), ('E085', 'ST_VK_001', N'Soát vé'),
('E086', 'ST_VK_004', N'Kỹ thuật viên'), ('E087', 'ST_VK_004', N'Soát vé'),
('E093', 'ST_VK_006', N'Kỹ thuật viên'), ('E094', 'ST_VK_006', N'Soát vé'),
('E095', 'ST_VK_101', N'Kỹ thuật viên'), ('E096', 'ST_VK_101', N'Soát vé'),
('E097', 'ST_VK_104', N'Kỹ thuật viên'), ('E098', 'ST_VK_104', N'Soát vé'),
('E099', 'ST_VK_106', N'Kỹ thuật viên'), ('E100', 'ST_VK_106', N'Soát vé'),

-- --- RẠP HAI BÀ TRƯNG (CINE_HBT) - Suất chiếu ngày 10/04 & 11/04 ---
('E002', 'ST_HB_001', N'Kỹ thuật viên'), ('E005', 'ST_HB_001', N'Soát vé'),
('E006', 'ST_HB_005', N'Kỹ thuật viên'), ('E007', 'ST_HB_005', N'Soát vé'), -- Suất IMAX
('E011', 'ST_HB_007', N'Kỹ thuật viên'), ('E013', 'ST_HB_101', N'Kỹ thuật viên'),
('E014', 'ST_HB_101', N'Soát vé'), ('E015', 'ST_HB_105', N'Kỹ thuật viên'),
('E016', 'ST_HB_105', N'Soát vé'), ('E017', 'ST_HB_107', N'Kỹ thuật viên'),
('E018', 'ST_HB_002', N'Soát vé'), ('E019', 'ST_HB_102', N'Soát vé'),
('E020', 'ST_HB_006', N'Soát vé'),

-- --- RẠP QUẬN 7 (CINE_Q7) - Suất chiếu ngày 10/04 & 11/04 ---
('E022', 'ST_Q7_001', N'Kỹ thuật viên'), ('E025', 'ST_Q7_001', N'Soát vé'),
('E026', 'ST_Q7_003', N'Kỹ thuật viên'), ('E027', 'ST_Q7_003', N'Soát vé'),
('E028', 'ST_Q7_005', N'Kỹ thuật viên'), ('E033', 'ST_Q7_005', N'Soát vé'),
('E034', 'ST_Q7_101', N'Kỹ thuật viên'), ('E035', 'ST_Q7_101', N'Soát vé'),
('E036', 'ST_Q7_103', N'Kỹ thuật viên'), ('E037', 'ST_Q7_103', N'Soát vé'),
('E038', 'ST_Q7_105', N'Kỹ thuật viên'), ('E039', 'ST_Q7_105', N'Soát vé'),
('E040', 'ST_Q7_007', N'Soát vé');


GO

-- ==============================================================================================
-- SECTION 07 - CUSTOMER / ORDER / REVIEW / PAYMENT DATA
-- ==============================================================================================
USE BTL2;
GO

INSERT INTO PERSON (PersonID, FName, Minit, LName, PersonDOB, PersonGender, PersonEmail, PersonPhone, PersonHouseNo, PersonStreet, PersonWard, PersonCity)
VALUES
('P101', N'An', N'Thành', N'Nguyễn', '1996-03-14', N'Nam', 'an.nguyenthanh@gmail.com', '0907000101', N'71', N'Nam Kỳ Khởi Nghĩa', N'Phường Sài Gòn', N'Thành phố Hồ Chí Minh'),
('P102', N'Bình', N'Thị', N'Trần', '1998-07-22', N'Nữ', 'binh.tranthi@gmail.com', '0917000102', N'82', N'Nguyễn Thị Minh Khai', N'Phường Bến Thành', N'Thành phố Hồ Chí Minh'),
('P103', N'Cường', N'Hoài', N'Lê', '1994-11-09', N'Nam', 'cuong.lehoai@gmail.com', '0927000103', N'93', N'Lê Lai', N'Phường Bến Thành', N'Thành phố Hồ Chí Minh'),
('P104', N'Duyên', N'Ngọc', N'Phạm', '2000-01-18', N'Nữ', 'duyen.phamngoc@gmail.com', '0937000104', N'104', N'Nguyễn Du', N'Phường Sài Gòn', N'Thành phố Hồ Chí Minh'),
('P105', N'Em', N'Thị', N'Võ', '1997-05-30', N'Nữ', 'em.vothi@gmail.com', '0947000105', N'115', N'Hàm Nghi', N'Phường Sài Gòn', N'Thành phố Hồ Chí Minh'),
('P106', N'Phong', N'Quốc', N'Đặng', '1995-08-12', N'Nam', 'phong.dangquoc@gmail.com', '0957000106', N'126', N'Tôn Đức Thắng', N'Phường Sài Gòn', N'Thành phố Hồ Chí Minh'),
('P107', N'Giang', N'Thảo', N'Hồ', '1999-09-03', N'Nữ', 'giang.hothao@gmail.com', '0967000107', N'137', N'Calmette', N'Phường Sài Gòn', N'Thành phố Hồ Chí Minh'),
('P108', N'Hải', N'Minh', N'Bùi', '1993-12-25', N'Nam', 'hai.buiminh@gmail.com', '0977000108', N'148', N'Yersin', N'Phường Cầu Ông Lãnh', N'Thành phố Hồ Chí Minh'),
('P109', N'Khánh', N'Thu', N'Ngô', '2001-04-07', N'Nữ', 'khanh.ngothu@gmail.com', '0987000109', N'159', N'Võ Văn Kiệt', N'Phường Cầu Ông Lãnh', N'Thành phố Hồ Chí Minh'),
('P110', N'Lộc', N'Thanh', N'Dương', '1992-10-16', N'Nam', 'loc.duongthanh@gmail.com', '0997000110', N'170', N'Trần Đình Xu', N'Phường Nguyễn Cư Trinh', N'Thành phố Hồ Chí Minh'),
('P111', N'Mai', N'Phương', N'Nguyễn', '1998-02-11', N'Nữ', 'mai.nguyenphuong@gmail.com', '0907000111', N'181', N'Cống Quỳnh', N'Phường Nguyễn Cư Trinh', N'Thành phố Hồ Chí Minh'),
('P112', N'Nam', N'Gia', N'Trần', '1994-06-28', N'Nam', 'nam.trangia@gmail.com', '0917000112', N'192', N'Nguyễn Cư Trinh', N'Phường Nguyễn Cư Trinh', N'Thành phố Hồ Chí Minh'),
('P113', N'Oanh', N'Thị Mỹ', N'Lê', '2000-11-15', N'Nữ', 'oanh.lemy@gmail.com', '0927000113', N'203', N'An Dương Vương', N'Phường An Đông', N'Thành phố Hồ Chí Minh'),
('P114', N'Phúc', N'Hoàng', N'Phạm', '1996-01-05', N'Nam', 'phuc.phamhoang@gmail.com', '0937000114', N'214', N'Ngô Quyền', N'Phường An Đông', N'Thành phố Hồ Chí Minh'),
('P115', N'Quỳnh', N'Thanh', N'Võ', '1997-08-19', N'Nữ', 'quynh.vothanh@gmail.com', '0947000115', N'225', N'Trần Hưng Đạo', N'Phường Chợ Quán', N'Thành phố Hồ Chí Minh'),
('P116', N'Rang', N'Văn', N'Đỗ', '1993-03-22', N'Nam', 'rang.dovan@gmail.com', '0957000116', N'236', N'Nguyễn Tri Phương', N'Phường Chợ Quán', N'Thành phố Hồ Chí Minh'),
('P117', N'Sương', N'Thiên', N'Huỳnh', '1999-07-27', N'Nữ', 'suong.huynhthien@gmail.com', '0967000117', N'247', N'Hùng Vương', N'Phường Chợ Lớn', N'Thành phố Hồ Chí Minh'),
('P118', N'Tùng', N'Minh', N'Nguyễn', '1995-12-08', N'Nam', 'tung.nguyenminh@gmail.com', '0977000118', N'258', N'Châu Văn Liêm', N'Phường Chợ Lớn', N'Thành phố Hồ Chí Minh'),
('P119', N'Uyên', N'Ngọc', N'Trần', '2001-09-14', N'Nữ', 'uyen.tranngoc@gmail.com', '0987000119', N'269', N'Hải Thượng Lãn Ông', N'Phường Chợ Lớn', N'Thành phố Hồ Chí Minh'),
('P120', N'Vinh', N'Hoài', N'Lý', '1992-04-01', N'Nam', 'vinh.lyhoai@gmail.com', '0997000120', N'280', N'Triệu Quang Phục', N'Phường Chợ Lớn', N'Thành phố Hồ Chí Minh');

INSERT INTO CUSTOMER (PersonID, CustomerID)
VALUES
('P090', 'C090'),
('P091', 'C091'),
('P092', 'C092'),
('P093', 'C093'),
('P094', 'C094'),
('P095', 'C095'),
('P096', 'C096'),
('P097', 'C097'),
('P098', 'C098'),
('P099', 'C099'),
('P100', 'C100'),
('P101', 'C101'),
('P102', 'C102'),
('P103', 'C103'),
('P104', 'C104'),
('P105', 'C105'),
('P106', 'C106'),
('P107', 'C107'),
('P108', 'C108'),
('P109', 'C109'),
('P110', 'C110'),
('P111', 'C111'),
('P112', 'C112'),
('P113', 'C113'),
('P114', 'C114'),
('P115', 'C115'),
('P116', 'C116'),
('P117', 'C117'),
('P118', 'C118'),
('P119', 'C119'),
('P120', 'C120');
GO

INSERT INTO GUEST_CUSTOMER (PersonID)
VALUES
('P101'),
('P102'),
('P103'),
('P104'),
('P105'),
('P106'),
('P107'),
('P108'),
('P109'),
('P110');
GO

INSERT INTO REGISTERED_CUSTOMER
    (PersonID, Username, Email, Password, RegistrationDate, CurrentPoints, AccountStatus, CreatedAt)
VALUES
('P090', 'user090', 'user090@gmail.com', 'pass090', '2026-03-21', 130, 1, '2026-03-21'),
('P091', 'user091', 'user091@gmail.com', 'pass091', '2026-03-22',  95, 1, '2026-03-22'),
('P092', 'user092', 'user092@gmail.com', 'pass092', '2026-03-23', 160, 1, '2026-03-23'),
('P093', 'user093', 'user093@gmail.com', 'pass093', '2026-03-24',  40, 1, '2026-03-24'),
('P094', 'user094', 'user094@gmail.com', 'pass094', '2026-03-25', 120, 1, '2026-03-25'),
('P095', 'user095', 'user095@gmail.com', 'pass095', '2026-03-26',  15, 1, '2026-03-26'),
('P096', 'user096', 'user096@gmail.com', 'pass096', '2026-03-27', 180, 1, '2026-03-27'),
('P097', 'user097', 'user097@gmail.com', 'pass097', '2026-03-28',  65, 1, '2026-03-28'),
('P098', 'user098', 'user098@gmail.com', 'pass098', '2026-03-29', 145, 1, '2026-03-29'),
('P099', 'user099', 'user099@gmail.com', 'pass099', '2026-03-30',  30, 1, '2026-03-30'),
('P100', 'user100', 'user100@gmail.com', 'pass100', '2026-03-31', 210, 1, '2026-03-31'),
('P111', 'user111', 'user111@gmail.com', 'pass111', '2026-04-01',  55, 1, '2026-04-01'),
('P112', 'user112', 'user112@gmail.com', 'pass112', '2026-04-02',  80, 1, '2026-04-02'),
('P113', 'user113', 'user113@gmail.com', 'pass113', '2026-04-03',  25, 1, '2026-04-03'),
('P114', 'user114', 'user114@gmail.com', 'pass114', '2026-04-04', 140, 1, '2026-04-04'),
('P115', 'user115', 'user115@gmail.com', 'pass115', '2026-04-05',  60, 1, '2026-04-05'),
('P116', 'user116', 'user116@gmail.com', 'pass116', '2026-04-06', 200, 1, '2026-04-06'),
('P117', 'user117', 'user117@gmail.com', 'pass117', '2026-04-07',  35, 1, '2026-04-07'),
('P118', 'user118', 'user118@gmail.com', 'pass118', '2026-04-08', 170, 1, '2026-04-08'),
('P119', 'user119', 'user119@gmail.com', 'pass119', '2026-04-09',  90, 1, '2026-04-09'),
('P120', 'user120', 'user120@gmail.com', 'pass120', '2026-04-10', 125, 1, '2026-04-10');
GO

INSERT INTO [ORDER]
    (OrderID, OrderStatus, OrderDate, OrderNote, TotalAmount, PersonID)
VALUES
('O001',  1, '2026-04-01', N'Mua vé tại quầy',         120000, 'P101'),
('O002',  1, '2026-04-01', N'Mua vé tại quầy',         135000, 'P102'),
('O003',  1, '2026-04-02', N'Mua vé tại quầy',         150000, 'P103'),
('O004',  1, '2026-04-02', N'Mua vé tại quầy',         125000, 'P104'),
('O005',  1, '2026-04-03', N'Mua vé tại quầy',         140000, 'P105'),
('O006',  1, '2026-04-03', N'Mua vé tại quầy',         155000, 'P106'),
('O007',  1, '2026-04-04', N'Mua vé tại quầy',         130000, 'P107'),
('O008',  1, '2026-04-04', N'Mua vé tại quầy',         145000, 'P108'),
('O009',  1, '2026-04-05', N'Mua vé tại quầy',         160000, 'P109'),
('O010',  1, '2026-04-05', N'Mua vé tại quầy',         135000, 'P110'),
('O011',  1, '2026-04-06', N'Đặt vé online',           150000, 'P090'),
('O012',  1, '2026-04-06', N'Đặt vé online',           175000, 'P091'),
('O013',  1, '2026-04-07', N'Đặt vé online',           140000, 'P092'),
('O014',  1, '2026-04-07', N'Đặt vé online',           165000, 'P093'),
('O015',  1, '2026-04-08', N'Đặt vé online',           120000, 'P094'),
('O016',  1, '2026-04-08', N'Đặt vé online',           155000, 'P095'),
('O017',  1, '2026-04-09', N'Đặt vé online',           180000, 'P111'),
('O018',  1, '2026-04-10', N'Đặt vé online',           135000, 'P112'),
('O019',  1, '2026-04-10', N'Đặt vé online',           145000, 'P113'),
('O020',  1, '2026-04-10', N'Đặt vé online',           160000, 'P114'),
('O021',  1, '2026-04-11', N'Đặt vé online',           150000, 'P115'),
('O022',  1, '2026-04-11', N'Đặt vé suất tối',         170000, 'P096'),
('O023',  1, '2026-04-18', N'Mua thêm combo bắp nước', 245000, 'P096'),
('O024',  1, '2026-04-12', N'Đặt vé cuối tuần',        155000, 'P097'),
('O025',  1, '2026-04-19', N'Đặt 2 vé xem phim',       280000, 'P097'),
('O026',  1, '2026-04-12', N'Đặt vé online',           140000, 'P098'),
('O027',  1, '2026-04-20', N'Mua vé và nước uống',     210000, 'P098'),
('O028',  1, '2026-04-13', N'Đặt vé cuối tuần',        160000, 'P116'),
('O029',  1, '2026-04-21', N'Mua vé và combo',         235000, 'P116'),
('O030',  1, '2026-04-13', N'Đặt vé online',           145000, 'P117'),
('O031',  1, '2026-04-22', N'Đặt vé suất tối',         185000, 'P117'),
('O032',  1, '2026-04-14', N'Đặt vé cuối tuần',        150000, 'P118'),
('O033',  1, '2026-04-23', N'Đặt vé cho bạn bè',       260000, 'P118');
GO

INSERT INTO ONLINE_ORDER
    (OrderID, TicketIssuedAt, BookingPlatform, DeliveryMethod)
VALUES
('O011', '2026-04-06', N'Website',   N'Email'),
('O012', '2026-04-06', N'MobileApp', N'QR Code'),
('O013', '2026-04-07', N'Website',   N'Email'),
('O014', '2026-04-07', N'MobileApp', N'QR Code'),
('O015', '2026-04-08', N'Website',   N'Email'),
('O016', '2026-04-08', N'MobileApp', N'QR Code'),
('O017', '2026-04-09', N'MobileApp', N'Email'),
('O018', '2026-04-09', N'Website',   N'QR Code'),
('O019', '2026-04-10', N'MobileApp', N'Email'),
('O020', '2026-04-10', N'Website',   N'QR Code'),
('O021', '2026-04-11', N'Website',   N'Email'),
('O022', '2026-04-11', N'MobileApp', N'QR Code'),
('O023', '2026-04-18', N'Website',   N'Email'),
('O024', '2026-04-12', N'MobileApp', N'QR Code'),
('O025', '2026-04-19', N'Website',   N'Email'),
('O026', '2026-04-12', N'Website',   N'QR Code'),
('O027', '2026-04-20', N'MobileApp', N'Email'),
('O028', '2026-04-13', N'Website',   N'QR Code'),
('O029', '2026-04-21', N'MobileApp', N'Email'),
('O030', '2026-04-13', N'Website',   N'QR Code'),
('O031', '2026-04-22', N'MobileApp', N'Email'),
('O032', '2026-04-14', N'Website',   N'QR Code'),
('O033', '2026-04-23', N'MobileApp', N'Email');
GO

INSERT INTO IN_STORE_ORDER (OrderID)
VALUES
('O001'),
('O002'),
('O003'),
('O004'),
('O005'),
('O006'),
('O007'),
('O008'),
('O009'),
('O010');
GO

INSERT INTO TICKET_PRINT_INFO
    (OrderID, PrintCount, PrintTime, PrintReason, PrintStatus, PersonID)
VALUES
('O001', 1, '2026-04-01', N'In vé lần đầu',              1, 'P010'),
('O002', 1, '2026-04-01', N'In vé lần đầu',              1, 'P011'),
('O003', 1, '2026-04-02', N'In vé lần đầu',              1, 'P012'),
('O003', 2, '2026-04-02', N'In lại do rách vé',          1, 'P012'),
('O004', 1, '2026-04-02', N'In vé lần đầu',              1, 'P013'),
('O005', 1, '2026-04-03', N'In vé lần đầu',              1, 'P014'),
('O005', 2, '2026-04-03', N'In lại do mờ mã vé',         1, 'P014'),
('O006', 1, '2026-04-03', N'In vé lần đầu',              1, 'P029'),
('O007', 1, '2026-04-04', N'In vé lần đầu',              1, 'P030'),
('O008', 1, '2026-04-04', N'In vé lần đầu',              1, 'P031'),
('O008', 2, '2026-04-04', N'In lại do khách làm mất vé', 1, 'P031'),
('O009', 1, '2026-04-05', N'In vé lần đầu',              1, 'P032'),
('O010', 1, '2026-04-05', N'In vé lần đầu',              1, 'P033'),
('O010', 2, '2026-04-05', N'In lại do sai thông tin vé', 1, 'P033');
GO

INSERT INTO ORDER_DETAIL
    (OrderDetailID, OrderDetailQuantity, OrderDetailUnitPrice, OrderDetailSubtotal, OrderID, RequestID)
VALUES
    ('OD001', 1, 120000.00, 120000.00, 'O001',  NULL),
    ('OD002', 1, 135000.00, 135000.00, 'O002',  NULL),
    ('OD003', 1, 150000.00, 150000.00, 'O003',  NULL),
    ('OD004', 1, 125000.00, 125000.00, 'O004',  NULL),
    ('OD005', 1, 140000.00, 140000.00, 'O005',  NULL),
    ('OD006', 1, 155000.00, 155000.00, 'O006',  NULL),
    ('OD007', 1, 130000.00, 130000.00, 'O007',  NULL),
    ('OD008', 1, 145000.00, 145000.00, 'O008',  NULL),
    ('OD009', 1, 160000.00, 160000.00, 'O009',  NULL),
    ('OD010', 1, 135000.00, 135000.00, 'O010',  NULL),

    ('OD011', 1, 150000.00, 150000.00, 'O011',  NULL),
    ('OD012', 1, 175000.00, 175000.00, 'O012',  NULL),
    ('OD013', 1, 140000.00, 140000.00, 'O013',  NULL),
    ('OD014', 1, 165000.00, 165000.00, 'O014',  NULL),
    ('OD015', 1, 120000.00, 120000.00, 'O015',  NULL),
    ('OD016', 1, 155000.00, 155000.00, 'O016',  NULL),
    ('OD017', 1, 180000.00, 180000.00, 'O017',  NULL),
    ('OD018', 1, 135000.00, 135000.00, 'O018',  NULL),
    ('OD019', 1, 145000.00, 145000.00, 'O019',  NULL),
    ('OD020', 1, 160000.00, 160000.00, 'O020',  NULL),
    ('OD021', 1, 150000.00, 150000.00, 'O021',  NULL),
    ('OD022', 1, 170000.00, 170000.00, 'O022',  NULL),

    -- Order có nhiều detail
    ('OD023', 1, 135000.00, 135000.00, 'O023',  NULL),
    ('OD024', 2,  55000.00, 110000.00, 'O023',  NULL),

    ('OD025', 1, 155000.00, 155000.00, 'O024',  NULL),

    -- Quantity = 2
    ('OD026', 2, 140000.00, 280000.00, 'O025',  NULL),

    ('OD027', 1, 140000.00, 140000.00, 'O026',  NULL),

    -- Vé + nước uống
    ('OD028', 1, 150000.00, 150000.00, 'O027',  NULL),
    ('OD029', 1,  60000.00,  60000.00, 'O027',  NULL),

    ('OD030', 1, 160000.00, 160000.00, 'O028',  NULL),

    -- Vé + combo, chia thành 3 detail
    ('OD031', 1, 160000.00, 160000.00, 'O029',  NULL),
    ('OD032', 1,  45000.00,  45000.00, 'O029',  NULL),
    ('OD033', 1,  30000.00,  30000.00, 'O029',  NULL),

    ('OD034', 1, 145000.00, 145000.00, 'O030',  NULL),
    ('OD035', 1, 185000.00, 185000.00, 'O031',  NULL),
    ('OD036', 1, 150000.00, 150000.00, 'O032',  NULL),

    -- Đặt vé cho bạn bè
    ('OD037', 2, 130000.00, 260000.00, 'O033',  NULL);

    
INSERT INTO PRODUCT_DETAIL
    (OrderDetailID, ProductDetailProductNote, ProductDetailSizeOption, ProductID)
VALUES
    ('OD023', N'Combo bắp nước tiêu chuẩn', N'Combo', NULL),
    ('OD024', N'Thêm 2 nước ngọt',          N'M',     NULL),
    ('OD029', N'Nước uống đi kèm vé',        N'L',     NULL),
    ('OD032', N'Bắp rang bơ',                N'M',     NULL),
    ('OD033', N'Nước suối',                  N'S',     NULL);

INSERT INTO TICKET_DETAIL
    (OrderDetailID, TicketDetailTicketType, TicketDetailTicketPrice, ShowtimeID)
VALUES
    ('OD001', N'Người lớn', 120000.00, NULL),
    ('OD002', N'Người lớn', 135000.00, NULL),
    ('OD003', N'Người lớn', 150000.00, NULL),
    ('OD004', N'Sinh viên', 125000.00, NULL),
    ('OD005', N'Người lớn', 140000.00, NULL),
    ('OD006', N'Người lớn', 155000.00, NULL),
    ('OD007', N'Sinh viên', 130000.00, NULL),
    ('OD008', N'Người lớn', 145000.00, NULL),
    ('OD009', N'VIP',       160000.00, NULL),
    ('OD010', N'Người lớn', 135000.00, NULL),

    ('OD011', N'Người lớn', 150000.00, NULL),
    ('OD012', N'VIP',       175000.00, NULL),
    ('OD013', N'Người lớn', 140000.00, NULL),
    ('OD014', N'VIP',       165000.00, NULL),
    ('OD015', N'Sinh viên', 120000.00, NULL),
    ('OD016', N'Người lớn', 155000.00, NULL),
    ('OD017', N'VIP',       180000.00, NULL),
    ('OD018', N'Người lớn', 135000.00, NULL),
    ('OD019', N'Người lớn', 145000.00, NULL),
    ('OD020', N'VIP',       160000.00, NULL),
    ('OD021', N'Người lớn', 150000.00, NULL),
    ('OD022', N'VIP',       170000.00, NULL),

    ('OD025', N'Người lớn', 155000.00, NULL),
    ('OD026', N'Người lớn', 140000.00, NULL),
    ('OD027', N'Sinh viên', 140000.00, NULL),
    ('OD028', N'Người lớn', 150000.00, NULL),
    ('OD030', N'VIP',       160000.00, NULL),
    ('OD031', N'VIP',       160000.00, NULL),
    ('OD034', N'Người lớn', 145000.00, NULL),
    ('OD035', N'VIP',       185000.00, NULL),
    ('OD036', N'Người lớn', 150000.00, NULL),
    ('OD037', N'Người lớn', 130000.00, NULL);


INSERT INTO E_TICKET
    (TicketID, ETicketQRCode, ETicketStatus, ETicketCheckinTime, OrderDetailID, RowIndex, ColumnNumber, RoomNumber, CinemaID)
VALUES
    ('ET001', 'QR-ET001', N'Checked-in', '2026-04-06 18:40:00', 'OD011', 'A', 1, NULL, NULL),
    ('ET002', 'QR-ET002', N'Checked-in', '2026-04-06 20:10:00', 'OD012', 'A', 2, NULL, NULL),
    ('ET003', 'QR-ET003', N'Checked-in', '2026-04-07 19:00:00', 'OD013', 'A', 3, NULL, NULL),
    ('ET004', 'QR-ET004', N'Checked-in', '2026-04-07 21:15:00', 'OD014', 'A', 4, NULL, NULL),
    ('ET005', 'QR-ET005', N'Checked-in', '2026-04-08 14:05:00', 'OD015', 'B', 1, NULL, NULL),
    ('ET006', 'QR-ET006', N'Checked-in', '2026-04-08 18:55:00', 'OD016', 'B', 2, NULL, NULL),
    ('ET007', 'QR-ET007', N'Checked-in', '2026-04-09 20:45:00', 'OD017', 'B', 3, NULL, NULL),
    ('ET008', 'QR-ET008', N'Checked-in', '2026-04-09 16:30:00', 'OD018', 'B', 4, NULL, NULL),
    ('ET009', 'QR-ET009', N'Checked-in', '2026-04-10 19:20:00', 'OD019', 'C', 1, NULL, NULL),
    ('ET010', 'QR-ET010', N'Checked-in', '2026-04-10 20:50:00', 'OD020', 'C', 2, NULL, NULL),
    ('ET011', 'QR-ET011', N'Checked-in', '2026-04-11 19:05:00', 'OD021', 'C', 3, NULL, NULL),
    ('ET012', 'QR-ET012', N'Checked-in', '2026-04-11 21:00:00', 'OD022', 'C', 4, NULL, NULL),

    ('ET013', 'QR-ET013', N'Unused',     NULL,                    'OD025', 'D', 1, NULL, NULL),

    ('ET014', 'QR-ET014', N'Checked-in', '2026-04-19 18:35:00', 'OD026', 'D', 2, NULL, NULL),
    ('ET015', 'QR-ET015', N'Unused',     NULL,                    'OD026', 'D', 3, NULL, NULL),

    ('ET016', 'QR-ET016', N'Checked-in', '2026-04-12 20:15:00', 'OD027', 'E', 1, NULL, NULL),
    ('ET017', 'QR-ET017', N'Unused',     NULL,                    'OD028', 'E', 2, NULL, NULL),
    ('ET018', 'QR-ET018', N'Checked-in', '2026-04-13 19:10:00', 'OD030', 'E', 3, NULL, NULL),
    ('ET019', 'QR-ET019', N'Unused',     NULL,                    'OD031', 'E', 4, NULL, NULL),
    ('ET020', 'QR-ET020', N'Checked-in', '2026-04-13 21:05:00', 'OD034', 'F', 1, NULL, NULL),
    ('ET021', 'QR-ET021', N'Unused',     NULL,                    'OD035', 'F', 2, NULL, NULL),
    ('ET022', 'QR-ET022', N'Checked-in', '2026-04-14 18:50:00', 'OD036', 'F', 3, NULL, NULL),

    ('ET023', 'QR-ET023', N'Unused',     NULL,                    'OD037', 'F', 4, NULL, NULL),
    ('ET024', 'QR-ET024', N'Unused',     NULL,                    'OD037', 'F', 5, NULL, NULL);


INSERT INTO PRODUCT
    (ProductID, ProductStatus, BasePrice, ProductName, ProductType)
VALUES
    ('PR001', N'Đang bán', 135000.00, N'Combo bắp nước tiêu chuẩn', N'Combo'),
    ('PR002', N'Đang bán',  55000.00, N'Nước ngọt',                N'Nước'),
    ('PR003', N'Đang bán',  60000.00, N'Nước ngọt size lớn',       N'Nước'),
    ('PR004', N'Đang bán',  45000.00, N'Bắp rang bơ',              N'Bắp'),
    ('PR005', N'Đang bán',  30000.00, N'Nước suối',                N'Nước');

    



UPDATE PRODUCT_DETAIL
SET ProductID = 'PR001'
WHERE OrderDetailID = 'OD023';

UPDATE PRODUCT_DETAIL
SET ProductID = 'PR002'
WHERE OrderDetailID = 'OD024';

UPDATE PRODUCT_DETAIL
SET ProductID = 'PR003'
WHERE OrderDetailID = 'OD029';

UPDATE PRODUCT_DETAIL
SET ProductID = 'PR004'
WHERE OrderDetailID = 'OD032';

UPDATE PRODUCT_DETAIL
SET ProductID = 'PR005'
WHERE OrderDetailID = 'OD033';


UPDATE E_TICKET
SET
    RoomNumber = CASE
        WHEN TicketID IN ('ET001','ET002','ET003','ET004') THEN 'R_Q7_01'
        WHEN TicketID IN ('ET005','ET006','ET007','ET008') THEN 'R_SV_01'
        WHEN TicketID IN ('ET009','ET010','ET011','ET012') THEN 'R_VVK_01'
        WHEN TicketID IN ('ET013','ET014','ET015')         THEN 'R01'
        WHEN TicketID IN ('ET016','ET017','ET018','ET019') THEN 'R_HBT_01'
        WHEN TicketID IN ('ET020','ET021','ET022')         THEN 'R_Q7_02'
        WHEN TicketID IN ('ET023','ET024')                 THEN 'R_Q7_03'
    END,
    CinemaID = CASE
        WHEN TicketID IN ('ET001','ET002','ET003','ET004') THEN 'CINE_Q7'
        WHEN TicketID IN ('ET005','ET006','ET007','ET008') THEN 'CINE_SV'
        WHEN TicketID IN ('ET009','ET010','ET011','ET012') THEN 'CINE_VVK'
        WHEN TicketID IN ('ET013','ET014','ET015')         THEN 'CINE_QT'
        WHEN TicketID IN ('ET016','ET017','ET018','ET019') THEN 'CINE_HBT'
        WHEN TicketID IN ('ET020','ET021','ET022')         THEN 'CINE_Q7'
        WHEN TicketID IN ('ET023','ET024')                 THEN 'CINE_Q7'
    END
WHERE TicketID IN
(
    'ET001','ET002','ET003','ET004',
    'ET005','ET006','ET007','ET008',
    'ET009','ET010','ET011','ET012',
    'ET013','ET014','ET015',
    'ET016','ET017','ET018','ET019',
    'ET020','ET021','ET022',
    'ET023','ET024'
);


INSERT INTO REVIEW
    (ReviewID, PersonID, Content, ReviewTime, ReviewNumOfStars)
VALUES
    ('RV001', 'P090', N'Đặt vé nhanh, giao diện dễ dùng, quá trình thanh toán rất thuận tiện.', '2026-04-12 20:15:00', 5),
    ('RV002', 'P091', N'Nhân viên hỗ trợ tốt, xử lý đơn tại quầy nhanh và rõ ràng.',             '2026-04-12 21:10:00', 4),
    ('RV003', 'P093', N'Đặt vé online khá ổn, nhận mã vé nhanh nhưng giờ cao điểm hơi chậm.',    '2026-04-13 19:45:00', 4),
    ('RV004', 'P096', N'Combo bắp nước ổn, phần bắp giòn và nước vừa vị.',                        '2026-04-18 21:00:00', 4),
    ('RV005', 'P097', N'Đặt online tiện, nhận mã QR nhanh và không gặp lỗi khi check-in.',        '2026-04-19 22:10:00', 5),
    ('RV006', 'P098', N'Nước ngọt uống ổn, lạnh vừa phải và kích cỡ đúng như mong đợi.',          '2026-04-20 20:40:00', 4),
    ('RV007', 'P111', N'Giá vé hợp lý, thao tác đặt và thanh toán nhìn chung khá mượt.',          '2026-04-21 18:30:00', 5),
    ('RV008', 'P114', N'Bắp rang bơ thơm nhưng hơi ít, ăn vẫn ngon.',                              '2026-04-22 21:25:00', 3),
    ('RV009', 'P116', N'Combo bắp nước khá đáng tiền, phần ăn vừa đủ và phục vụ nhanh.',         '2026-04-23 19:50:00', 5),
    ('RV010', 'P118', N'Nước suối giá hơi cao so với bên ngoài nhưng tiện khi mua kèm vé.',      '2026-04-24 20:05:00', 3);

INSERT INTO ORDER_REVIEW
    (ReviewID, OrderID)
VALUES
    ('RV001', 'O011'),
    ('RV002', 'O012'),
    ('RV003', 'O014'),
    ('RV005', 'O025'),
    ('RV007', 'O017');

INSERT INTO PRODUCT_REVIEW
    (ReviewID, ProductID)
VALUES
    ('RV004', 'PR001'),
    ('RV006', 'PR002'),
    ('RV008', 'PR004'),
    ('RV009', 'PR001'),
    ('RV010', 'PR005');


INSERT INTO PAYMENT_TRANSACTION
    (TransactionID, PaymentTransactionAmount, PaymentTransactionPaymentTime,
     PaymentTransactionPaymentStatus, PaymentTransactionMethod, PaymentTransactionReferenceID, OrderID)
VALUES
    ('PT001', 120000.00, '2026-04-01 10:15:00', N'Success', N'Cash',        'REF_O001', 'O001'),
    ('PT002', 135000.00, '2026-04-01 11:05:00', N'Success', N'Card',        'REF_O002', 'O002'),
    ('PT003', 150000.00, '2026-04-02 13:20:00', N'Success', N'Cash',        'REF_O003', 'O003'),
    ('PT004', 125000.00, '2026-04-02 15:10:00', N'Success', N'Cash',        'REF_O004', 'O004'),
    ('PT005', 140000.00, '2026-04-03 09:40:00', N'Success', N'Card',        'REF_O005', 'O005'),
    ('PT006', 155000.00, '2026-04-03 18:00:00', N'Success', N'Cash',        'REF_O006', 'O006'),
    ('PT007', 130000.00, '2026-04-04 14:25:00', N'Success', N'Cash',        'REF_O007', 'O007'),
    ('PT008', 145000.00, '2026-04-04 20:30:00', N'Success', N'Card',        'REF_O008', 'O008'),
    ('PT009', 160000.00, '2026-04-05 16:45:00', N'Success', N'Cash',        'REF_O009', 'O009'),
    ('PT010', 135000.00, '2026-04-05 19:10:00', N'Success', N'Card',        'REF_O010', 'O010'),

    ('PT011', 150000.00, '2026-04-06 08:50:00', N'Success', N'Momo',        'REF_O011', 'O011'),
    ('PT012', 175000.00, '2026-04-06 09:15:00', N'Success', N'Banking',     'REF_O012', 'O012'),
    ('PT013', 140000.00, '2026-04-07 10:05:00', N'Success', N'Credit Card', 'REF_O013', 'O013'),
    ('PT014', 165000.00, '2026-04-07 11:40:00', N'Success', N'Momo',        'REF_O014', 'O014'),
    ('PT015', 120000.00, '2026-04-08 13:00:00', N'Success', N'Banking',     'REF_O015', 'O015'),
    ('PT016', 155000.00, '2026-04-08 15:20:00', N'Success', N'Credit Card', 'REF_O016', 'O016'),
    ('PT017', 180000.00, '2026-04-09 17:10:00', N'Success', N'Momo',        'REF_O017', 'O017'),
    ('PT018', 135000.00, '2026-04-09 18:25:00', N'Success', N'Banking',     'REF_O018', 'O018'),
    ('PT019', 145000.00, '2026-04-10 12:35:00', N'Success', N'Credit Card', 'REF_O019', 'O019'),
    ('PT020', 160000.00, '2026-04-10 14:50:00', N'Success', N'Momo',        'REF_O020', 'O020'),
    ('PT021', 150000.00, '2026-04-11 09:05:00', N'Success', N'Banking',     'REF_O021', 'O021'),
    ('PT022', 170000.00, '2026-04-11 10:30:00', N'Success', N'Credit Card', 'REF_O022', 'O022'),
    ('PT023', 245000.00, '2026-04-18 19:15:00', N'Success', N'Momo',        'REF_O023', 'O023'),
    ('PT024', 155000.00, '2026-04-12 16:20:00', N'Success', N'Banking',     'REF_O024', 'O024'),
    ('PT025', 280000.00, '2026-04-19 18:10:00', N'Success', N'Credit Card', 'REF_O025', 'O025'),
    ('PT026', 140000.00, '2026-04-12 20:40:00', N'Success', N'Momo',        'REF_O026', 'O026'),
    ('PT027', 210000.00, '2026-04-20 14:05:00', N'Success', N'Banking',     'REF_O027', 'O027'),
    ('PT028', 160000.00, '2026-04-13 09:55:00', N'Success', N'Credit Card', 'REF_O028', 'O028'),
    ('PT029', 235000.00, '2026-04-21 11:25:00', N'Success', N'Momo',        'REF_O029', 'O029'),
    ('PT030', 145000.00, '2026-04-13 15:45:00', N'Success', N'Banking',     'REF_O030', 'O030'),
    ('PT031', 185000.00, '2026-04-22 18:35:00', N'Success', N'Credit Card', 'REF_O031', 'O031'),
    ('PT032', 150000.00, '2026-04-14 17:20:00', N'Success', N'Momo',        'REF_O032', 'O032'),
    ('PT033', 260000.00, '2026-04-23 19:00:00', N'Success', N'Banking',     'REF_O033', 'O033');


INSERT INTO REFUND_EXCHANGE_REQUEST
    (RequestID, RequestType, RequestReason, RequestProcessTime, RequestStatus, RequestActualRefundAmount, PersonID)
VALUES
    ('REQ001', N'Refund',  N'Khách chọn nhầm suất chiếu và yêu cầu hoàn tiền.',              '2026-04-13 10:30:00', N'Approved',   155000.00, 'P097'),
    ('REQ002', N'Exchange',N'Khách muốn đổi sang ghế khác cùng suất chiếu.',                '2026-04-12 21:00:00', N'Approved',        NULL, 'P098'),
    ('REQ003', N'Refund',  N'Nước uống giao sai size, khách yêu cầu hoàn tiền.',            '2026-04-20 14:30:00', N'Approved',    60000.00, 'P098'),
    ('REQ004', N'Refund',  N'Khách đến trễ giờ chiếu nên yêu cầu hoàn tiền.',               '2026-04-22 19:10:00', N'Rejected',        NULL, 'P116'),
    ('REQ005', N'Exchange',N'Khách muốn đổi 2 vé sang suất chiếu khác.',                    NULL,                  N'Processing',      NULL, 'P118'),
    ('REQ006', N'Refund',  N'Bắp rang bị nguội, khách yêu cầu hoàn tiền sản phẩm.',         '2026-04-21 11:50:00', N'Approved',    45000.00, 'P116');


UPDATE ORDER_DETAIL SET RequestID = 'REQ001' WHERE OrderDetailID = 'OD025';
UPDATE ORDER_DETAIL SET RequestID = 'REQ002' WHERE OrderDetailID = 'OD028';
UPDATE ORDER_DETAIL SET RequestID = 'REQ003' WHERE OrderDetailID = 'OD029';
UPDATE ORDER_DETAIL SET RequestID = 'REQ004' WHERE OrderDetailID = 'OD030';
UPDATE ORDER_DETAIL SET RequestID = 'REQ005' WHERE OrderDetailID = 'OD037';
UPDATE ORDER_DETAIL SET RequestID = 'REQ006' WHERE OrderDetailID = 'OD032';

INSERT INTO POINT_HISTORY
    (HistoryID, PointChange, PointReason, PointTimeStamp, PersonID, OrderID)
VALUES
    ('PH001',   50, N'Thưởng đăng ký tài khoản mới',                '2026-03-21 09:00:00', 'P090', NULL),
    ('PH002',   15, N'Tích điểm từ đơn hàng O011',                  '2026-04-06 09:10:00', 'P090', 'O011'),

    ('PH003',   50, N'Thưởng đăng ký tài khoản mới',                '2026-03-22 09:15:00', 'P091', NULL),
    ('PH004',   18, N'Tích điểm từ đơn hàng O012',                  '2026-04-06 09:30:00', 'P091', 'O012'),

    ('PH005',   14, N'Tích điểm từ đơn hàng O013',                  '2026-04-07 10:20:00', 'P092', 'O013'),
    ('PH006',   17, N'Tích điểm từ đơn hàng O014',                  '2026-04-07 11:55:00', 'P093', 'O014'),
    ('PH007',   12, N'Tích điểm từ đơn hàng O015',                  '2026-04-08 13:10:00', 'P094', 'O015'),
    ('PH008',   16, N'Tích điểm từ đơn hàng O016',                  '2026-04-08 15:35:00', 'P095', 'O016'),

    ('PH009',   17, N'Tích điểm từ đơn hàng O022',                  '2026-04-11 10:45:00', 'P096', 'O022'),
    ('PH010',   25, N'Tích điểm từ đơn hàng O023',                  '2026-04-18 19:25:00', 'P096', 'O023'),

    ('PH011',   16, N'Tích điểm từ đơn hàng O024',                  '2026-04-12 16:35:00', 'P097', 'O024'),
    ('PH012',   28, N'Tích điểm từ đơn hàng O025',                  '2026-04-19 18:20:00', 'P097', 'O025'),
    ('PH013',  -20, N'Sử dụng điểm giảm giá cho đơn hàng tiếp theo', '2026-04-20 09:00:00', 'P097', NULL),

    ('PH014',   14, N'Tích điểm từ đơn hàng O026',                  '2026-04-12 20:50:00', 'P098', 'O026'),
    ('PH015',   21, N'Tích điểm từ đơn hàng O027',                  '2026-04-20 14:15:00', 'P098', 'O027'),

    ('PH016',   18, N'Tích điểm từ đơn hàng O017',                  '2026-04-09 17:25:00', 'P111', 'O017'),
    ('PH017',   14, N'Tích điểm từ đơn hàng O018',                  '2026-04-09 18:40:00', 'P112', 'O018'),
    ('PH018',   15, N'Tích điểm từ đơn hàng O019',                  '2026-04-10 12:50:00', 'P113', 'O019'),
    ('PH019',   16, N'Tích điểm từ đơn hàng O020',                  '2026-04-10 15:05:00', 'P114', 'O020'),
    ('PH020',   15, N'Tích điểm từ đơn hàng O021',                  '2026-04-11 09:20:00', 'P115', 'O021'),

    ('PH021',   16, N'Tích điểm từ đơn hàng O028',                  '2026-04-13 10:05:00', 'P116', 'O028'),
    ('PH022',   24, N'Tích điểm từ đơn hàng O029',                  '2026-04-21 11:35:00', 'P116', 'O029'),

    ('PH023',   15, N'Tích điểm từ đơn hàng O030',                  '2026-04-13 16:00:00', 'P117', 'O030'),
    ('PH024',   19, N'Tích điểm từ đơn hàng O031',                  '2026-04-22 18:45:00', 'P117', 'O031'),

    ('PH025',   15, N'Tích điểm từ đơn hàng O032',                  '2026-04-14 17:35:00', 'P118', 'O032'),
    ('PH026',   26, N'Tích điểm từ đơn hàng O033',                  '2026-04-23 19:10:00', 'P118', 'O033'),

    ('PH027',   30, N'Thưởng sinh nhật thành viên',                  '2026-04-09 08:00:00', 'P119', NULL),
    ('PH028',   25, N'Thưởng tham gia chương trình khách hàng thân thiết', '2026-04-10 08:30:00', 'P120', NULL);

-------------------------------------------------------------------------------------------------------------------------

INSERT INTO VOUCHER
    (VoucherID, VoucherDiscountType, VoucherValue, VoucherApplyCondition, VoucherExpiresAt, VoucherStatus)
VALUES
    ('V001', N'Percent',     10.00,    N'Áp dụng cho đơn từ 100000 VND',        '2026-05-31 23:59:59', N'Active'),
    ('V002', N'Percent',     15.00,    N'Áp dụng cho đơn từ 150000 VND',        '2026-05-15 23:59:59', N'Active'),
    ('V003', N'FixedAmount', 20000.00, N'Áp dụng cho đơn từ 120000 VND',        '2026-05-20 23:59:59', N'Active'),
    ('V004', N'FixedAmount', 30000.00, N'Áp dụng cho đơn từ 200000 VND',        '2026-05-25 23:59:59', N'Active'),
    ('V005', N'Percent',     20.00,    N'Áp dụng cho khách hàng thành viên',    '2026-04-30 23:59:59', N'Active'),
    ('V006', N'FixedAmount', 50000.00, N'Áp dụng cho đơn từ 300000 VND',        '2026-03-31 23:59:59', N'Expired'),
    ('V007', N'Percent',      5.00,    N'Áp dụng cho mọi đơn hàng online',      '2026-06-10 23:59:59', N'Active'),
    ('V008', N'FixedAmount', 25000.00, N'Áp dụng cho suất chiếu cuối tuần',     '2026-05-10 23:59:59', N'Disabled');

INSERT INTO APPLY
    (VoucherID, OrderID, DiscountAmount)
VALUES
    ('V001', 'O001', 12000.00),   -- 10% của 120000
    ('V003', 'O015', 20000.00),   -- fixed 20000
    ('V002', 'O012', 26250.00),   -- 15% của 175000
    ('V005', 'O017', 36000.00),   -- 20% của 180000
    ('V007', 'O021',  7500.00),   -- 5% của 150000
    ('V004', 'O023', 30000.00),   -- fixed 30000
    ('V002', 'O024', 23250.00),   -- 15% của 155000
    ('V004', 'O027', 30000.00),   -- fixed 30000
    ('V005', 'O029', 47000.00),   -- 20% của 235000
    ('V004', 'O033', 30000.00);   -- fixed 30000

INSERT INTO SERVICE_REQUEST
    (ServiceRequestID, RowIndex, ColumnNumber, OrderID, Note, Status, Time, RoomNumber, CinemaID)
VALUES
    ('SR001', 'D', 2, 'O025', N'Khách muốn kiểm tra lại ghế do ngồi nhầm vị trí.',      N'Completed',  '2026-04-19 18:25:00', 'R01',      'CINE_QT'),
    ('SR002', 'E', 2, 'O028', N'Khách yêu cầu hỗ trợ đổi ghế gần lối đi.',              N'Pending',    '2026-04-13 10:10:00', 'R_HBT_01', 'CINE_HBT'),
    ('SR003', NULL, NULL, 'O023', N'Khách yêu cầu mang thêm khăn giấy tại chỗ ngồi.',   N'Completed',  '2026-04-18 19:40:00', NULL,       NULL),
    ('SR004', 'F', 4, 'O033', N'Khách báo ghế có vấn đề, cần nhân viên kiểm tra.',      N'Completed',  '2026-04-23 19:20:00', 'R_Q7_03',  'CINE_Q7'),
    ('SR005', NULL, NULL, 'O017', N'Khách cần hỗ trợ kiểm tra mã vé điện tử.',          N'Completed',  '2026-04-09 17:20:00', NULL,       NULL),
    ('SR006', 'E', 3, 'O030', N'Khách muốn đổi sang ghế trung tâm nếu còn trống.',      N'Canceled',   '2026-04-13 16:05:00', 'R_Q7_02',  'CINE_Q7'),
    ('SR007', 'B', 3, 'O017', N'Khách yêu cầu hỗ trợ vì ghế ngồi bị bẩn.',              N'InProgress', '2026-04-09 17:30:00', 'R_SV_01',  'CINE_SV'),
    ('SR008', NULL, NULL, 'O029', N'Khách hỏi về combo áp dụng cho đơn hàng hiện tại.', N'Pending',    '2026-04-21 11:40:00', NULL,       NULL);


-- Sửa lại bảng PRODUCT --

DECLARE @ProductBasePriceCK SYSNAME;

SELECT TOP (1) @ProductBasePriceCK = cc.name
FROM sys.check_constraints AS cc
JOIN sys.objects AS o
    ON cc.parent_object_id = o.object_id
JOIN sys.columns AS c
    ON c.object_id = o.object_id
   AND c.column_id = cc.parent_column_id
WHERE o.name = 'PRODUCT'
  AND c.name = 'BasePrice';

IF @ProductBasePriceCK IS NOT NULL
BEGIN
    DECLARE @sqlDropProductCK NVARCHAR(MAX);
    SET @sqlDropProductCK = N'ALTER TABLE PRODUCT DROP CONSTRAINT ' + QUOTENAME(@ProductBasePriceCK) + N';';
    EXEC sp_executesql @sqlDropProductCK;
END;
GO

ALTER TABLE PRODUCT
ALTER COLUMN ProductName NVARCHAR(100) NOT NULL;

ALTER TABLE PRODUCT
ALTER COLUMN ProductType NVARCHAR(50) NOT NULL;

ALTER TABLE PRODUCT
ALTER COLUMN BasePrice DECIMAL(12,2) NOT NULL;

ALTER TABLE PRODUCT
ALTER COLUMN ProductStatus NVARCHAR(30) NOT NULL;

UPDATE PRODUCT
SET ProductStatus = N'Đang bán'
WHERE ProductStatus = 'Available';

UPDATE PRODUCT
SET ProductStatus = N'Tạm ngừng'
WHERE ProductStatus = 'Unavailable';

UPDATE PRODUCT
SET ProductStatus = N'Ngừng kinh doanh'
WHERE ProductStatus = 'Discontinued';

UPDATE PRODUCT
SET ProductType = N'Nước'
WHERE ProductType = 'Drink';

UPDATE PRODUCT
SET ProductType = N'Bắp'
WHERE ProductType = 'Food';

UPDATE PRODUCT
SET ProductType = N'Combo'
WHERE ProductType = 'Combo';

UPDATE PRODUCT
SET ProductType = N'Khác'
WHERE ProductType NOT IN (N'Bắp', N'Nước', N'Combo', N'Khác');

ALTER TABLE PRODUCT
ADD CONSTRAINT CK_PRODUCT_ProductName_NotEmpty
CHECK (LEN(LTRIM(RTRIM(ProductName))) > 0);

ALTER TABLE PRODUCT
ADD CONSTRAINT CK_PRODUCT_ProductType
CHECK (ProductType IN (N'Bắp', N'Nước', N'Combo', N'Khác'));

ALTER TABLE PRODUCT
ADD CONSTRAINT CK_PRODUCT_BasePrice
CHECK (BasePrice >= 0);

ALTER TABLE PRODUCT
ADD CONSTRAINT CK_PRODUCT_ProductStatus
CHECK (ProductStatus IN (N'Đang bán', N'Tạm ngừng', N'Ngừng kinh doanh'));

-- UPDATE Data cho bảng ORDER --
WITH DetailTotal AS (
    SELECT 
        OrderID,
        SUM(OrderDetailSubtotal) AS DetailSum
    FROM ORDER_DETAIL
    GROUP BY OrderID
),
DiscountTotal AS (
    SELECT 
        OrderID,
        SUM(DiscountAmount) AS DiscountSum
    FROM APPLY
    GROUP BY OrderID
)
UPDATE o
SET o.TotalAmount = CAST(
    COALESCE(dt.DetailSum, 0) - COALESCE(ap.DiscountSum, 0)
    AS INT
)
FROM [ORDER] o
LEFT JOIN DetailTotal dt ON o.OrderID = dt.OrderID
LEFT JOIN DiscountTotal ap ON o.OrderID = ap.OrderID;


-- ==============================================================================================
-- SECTION 99 - PATCH BO SUNG GIA TRI KHONG NULL CHO TICKET_DETAIL / SERVICE_REQUEST
-- Muc tieu: chi bo sung du lieu dang NULL bang cac khoa ngoai hop le, KHONG doi schema / logic bang.
-- ==============================================================================================

UPDATE TICKET_DETAIL
SET ShowtimeID = CASE OrderDetailID
    WHEN 'OD001' THEN 'ST_Q7_001'
    WHEN 'OD002' THEN 'ST_Q7_002'
    WHEN 'OD003' THEN 'ST_Q7_003'
    WHEN 'OD004' THEN 'ST_Q7_004'
    WHEN 'OD005' THEN 'ST_SV_004'
    WHEN 'OD006' THEN 'ST_SV_005'
    WHEN 'OD007' THEN 'ST_SV_007'
    WHEN 'OD008' THEN 'ST_SV_009'
    WHEN 'OD009' THEN 'ST_VK_001'
    WHEN 'OD010' THEN 'ST_VK_002'

    WHEN 'OD011' THEN 'ST_Q7_101'
    WHEN 'OD012' THEN 'ST_Q7_102'
    WHEN 'OD013' THEN 'ST_Q7_101'
    WHEN 'OD014' THEN 'ST_Q7_102'

    WHEN 'OD015' THEN 'ST_SV_101'
    WHEN 'OD016' THEN 'ST_SV_102'
    WHEN 'OD017' THEN 'ST_SV_103'
    WHEN 'OD018' THEN 'ST_SV_104'

    WHEN 'OD019' THEN 'ST_VK_101'
    WHEN 'OD020' THEN 'ST_VK_102'
    WHEN 'OD021' THEN 'ST_VK_103'
    WHEN 'OD022' THEN 'ST_VK_101'

    WHEN 'OD025' THEN 'ST_QT_101'
    WHEN 'OD026' THEN 'ST_QT_103'
    WHEN 'OD027' THEN 'ST_HB_101'
    WHEN 'OD028' THEN 'ST_HB_102'

    WHEN 'OD030' THEN 'ST_Q7_103'
    WHEN 'OD031' THEN 'ST_HB_101'
    WHEN 'OD034' THEN 'ST_Q7_104'
    WHEN 'OD035' THEN 'ST_Q7_103'
    WHEN 'OD036' THEN 'ST_Q7_104'
    WHEN 'OD037' THEN 'ST_Q7_105'
    ELSE ShowtimeID
END
WHERE ShowtimeID IS NULL;

UPDATE SERVICE_REQUEST
SET
    RowIndex = 'D',
    ColumnNumber = 1,
    RoomNumber = 'R01',
    CinemaID = 'CINE_QT'
WHERE ServiceRequestID = 'SR003'
  AND (RowIndex IS NULL OR ColumnNumber IS NULL OR RoomNumber IS NULL OR CinemaID IS NULL);

UPDATE SERVICE_REQUEST
SET
    RowIndex = 'B',
    ColumnNumber = 3,
    RoomNumber = 'R_SV_01',
    CinemaID = 'CINE_SV'
WHERE ServiceRequestID = 'SR005'
  AND (RowIndex IS NULL OR ColumnNumber IS NULL OR RoomNumber IS NULL OR CinemaID IS NULL);

UPDATE SERVICE_REQUEST
SET
    RowIndex = 'E',
    ColumnNumber = 4,
    RoomNumber = 'R_HBT_01',
    CinemaID = 'CINE_HBT'
WHERE ServiceRequestID = 'SR008'
  AND (RowIndex IS NULL OR ColumnNumber IS NULL OR RoomNumber IS NULL OR CinemaID IS NULL);







