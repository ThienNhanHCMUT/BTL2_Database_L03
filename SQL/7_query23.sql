GO

--========================================================
/*
`sp_GetProductSalesSummary` là thủ tục dùng để thống kê doanh thu và số lượng bán của từng sản phẩm trong một khoảng thời gian.

Thủ tục lấy dữ liệu từ 5 bảng:
PRODUCT, PRODUCT_DETAIL, ORDER_DETAIL, [ORDER], REFUND_EXCHANGE_REQUEST.

WHERE dùng để lọc trước theo loại sản phẩm và ngày đặt hàng.
GROUP BY dùng để gom các lần bán của cùng một sản phẩm thành một nhóm.

COUNT(DISTINCT ...) dùng để tính số đơn.
SUM(...) dùng để tính tổng số lượng bán, doanh thu gốc, tổng tiền hoàn, doanh thu sau hoàn tiền.

Hoàn tiền chỉ được trừ khi:
RequestType = N'Refund'
AND RequestStatus = N'Approved'

HAVING dùng để lọc các sản phẩm đạt ngưỡng số lượng hoặc doanh thu sau hoàn tiền tối thiểu.
ORDER BY dùng để sắp xếp kết quả theo doanh thu sau hoàn tiền giảm dần.

Nếu @ProductType = NULL thì không lọc theo loại sản phẩm, lấy tất cả mặt hàng để thống kê.
*/
--========================================================

CREATE OR ALTER PROCEDURE sp_GetProductSalesSummary
    @ProductType        NVARCHAR(50)   = NULL,
    @FromDate           DATE           = NULL,
    @ToDate             DATE           = NULL,
    @MinTotalQuantity   INT            = 0,
    @MinTotalRevenue    DECIMAL(12,2)  = 0
AS
BEGIN
    SET NOCOUNT ON;

    -- Chuẩn hóa input
    SET @ProductType = NULLIF(LTRIM(RTRIM(@ProductType)), N'');

    -- Validate input
    IF @FromDate IS NOT NULL
       AND @ToDate IS NOT NULL
       AND @FromDate > @ToDate
        THROW 50301, N'Ngày bắt đầu không được lớn hơn ngày kết thúc.', 1;

    IF @MinTotalQuantity < 0
        THROW 50302, N'Số lượng tối thiểu không được âm.', 1;

    IF @MinTotalRevenue < 0
        THROW 50303, N'Doanh thu tối thiểu không được âm.', 1;

    ;WITH SalesBase AS
    (
        SELECT
            p.ProductID,
            p.ProductName,
            p.ProductType,
            p.ProductStatus,
            o.OrderID,
            od.OrderDetailQuantity,
            od.OrderDetailSubtotal,

            -- Tiền hoàn chỉ tính khi Refund + Approved.
            -- Nếu số tiền hoàn lớn hơn subtotal thì chỉ trừ tối đa bằng subtotal
            -- để doanh thu sản phẩm không bị âm.
            CASE
                WHEN rer.RequestID IS NOT NULL THEN
                    CASE
                        WHEN ISNULL(rer.RequestActualRefundAmount, 0) > od.OrderDetailSubtotal
                            THEN od.OrderDetailSubtotal
                        ELSE ISNULL(rer.RequestActualRefundAmount, 0)
                    END
                ELSE 0
            END AS RefundAmount
        FROM PRODUCT p
        JOIN PRODUCT_DETAIL pd
            ON pd.ProductID = p.ProductID
        JOIN ORDER_DETAIL od
            ON od.OrderDetailID = pd.OrderDetailID
        JOIN [ORDER] o
            ON o.OrderID = od.OrderID
        LEFT JOIN REFUND_EXCHANGE_REQUEST rer
            ON rer.RequestID = od.RequestID
           AND rer.RequestType = N'Refund'
           AND rer.RequestStatus = N'Approved'
        WHERE (@ProductType IS NULL OR p.ProductType = @ProductType)
          AND (@FromDate IS NULL OR o.OrderDate >= @FromDate)
          AND (@ToDate IS NULL OR o.OrderDate <= @ToDate)
    )
    SELECT
        ProductID,
        ProductName,
        ProductType,
        ProductStatus,
        COUNT(DISTINCT OrderID)                   AS TotalOrders,
        SUM(OrderDetailQuantity)                  AS TotalQuantitySold,
        SUM(OrderDetailSubtotal)                  AS GrossRevenue,
        SUM(RefundAmount)                         AS TotalRefundAmount,
        SUM(OrderDetailSubtotal - RefundAmount)   AS TotalRevenue
    FROM SalesBase
    GROUP BY
        ProductID,
        ProductName,
        ProductType,
        ProductStatus
    HAVING
        SUM(OrderDetailQuantity) >= @MinTotalQuantity
        AND SUM(OrderDetailSubtotal - RefundAmount) >= @MinTotalRevenue
    ORDER BY
        TotalRevenue DESC,
        TotalQuantitySold DESC,
        ProductName ASC;
END;
GO