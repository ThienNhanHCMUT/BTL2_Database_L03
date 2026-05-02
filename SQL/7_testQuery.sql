


/*
Case 1: Test full tất cả sản phẩm có phát sinh bán



*/
EXEC dbo.sp_GetProductSalesSummary
    @ProductType = NULL,
    @FromDate = '2026-04-01',
    @ToDate = '2026-04-23',
    @MinTotalQuantity = 0,
    @MinTotalRevenue = 0;
GO

/*
Case 2: Test loại Bắp trong khoảng thời gian có dữ liệu
*/


EXEC dbo.sp_GetProductSalesSummary
    @ProductType = N'Nước',
    @FromDate = '2026-04-01',
    @ToDate = '2026-04-30',
    @MinTotalQuantity = 1,
    @MinTotalRevenue = 0;
GO