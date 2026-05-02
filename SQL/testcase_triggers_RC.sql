SET NOCOUNT ON;
SET XACT_ABORT OFF;

PRINT N'============================================================';
PRINT N'BAT DAU TESTCASE CHO CAC TRIGGER RC';
PRINT N'============================================================';
GO

/*
    TEST 01
    Trigger test: trg_Check_Apply_Rules
    Ràng buộc: RC9 - Voucher phải còn hiệu lực khi áp dụng.
    Case: Thử INSERT vào APPLY bằng voucher không Active hoặc đã hết hạn.
    Output mong muốn: INSERT bị chặn, SQL Server báo lỗi:
        "Voucher không còn hiệu lực hoặc đã hết hạn tại thời điểm áp dụng."
*/
DECLARE @VoucherID_RC9 VARCHAR(20);
DECLARE @OrderID_RC9 VARCHAR(20);

SELECT TOP 1 @VoucherID_RC9 = v.VoucherID
FROM VOUCHER v
WHERE v.VoucherStatus <> N'Active'
   OR v.VoucherExpiresAt < GETDATE()
ORDER BY v.VoucherID;

SELECT TOP 1 @OrderID_RC9 = o.OrderID
FROM [ORDER] o
WHERE @VoucherID_RC9 IS NOT NULL
  AND NOT EXISTS (
        SELECT 1
        FROM APPLY a
        WHERE a.VoucherID = @VoucherID_RC9
          AND a.OrderID = o.OrderID
  )
ORDER BY o.OrderID;

IF @VoucherID_RC9 IS NULL OR @OrderID_RC9 IS NULL
BEGIN
    PRINT N'TEST 01 SKIP: Không tìm thấy voucher hết hạn/không Active hoặc không tìm thấy order phù hợp.';
END
ELSE
BEGIN
    BEGIN TRY
        BEGIN TRAN;

        INSERT INTO APPLY (VoucherID, OrderID, DiscountAmount)
        VALUES (@VoucherID_RC9, @OrderID_RC9, 1000);

        PRINT N'TEST 01 FAIL: APPLY đã insert được dù voucher không hợp lệ.';
        IF @@TRANCOUNT > 0 ROLLBACK;
    END TRY
    BEGIN CATCH
        PRINT N'TEST 01 PASS: Trigger đã chặn voucher không hợp lệ.';
        PRINT N'  Message: ' + ERROR_MESSAGE();
        IF @@TRANCOUNT > 0 ROLLBACK;
    END CATCH;
END;
GO

/*
    TEST 02
    Trigger test: trg_Check_Apply_Rules
    Ràng buộc: RC4 - Tổng DiscountAmount không được vượt quá giá trị gốc của đơn hàng.
    Case: Thử INSERT APPLY với DiscountAmount lớn hơn tổng OrderDetailSubtotal của đơn.
    Output mong muốn: INSERT bị chặn, SQL Server báo lỗi:
        "Tổng DiscountAmount của đơn hàng không được vượt quá giá trị gốc của đơn."
*/
DECLARE @VoucherID_RC4 VARCHAR(20);
DECLARE @OrderID_RC4 VARCHAR(20);
DECLARE @Gross_RC4 DECIMAL(18,2);

SELECT TOP 1
    @VoucherID_RC4 = v.VoucherID,
    @OrderID_RC4 = o.OrderID,
    @Gross_RC4 = SUM(od.OrderDetailSubtotal)
FROM VOUCHER v
CROSS JOIN [ORDER] o
JOIN ORDER_DETAIL od ON od.OrderID = o.OrderID
WHERE v.VoucherStatus = N'Active'
  AND (v.VoucherExpiresAt IS NULL OR CAST(o.OrderDate AS DATETIME) <= v.VoucherExpiresAt)
  AND NOT EXISTS (
        SELECT 1
        FROM APPLY a
        WHERE a.VoucherID = v.VoucherID
          AND a.OrderID = o.OrderID
  )
GROUP BY v.VoucherID, o.OrderID, o.OrderDate, v.VoucherExpiresAt
HAVING SUM(od.OrderDetailSubtotal) > 0
ORDER BY o.OrderID, v.VoucherID;

IF @VoucherID_RC4 IS NULL OR @OrderID_RC4 IS NULL
BEGIN
    PRINT N'TEST 02 SKIP: Không tìm thấy active voucher + order có detail phù hợp.';
END
ELSE
BEGIN
    BEGIN TRY
        BEGIN TRAN;

        INSERT INTO APPLY (VoucherID, OrderID, DiscountAmount)
        VALUES (@VoucherID_RC4, @OrderID_RC4, @Gross_RC4 + 1);

        PRINT N'TEST 02 FAIL: APPLY đã insert được dù tổng giảm giá vượt giá trị gốc đơn.';
        IF @@TRANCOUNT > 0 ROLLBACK;
    END TRY
    BEGIN CATCH
        PRINT N'TEST 02 PASS: Trigger đã chặn tổng giảm giá vượt giá trị gốc đơn.';
        PRINT N'  Message: ' + ERROR_MESSAGE();
        IF @@TRANCOUNT > 0 ROLLBACK;
    END CATCH;
END;
GO

/*
    TEST 03
    Trigger test: trg_UpdateOrderTotal_FromOrderDetail
    Ràng buộc/thuộc tính dẫn xuất: ORDER.TotalAmount tự cập nhật khi ORDER_DETAIL thay đổi.
    Case: UPDATE một ORDER_DETAIL.OrderDetailSubtotal tăng thêm 1000 trong transaction.
    Output mong muốn: ORDER.TotalAmount = SUM(OrderDetailSubtotal) - SUM(DiscountAmount) của order đó.
*/
DECLARE @OrderDetailID_T3 VARCHAR(20);
DECLARE @OrderID_T3 VARCHAR(20);
DECLARE @ExpectedTotal_T3 INT;
DECLARE @ActualTotal_T3 INT;

SELECT TOP 1
    @OrderDetailID_T3 = od.OrderDetailID,
    @OrderID_T3 = od.OrderID
FROM ORDER_DETAIL od
ORDER BY od.OrderDetailID;

IF @OrderDetailID_T3 IS NULL
BEGIN
    PRINT N'TEST 03 SKIP: Không có ORDER_DETAIL để test.';
END
ELSE
BEGIN
    BEGIN TRY
        BEGIN TRAN;

        UPDATE ORDER_DETAIL
        SET OrderDetailSubtotal = OrderDetailSubtotal + 1000
        WHERE OrderDetailID = @OrderDetailID_T3;

        SELECT @ExpectedTotal_T3 = CAST(
            COALESCE((SELECT SUM(OrderDetailSubtotal) FROM ORDER_DETAIL WHERE OrderID = @OrderID_T3), 0)
          - COALESCE((SELECT SUM(DiscountAmount) FROM APPLY WHERE OrderID = @OrderID_T3), 0)
            AS INT
        );

        SELECT @ActualTotal_T3 = TotalAmount
        FROM [ORDER]
        WHERE OrderID = @OrderID_T3;

        IF @ActualTotal_T3 = @ExpectedTotal_T3
            PRINT N'TEST 03 PASS: ORDER.TotalAmount cập nhật đúng sau khi UPDATE ORDER_DETAIL.';
        ELSE
            PRINT N'TEST 03 FAIL: ORDER.TotalAmount không đúng sau khi UPDATE ORDER_DETAIL.';

        PRINT N'  Expected TotalAmount = ' + CAST(@ExpectedTotal_T3 AS NVARCHAR(50));
        PRINT N'  Actual TotalAmount   = ' + CAST(@ActualTotal_T3 AS NVARCHAR(50));

        IF @@TRANCOUNT > 0 ROLLBACK;
    END TRY
    BEGIN CATCH
        PRINT N'TEST 03 ERROR: ' + ERROR_MESSAGE();
        IF @@TRANCOUNT > 0 ROLLBACK;
    END CATCH;
END;
GO

/*
    TEST 04
    Trigger test: trg_UpdateOrderTotal_FromApply
    Ràng buộc/thuộc tính dẫn xuất: ORDER.TotalAmount tự cập nhật khi APPLY thay đổi.
    Case: INSERT một APPLY hợp lệ với DiscountAmount nhỏ hơn gross amount.
    Output mong muốn: ORDER.TotalAmount = SUM(OrderDetailSubtotal) - SUM(DiscountAmount).
*/
DECLARE @VoucherID_T4 VARCHAR(20);
DECLARE @OrderID_T4 VARCHAR(20);
DECLARE @Gross_T4 DECIMAL(18,2);
DECLARE @Discount_T4 DECIMAL(10,2) = 1000;
DECLARE @ExpectedTotal_T4 INT;
DECLARE @ActualTotal_T4 INT;

SELECT TOP 1
    @VoucherID_T4 = v.VoucherID,
    @OrderID_T4 = o.OrderID,
    @Gross_T4 = SUM(od.OrderDetailSubtotal)
FROM VOUCHER v
CROSS JOIN [ORDER] o
JOIN ORDER_DETAIL od ON od.OrderID = o.OrderID
WHERE v.VoucherStatus = N'Active'
  AND (v.VoucherExpiresAt IS NULL OR CAST(o.OrderDate AS DATETIME) <= v.VoucherExpiresAt)
  AND NOT EXISTS (
        SELECT 1
        FROM APPLY a
        WHERE a.VoucherID = v.VoucherID
          AND a.OrderID = o.OrderID
  )
GROUP BY v.VoucherID, o.OrderID, o.OrderDate, v.VoucherExpiresAt
HAVING SUM(od.OrderDetailSubtotal) >= 1000
ORDER BY o.OrderID, v.VoucherID;

IF @VoucherID_T4 IS NULL OR @OrderID_T4 IS NULL
BEGIN
    PRINT N'TEST 04 SKIP: Không tìm thấy active voucher + order phù hợp để insert APPLY hợp lệ.';
END
ELSE
BEGIN
    BEGIN TRY
        BEGIN TRAN;

        INSERT INTO APPLY (VoucherID, OrderID, DiscountAmount)
        VALUES (@VoucherID_T4, @OrderID_T4, @Discount_T4);

        SELECT @ExpectedTotal_T4 = CAST(
            COALESCE((SELECT SUM(OrderDetailSubtotal) FROM ORDER_DETAIL WHERE OrderID = @OrderID_T4), 0)
          - COALESCE((SELECT SUM(DiscountAmount) FROM APPLY WHERE OrderID = @OrderID_T4), 0)
            AS INT
        );

        SELECT @ActualTotal_T4 = TotalAmount
        FROM [ORDER]
        WHERE OrderID = @OrderID_T4;

        IF @ActualTotal_T4 = @ExpectedTotal_T4
            PRINT N'TEST 04 PASS: ORDER.TotalAmount cập nhật đúng sau khi INSERT APPLY.';
        ELSE
            PRINT N'TEST 04 FAIL: ORDER.TotalAmount không đúng sau khi INSERT APPLY.';

        PRINT N'  Expected TotalAmount = ' + CAST(@ExpectedTotal_T4 AS NVARCHAR(50));
        PRINT N'  Actual TotalAmount   = ' + CAST(@ActualTotal_T4 AS NVARCHAR(50));

        IF @@TRANCOUNT > 0 ROLLBACK;
    END TRY
    BEGIN CATCH
        PRINT N'TEST 04 ERROR: ' + ERROR_MESSAGE();
        IF @@TRANCOUNT > 0 ROLLBACK;
    END CATCH;
END;
GO

/*
    TEST 05
    Trigger test: trg_Check_GuestCustomer_NoPoints
    Ràng buộc: RC5 - Khách vãng lai không được tích điểm/lưu lịch sử điểm.
    Case: UPDATE một dòng POINT_HISTORY hiện có sang PersonID của GUEST_CUSTOMER.
    Output mong muốn: UPDATE bị chặn, SQL Server báo lỗi:
        "Khách vãng lai không được tích điểm hoặc lưu lịch sử điểm."
*/
DECLARE @GuestPersonID_T5 VARCHAR(20);

SELECT TOP 1 @GuestPersonID_T5 = PersonID
FROM GUEST_CUSTOMER
ORDER BY PersonID;

IF @GuestPersonID_T5 IS NULL OR NOT EXISTS (SELECT 1 FROM POINT_HISTORY)
BEGIN
    PRINT N'TEST 05 SKIP: Không có GUEST_CUSTOMER hoặc POINT_HISTORY để test.';
END
ELSE
BEGIN
    BEGIN TRY
        BEGIN TRAN;

        UPDATE TOP (1) POINT_HISTORY
        SET PersonID = @GuestPersonID_T5
        WHERE PersonID <> @GuestPersonID_T5;

        PRINT N'TEST 05 FAIL: POINT_HISTORY đã cập nhật sang khách vãng lai.';
        IF @@TRANCOUNT > 0 ROLLBACK;
    END TRY
    BEGIN CATCH
        PRINT N'TEST 05 PASS: Trigger đã chặn khách vãng lai có lịch sử điểm.';
        PRINT N'  Message: ' + ERROR_MESSAGE();
        IF @@TRANCOUNT > 0 ROLLBACK;
    END CATCH;
END;
GO

/*
    TEST 06
    Trigger test: trg_UpdateRegisteredCustomerCurrentPoints
    Ràng buộc/thuộc tính dẫn xuất: REGISTERED_CUSTOMER.CurrentPoints tự cập nhật theo SUM(POINT_HISTORY.PointChange).
    Case: UPDATE PointChange của một POINT_HISTORY thuộc REGISTERED_CUSTOMER.
    Output mong muốn: CurrentPoints của khách hàng thành viên = tổng PointChange hiện tại.
*/
DECLARE @RegPersonID_T6 VARCHAR(20);
DECLARE @ExpectedPoints_T6 INT;
DECLARE @ActualPoints_T6 INT;

SELECT TOP 1 @RegPersonID_T6 = ph.PersonID
FROM POINT_HISTORY ph
JOIN REGISTERED_CUSTOMER rc ON rc.PersonID = ph.PersonID
ORDER BY ph.PersonID;

IF @RegPersonID_T6 IS NULL
BEGIN
    PRINT N'TEST 06 SKIP: Không có POINT_HISTORY của REGISTERED_CUSTOMER để test.';
END
ELSE
BEGIN
    BEGIN TRY
        BEGIN TRAN;

        UPDATE TOP (1) POINT_HISTORY
        SET PointChange = PointChange + 10
        WHERE PersonID = @RegPersonID_T6;

        SELECT @ExpectedPoints_T6 = COALESCE(SUM(PointChange), 0)
        FROM POINT_HISTORY
        WHERE PersonID = @RegPersonID_T6;

        SELECT @ActualPoints_T6 = CurrentPoints
        FROM REGISTERED_CUSTOMER
        WHERE PersonID = @RegPersonID_T6;

        IF @ActualPoints_T6 = @ExpectedPoints_T6
            PRINT N'TEST 06 PASS: CurrentPoints cập nhật đúng theo POINT_HISTORY.';
        ELSE
            PRINT N'TEST 06 FAIL: CurrentPoints không khớp với tổng PointChange.';

        PRINT N'  Expected CurrentPoints = ' + CAST(@ExpectedPoints_T6 AS NVARCHAR(50));
        PRINT N'  Actual CurrentPoints   = ' + CAST(@ActualPoints_T6 AS NVARCHAR(50));

        IF @@TRANCOUNT > 0 ROLLBACK;
    END TRY
    BEGIN CATCH
        PRINT N'TEST 06 ERROR: ' + ERROR_MESSAGE();
        IF @@TRANCOUNT > 0 ROLLBACK;
    END CATCH;
END;
GO

/*
    TEST 07
    Trigger test: trg_Check_ETicket_OneCheckinOnly
    Ràng buộc: RC7 - Nếu ETicketStatus = Checked-in thì phải có ETicketCheckinTime.
    Case: UPDATE một E_TICKET sang Checked-in nhưng ETicketCheckinTime = NULL.
    Output mong muốn: UPDATE bị chặn, SQL Server báo lỗi:
        "Vé ở trạng thái Checked-in phải có ETicketCheckinTime."
*/
IF NOT EXISTS (SELECT 1 FROM E_TICKET)
BEGIN
    PRINT N'TEST 07 SKIP: Không có E_TICKET để test.';
END
ELSE
BEGIN
    BEGIN TRY
        BEGIN TRAN;

        UPDATE TOP (1) E_TICKET
        SET ETicketStatus = N'Checked-in',
            ETicketCheckinTime = NULL;

        PRINT N'TEST 07 FAIL: Vé Checked-in nhưng không có thời gian vẫn cập nhật được.';
        IF @@TRANCOUNT > 0 ROLLBACK;
    END TRY
    BEGIN CATCH
        PRINT N'TEST 07 PASS: Trigger đã chặn Checked-in không có ETicketCheckinTime.';
        PRINT N'  Message: ' + ERROR_MESSAGE();
        IF @@TRANCOUNT > 0 ROLLBACK;
    END CATCH;
END;
GO

/*
    TEST 08
    Trigger test: trg_Check_ETicket_OneCheckinOnly
    Ràng buộc: RC7 - Mỗi vé chỉ được check-in thành công đúng một lần, không được đổi ngược trạng thái sau khi check-in.
    Case: Trong cùng transaction, update một vé chưa check-in sang Checked-in có thời gian, sau đó update ngược về Issued.
    Output mong muốn: Lần update ngược bị chặn, SQL Server báo lỗi:
        "Mỗi vé chỉ được check-in thành công đúng một lần."
*/
DECLARE @TicketID_T8 VARCHAR(20);

SELECT TOP 1 @TicketID_T8 = TicketID
FROM E_TICKET
WHERE (ETicketStatus <> N'Checked-in' OR ETicketStatus IS NULL)
  AND ETicketCheckinTime IS NULL
ORDER BY TicketID;

IF @TicketID_T8 IS NULL
BEGIN
    PRINT N'TEST 08 SKIP: Không có vé chưa check-in để test.';
END
ELSE
BEGIN
    BEGIN TRY
        BEGIN TRAN;

        UPDATE E_TICKET
        SET ETicketStatus = N'Checked-in',
            ETicketCheckinTime = GETDATE()
        WHERE TicketID = @TicketID_T8;

        UPDATE E_TICKET
        SET ETicketStatus = N'Issued'
        WHERE TicketID = @TicketID_T8;

        PRINT N'TEST 08 FAIL: Vé đã check-in vẫn đổi ngược trạng thái được.';
        IF @@TRANCOUNT > 0 ROLLBACK;
    END TRY
    BEGIN CATCH
        PRINT N'TEST 08 PASS: Trigger đã chặn đổi trạng thái sau khi check-in.';
        PRINT N'  Message: ' + ERROR_MESSAGE();
        IF @@TRANCOUNT > 0 ROLLBACK;
    END CATCH;
END;
GO

/*
    TEST 09
    Trigger test: trg_Review_PreventUpdatePersonID
    Ràng buộc bổ sung: Không cho chỉnh sửa người viết REVIEW sau khi đã tạo REVIEW.
    Case: UPDATE REVIEW.PersonID sang một Customer khác.
    Output mong muốn: UPDATE bị chặn, SQL Server báo lỗi:
        "Không được phép thay đổi người viết review sau khi review đã được tạo."
*/
DECLARE @ReviewID_T9 VARCHAR(20);
DECLARE @OtherPersonID_T9 VARCHAR(20);

SELECT TOP 1 @ReviewID_T9 = ReviewID
FROM REVIEW
ORDER BY ReviewID;

SELECT TOP 1 @OtherPersonID_T9 = c.PersonID
FROM CUSTOMER c
WHERE @ReviewID_T9 IS NOT NULL
  AND c.PersonID <> (SELECT PersonID FROM REVIEW WHERE ReviewID = @ReviewID_T9)
ORDER BY c.PersonID;

IF @ReviewID_T9 IS NULL OR @OtherPersonID_T9 IS NULL
BEGIN
    PRINT N'TEST 09 SKIP: Không đủ REVIEW hoặc CUSTOMER khác để test.';
END
ELSE
BEGIN
    BEGIN TRY
        BEGIN TRAN;

        UPDATE REVIEW
        SET PersonID = @OtherPersonID_T9
        WHERE ReviewID = @ReviewID_T9;

        PRINT N'TEST 09 FAIL: REVIEW.PersonID đã bị thay đổi.';
        IF @@TRANCOUNT > 0 ROLLBACK;
    END TRY
    BEGIN CATCH
        PRINT N'TEST 09 PASS: Trigger đã chặn thay đổi người viết review.';
        PRINT N'  Message: ' + ERROR_MESSAGE();
        IF @@TRANCOUNT > 0 ROLLBACK;
    END CATCH;
END;
GO

/*
    TEST 10
    Trigger test: trg_Check_OrderReview_Condition
    Ràng buộc: RC10 - Chỉ chủ đơn hàng đã thanh toán thành công mới được gửi ORDER_REVIEW.
    Case: INSERT ORDER_REVIEW với ReviewID của người không phải chủ OrderID.
    Output mong muốn: INSERT bị chặn, SQL Server báo lỗi:
        "Chỉ chủ đơn hàng đã thanh toán thành công mới được gửi ORDER_REVIEW."
*/
DECLARE @ReviewID_T10 VARCHAR(20);
DECLARE @OrderID_T10 VARCHAR(20);

SELECT TOP 1
    @ReviewID_T10 = r.ReviewID,
    @OrderID_T10 = o.OrderID
FROM REVIEW r
CROSS JOIN [ORDER] o
WHERE r.PersonID <> o.PersonID
  AND NOT EXISTS (
        SELECT 1
        FROM ORDER_REVIEW orv
        WHERE orv.ReviewID = r.ReviewID
          AND orv.OrderID = o.OrderID
  )
ORDER BY r.ReviewID, o.OrderID;

IF @ReviewID_T10 IS NULL OR @OrderID_T10 IS NULL
BEGIN
    PRINT N'TEST 10 SKIP: Không tìm thấy Review/Order lệch chủ phù hợp để test.';
END
ELSE
BEGIN
    BEGIN TRY
        BEGIN TRAN;

        INSERT INTO ORDER_REVIEW (ReviewID, OrderID)
        VALUES (@ReviewID_T10, @OrderID_T10);

        PRINT N'TEST 10 FAIL: ORDER_REVIEW lệch chủ đơn vẫn insert được.';
        IF @@TRANCOUNT > 0 ROLLBACK;
    END TRY
    BEGIN CATCH
        PRINT N'TEST 10 PASS: Trigger đã chặn ORDER_REVIEW không hợp lệ.';
        PRINT N'  Message: ' + ERROR_MESSAGE();
        IF @@TRANCOUNT > 0 ROLLBACK;
    END CATCH;
END;
GO

/*
    TEST 11
    Trigger test: trg_Check_ProductReview_Condition
    Ràng buộc: RC10 - Khách hàng chỉ được review sản phẩm đã mua trong đơn thanh toán thành công của chính mình.
    Case: INSERT PRODUCT_REVIEW với ProductID mà người viết review chưa từng mua trong đơn Success.
    Output mong muốn: INSERT bị chặn, SQL Server báo lỗi:
        "Khách hàng chỉ được gửi PRODUCT_REVIEW cho sản phẩm đã mua trong đơn thanh toán thành công của chính mình."
*/
DECLARE @ReviewID_T11 VARCHAR(20);
DECLARE @ProductID_T11 VARCHAR(20);

SELECT TOP 1
    @ReviewID_T11 = r.ReviewID,
    @ProductID_T11 = p.ProductID
FROM REVIEW r
CROSS JOIN PRODUCT p
WHERE NOT EXISTS (
        SELECT 1
        FROM [ORDER] o
        JOIN PAYMENT_TRANSACTION pt
            ON pt.OrderID = o.OrderID
           AND pt.PaymentTransactionPaymentStatus = N'Success'
        JOIN ORDER_DETAIL od
            ON od.OrderID = o.OrderID
        JOIN PRODUCT_DETAIL pd
            ON pd.OrderDetailID = od.OrderDetailID
        WHERE o.PersonID = r.PersonID
          AND pd.ProductID = p.ProductID
  )
  AND NOT EXISTS (
        SELECT 1
        FROM PRODUCT_REVIEW pr
        WHERE pr.ReviewID = r.ReviewID
          AND pr.ProductID = p.ProductID
  )
ORDER BY r.ReviewID, p.ProductID;

IF @ReviewID_T11 IS NULL OR @ProductID_T11 IS NULL
BEGIN
    PRINT N'TEST 11 SKIP: Không tìm thấy Review/Product chưa mua phù hợp để test.';
END
ELSE
BEGIN
    BEGIN TRY
        BEGIN TRAN;

        INSERT INTO PRODUCT_REVIEW (ReviewID, ProductID)
        VALUES (@ReviewID_T11, @ProductID_T11);

        PRINT N'TEST 11 FAIL: PRODUCT_REVIEW cho sản phẩm chưa mua vẫn insert được.';
        IF @@TRANCOUNT > 0 ROLLBACK;
    END TRY
    BEGIN CATCH
        PRINT N'TEST 11 PASS: Trigger đã chặn PRODUCT_REVIEW không hợp lệ.';
        PRINT N'  Message: ' + ERROR_MESSAGE();
        IF @@TRANCOUNT > 0 ROLLBACK;
    END CATCH;
END;
GO

/*
    TEST 12
    Trigger test: trg_Check_RefundExchange_NoCheckedInTicket
    Ràng buộc: RC3 - Vé đã check-in không được tạo hoặc cập nhật yêu cầu hoàn/đổi.
    Case: UPDATE một REFUND_EXCHANGE_REQUEST đã liên kết tới ORDER_DETAIL có E_TICKET Checked-in.
    Output mong muốn: UPDATE bị chặn, SQL Server báo lỗi:
        "Vé đã check-in thì không được tạo hoặc cập nhật yêu cầu hoàn/đổi."
*/
DECLARE @RequestID_T12 VARCHAR(20);

SELECT TOP 1 @RequestID_T12 = rer.RequestID
FROM REFUND_EXCHANGE_REQUEST rer
JOIN ORDER_DETAIL od ON od.RequestID = rer.RequestID
JOIN E_TICKET et ON et.OrderDetailID = od.OrderDetailID
WHERE et.ETicketStatus = N'Checked-in'
   OR et.ETicketCheckinTime IS NOT NULL
ORDER BY rer.RequestID;

IF @RequestID_T12 IS NULL
BEGIN
    PRINT N'TEST 12 SKIP: Không có REFUND_EXCHANGE_REQUEST liên quan vé đã check-in để test.';
END
ELSE
BEGIN
    BEGIN TRY
        BEGIN TRAN;

        UPDATE REFUND_EXCHANGE_REQUEST
        SET RequestID = RequestID
        WHERE RequestID = @RequestID_T12;

        PRINT N'TEST 12 FAIL: Request hoàn/đổi cho vé checked-in vẫn cập nhật được.';
        IF @@TRANCOUNT > 0 ROLLBACK;
    END TRY
    BEGIN CATCH
        PRINT N'TEST 12 PASS: Trigger đã chặn yêu cầu hoàn/đổi của vé checked-in.';
        PRINT N'  Message: ' + ERROR_MESSAGE();
        IF @@TRANCOUNT > 0 ROLLBACK;
    END CATCH;
END;
GO

PRINT N'============================================================';
PRINT N'KET THUC TESTCASE CHO CAC TRIGGER RC';
PRINT N'============================================================';
GO
