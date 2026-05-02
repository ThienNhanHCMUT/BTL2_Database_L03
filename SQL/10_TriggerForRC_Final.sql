
----------------------------------------------------------------------------
------------------- Trigger for RC4 & RC9 ---------------------
----------------------------------------------------------------------------
CREATE OR ALTER TRIGGER trg_Check_Apply_Rules
ON APPLY
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    -- RC9: voucher phải còn hiệu lực tại thời điểm áp dụng
    IF EXISTS (
        SELECT 1
        FROM inserted i
        JOIN VOUCHER v ON i.VoucherID = v.VoucherID
        WHERE v.VoucherStatus <> N'Active'
           OR GETDATE() > v.VoucherExpiresAt
    )
    BEGIN
        RAISERROR (N'Voucher không còn hiệu lực hoặc đã hết hạn tại thời điểm áp dụng.', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END;

    -- RC4: tổng giảm giá không được vượt quá tổng giá trị gốc của đơn
    IF EXISTS (
        SELECT 1
        FROM (
            SELECT 
                a.OrderID,
                SUM(a.DiscountAmount) AS TotalDiscount
            FROM APPLY a
            JOIN (
                SELECT OrderID FROM inserted
            ) ao ON a.OrderID = ao.OrderID
            GROUP BY a.OrderID
        ) d
        JOIN (
            SELECT 
                od.OrderID,
                SUM(od.OrderDetailSubtotal) AS GrossAmount
            FROM ORDER_DETAIL od
            JOIN (
                SELECT OrderID FROM inserted
            ) ao ON od.OrderID = ao.OrderID
            GROUP BY od.OrderID
        ) g
        ON d.OrderID = g.OrderID
        WHERE d.TotalDiscount > g.GrossAmount
    )
    BEGIN
        RAISERROR (N'Tổng DiscountAmount của đơn hàng không được vượt quá giá trị gốc của đơn.', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END;
END;
GO


----------------------------------------------------------------------------
----------------------------- Trigger for RC5 ------------------------------
----------------------------------------------------------------------------
CREATE OR ALTER TRIGGER trg_Check_GuestCustomer_NoPoints
ON POINT_HISTORY
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (
        SELECT 1
        FROM inserted i
        JOIN GUEST_CUSTOMER g ON i.PersonID = g.PersonID
    )
    BEGIN
        RAISERROR (N'Khách vãng lai không được tích điểm hoặc lưu lịch sử điểm.', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END;

    IF EXISTS (
        SELECT 1
        FROM inserted i
        LEFT JOIN REGISTERED_CUSTOMER r ON i.PersonID = r.PersonID
        WHERE r.PersonID IS NULL
    )
    BEGIN
        RAISERROR (N'Chỉ khách hàng thành viên mới được phép có lịch sử điểm.', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END;
END;
GO

----------------------------------------------------------------------------
----------------------------- Trigger for RC7 ------------------------------
----------------------------------------------------------------------------
CREATE OR ALTER TRIGGER trg_Check_ETicket_OneCheckinOnly
ON E_TICKET
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    -- Nếu trạng thái là Checked-in thì bắt buộc phải có thời gian check-in
    IF EXISTS (
        SELECT 1
        FROM inserted
        WHERE ETicketStatus = N'Checked-in'
          AND ETicketCheckinTime IS NULL
    )
    BEGIN
        RAISERROR (N'Vé ở trạng thái Checked-in phải có ETicketCheckinTime.', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END;

    -- Nếu vé đã check-in rồi thì không được check-in lại / đổi ngược trạng thái
    IF EXISTS (
        SELECT 1
        FROM inserted i
        JOIN deleted d ON i.TicketID = d.TicketID
        WHERE (d.ETicketStatus = N'Checked-in' OR d.ETicketCheckinTime IS NOT NULL)
          AND (
                i.ETicketStatus <> N'Checked-in'
             OR i.ETicketCheckinTime IS NULL
             OR ISNULL(CONVERT(VARCHAR(23), i.ETicketCheckinTime, 121), '')
                <> ISNULL(CONVERT(VARCHAR(23), d.ETicketCheckinTime, 121), '')
          )
    )
    BEGIN
        RAISERROR (N'Mỗi vé chỉ được check-in thành công đúng một lần.', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END;
END;
GO

----------------------------------------------------------------------------
------------------------Trigger for RC10 -----------------------------------
----------------------------------------------------------------------------
CREATE OR ALTER TRIGGER trg_Check_OrderReview_Condition
ON ORDER_REVIEW
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (
        SELECT 1
        FROM inserted i
        JOIN REVIEW r ON i.ReviewID = r.ReviewID
        JOIN [ORDER] o ON i.OrderID = o.OrderID
        WHERE r.PersonID <> o.PersonID
           OR NOT EXISTS (
                SELECT 1
                FROM PAYMENT_TRANSACTION p
                WHERE p.OrderID = o.OrderID
                  AND p.PaymentTransactionPaymentStatus = N'Success'
           )
    )
    BEGIN
        THROW 50004,
              N'Chỉ chủ đơn hàng đã thanh toán thành công mới được gửi ORDER_REVIEW.',
              1;
    END;
END;
GO

CREATE OR ALTER TRIGGER trg_Check_ProductReview_Condition
ON PRODUCT_REVIEW
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (
        SELECT 1
        FROM inserted i
        JOIN REVIEW r ON i.ReviewID = r.ReviewID
        WHERE NOT EXISTS (
            SELECT 1
            FROM [ORDER] o
            JOIN PAYMENT_TRANSACTION p 
                ON p.OrderID = o.OrderID
               AND p.PaymentTransactionPaymentStatus = N'Success'
            JOIN ORDER_DETAIL od 
                ON od.OrderID = o.OrderID
            JOIN PRODUCT_DETAIL pd 
                ON pd.OrderDetailID = od.OrderDetailID
            WHERE o.PersonID = r.PersonID
              AND pd.ProductID = i.ProductID
        )
    )
    BEGIN
        RAISERROR (N'Khách hàng chỉ được gửi PRODUCT_REVIEW cho sản phẩm đã mua trong đơn thanh toán thành công của chính mình.', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END;
END;
GO

--trigger bổ sung nhằm đảm bảo không cho chỉnh sửa người viết REVIEW sau khi đã tạo REVIEW

--REVIEW
CREATE OR ALTER TRIGGER trg_Review_PreventUpdatePersonID
ON REVIEW
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (
        SELECT 1
        FROM inserted i
        INNER JOIN deleted d
            ON i.ReviewID = d.ReviewID
        WHERE i.PersonID <> d.PersonID
    )
    BEGIN
        THROW 50003,
              N'Không được phép thay đổi người viết review sau khi review đã được tạo.',
              1;
    END
END;
GO

----------------------------------------------------------------------------
---------------------Trigger for RC3---------------------------------------
----------------------------------------------------------------------------
CREATE OR ALTER TRIGGER trg_Check_RefundExchange_NoCheckedInTicket
ON REFUND_EXCHANGE_REQUEST
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (
        SELECT 1
        FROM inserted i
        JOIN ORDER_DETAIL od ON od.RequestID = i.RequestID
        JOIN E_TICKET et ON et.OrderDetailID = od.OrderDetailID
        WHERE et.ETicketStatus = N'Checked-in'
           OR et.ETicketCheckinTime IS NOT NULL
    )
    BEGIN
        RAISERROR (N'Vé đã check-in thì không được tạo hoặc cập nhật yêu cầu hoàn/đổi.', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END;
END;
GO


------------------------------------------------------
-------------Trigger Update ORDER.TotalAmount---------
------------------------------------------------------
CREATE OR ALTER TRIGGER trg_UpdateOrderTotal_FromOrderDetail
ON ORDER_DETAIL
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    ;WITH AffectedOrders AS (
        SELECT OrderID FROM inserted
        UNION
        SELECT OrderID FROM deleted
    ),
    DetailTotal AS (
        SELECT 
            od.OrderID,
            SUM(od.OrderDetailSubtotal) AS DetailSum
        FROM ORDER_DETAIL od
        INNER JOIN AffectedOrders ao ON od.OrderID = ao.OrderID
        GROUP BY od.OrderID
    ),
    DiscountTotal AS (
        SELECT 
            a.OrderID,
            SUM(a.DiscountAmount) AS DiscountSum
        FROM APPLY a
        INNER JOIN AffectedOrders ao ON a.OrderID = ao.OrderID
        GROUP BY a.OrderID
    )
    UPDATE o
    SET o.TotalAmount = CAST(
        COALESCE(dt.DetailSum, 0) - COALESCE(ap.DiscountSum, 0)
        AS INT
    )
    FROM [ORDER] o
    INNER JOIN AffectedOrders ao ON o.OrderID = ao.OrderID
    LEFT JOIN DetailTotal dt ON o.OrderID = dt.OrderID
    LEFT JOIN DiscountTotal ap ON o.OrderID = ap.OrderID;
END;
GO

CREATE OR ALTER TRIGGER trg_UpdateOrderTotal_FromApply
ON APPLY
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    ;WITH AffectedOrders AS (
        SELECT OrderID FROM inserted
        UNION
        SELECT OrderID FROM deleted
    ),
    DetailTotal AS (
        SELECT 
            od.OrderID,
            SUM(od.OrderDetailSubtotal) AS DetailSum
        FROM ORDER_DETAIL od
        INNER JOIN AffectedOrders ao ON od.OrderID = ao.OrderID
        GROUP BY od.OrderID
    ),
    DiscountTotal AS (
        SELECT 
            a.OrderID,
            SUM(a.DiscountAmount) AS DiscountSum
        FROM APPLY a
        INNER JOIN AffectedOrders ao ON a.OrderID = ao.OrderID
        GROUP BY a.OrderID
    )
    UPDATE o
    SET o.TotalAmount = CAST(
        COALESCE(dt.DetailSum, 0) - COALESCE(ap.DiscountSum, 0)
        AS INT
    )
    FROM [ORDER] o
    INNER JOIN AffectedOrders ao ON o.OrderID = ao.OrderID
    LEFT JOIN DetailTotal dt ON o.OrderID = dt.OrderID
    LEFT JOIN DiscountTotal ap ON o.OrderID = ap.OrderID;
END;
GO


------------------------------------------------------
-------------Trigger Update Point History-------------
------------------------------------------------------

CREATE OR ALTER TRIGGER trg_PointHistory_UpdateCurrentPoints
ON POINT_HISTORY
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    ;WITH AffectedPerson AS (
        SELECT PersonID
        FROM inserted
        WHERE PersonID IS NOT NULL

        UNION

        SELECT PersonID
        FROM deleted
        WHERE PersonID IS NOT NULL
    ),
    PointSummary AS (
        SELECT
            ap.PersonID,
            ISNULL(SUM(ph.PointChange), 0) AS TotalPoints
        FROM AffectedPerson ap
        LEFT JOIN POINT_HISTORY ph
            ON ph.PersonID = ap.PersonID
        GROUP BY ap.PersonID
    )
    UPDATE rc
    SET rc.CurrentPoints = ps.TotalPoints
    FROM REGISTERED_CUSTOMER rc
    INNER JOIN PointSummary ps
        ON ps.PersonID = rc.PersonID;
END;
GO