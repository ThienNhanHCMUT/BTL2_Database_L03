-- 2.1 PROCEDUCE for table PRODUCT


GO


-- INSERT


CREATE OR ALTER PROCEDURE sp_InsertProduct
-- cac input params
    @ProductID      VARCHAR(20),
    @ProductName    NVARCHAR(100),
    @ProductType    NVARCHAR(50),
    @BasePrice      DECIMAL(12,2),
    @ProductStatus  NVARCHAR(30)
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        -- chuẩn hóa sang nvarchar cho juan
        -- khi 2 dau la dau " " thì xóa bớt đi
        -- toàn dấu " " thì bỏ hết dấu cách => sẽ null và bắt được lỗi 

        SET @ProductID = LTRIM(RTRIM(@ProductID));
        SET @ProductName = LTRIM(RTRIM(@ProductName));
        SET @ProductType = LTRIM(RTRIM(@ProductType));
        SET @ProductStatus = LTRIM(RTRIM(@ProductStatus));

        -- 1. 
        IF @ProductID IS NULL OR @ProductID = ''
            THROW 50001, N'Mã sản phẩm không được để trống.', 1;

        -- trùng id hay ko
        IF EXISTS (
            SELECT 1
            FROM PRODUCT
            WHERE ProductID = @ProductID
        )
            THROW 50009, N'Mã sản phẩm đã tồn tại.', 1;


        -- 2. 
        IF @ProductName IS NULL OR @ProductName = ''
            THROW 50002, N'Tên sản phẩm không được để trống.', 1;

        -- 3. 
        IF @ProductType IS NULL OR @ProductType = ''
            THROW 50003, N'Loại sản phẩm không được để trống.', 1;

        IF @ProductType NOT IN (N'Bắp', N'Nước', N'Combo', N'Khác')
            THROW 50004, N'Loại sản phẩm không hợp lệ. Chỉ chấp nhận: Bắp, Nước, Combo, Khác.', 1;

        -- 4. 
        IF @BasePrice IS NULL
            THROW 50005, N'Giá cơ bản không được để trống.', 1;

        IF @BasePrice < 0
            THROW 50006, N'Giá cơ bản phải lớn hơn hoặc bằng 0.', 1;

        -- 5. 
        IF @ProductStatus IS NULL OR @ProductStatus = ''
            THROW 50007, N'Trạng thái sản phẩm không được để trống.', 1;

        IF @ProductStatus NOT IN (N'Đang bán', N'Tạm ngừng', N'Ngừng kinh doanh')
            THROW 50008, N'Trạng thái sản phẩm không hợp lệ. Chỉ chấp nhận: Đang bán, Tạm ngừng, Ngừng kinh doanh.', 1;

       
----- ỔN HẾT MỚI THÊM VÔ

        -- 6.
        INSERT INTO PRODUCT (
            ProductID,
            ProductName,
            ProductType,
            BasePrice,
            ProductStatus
        )
        VALUES (
            @ProductID,
            @ProductName,
            @ProductType,
            @BasePrice,
            @ProductStatus
        );

        PRINT N'Thêm sản phẩm thành công. he he';
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO





















-----------------------------------------------------------------------------------------------
-----------------------------------------------------------------------------------------------
-----------------------------------------------------------------------------------------------


-- UPDATE
-- pipeline: chuẩn hóa dữ liệu -> check xem có id trước đó chưa -> check đúng dữ liệu(null, trùng )  -> update vô table dựa vào id


-----------------------------------------------------------------------------------------------
-----------------------------------------------------------------------------------------------
-----------------------------------------------------------------------------------------------

CREATE OR ALTER PROCEDURE sp_UpdateProduct
    @ProductID      VARCHAR(20),
    @ProductName    NVARCHAR(100),
    @ProductType    NVARCHAR(50),
    @BasePrice      DECIMAL(12,2),
    @ProductStatus  NVARCHAR(30)
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        -- Chuẩn hóa dữ liệu 
        SET @ProductID = LTRIM(RTRIM(@ProductID));
        SET @ProductName = LTRIM(RTRIM(@ProductName));
        SET @ProductType = LTRIM(RTRIM(@ProductType));
        SET @ProductStatus = LTRIM(RTRIM(@ProductStatus));

        -- 1. Kiểm tra ProductID
        IF @ProductID IS NULL OR @ProductID = ''
            THROW 50101, N'Mã sản phẩm không được để trống.', 1;

        -- 2. Kiểm tra sản phẩm có tồn tại không
        IF NOT EXISTS (
            SELECT 1
            FROM PRODUCT
            WHERE ProductID = @ProductID
        )
            THROW 50102, N'Không tìm thấy sản phẩm cần cập nhật.', 1;

        -- 3. Kiểm tra ProductName
        IF @ProductName IS NULL OR @ProductName = ''
            THROW 50103, N'Tên sản phẩm không được để trống.', 1;

        -- 4. Kiểm tra ProductType
        IF @ProductType IS NULL OR @ProductType = ''
            THROW 50104, N'Loại sản phẩm không được để trống.', 1;

        IF @ProductType NOT IN (N'Bắp', N'Nước', N'Combo', N'Khác')
            THROW 50105, N'Loại sản phẩm không hợp lệ. Chỉ chấp nhận: Bắp, Nước, Combo, Khác.', 1;

        -- 5. Kiểm tra BasePrice
        IF @BasePrice IS NULL
            THROW 50106, N'Giá cơ bản không được để trống.', 1;

        IF @BasePrice < 0
            THROW 50107, N'Giá cơ bản phải lớn hơn hoặc bằng 0.', 1;

        -- 6. Kiểm tra ProductStatus
        IF @ProductStatus IS NULL OR @ProductStatus = ''
            THROW 50108, N'Trạng thái sản phẩm không được để trống.', 1;

        IF @ProductStatus NOT IN (N'Đang bán', N'Tạm ngừng', N'Ngừng kinh doanh')
            THROW 50109, N'Trạng thái sản phẩm không hợp lệ. Chỉ chấp nhận: Đang bán, Tạm ngừng, Ngừng kinh doanh.', 1;

        -- 7. Thực hiện cập nhật
        UPDATE PRODUCT
        SET
            ProductName = @ProductName,
            ProductType = @ProductType,
            BasePrice = @BasePrice,
            ProductStatus = @ProductStatus
        WHERE ProductID = @ProductID;

        PRINT N'Cập nhật sản phẩm thành công.';
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO














-----------------------------------------------------------------------------------------------
-----------------------------------------------------------------------------------------------
-----------------------------------------------------------------------------------------------


-- DELELET
-- pipeline: chuẩn hóa dữ liệu -> check xem có id trước đó chưa -> check đúng dữ liệu(null, trùng )  -> update vô table dựa vào id

/*

Chuẩn hóa @ProductID
Kiểm tra @ProductID có rỗng không
Kiểm tra sản phẩm có tồn tại không


sp phải NGỪNG KINH DOANH mới xóa


Kiểm tra theo chuỗi
PRODUCT_DETAIL -> ORDER_DETAIL -> [ORDER]

xem có đơn hàng nào chứa sản phẩm này trong cùng ngày

Nếu có thì báo lỗi: không được xóa vì sản phẩm có order phát sinh trong cùng ngày 
( phải đổi status thành Ngưng hoạt động trước, đợi 1 ngày sau mới xóa)

Nếu không có thì mới đi tới câu lệnh DELETE


*/
-----------------------------------------------------------------------------------------------
-----------------------------------------------------------------------------------------------
-----------------------------------------------------------------------------------------------'


GO

CREATE OR ALTER PROCEDURE sp_DeleteProduct
    @ProductID VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        -- Chuẩn hóa dữ liệu
        SET @ProductID = LTRIM(RTRIM(@ProductID));

        -- 1. Kiểm tra ProductID
        IF @ProductID IS NULL OR @ProductID = ''
            THROW 50201, N'Mã sản phẩm không được để trống.', 1;

        -- 2. Kiểm tra sản phẩm có tồn tại không
        IF NOT EXISTS (
            SELECT 1
            FROM PRODUCT
            WHERE ProductID = @ProductID
        )
            THROW 50202, N'Không tìm thấy sản phẩm cần xóa.', 1;



        ---3. NGỪNG KINH DOANH MỚI XÓA

        IF NOT EXISTS (
            SELECT 1
            FROM PRODUCT
            WHERE ProductID = @ProductID
              AND ProductStatus = N'Ngừng kinh doanh'
        )
            THROW 50203, N'Chỉ được xóa sản phẩm có trạng thái "Ngừng kinh doanh". Hãy cập nhật trạng thái trước khi xóa.', 1;


        -- 4. Kiểm tra nghiệp vụ:
        -- Không được xóa nếu trong ngày hôm nay có đơn hàng chứa sản phẩm này
        IF EXISTS (
            SELECT 1
            FROM PRODUCT_DETAIL pd
            JOIN ORDER_DETAIL od
                ON pd.OrderDetailID = od.OrderDetailID
            JOIN [ORDER] o
                ON od.OrderID = o.OrderID
            WHERE pd.ProductID = @ProductID
              AND o.OrderDate = CAST(GETDATE() AS DATE)
        )
            THROW 50204, N'Không thể xóa vì hôm nay đã phát sinh đơn hàng chứa sản phẩm này.', 1;

        -- 4. Thực hiện xóa
        DELETE FROM PRODUCT
        WHERE ProductID = @ProductID;

        PRINT N'Xóa sản phẩm thành công.';
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO