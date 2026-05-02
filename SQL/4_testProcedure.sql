/*
    TEST dbo.sp_InsertProduct
    Chỉ gọi procedure với tham số.

*/


/*
Case 1: Insert hợp lệ
Mong muốn: Thêm sản phẩm thành công.
*/
EXEC dbo.sp_InsertProduct
    @ProductID = 'PR016',
    @ProductName = N'Combo bắp nước lớn',
    @ProductType = N'Combo',
    @BasePrice = 150000,
    @ProductStatus = N'Đang bán';
GO

/*
Case 2: ProductID rỗng
Mong muốn: Lỗi 50001 - Mã sản phẩm không được để trống.
*/
EXEC dbo.sp_InsertProduct
    @ProductID = '',
    @ProductName = N'Combo bắp nước nhỏ',
    @ProductType = N'Combo',
    @BasePrice = 90000,
    @ProductStatus = N'Đang bán';
GO

/*
Case 3: ProductID toàn khoảng trắng
Mong muốn: Lỗi 50001 - Mã sản phẩm không được để trống.
*/
EXEC dbo.sp_InsertProduct
    @ProductID = '     ',
    @ProductName = N'Combo bắp nước vừa',
    @ProductType = N'Combo',
    @BasePrice = 120000,
    @ProductStatus = N'Đang bán';
GO

/*
Case 4: ProductID trùng PR001
Dữ liệu nguồn: PR001 đã có trong bảng PRODUCT.
Mong muốn: Lỗi 50009 - Mã sản phẩm đã tồn tại.
*/
EXEC dbo.sp_InsertProduct
    @ProductID = 'PR001',
    @ProductName = N'Combo bắp nước tiêu chuẩn',
    @ProductType = N'Combo',
    @BasePrice = 135000,
    @ProductStatus = N'Đang bán';
GO

/*
Case 5: ProductName rỗng
Mong muốn: Lỗi 50002 - Tên sản phẩm không được để trống.
*/
EXEC dbo.sp_InsertProduct
    @ProductID = 'PR007',
    @ProductName = N'',
    @ProductType = N'Combo',
    @BasePrice = 100000,
    @ProductStatus = N'Đang bán';
GO

/*
Case 6: ProductType rỗng
Mong muốn: Lỗi 50003 - Loại sản phẩm không được để trống.
*/
EXEC dbo.sp_InsertProduct
    @ProductID = 'PR008',
    @ProductName = N'Nước ngọt vị cam',
    @ProductType = N'',
    @BasePrice = 55000,
    @ProductStatus = N'Đang bán';
GO

/*
Case 7: ProductType sai danh mục
Mong muốn: Lỗi 50004 - Loại sản phẩm không hợp lệ.
*/
EXEC dbo.sp_InsertProduct
    @ProductID = 'PR009',
    @ProductName = N'Khoai tây chiên',
    @ProductType = N'Đồ ăn',
    @BasePrice = 70000,
    @ProductStatus = N'Đang bán';
GO

/*
Case 8: BasePrice NULL
Mong muốn: Lỗi 50005 - Giá cơ bản không được để trống.
*/
EXEC dbo.sp_InsertProduct
    @ProductID = 'PR010',
    @ProductName = N'Bắp rang bơ phô mai',
    @ProductType = N'Bắp',
    @BasePrice = NULL,
    @ProductStatus = N'Đang bán';
GO

/*
Case 9: BasePrice âm
Mong muốn: Lỗi 50006 - Giá cơ bản phải lớn hơn hoặc bằng 0.
*/
EXEC dbo.sp_InsertProduct
    @ProductID = 'PR011',
    @ProductName = N'Nước suối lạnh',
    @ProductType = N'Nước',
    @BasePrice = -1000,
    @ProductStatus = N'Đang bán';
GO

/*
Case 10: ProductStatus rỗng
Mong muốn: Lỗi 50007 - Trạng thái sản phẩm không được để trống.
*/
EXEC dbo.sp_InsertProduct
    @ProductID = 'PR012',
    @ProductName = N'Nước ngọt size nhỏ',
    @ProductType = N'Nước',
    @BasePrice = 45000,
    @ProductStatus = N'';
GO

/*
Case 11: ProductStatus sai danh mục
Mong muốn: Lỗi 50008 - Trạng thái sản phẩm không hợp lệ.
*/
EXEC dbo.sp_InsertProduct
    @ProductID = 'PR013',
    @ProductName = N'Combo bắp nước đặc biệt',
    @ProductType = N'Combo',
    @BasePrice = 180000,
    @ProductStatus = N'Còn hàng';
GO






/*
    TEST dbo.sp_UpdateProduct
    Chỉ gọi procedure với tham số.
    Không so sánh, không assert.

    Dữ liệu nguồn:
    PR001 | Combo bắp nước tiêu chuẩn | Combo | 135000 | Đang bán
    PR002 | Nước ngọt                 | Nước  | 55000  | Đang bán
    PR003 | Nước ngọt size lớn        | Nước  | 60000  | Đang bán
    PR004 | Bắp rang bơ               | Bắp   | 45000  | Đang bán
    PR005 | Nước suối                 | Nước  | 30000  | Đang bán
*/



/*
Case 1: Update hợp lệ
Dữ liệu nguồn: PR005 là Nước suối, giá 30000.
Mong muốn: Cập nhật thành công, chỉ tăng giá bán từ 30000 lên 35000.
*/
EXEC dbo.sp_UpdateProduct
    @ProductID = 'PR005',
    @ProductName = N'Nước suối',
    @ProductType = N'Nước',
    @BasePrice = 35000,
    @ProductStatus = N'Đang bán';
GO

/*
Case 2: ProductID rỗng
Mong muốn: Lỗi 50101 - Mã sản phẩm không được để trống.
*/
EXEC dbo.sp_UpdateProduct
    @ProductID = '',
    @ProductName = N'Nước suối',
    @ProductType = N'Nước',
    @BasePrice = 35000,
    @ProductStatus = N'Đang bán';
GO

/*
Case 3: ProductID toàn khoảng trắng
Mong muốn: Lỗi 50101 - Mã sản phẩm không được để trống.
*/
EXEC dbo.sp_UpdateProduct
    @ProductID = '     ',
    @ProductName = N'Nước suối',
    @ProductType = N'Nước',
    @BasePrice = 35000,
    @ProductStatus = N'Đang bán';
GO

/*
Case 4: ProductID không tồn tại
Mong muốn: Lỗi 50102 - Không tìm thấy sản phẩm cần cập nhật.
*/
EXEC dbo.sp_UpdateProduct
    @ProductID = 'PR999',
    @ProductName = N'Nước suối',
    @ProductType = N'Nước',
    @BasePrice = 35000,
    @ProductStatus = N'Đang bán';
GO

/*
Case 5: ProductName rỗng
Dùng PR001 vì PR001 có tồn tại trong bảng PRODUCT.
Mong muốn: Lỗi 50103 - Tên sản phẩm không được để trống.
*/
EXEC dbo.sp_UpdateProduct
    @ProductID = 'PR001',
    @ProductName = N'',
    @ProductType = N'Combo',
    @BasePrice = 135000,
    @ProductStatus = N'Đang bán';
GO

/*
Case 6: ProductType rỗng
Dùng PR001 vì PR001 có tồn tại trong bảng PRODUCT.
Mong muốn: Lỗi 50104 - Loại sản phẩm không được để trống.
*/
EXEC dbo.sp_UpdateProduct
    @ProductID = 'PR001',
    @ProductName = N'Combo bắp nước tiêu chuẩn',
    @ProductType = N'',
    @BasePrice = 135000,
    @ProductStatus = N'Đang bán';
GO

/*
Case 7: ProductType sai danh mục
Dùng PR001 vì PR001 có tồn tại trong bảng PRODUCT.
Mong muốn: Lỗi 50105 - Loại sản phẩm không hợp lệ.
*/
EXEC dbo.sp_UpdateProduct
    @ProductID = 'PR001',
    @ProductName = N'Combo bắp nước tiêu chuẩn',
    @ProductType = N'Đồ ăn',
    @BasePrice = 135000,
    @ProductStatus = N'Đang bán';
GO

/*
Case 8: BasePrice NULL
Dùng PR001 vì PR001 có tồn tại trong bảng PRODUCT.
Mong muốn: Lỗi 50106 - Giá cơ bản không được để trống.
*/
EXEC dbo.sp_UpdateProduct
    @ProductID = 'PR001',
    @ProductName = N'Combo bắp nước tiêu chuẩn',
    @ProductType = N'Combo',
    @BasePrice = NULL,
    @ProductStatus = N'Đang bán';
GO

/*
Case 9: BasePrice âm
Dùng PR001 vì PR001 có tồn tại trong bảng PRODUCT.
Mong muốn: Lỗi 50107 - Giá cơ bản phải lớn hơn hoặc bằng 0.
*/
EXEC dbo.sp_UpdateProduct
    @ProductID = 'PR001',
    @ProductName = N'Combo bắp nước tiêu chuẩn',
    @ProductType = N'Combo',
    @BasePrice = -1000,
    @ProductStatus = N'Đang bán';
GO

/*
Case 10: ProductStatus rỗng
Dùng PR001 vì PR001 có tồn tại trong bảng PRODUCT.
Mong muốn: Lỗi 50108 - Trạng thái sản phẩm không được để trống.
*/
EXEC dbo.sp_UpdateProduct
    @ProductID = 'PR001',
    @ProductName = N'Combo bắp nước tiêu chuẩn',
    @ProductType = N'Combo',
    @BasePrice = 135000,
    @ProductStatus = N'';
GO

/*
Case 11: ProductStatus sai danh mục
Dùng PR001 vì PR001 có tồn tại trong bảng PRODUCT.
Mong muốn: Lỗi 50109 - Trạng thái sản phẩm không hợp lệ.
*/
EXEC dbo.sp_UpdateProduct
    @ProductID = 'PR001',
    @ProductName = N'Combo bắp nước tiêu chuẩn',
    @ProductType = N'Combo',
    @BasePrice = 135000,
    @ProductStatus = N'Còn hàng';
GO





/*
    TEST dbo.sp_DeleteProduct
    Chỉ gọi procedure với tham số.
    Không so sánh, không assert.

    Source đã check:

    PRODUCT:
    PR001 | Đang bán | 135000 | Combo bắp nước tiêu chuẩn | Combo
    PR002 | Đang bán |  55000 | Nước ngọt                 | Nước
    PR003 | Đang bán |  60000 | Nước ngọt size lớn        | Nước
    PR004 | Đang bán |  45000 | Bắp rang bơ               | Bắp
    PR005 | Đang bán |  30000 | Nước suối                 | Nước

    Form ID theo source:
    ProductID     : PR001, PR002, PR003...
    OrderID       : O001, O002, O003...
    OrderDetailID : OD001, OD002, OD003...

    Data lớn nhất trong source:
    ProductID     : PR005
    OrderID       : O033
    OrderDetailID : OD037

    Data test mới dùng:
    PR014: dùng cho case xóa hợp lệ
    PR015: dùng cho case sản phẩm có order hôm nay
    O034 : order hôm nay cho PR015
    OD038: order detail + product detail cho PR015
*/


/*
Case 1: Delete hợp lệ

Data cần tạo:
Bảng PRODUCT:
PR014 | Ngừng kinh doanh | 45000 | Trà đào | Nước

Không tạo dòng nào trong PRODUCT_DETAIL, ORDER_DETAIL, [ORDER]
để PR014 không bị ràng buộc bởi đơn hàng.

Mong muốn:
Xóa sản phẩm thành công.
*/
IF NOT EXISTS (
    SELECT 1
    FROM PRODUCT
    WHERE ProductID = 'PR014'
)
BEGIN
    INSERT INTO PRODUCT
        (ProductID, ProductStatus, BasePrice, ProductName, ProductType)
    VALUES
        ('PR014', N'Ngừng kinh doanh', 45000.00, N'Trà đào', N'Nước');
END
GO

EXEC dbo.sp_DeleteProduct
    @ProductID = 'PR014';
GO

/*
Case 2: ProductID NULL

Mong muốn:
Lỗi 50201 - Mã sản phẩm không được để trống.
*/
EXEC dbo.sp_DeleteProduct
    @ProductID = NULL;
GO

/*
Case 3: ProductID rỗng

Mong muốn:
Lỗi 50201 - Mã sản phẩm không được để trống.
*/
EXEC dbo.sp_DeleteProduct
    @ProductID = '';
GO

/*
Case 4: ProductID toàn khoảng trắng

Mong muốn:
Lỗi 50201 - Mã sản phẩm không được để trống.
*/
EXEC dbo.sp_DeleteProduct
    @ProductID = '     ';
GO

/*
Case 5: ProductID không tồn tại

Data check từ source:
Không có ProductID PR999 trong bảng PRODUCT.

Mong muốn:
Lỗi 50202 - Không tìm thấy sản phẩm cần xóa.
*/
EXEC dbo.sp_DeleteProduct
    @ProductID = 'PR999';
GO

/*
Case 6: Sản phẩm có tồn tại nhưng chưa Ngừng kinh doanh

Data lấy từ source:
PRODUCT:
PR002 | Đang bán | 55000 | Nước ngọt | Nước

Vì PR002 đang có ProductStatus = N'Đang bán'
nên procedure phải chặn trước khi xét order.

Mong muốn:
Lỗi 50203 - Chỉ được xóa sản phẩm có trạng thái "Ngừng kinh doanh".
*/
EXEC dbo.sp_DeleteProduct
    @ProductID = 'PR002';
GO

/*
Case 7: Sản phẩm đã Ngừng kinh doanh nhưng hôm nay có order chứa sản phẩm đó

Data cần tạo theo đúng form ID nguồn:

Bảng PRODUCT:
PR015 | Ngừng kinh doanh | 50000 | Nước cam | Nước

Bảng [ORDER]:
O034 | 1 | CAST(GETDATE() AS DATE) | Mua nước cam trong ngày | 50000 | P101

P101 có sẵn trong CUSTOMER:
P101 | C101

Bảng ORDER_DETAIL:
OD038 | 1 | 50000.00 | 50000.00 | O034 | NULL

Bảng PRODUCT_DETAIL:
OD038 | Nước cam | M | PR015

Chuỗi liên quan:
PRODUCT.PR015
-> PRODUCT_DETAIL.OD038
-> ORDER_DETAIL.OD038
-> [ORDER].O034, OrderDate = hôm nay

Mong muốn:
Lỗi 50204 - Không thể xóa vì hôm nay đã phát sinh đơn hàng chứa sản phẩm này.
*/

IF NOT EXISTS (
    SELECT 1
    FROM PRODUCT
    WHERE ProductID = 'PR015'
            )
            BEGIN
                INSERT INTO PRODUCT
                    (ProductID, ProductStatus, BasePrice, ProductName, ProductType)
                VALUES
                    ('PR015', N'Ngừng kinh doanh', 50000.00, N'Nước cam', N'Nước');
            END
ELSE
    BEGIN
        UPDATE PRODUCT
        SET
            ProductStatus = N'Ngừng kinh doanh',
            BasePrice = 50000.00,
            ProductName = N'Nước cam',
            ProductType = N'Nước'
        WHERE ProductID = 'PR015';
    END
GO

IF NOT EXISTS (
    SELECT 1
    FROM [ORDER]
    WHERE OrderID = 'O034'
)
BEGIN
    INSERT INTO [ORDER]
        (OrderID, OrderStatus, OrderDate, OrderNote, TotalAmount, PersonID)
    VALUES
        ('O034', 1, CAST(GETDATE() AS DATE), N'Mua nước cam trong ngày', 50000, 'P101');
END
ELSE
BEGIN
    UPDATE [ORDER]
    SET
        OrderStatus = 1,
        OrderDate = CAST(GETDATE() AS DATE),
        OrderNote = N'Mua nước cam trong ngày',
        TotalAmount = 50000,
        PersonID = 'P101'
    WHERE OrderID = 'O034';
END
GO

IF NOT EXISTS (
    SELECT 1
    FROM ORDER_DETAIL
    WHERE OrderDetailID = 'OD038'
)
BEGIN
    INSERT INTO ORDER_DETAIL
        (OrderDetailID, OrderDetailQuantity, OrderDetailUnitPrice, OrderDetailSubtotal, OrderID, RequestID)
    VALUES
        ('OD038', 1, 50000.00, 50000.00, 'O034', NULL);
END
ELSE
BEGIN
    UPDATE ORDER_DETAIL
    SET
        OrderDetailQuantity = 1,
        OrderDetailUnitPrice = 50000.00,
        OrderDetailSubtotal = 50000.00,
        OrderID = 'O034',
        RequestID = NULL
    WHERE OrderDetailID = 'OD038';
END
GO

IF NOT EXISTS (
    SELECT 1
    FROM PRODUCT_DETAIL
    WHERE OrderDetailID = 'OD038'
)
BEGIN
    INSERT INTO PRODUCT_DETAIL
        (OrderDetailID, ProductDetailProductNote, ProductDetailSizeOption, ProductID)
    VALUES
        ('OD038', N'Nước cam', N'M', 'PR015');
END
ELSE
BEGIN
    UPDATE PRODUCT_DETAIL
    SET
        ProductDetailProductNote = N'Nước cam',
        ProductDetailSizeOption = N'M',
        ProductID = 'PR015'
    WHERE OrderDetailID = 'OD038';
END
GO

EXEC dbo.sp_DeleteProduct
    @ProductID = 'PR015';
GO