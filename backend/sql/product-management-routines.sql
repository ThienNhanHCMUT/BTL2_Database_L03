CREATE OR ALTER PROCEDURE dbo.sp_ProductCatalogForManagement
  @SearchTerm NVARCHAR(100) = N'',
  @ProductType NVARCHAR(50) = N'',
  @ProductStatus NVARCHAR(50) = N'',
  @SortBy VARCHAR(30) = 'productId',
  @SortOrder VARCHAR(4) = 'ASC'
AS
BEGIN
  SET NOCOUNT ON;

  DECLARE @OrderColumn NVARCHAR(40) =
    CASE @SortBy
      WHEN 'name' THEN N'ProductName'
      WHEN 'type' THEN N'ProductType'
      WHEN 'price' THEN N'BasePrice'
      WHEN 'status' THEN N'ProductStatus'
      WHEN 'usage' THEN N'OrderUsageCount'
      WHEN 'revenue' THEN N'TotalRevenue'
      ELSE N'ProductID'
    END;

  DECLARE @Direction NVARCHAR(4) =
    CASE WHEN UPPER(@SortOrder) = 'DESC' THEN N'DESC' ELSE N'ASC' END;

  DECLARE @Sql NVARCHAR(MAX) = N'
    SELECT
      p.ProductID,
      p.ProductName,
      p.ProductType,
      p.BasePrice,
      p.ProductStatus,
      COUNT(pd.OrderDetailID) AS OrderUsageCount,
      COALESCE(SUM(od.OrderDetailQuantity), 0) AS TotalSold,
      COALESCE(SUM(od.OrderDetailSubtotal), 0) AS TotalRevenue
    FROM PRODUCT p
    LEFT JOIN PRODUCT_DETAIL pd
      ON pd.ProductID = p.ProductID
    LEFT JOIN ORDER_DETAIL od
      ON od.OrderDetailID = pd.OrderDetailID
    WHERE (
        @SearchTerm = N''''
        OR p.ProductID LIKE N''%'' + @SearchTerm + N''%''
        OR p.ProductName LIKE N''%'' + @SearchTerm + N''%''
        OR p.ProductType LIKE N''%'' + @SearchTerm + N''%''
      )
      AND (@ProductType = N'''' OR p.ProductType = @ProductType)
      AND (@ProductStatus = N'''' OR p.ProductStatus = @ProductStatus)
    GROUP BY
      p.ProductID,
      p.ProductName,
      p.ProductType,
      p.BasePrice,
      p.ProductStatus
    ORDER BY ' + @OrderColumn + N' ' + @Direction + N';
  ';

  EXEC sp_executesql
    @Sql,
    N'@SearchTerm NVARCHAR(100), @ProductType NVARCHAR(50), @ProductStatus NVARCHAR(50)',
    @SearchTerm = @SearchTerm,
    @ProductType = @ProductType,
    @ProductStatus = @ProductStatus;
END;
GO

CREATE OR ALTER FUNCTION dbo.fn_CalculateProductOrderTotal
(
  @ProductID VARCHAR(20),
  @Quantity INT
)
RETURNS DECIMAL(12, 2)
AS
BEGIN
  DECLARE @BasePrice DECIMAL(12, 2);

  SELECT @BasePrice = BasePrice
  FROM PRODUCT
  WHERE ProductID = @ProductID;

  IF @BasePrice IS NULL OR @Quantity IS NULL OR @Quantity <= 0
    RETURN 0;

  RETURN @BasePrice * @Quantity;
END;
GO
