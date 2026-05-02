# Frontend API Contract - Event & Product Modules

File này mô tả API contract frontend đang giả định cho phần 3 của BTL CSDL. Backend team sẽ hiện thực endpoint thật sau. Frontend không tạo backend và không gọi trực tiếp SQL.

Base URL lấy từ `VITE_API_BASE_URL`, mặc định `http://localhost:5000`. Prefix lấy từ `VITE_API_PREFIX`, mặc định `/api`.

## Mapping màn hình

| Màn hình frontend | Route | Service frontend | Endpoint | SQL backend cần gọi |
| --- | --- | --- | --- | --- |
| Quản lý sự kiện | `/events` | `fetchEvents` | `GET /api/events` | `usp_Event_List` |
| Quản lý sự kiện | `/events` | `createEvent` | `POST /api/events` | `usp_Event_Insert` |
| Quản lý sự kiện | `/events` | `updateEvent` | `PUT /api/events/:eventId` | `usp_Event_Update` |
| Quản lý sự kiện | `/events` | `deleteEvent` | `DELETE /api/events/:eventId` | `usp_Event_Delete` |
| Tổng hợp tổ chức | `/event-organizer-summary` | `fetchOrganizerEventSummary` | `GET /api/event-organizer-summary` | `usp_Organizer_Event_Summary` |
| Phân tích sự kiện | `/event-analytics` | `fetchEventMetrics` | `GET /api/events/:eventId/metrics` | `fn_Event_TotalConfirmedRentalFee`, `fn_Event_CapacityCoverageLabel` |

## Quy ước response

Frontend chấp nhận các dạng list sau:

```json
{ "data": [] }
```

```json
{ "items": [] }
```

```json
{ "recordset": [] }
```

Frontend chấp nhận lỗi dạng:

```json
{
  "message": "Thông báo lỗi nghiệp vụ rõ ràng",
  "code": "BUSINESS_RULE_ERROR",
  "fieldErrors": {
    "EventName": "Tên sự kiện không được để trống."
  }
}
```

`message` nên giữ nguyên nội dung lỗi từ procedure/trigger khi có thể.

## 1. CRUD EVENT - Câu 3.1

### 1.1. List EVENT

**Endpoint**

`GET /api/events`

**SQL cần gọi**

`usp_Event_List`

**Query params**

| Param | SQL param | Type | Bắt buộc | Ghi chú |
| --- | --- | --- | --- | --- |
| `Keyword` | `@Keyword` | string | Không | Tìm theo `EventID`, `EventName`, `OrgName` |
| `EventStatus` | `@EventStatus` | string | Không | `Chờ duyệt`, `Đã duyệt`, `Từ chối`, `Đã hoàn thành` |
| `FromDate` | `@FromDate` | date | Không | Lọc `EventStartDate >= FromDate` |
| `ToDate` | `@ToDate` | date | Không | Lọc `EventStartDate <= ToDate` |

**Response mẫu**

```json
{
  "data": [
    {
      "EventID": "EV003",
      "EventName": "Tên sự kiện",
      "EventStartDate": "2026-06-01",
      "EventEndDate": "2026-06-02",
      "EventStatus": "Đã duyệt",
      "ExpectedScale": 200,
      "TotalBudget": 50000000,
      "ConfirmedSessionCount": 2,
      "OrgName": "Tên nhà tổ chức",
      "OrganizerType": "Corporate"
    }
  ]
}
```

### 1.2. Insert EVENT

**Endpoint**

`POST /api/events`

**SQL cần gọi**

`usp_Event_Insert`

**Request body**

```json
{
  "EventID": "EV010",
  "OrganizerID": "ORG001",
  "EventName": "Tên sự kiện",
  "EventDesc": "Mô tả sự kiện",
  "EventStartDate": "2026-06-01",
  "EventEndDate": "2026-06-02",
  "ExpectedScale": 200,
  "TotalBudget": 50000000,
  "EventStatus": "Chờ duyệt"
}
```

**Response mẫu**

```json
{
  "data": {
    "EventID": "EV010",
    "OrganizerID": "ORG001",
    "EventName": "Tên sự kiện",
    "EventDesc": "Mô tả sự kiện",
    "EventStartDate": "2026-06-01",
    "EventEndDate": "2026-06-02",
    "ExpectedScale": 200,
    "TotalBudget": 50000000,
    "EventStatus": "Chờ duyệt",
    "ConfirmedSessionCount": 0
  }
}
```

**Lỗi nghiệp vụ backend nên trả**

```json
{
  "message": "Mã sự kiện đã tồn tại.",
  "code": "BUSINESS_RULE_ERROR",
  "fieldErrors": {
    "EventID": "Mã sự kiện đã tồn tại."
  }
}
```

Các lỗi procedure có thể có:

- `Mã sự kiện không được để trống.`
- `Mã sự kiện đã tồn tại.`
- `Mã nhà tổ chức không được để trống.`
- `OrganizerID không tồn tại trong bảng ORGANIZER.`
- `Tên sự kiện không được để trống.`
- `Ngày bắt đầu và ngày kết thúc là bắt buộc.`
- `Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.`
- `Quy mô dự kiến phải lớn hơn 0.`
- `Tổng ngân sách không được âm.`
- `Trạng thái sự kiện không hợp lệ.`
- `Nhà tổ chức Corporate chỉ được tạo sự kiện Đã duyệt khi thời gian sự kiện nằm trong hiệu lực hợp đồng.`

### 1.3. Update EVENT

**Endpoint**

`PUT /api/events/:eventId`

**SQL cần gọi**

`usp_Event_Update`

**Path params**

| Param | Type | Ghi chú |
| --- | --- | --- |
| `eventId` | string | Tương ứng `@EventID`; frontend cũng gửi `EventID` trong body để khớp procedure |

**Request body**

```json
{
  "EventID": "EV010",
  "OrganizerID": "ORG001",
  "EventName": "Tên sự kiện cập nhật",
  "EventDesc": "Mô tả cập nhật",
  "EventStartDate": "2026-06-01",
  "EventEndDate": "2026-06-03",
  "ExpectedScale": 250,
  "TotalBudget": 60000000,
  "EventStatus": "Đã duyệt"
}
```

**Response mẫu**

```json
{
  "data": {
    "EventID": "EV010",
    "OrganizerID": "ORG001",
    "EventName": "Tên sự kiện cập nhật",
    "EventDesc": "Mô tả cập nhật",
    "EventStartDate": "2026-06-01",
    "EventEndDate": "2026-06-03",
    "ExpectedScale": 250,
    "TotalBudget": 60000000,
    "EventStatus": "Đã duyệt",
    "ConfirmedSessionCount": 1
  }
}
```

**Lỗi nghiệp vụ backend nên trả**

```json
{
  "message": "Không được đổi nhà tổ chức khi sự kiện đã có SESSION.",
  "code": "BUSINESS_RULE_ERROR"
}
```

Các lỗi procedure có thể có:

- `Mã sự kiện không được để trống khi cập nhật.`
- `Không tìm thấy sự kiện cần cập nhật.`
- `OrganizerID không tồn tại trong bảng ORGANIZER.`
- `Không được đổi nhà tổ chức khi sự kiện đã có SESSION.`
- `Khoảng thời gian mới của EVENT không bao phủ toàn bộ SESSION đang có.`
- `Không thể chuyển sự kiện sang Từ chối khi đã có SESSION ở trạng thái Đã xác nhận.`
- `Nhà tổ chức Corporate chỉ được cập nhật sang Đã duyệt khi thời gian sự kiện nằm trong hiệu lực hợp đồng.`

### 1.4. Delete EVENT

**Endpoint**

`DELETE /api/events/:eventId`

**SQL cần gọi**

`usp_Event_Delete`

**Path params**

| Param | SQL param | Type |
| --- | --- | --- |
| `eventId` | `@EventID` | string |

**Response mẫu**

```json
{
  "message": "Đã xóa sự kiện thành công.",
  "data": {
    "EventID": "EV010"
  }
}
```

**Lỗi nghiệp vụ backend nên trả**

```json
{
  "message": "Không được xóa sự kiện vì đã phát sinh SESSION. Chỉ nên xóa hồ sơ nhập sai hoặc chưa triển khai để tránh mất lịch sử nghiệp vụ.",
  "code": "BUSINESS_RULE_ERROR"
}
```

Các lỗi procedure có thể có:

- `Mã sự kiện không được để trống khi xóa.`
- `Không tìm thấy sự kiện cần xóa.`
- `Không được xóa sự kiện vì đã phát sinh SESSION. Chỉ nên xóa hồ sơ nhập sai hoặc chưa triển khai để tránh mất lịch sử nghiệp vụ.`
- `Chỉ được xóa sự kiện ở trạng thái Chờ duyệt hoặc Từ chối.`

## 2. Procedure truy vấn câu 2.3

### 2.1. `usp_Event_List`

Được dùng tại màn hình `/events`.

Endpoint đã mô tả ở mục `1.1`.

Frontend controls:

- Textbox: `Keyword`
- Select: `EventStatus`
- Date picker: `FromDate`, `ToDate`
- Client-side sort: ngày bắt đầu, tên sự kiện, ngân sách, số phiên xác nhận

### 2.2. `usp_Organizer_Event_Summary`

**Endpoint**

`GET /api/event-organizer-summary`

**SQL cần gọi**

`usp_Organizer_Event_Summary`

**Query params**

| Param | SQL param | Type | Default frontend |
| --- | --- | --- | --- |
| `EventStatus` | `@EventStatus` | string | empty |
| `BudgetFloor` | `@BudgetFloor` | decimal | `0` |
| `MinEventCount` | `@MinEventCount` | int | `1` |
| `MinConfirmedRentalFee` | `@MinConfirmedRentalFee` | decimal | `0` |

**Response mẫu**

```json
{
  "data": [
    {
      "OrganizerID": "ORG001",
      "OrgName": "Tên nhà tổ chức",
      "OrganizerType": "Corporate",
      "EventCount": 3,
      "TotalPlannedBudget": 180000000,
      "TotalConfirmedRentalFee": 45000000,
      "TotalConfirmedSessionCount": 5
    }
  ]
}
```

**Error mẫu**

```json
{
  "message": "MinEventCount phải lớn hơn hoặc bằng 1.",
  "code": "VALIDATION_ERROR",
  "fieldErrors": {
    "MinEventCount": "Số sự kiện tối thiểu phải là số nguyên từ 1."
  }
}
```

## 3. Function câu 2.4

### 3.1. Event metrics

**Endpoint**

`GET /api/events/:eventId/metrics`

**SQL cần gọi**

- `dbo.fn_Event_TotalConfirmedRentalFee(@EventID)`
- `dbo.fn_Event_CapacityCoverageLabel(@EventID)`

**Path params**

| Param | SQL param | Type |
| --- | --- | --- |
| `eventId` | `@EventID` | string |

**Response mẫu**

```json
{
  "data": {
    "EventID": "EV003",
    "TotalConfirmedRentalFee": 25000000,
    "CapacityCoverageLabel": "Đạt hoặc vượt (120.00%)"
  }
}
```

Frontend cũng đọc được response nếu backend dùng camelCase:

```json
{
  "data": {
    "eventId": "EV003",
    "totalConfirmedRentalFee": 25000000,
    "capacityCoverageLabel": "Đạt hoặc vượt (120.00%)"
  }
}
```

**Error mẫu**

```json
{
  "message": "Không tìm thấy sự kiện",
  "code": "BUSINESS_RULE_ERROR"
}
```

## 4. Validate frontend đang làm

### EVENT form

- `EventID` bắt buộc, tối đa 20 ký tự.
- `OrganizerID` bắt buộc, tối đa 20 ký tự.
- `EventName` bắt buộc, tối đa 200 ký tự.
- `EventStartDate`, `EventEndDate` bắt buộc.
- `EventEndDate >= EventStartDate`.
- `ExpectedScale` là số nguyên lớn hơn 0.
- `TotalBudget >= 0`.
- `EventStatus` thuộc `Chờ duyệt`, `Đã duyệt`, `Từ chối`, `Đã hoàn thành`.

### `usp_Event_List` filters

- `Keyword` tối đa 200 ký tự.
- `EventStatus` thuộc danh sách trạng thái hợp lệ.
- `ToDate >= FromDate`.

### `usp_Organizer_Event_Summary` filters

- `BudgetFloor >= 0`.
- `MinEventCount` là số nguyên từ 1.
- `MinConfirmedRentalFee >= 0`.
- `EventStatus` thuộc danh sách trạng thái hợp lệ.

### Function metrics

- `EventID` bắt buộc.
- `EventID` tối đa 20 ký tự.

## 5. Lưu ý tích hợp backend

- Backend nên trả HTTP 4xx cho lỗi validate/nghiệp vụ và giữ `message` cụ thể từ SQL procedure/function.
- Backend nên map lỗi SQL `RAISERROR` thành `{ "message": "..." }`.
- Nếu có lỗi theo field, backend có thể trả thêm `fieldErrors`.
- Không đổi tên field SQL trong request body CRUD vì frontend đang gửi đúng `EventID`, `OrganizerID`, `EventName`, `EventDesc`, `EventStartDate`, `EventEndDate`, `ExpectedScale`, `TotalBudget`, `EventStatus`.
- Frontend hiện chưa gọi endpoint lookup `ORGANIZER`; nếu backend muốn cải thiện UX sau này có thể thêm `GET /api/organizers` để thay textbox `OrganizerID` bằng combobox.

## 6. PRODUCT module

Phần này mô tả API contract frontend đang giả định cho PRODUCT. Backend team sẽ hiện thực endpoint thật sau. Frontend chỉ gọi service trong `src/services/productApi.js`, không gọi trực tiếp SQL.

### 6.1. Mapping màn hình PRODUCT

| Màn hình frontend | Route | Service frontend | Endpoint | SQL backend cần gọi |
| --- | --- | --- | --- | --- |
| Quản lý sản phẩm | `/products-management` | `fetchProducts` | `GET /api/products` | Truy vấn bảng `PRODUCT` hoặc procedure list nếu backend bổ sung |
| Quản lý sản phẩm | `/products-management` | `createProduct` | `POST /api/products` | `sp_InsertProduct` |
| Quản lý sản phẩm | `/products-management` | `updateProduct` | `PUT /api/products/:productId` | `sp_UpdateProduct` |
| Quản lý sản phẩm | `/products-management` | `deleteProduct` | `DELETE /api/products/:productId` | `sp_DeleteProduct` |
| Thống kê sản phẩm | `/product-sales-summary` | `fetchProductSalesSummary` | `GET /api/products/sales-summary` | `sp_GetProductSalesSummary` |
| Giá trị khách hàng | `/customer-net-value` | `fetchCustomerNetValue` | `GET /api/customers/net-value` | `dbo.fn_CalculateCustomerNetValue` |

### 6.2. Bảng PRODUCT

Frontend đang bám theo các field SQL đã phân tích:

| Field | SQL type | Validate frontend |
| --- | --- | --- |
| `ProductID` | `VARCHAR(20)` | Bắt buộc, tối đa 20 ký tự |
| `ProductName` | `NVARCHAR(100)` | Bắt buộc, tối đa 100 ký tự |
| `ProductType` | `NVARCHAR(50)` | Một trong `Bắp`, `Nước`, `Combo`, `Khác` |
| `BasePrice` | `DECIMAL(12,2)` | Bắt buộc, số hợp lệ, `>= 0` |
| `ProductStatus` | `NVARCHAR(30)` | Một trong `Đang bán`, `Tạm ngừng`, `Ngừng kinh doanh` |

## 7. PRODUCT CRUD - Câu 3.1

### 7.1. List PRODUCT

**Endpoint**

`GET /api/products`

**Backend mapping**

Truy vấn bảng `PRODUCT` hoặc procedure list nếu backend bổ sung sau. Trong SQL Product đã phân tích, CRUD chính có `sp_InsertProduct`, `sp_UpdateProduct`, `sp_DeleteProduct`; chưa thấy procedure list riêng.

**Response mẫu**

```json
{
  "data": [
    {
      "ProductID": "PRD001",
      "ProductName": "Combo bắp nước",
      "ProductType": "Combo",
      "BasePrice": 75000,
      "ProductStatus": "Đang bán"
    }
  ]
}
```

Frontend cũng đọc được camelCase:

```json
{
  "data": [
    {
      "productId": "PRD001",
      "productName": "Combo bắp nước",
      "productType": "Combo",
      "basePrice": 75000,
      "productStatus": "Đang bán"
    }
  ]
}
```

### 7.2. Insert PRODUCT

**Endpoint**

`POST /api/products`

**Backend mapping**

`sp_InsertProduct`

**Request body**

```json
{
  "ProductID": "PRD001",
  "ProductName": "Combo bắp nước",
  "ProductType": "Combo",
  "BasePrice": 75000,
  "ProductStatus": "Đang bán"
}
```

**SQL params**

| Body field | SQL param | SQL type |
| --- | --- | --- |
| `ProductID` | `@ProductID` | `VARCHAR(20)` |
| `ProductName` | `@ProductName` | `NVARCHAR(100)` |
| `ProductType` | `@ProductType` | `NVARCHAR(50)` |
| `BasePrice` | `@BasePrice` | `DECIMAL(12,2)` |
| `ProductStatus` | `@ProductStatus` | `NVARCHAR(30)` |

**Response mẫu**

```json
{
  "data": {
    "ProductID": "PRD001",
    "ProductName": "Combo bắp nước",
    "ProductType": "Combo",
    "BasePrice": 75000,
    "ProductStatus": "Đang bán"
  }
}
```

### 7.3. Update PRODUCT

**Endpoint**

`PUT /api/products/:productId`

**Backend mapping**

`sp_UpdateProduct`

**Path params**

| Param | SQL param | Type |
| --- | --- | --- |
| `productId` | `@ProductID` | string |

**Request body**

```json
{
  "ProductID": "PRD001",
  "ProductName": "Combo bắp nước size lớn",
  "ProductType": "Combo",
  "BasePrice": 85000,
  "ProductStatus": "Đang bán"
}
```

**Response mẫu**

```json
{
  "data": {
    "ProductID": "PRD001",
    "ProductName": "Combo bắp nước size lớn",
    "ProductType": "Combo",
    "BasePrice": 85000,
    "ProductStatus": "Đang bán"
  }
}
```

### 7.4. Delete PRODUCT

**Endpoint**

`DELETE /api/products/:productId`

**Backend mapping**

`sp_DeleteProduct`

**Path params**

| Param | SQL param | Type |
| --- | --- | --- |
| `productId` | `@ProductID` | string |

**Response mẫu**

```json
{
  "message": "Đã xóa sản phẩm thành công.",
  "data": {
    "ProductID": "PRD001"
  }
}
```

**Quy tắc nghiệp vụ khi xóa**

- `ProductID` phải tồn tại.
- SQL chỉ cho phép xóa khi `ProductStatus = N'Ngừng kinh doanh'`.
- SQL không cho xóa nếu sản phẩm có đơn hàng trong ngày hiện tại.
- Foreign key đang tham chiếu sản phẩm vẫn có thể làm backend/database từ chối xóa.

**Error response mẫu**

```json
{
  "message": "Chỉ được xóa sản phẩm ở trạng thái Ngừng kinh doanh.",
  "code": "BUSINESS_RULE_ERROR",
  "fieldErrors": {
    "ProductStatus": "Sản phẩm phải ở trạng thái Ngừng kinh doanh trước khi xóa."
  }
}
```

## 8. Product sales summary - Câu 3.2

### 8.1. `sp_GetProductSalesSummary`

**Endpoint**

`GET /api/products/sales-summary`

**Backend mapping**

`sp_GetProductSalesSummary`

**Query params**

| Query param | SQL param | SQL type | Default frontend | Ghi chú |
| --- | --- | --- | --- | --- |
| `productType` | `@ProductType` | `NVARCHAR(50)` | empty | Empty nghĩa là tất cả loại sản phẩm |
| `fromDate` | `@FromDate` | `DATE` | empty | Lọc ngày đơn hàng từ ngày này |
| `toDate` | `@ToDate` | `DATE` | empty | Lọc ngày đơn hàng đến ngày này |
| `minTotalQuantity` | `@MinTotalQuantity` | `INT` | `0` | HAVING theo tổng số lượng bán |
| `minTotalRevenue` | `@MinTotalRevenue` | `DECIMAL(12,2)` | `0` | HAVING theo tổng doanh thu |

**Response mẫu**

```json
{
  "data": [
    {
      "ProductID": "PRD001",
      "ProductName": "Combo bắp nước",
      "ProductType": "Combo",
      "ProductStatus": "Đang bán",
      "TotalOrders": 12,
      "TotalQuantitySold": 30,
      "TotalRevenue": 2250000
    }
  ],
  "meta": {
    "routine": "sp_GetProductSalesSummary"
  }
}
```

Frontend cũng đọc được camelCase:

```json
{
  "items": [
    {
      "productId": "PRD001",
      "productName": "Combo bắp nước",
      "productType": "Combo",
      "productStatus": "Đang bán",
      "totalOrders": 12,
      "totalQuantitySold": 30,
      "totalRevenue": 2250000
    }
  ]
}
```

**Validate frontend đang làm**

- `productType` phải thuộc `Bắp`, `Nước`, `Combo`, `Khác` nếu có nhập.
- `fromDate <= toDate` nếu nhập cả hai.
- `minTotalQuantity >= 0` và là số nguyên nếu có nhập.
- `minTotalRevenue >= 0` nếu có nhập.

## 9. Customer net value - Câu 3.3

### 9.1. `dbo.fn_CalculateCustomerNetValue`

**Endpoint**

`GET /api/customers/net-value`

**Backend mapping**

`dbo.fn_CalculateCustomerNetValue`

**Query params**

| Query param | SQL param | SQL type | Bắt buộc |
| --- | --- | --- | --- |
| `personId` | `@PersonID` | `VARCHAR(20)` | Có |
| `fromDate` | `@FromDate` | `DATE` | Có |
| `toDate` | `@ToDate` | `DATE` | Có |

**Response mẫu**

```json
{
  "data": {
    "personId": "P001",
    "fromDate": "2026-01-01",
    "toDate": "2026-12-31",
    "netValue": 1250000
  }
}
```

Backend có thể trả thêm các field phụ nếu có dữ liệu:

```json
{
  "data": {
    "PersonID": "P001",
    "CustomerName": "Nguyen Van A",
    "FromDate": "2026-01-01",
    "ToDate": "2026-12-31",
    "NetValue": 1250000,
    "TotalOrders": 4,
    "GrossValue": 1500000,
    "RefundAmount": 250000,
    "LastOrderDate": "2026-04-10"
  }
}
```

Nếu function trả `NULL`, backend nên trả rõ để frontend hiển thị trạng thái không có kết quả hợp lệ:

```json
{
  "data": {
    "personId": "P001",
    "fromDate": "2026-01-01",
    "toDate": "2026-12-31",
    "netValue": null
  },
  "message": "Không có giá trị hợp lệ cho tham số đã nhập."
}
```

Frontend cũng xử lý được nếu backend trả trực tiếp số:

```json
1250000
```

**Validate frontend đang làm**

- `personId` bắt buộc.
- `personId` tối đa 20 ký tự.
- `fromDate` bắt buộc.
- `toDate` bắt buộc.
- `fromDate <= toDate`.

## 10. Error response mẫu cho PRODUCT

### 10.1. Validation error

```json
{
  "message": "Dữ liệu sản phẩm không hợp lệ.",
  "code": "VALIDATION_ERROR",
  "fieldErrors": {
    "ProductName": "Tên sản phẩm không được để trống.",
    "BasePrice": "Giá cơ bản phải lớn hơn hoặc bằng 0."
  }
}
```

### 10.2. Not found

```json
{
  "message": "Không tìm thấy sản phẩm.",
  "code": "NOT_FOUND"
}
```

### 10.3. Business rule violation

```json
{
  "message": "Không được xóa sản phẩm vì sản phẩm đã phát sinh đơn hàng trong ngày hiện tại.",
  "code": "BUSINESS_RULE_ERROR"
}
```

### 10.4. Server/database error

```json
{
  "message": "Không thể thực hiện thao tác do lỗi cơ sở dữ liệu.",
  "code": "DATABASE_ERROR"
}
```

## 11. Lưu ý tích hợp backend cho PRODUCT

- Backend nên giữ nguyên thông báo lỗi nghiệp vụ từ `sp_InsertProduct`, `sp_UpdateProduct`, `sp_DeleteProduct` khi có thể.
- Backend nên map lỗi SQL `RAISERROR` thành `{ "message": "..." }`.
- Nếu lỗi gắn với field, backend nên trả thêm `fieldErrors` với key theo tên field SQL như `ProductID`, `ProductName`, `ProductType`, `BasePrice`, `ProductStatus`.
- Request body CRUD dùng tên field SQL PascalCase để khớp procedure: `ProductID`, `ProductName`, `ProductType`, `BasePrice`, `ProductStatus`.
- Endpoint sales summary dùng query params camelCase: `productType`, `fromDate`, `toDate`, `minTotalQuantity`, `minTotalRevenue`, backend map sang các SQL params tương ứng.
- Endpoint customer net value dùng query params camelCase: `personId`, `fromDate`, `toDate`, backend map sang `@PersonID`, `@FromDate`, `@ToDate`.
