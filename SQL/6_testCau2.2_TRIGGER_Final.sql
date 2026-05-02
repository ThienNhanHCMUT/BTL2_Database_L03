/*
TEST TRIGGER dbo.trg_Review_PreventUpdatePersonID
*/


/*
Case 1: Update hợp lệ - chỉ sửa nội dung review

Data nguồn:
RV001 | PersonID = P090

Thao tác:
Chỉ sửa Content, không đổi PersonID

Mong muốn:
Update thành công.
*/
UPDATE REVIEW
SET Content = N'Nội dung đã được chỉnh sửa.'
WHERE ReviewID = 'RV001';
GO


/*
Case 2: Đổi người viết review

Data nguồn:
RV001 | PersonID = P090

Thao tác:
Đổi PersonID từ P090 sang P091

Mong muốn:
Lỗi 50003
Không được phép thay đổi người viết review sau khi review đã được tạo.
*/
UPDATE REVIEW
SET PersonID = 'P091'
WHERE ReviewID = 'RV001';
GO


/*
Case 3: Update nhiều dòng cùng lúc có vi phạm

Data nguồn:
RV002 | P091
RV003 | P093

Thao tác:
Đổi PersonID cả 2 review

Mong muốn:
Lỗi 50003
Toàn bộ câu lệnh bị rollback.
*/
UPDATE REVIEW
SET PersonID = 'P120'
WHERE ReviewID IN ('RV002', 'RV003');
GO



/*
TEST TRIGGER dbo.trg_ProductReview_OnlyPurchasedProduct
*/

/*
Case 1: Review sản phẩm đã từng mua

Data nguồn:
P096 đã mua:
O022, O023

Trong O023 có:
OD023 -> PR001

Tạo review mới RV011 cho P096
Sau đó review PR001

Mong muốn:
Insert thành công.
*/
INSERT INTO REVIEW
(ReviewID, PersonID, Content, ReviewTime, ReviewNumOfStars)
VALUES
('RV011', 'P096', N'Combo khá ngon.', GETDATE(), 5);
GO

INSERT INTO PRODUCT_REVIEW
(ReviewID, ProductID)
VALUES
('RV011', 'PR001');
GO


/*
Case 2: Review sản phẩm chưa từng mua

Data nguồn:
P096 chưa mua PR005

Tạo review mới RV012 cho P096
Sau đó gắn PR005

Mong muốn:
Lỗi 50001
Không thể review sản phẩm này vì khách hàng chưa từng mua sản phẩm.
*/
INSERT INTO REVIEW
(ReviewID, PersonID, Content, ReviewTime, ReviewNumOfStars)
VALUES
('RV012', 'P096', N'Thử review nước suối.', GETDATE(), 3);
GO

INSERT INTO PRODUCT_REVIEW
(ReviewID, ProductID)
VALUES
('RV012', 'PR005');
GO


/*
Case 3: Update review cũ sang sản phẩm chưa mua

Data nguồn:
RV004 thuộc P096 hiện đang review PR001

Thao tác:
Đổi sang PR003

P096 chưa từng mua PR003

Mong muốn:
Lỗi 50001
*/
UPDATE PRODUCT_REVIEW
SET ProductID = 'PR003'
WHERE ReviewID = 'RV004';
GO


/*
Case 4: Insert nhiều dòng, 1 đúng 1 sai

Data:
P098 đã mua PR003
P098 chưa mua PR001

Tạo:
RV013, RV014

Mong muốn:
Lỗi 50001
Cả batch insert rollback.
*/
INSERT INTO REVIEW
(ReviewID, PersonID, Content, ReviewTime, ReviewNumOfStars)
VALUES
('RV013', 'P098', N'Review đúng.', GETDATE(), 4),
('RV014', 'P098', N'Review sai.', GETDATE(), 2);
GO

INSERT INTO PRODUCT_REVIEW
(ReviewID, ProductID)
VALUES
('RV013', 'PR003'),
('RV014', 'PR001');
GO



/*
=========================================================
TEST TRIGGER: trg_PointHistory_UpdateCurrentPoints
=========================================================
*/


/*
Case 1: INSERT thêm điểm cho khách đã đăng ký

Source:
P090 hiện có:
PH001 = +50
PH002 = +15
=> Tổng hiện tại = 65

Thêm:
+20

Mong muốn:
CurrentPoints của P090 = 85
*/
INSERT INTO POINT_HISTORY
(HistoryID, PointChange, PointReason, PointTimeStamp, PersonID, OrderID)
VALUES
('PH9001', 20, N'Test cộng điểm', GETDATE(), 'P090', NULL);

SELECT PersonID, CurrentPoints
FROM REGISTERED_CUSTOMER
WHERE PersonID = 'P090';
GO



/*
Case 2: INSERT trừ điểm

Source:
P097 có:
PH011 = +16
PH012 = +28
PH013 = -20
=> Tổng = 24

Thêm:
-10

Mong muốn:
CurrentPoints = 14
*/
INSERT INTO POINT_HISTORY
(HistoryID, PointChange, PointReason, PointTimeStamp, PersonID, OrderID)
VALUES
('PH9002', -10, N'Test trừ điểm', GETDATE(), 'P097', NULL);

SELECT PersonID, CurrentPoints
FROM REGISTERED_CUSTOMER
WHERE PersonID = 'P097';
GO



/*
Case 3: UPDATE PointChange

Source:
PH9001 của P090 = +20

Đổi thành +50

Mong muốn:
P090 đang 85
Tăng thêm 30
=> CurrentPoints = 115
*/
UPDATE POINT_HISTORY
SET PointChange = 50
WHERE HistoryID = 'PH9001';

SELECT PersonID, CurrentPoints
FROM REGISTERED_CUSTOMER
WHERE PersonID = 'P090';
GO



/*
Case 4: DELETE lịch sử điểm

Xóa PH9001 (+50)

Mong muốn:
P090 từ 115 giảm còn 65
*/
DELETE FROM POINT_HISTORY
WHERE HistoryID = 'PH9001';

SELECT PersonID, CurrentPoints
FROM REGISTERED_CUSTOMER
WHERE PersonID = 'P090';
GO



/*
Case 5: UPDATE chuyển PersonID sang khách khác

Source:
PH9002 đang thuộc P097 = -10

Chuyển sang P098

Mong muốn:
P097 mất dòng -10 => tăng từ 14 lên 24
P098 nhận -10
P098 hiện có:
PH014 = +14
PH015 = +21
=35

Sau khi nhận -10 => 25
*/
UPDATE POINT_HISTORY
SET PersonID = 'P098'
WHERE HistoryID = 'PH9002';

SELECT PersonID, CurrentPoints
FROM REGISTERED_CUSTOMER
WHERE PersonID IN ('P097', 'P098');
GO



/*
Case 6: INSERT nhiều dòng cùng lúc

Thêm cho P111:
+10
+20
-5

Source P111 hiện:
PH016 = +18

Mong muốn:
18 +10 +20 -5 = 43
*/
INSERT INTO POINT_HISTORY
(HistoryID, PointChange, PointReason, PointTimeStamp, PersonID, OrderID)
VALUES
('PH9003', 10, N'Test batch 1', GETDATE(), 'P111', NULL),
('PH9004', 20, N'Test batch 2', GETDATE(), 'P111', NULL),
('PH9005', -5, N'Test batch 3', GETDATE(), 'P111', NULL);

SELECT PersonID, CurrentPoints
FROM REGISTERED_CUSTOMER
WHERE PersonID = 'P111';
GO



/*
Case 7: DELETE nhiều dòng cùng lúc

Xóa PH9003 PH9004 PH9005

Mong muốn:
P111 quay lại 18
*/
DELETE FROM POINT_HISTORY
WHERE HistoryID IN ('PH9003','PH9004','PH9005');

SELECT PersonID, CurrentPoints
FROM REGISTERED_CUSTOMER
WHERE PersonID = 'P111';
GO



/*
Case 8: Xóa toàn bộ lịch sử điểm của 1 khách

P120 hiện có:
PH028 = +25

Xóa PH028

Mong muốn:
CurrentPoints = 0
*/
DELETE FROM POINT_HISTORY
WHERE HistoryID = 'PH028';

SELECT PersonID, CurrentPoints
FROM REGISTERED_CUSTOMER
WHERE PersonID = 'P120';
GO