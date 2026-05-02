
GO

--========================================================
/*
`fn_CalculateCustomerNetValue` là hàm dùng để tính giá trị ròng của một khách hàng
trong một khoảng thời gian.

Hàm nhận vào:
- @PersonID: mã khách hàng
- @FromDate: ngày bắt đầu
- @ToDate: ngày kết thúc

Hàm trả về:
- Tổng tiền khách đã thanh toán thành công
  trừ đi tổng tiền đã hoàn lại cho khách trong khoảng thời gian đó.

Công thức chính:

    NetValue = TotalPaid - TotalRefund

Trong đó:

1. TotalPaid:
   Được lấy từ bảng PAYMENT_TRANSACTION.
   Chỉ cộng các giao dịch có trạng thái thanh toán là 'success'.

   Nghĩa là hàm đang tính tiền thanh toán của cả ORDER,
   không tách riêng tiền vé hay tiền sản phẩm.

2. TotalRefund:
   Được lấy từ bảng REFUND_EXCHANGE_REQUEST thông qua ORDER_DETAIL.RequestID.
   Hàm dùng DISTINCT RequestID để tránh cộng trùng một request nếu request đó xuất hiện
   ở nhiều dòng ORDER_DETAIL.

3. Hàm duyệt từng ORDER của khách bằng CURSOR.
   Với mỗi ORDER:
   - Tính tổng tiền đã thanh toán thành công của order đó.
   - Tính tổng tiền hoàn thực tế của order đó.
   - Cộng dồn vào TotalPaid và TotalRefund.

4. Nếu khách hàng không tồn tại, ngày không hợp lệ, hoặc input bị rỗng,
   hàm trả về NULL.

5. Nếu khách hàng có tồn tại nhưng không có order trong khoảng ngày,
   hàm trả về 0.

6. Nếu kết quả NetValue bị âm,
   hàm ép về 0.

Lưu ý quan trọng:
Hàm này KHÔNG tính riêng doanh thu product.
Hàm này cũng KHÔNG tính riêng tiền vé.

Vì hàm lấy TotalPaid từ PAYMENT_TRANSACTION theo OrderID,
nên số tiền thanh toán có thể bao gồm:
- Vé
- Sản phẩm
- Combo
- Các khoản khác nằm trong cùng ORDER

Nếu muốn tính riêng product thì phải join thêm:
PRODUCT_DETAIL -> ORDER_DETAIL -> [ORDER]

Nếu muốn tính riêng vé thì phải join thêm:
TICKET_DETAIL -> ORDER_DETAIL -> [ORDER]
*/
--========================================================

GO

CREATE OR ALTER FUNCTION dbo.fn_CalculateCustomerNetValue
(
    @PersonID   VARCHAR(20),
    @FromDate   DATE,
    @ToDate     DATE
)
RETURNS DECIMAL(18,2)
AS
BEGIN
    DECLARE 
        @NetValue           DECIMAL(18,2) = 0,
        @TotalPaid          DECIMAL(18,2) = 0,
        @TotalRefund        DECIMAL(18,2) = 0,
        @CurrentOrderID     VARCHAR(20),
        @PaidOfOrder        DECIMAL(18,2),
        @RefundOfOrder      DECIMAL(18,2);

    -- Chuẩn hóa input
    SET @PersonID = LTRIM(RTRIM(@PersonID));

    -- Validate input
    IF @PersonID IS NULL OR @PersonID = ''
        RETURN NULL;

    IF @FromDate IS NULL OR @ToDate IS NULL
        RETURN NULL;

    IF @FromDate > @ToDate
        RETURN NULL;

    -- Kiểm tra khách hàng có tồn tại không
    IF NOT EXISTS
    (
        SELECT 1
        FROM CUSTOMER
        WHERE PersonID = @PersonID
    )
        RETURN NULL;

    -- Nếu không có đơn hàng nào trong kỳ thì trả 0
    IF NOT EXISTS
    (
        SELECT 1
        FROM [ORDER]
        WHERE PersonID = @PersonID
          AND OrderDate BETWEEN @FromDate AND @ToDate
    )
        RETURN 0;


        --MAIN--------------------------


    -- Cursor duyệt từng order của khách trong kỳ
    DECLARE cur_Order CURSOR LOCAL FORWARD_ONLY READ_ONLY FOR
        SELECT OrderID
        FROM [ORDER]
        WHERE PersonID = @PersonID
          AND OrderDate BETWEEN @FromDate AND @ToDate;

    OPEN cur_Order;

    FETCH NEXT FROM cur_Order INTO @CurrentOrderID;

    WHILE @@FETCH_STATUS = 0
    BEGIN
        -- 1) Tổng tiền thanh toán thành công của order hiện tại
        SELECT @PaidOfOrder = ISNULL(SUM(PT.PaymentTransactionAmount), 0)
        FROM PAYMENT_TRANSACTION AS PT
        WHERE PT.OrderID = @CurrentOrderID
          AND LOWER(LTRIM(RTRIM(PT.PaymentTransactionPaymentStatus))) = N'success';

        -- 2) Tổng tiền hoàn thực tế của order hiện tại
        -- Dùng DISTINCT RequestID để tránh cộng trùng nếu 1 request áp vào nhiều ORDER_DETAIL
        SELECT @RefundOfOrder = ISNULL(SUM(RER.RequestActualRefundAmount), 0)
        FROM
        (
            SELECT DISTINCT OD.RequestID
            FROM ORDER_DETAIL AS OD
            WHERE OD.OrderID = @CurrentOrderID
              AND OD.RequestID IS NOT NULL
        ) AS X
        INNER JOIN REFUND_EXCHANGE_REQUEST AS RER
            ON RER.RequestID = X.RequestID
        WHERE RER.RequestActualRefundAmount IS NOT NULL
          AND LOWER(LTRIM(RTRIM(RER.RequestStatus))) IN
              (N'completed', N'done', N'đã hoàn thành', N'hoàn thành', N'Approved');

        -- 3) Cộng dồn
        SET @TotalPaid   = @TotalPaid   + ISNULL(@PaidOfOrder, 0);
        SET @TotalRefund = @TotalRefund + ISNULL(@RefundOfOrder, 0);

        FETCH NEXT FROM cur_Order INTO @CurrentOrderID;
    END

    CLOSE cur_Order;
    DEALLOCATE cur_Order;

    -- 4) Giá trị ròng cuối cùng
    SET @NetValue = @TotalPaid - @TotalRefund;

    -- Có thể chặn âm nếu muốn
    IF @NetValue < 0
        SET @NetValue = 0;

    RETURN @NetValue;
END;
GO