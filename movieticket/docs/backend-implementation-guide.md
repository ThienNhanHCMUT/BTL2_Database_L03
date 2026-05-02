# Backend Implementation Guide

## 1. Purpose

File này hướng dẫn backend team hiện thực API khớp với frontend EVENT và PRODUCT hiện tại của MovieTick.

Tài liệu này được lập bằng cách đọc frontend hiện tại:
- Route/tab trong `src/App.jsx` và `src/components/common/Navbar.jsx`.
- Page EVENT: `EventManagementPage`, `EventOrganizerSummaryPage`, `EventAnalyticsPage`.
- Page PRODUCT: `ProductManagementPage`, `ProductSalesReportPage`, `CustomerNetValuePage`.
- Service/API client: `src/services/api.js`, `src/services/eventApi.js`, `src/services/productApi.js`.
- Mapper PRODUCT: `src/utils/productManagementMappers.js`.

Backend team cần hiện thực API thật. Frontend không gọi trực tiếp SQL và không tạo backend trong phần này.

## 2. Important Rules

- Backend phải giữ đúng endpoint mà frontend đang gọi.
- Backend phải giữ đúng tên field request/response mà frontend đang dùng.
- Error response phải có `message` rõ ràng để frontend hiển thị.
- Date format nên là `YYYY-MM-DD` vì frontend dùng `input type="date"`.
- Numeric fields phải trả dạng number nếu frontend đang sort, tính tổng hoặc format tiền tệ.
- Không trả lỗi chung chung như `Error`, `Failed`, `Invalid input`.
- Frontend lấy base URL từ `VITE_API_BASE_URL`, mặc định `http://localhost:5000`.
- Frontend lấy prefix API từ `VITE_API_PREFIX`, mặc định `/api`.
- `requestJson` sẽ gọi URL dạng `http://localhost:5000/api/...` theo mặc định.
- Khi HTTP status không OK, frontend đọc `message`, `code`, `fieldErrors` từ response body.

## 3. Frontend Screen to API Mapping

| Module | Frontend screen | Route | Service function | Backend endpoint | Method | SQL mapping | Notes |
|---|---|---|---|---|---|---|---|
| EVENT | Quản lý sự kiện | `/events` | `fetchEvents` | `/api/events` | GET | `usp_Event_List` | Có query filter |
| EVENT | Quản lý sự kiện | `/events` | `createEvent` | `/api/events` | POST | `usp_Event_Insert` | Body dùng PascalCase theo SQL |
| EVENT | Quản lý sự kiện | `/events` | `updateEvent` | `/api/events/:eventId` | PUT | `usp_Event_Update` | Body vẫn gửi `EventID` |
| EVENT | Quản lý sự kiện | `/events` | `deleteEvent` | `/api/events/:eventId` | DELETE | `usp_Event_Delete` | Business rule do backend/SQL quyết định |
| EVENT | Tổng hợp tổ chức | `/event-organizer-summary` | `fetchOrganizerEventSummary` | `/api/event-organizer-summary` | GET | `usp_Organizer_Event_Summary` | Có WHERE/HAVING filters |
| EVENT | Phân tích sự kiện | `/event-analytics` | `fetchEventMetrics` | `/api/events/:eventId/metrics` | GET | `fn_Event_TotalConfirmedRentalFee`, `fn_Event_CapacityCoverageLabel` | Trả 2 metric |
| PRODUCT | Quản lý sản phẩm | `/products-management` | `fetchProducts` | `/api/products` | GET | `SELECT FROM PRODUCT` hoặc Need backend confirmation | SQL chưa có procedure list riêng trong mapping frontend |
| PRODUCT | Quản lý sản phẩm | `/products-management` | `createProduct` | `/api/products` | POST | `sp_InsertProduct` | Body dùng PascalCase theo SQL |
| PRODUCT | Quản lý sản phẩm | `/products-management` | `updateProduct` | `/api/products/:productId` | PUT | `sp_UpdateProduct` | Body vẫn gửi `ProductID` |
| PRODUCT | Quản lý sản phẩm | `/products-management` | `deleteProduct` | `/api/products/:productId` | DELETE | `sp_DeleteProduct` | Business rule xóa theo SQL |
| PRODUCT | Thống kê sản phẩm | `/product-sales-summary` | `fetchProductSalesSummary` | `/api/products/sales-summary` | GET | `sp_GetProductSalesSummary` | Query params camelCase |
| PRODUCT | Giá trị khách hàng | `/customer-net-value` | `fetchCustomerNetValue` | `/api/customers/net-value` | GET | `dbo.fn_CalculateCustomerNetValue` | Query params camelCase |

## 4. EVENT Backend Requirements

### 4.1. GET /api/events

Màn hình frontend gọi: `Quản lý sự kiện` tại `/events`.

Service: `fetchEvents(filters)`.

SQL mapping: `usp_Event_List`.

Query params frontend gửi:

| Query param | Frontend source | Notes |
|---|---|---|
| `Keyword` | `filters.keyword` | Từ khóa theo EventID, EventName, OrgName |
| `EventStatus` | `filters.eventStatus` | Empty là tất cả |
| `FromDate` | `filters.fromDate` | `YYYY-MM-DD` |
| `ToDate` | `filters.toDate` | `YYYY-MM-DD` |

Response frontend kỳ vọng:

Frontend đọc được list ở các dạng `[]`, `{ data: [] }`, `{ items: [] }`, `{ recordset: [] }`, hoặc `{ data: { items: [] } }`.

Mỗi item nên có các field sau, có thể PascalCase hoặc camelCase:
- `EventID` / `eventId`
- `OrganizerID` / `organizerId`
- `EventName` / `eventName`
- `EventDesc` / `eventDesc`
- `EventStartDate` / `eventStartDate`
- `EventEndDate` / `eventEndDate`
- `ExpectedScale` / `expectedScale`
- `TotalBudget` / `totalBudget`
- `EventStatus` / `eventStatus`
- `ConfirmedSessionCount` / `confirmedSessionCount`
- `OrgName` / `orgName`
- `OrganizerType` / `organizerType`

Backend cần validate:
- `Keyword` tối đa 200 ký tự nếu backend nhận filter này.
- `EventStatus` thuộc `Chờ duyệt`, `Đã duyệt`, `Từ chối`, `Đã hoàn thành` nếu có.
- `ToDate >= FromDate` nếu nhập cả hai.

Error response frontend kỳ vọng:
- Có `message` rõ ràng.
- Nếu có lỗi field thì trả `fieldErrors`.

### 4.2. POST /api/events

Màn hình frontend gọi: `Quản lý sự kiện` tại `/events`.

Service: `createEvent(payload)`.

SQL mapping: `usp_Event_Insert`.

Request body frontend gửi:

{
  "EventID": "EV010",
  "OrganizerID": "ORG001",
  "EventName": "Tên sự kiện",
  "EventDesc": "Mô tả sự kiện hoặc null",
  "EventStartDate": "2026-06-01",
  "EventEndDate": "2026-06-02",
  "ExpectedScale": 200,
  "TotalBudget": 50000000,
  "EventStatus": "Chờ duyệt"
}

Response frontend kỳ vọng:

Frontend đọc một object từ `{ data: object }`, `{ data: [object] }`, `{ recordset: [object] }`, hoặc object trực tiếp. Field giống item của `GET /api/events`.

Backend cần validate:
- `EventID` bắt buộc, tối đa 20 ký tự.
- `OrganizerID` bắt buộc, tối đa 20 ký tự.
- `EventName` bắt buộc, tối đa 200 ký tự.
- `EventStartDate` và `EventEndDate` bắt buộc.
- `EventEndDate >= EventStartDate`.
- `ExpectedScale` là số nguyên lớn hơn 0.
- `TotalBudget >= 0`.
- `EventStatus` thuộc danh sách trạng thái hợp lệ.
- Các rule nghiệp vụ trong procedure/trigger cần chuyển thành message rõ ràng.

### 4.3. PUT /api/events/:eventId

Màn hình frontend gọi: `Quản lý sự kiện` tại `/events`.

Service: `updateEvent(eventId, payload)`.

SQL mapping: `usp_Event_Update`.

Path param:
- `eventId`: tương ứng `@EventID`.

Request body frontend gửi:

{
  "EventID": "EV010",
  "OrganizerID": "ORG001",
  "EventName": "Tên sự kiện cập nhật",
  "EventDesc": "Mô tả cập nhật hoặc null",
  "EventStartDate": "2026-06-01",
  "EventEndDate": "2026-06-03",
  "ExpectedScale": 250,
  "TotalBudget": 60000000,
  "EventStatus": "Đã duyệt"
}

Response frontend kỳ vọng:
- Object EVENT giống `POST /api/events`.

Backend cần validate:
- Các validate giống insert.
- `eventId` path và `EventID` body nên cùng bản ghi.
- Rule nghiệp vụ update từ SQL cần trả message rõ ràng.

### 4.4. DELETE /api/events/:eventId

Màn hình frontend gọi: `Quản lý sự kiện` tại `/events`.

Service: `deleteEvent(eventId)`.

SQL mapping: `usp_Event_Delete`.

Path param:
- `eventId`: tương ứng `@EventID`.

Response success frontend chấp nhận:

{
  "success": true,
  "message": "Đã xóa sự kiện thành công.",
  "data": {
    "EventID": "EV010"
  }
}

Backend cần validate:
- `eventId` bắt buộc.
- Event phải tồn tại.
- Rule nghiệp vụ xóa theo `usp_Event_Delete`.
- Nếu không được xóa, message phải nói rõ lý do.

### 4.5. GET /api/event-organizer-summary

Màn hình frontend gọi: `Tổng hợp tổ chức` tại `/event-organizer-summary`.

Service: `fetchOrganizerEventSummary(filters)`.

SQL mapping: `usp_Organizer_Event_Summary`.

Query params frontend gửi:

| Query param | Frontend source | Default |
|---|---|---|
| `EventStatus` | `filters.eventStatus` | empty |
| `BudgetFloor` | `filters.budgetFloor` | `0` |
| `MinEventCount` | `filters.minEventCount` | `1` |
| `MinConfirmedRentalFee` | `filters.minConfirmedRentalFee` | `0` |

Response frontend kỳ vọng:

Frontend đọc list ở các dạng `[]`, `{ data: [] }`, `{ items: [] }`, `{ recordset: [] }`, hoặc `{ data: { items: [] } }`.

Mỗi item nên có:
- `OrganizerID` / `organizerId`
- `OrgName` / `orgName`
- `OrganizerType` / `organizerType`
- `EventCount` / `eventCount`
- `TotalPlannedBudget` / `totalPlannedBudget`
- `TotalConfirmedRentalFee` / `totalConfirmedRentalFee`
- `TotalConfirmedSessionCount` / `totalConfirmedSessionCount`

Backend cần validate:
- `EventStatus` thuộc danh sách hợp lệ nếu có.
- `BudgetFloor >= 0`.
- `MinEventCount` là số nguyên từ 1.
- `MinConfirmedRentalFee >= 0`.

### 4.6. GET /api/events/:eventId/metrics

Màn hình frontend gọi: `Phân tích sự kiện` tại `/event-analytics`.

Service: `fetchEventMetrics(eventId)`.

SQL mapping:
- `fn_Event_TotalConfirmedRentalFee`
- `fn_Event_CapacityCoverageLabel`

Path param:
- `eventId`: tương ứng `@EventID`.

Response frontend kỳ vọng:

Frontend đọc object từ `{ data: object }`, `{ data: [object] }`, `{ recordset: [object] }`, hoặc object trực tiếp.

Object nên có:
- `EventID` / `eventId`
- `TotalConfirmedRentalFee` / `totalConfirmedRentalFee` / `fn_Event_TotalConfirmedRentalFee`
- `CapacityCoverageLabel` / `capacityCoverageLabel` / `fn_Event_CapacityCoverageLabel`

Backend cần validate:
- `eventId` bắt buộc.
- `eventId` tối đa 20 ký tự.
- Nếu không tìm thấy event, trả error message rõ.

## 5. PRODUCT Backend Requirements

### 5.1. Product list

Endpoint frontend đang gọi: `GET /api/products`.

Service: `fetchProducts()`.

SQL mapping dự kiến: truy vấn bảng `PRODUCT` hoặc procedure list nếu backend bổ sung. Need backend confirmation vì frontend Product CRUD hiện không có procedure list trong SQL mapping.

Response frontend kỳ vọng:

Frontend đọc list ở các dạng `[]`, `{ data: [] }`, `{ items: [] }`, `{ data: { items: [] } }`, `{ results: [] }`, hoặc `{ recordset: [] }`.

Mỗi item nên có:
- `ProductID` / `productId`
- `ProductName` / `productName`
- `ProductType` / `productType`
- `BasePrice` / `basePrice`
- `ProductStatus` / `productStatus`

Numeric field:
- `BasePrice` phải trả number hoặc numeric string parse được.

### 5.2. Product insert

Endpoint frontend đang gọi: `POST /api/products`.

Service: `createProduct(payload)`.

SQL mapping dự kiến: `sp_InsertProduct`.

Request body frontend gửi:

{
  "ProductID": "PRD001",
  "ProductName": "Combo bắp nước",
  "ProductType": "Combo",
  "BasePrice": 75000,
  "ProductStatus": "Đang bán"
}

Response success frontend kỳ vọng:
- `{ data: product }` hoặc product trực tiếp.
- Product object có field như Product list.

Response error frontend kỳ vọng:
- Có `message`.
- Nếu lỗi field, có `fieldErrors` với key PascalCase như `ProductID`, `ProductName`, `ProductType`, `BasePrice`, `ProductStatus`.

Backend cần validate:
- `ProductID` bắt buộc, tối đa 20 ký tự.
- `ProductName` bắt buộc, tối đa 100 ký tự.
- `ProductType` thuộc `Bắp`, `Nước`, `Combo`, `Khác`.
- `BasePrice` bắt buộc, là number, `>= 0`.
- `ProductStatus` thuộc `Đang bán`, `Tạm ngừng`, `Ngừng kinh doanh`.
- Rule nghiệp vụ trong `sp_InsertProduct`.

### 5.3. Product update

Endpoint frontend đang gọi: `PUT /api/products/:productId`.

Service: `updateProduct(productId, payload)`.

SQL mapping dự kiến: `sp_UpdateProduct`.

Path param:
- `productId`: tương ứng `@ProductID`.

Request body frontend gửi:

{
  "ProductID": "PRD001",
  "ProductName": "Combo bắp nước size lớn",
  "ProductType": "Combo",
  "BasePrice": 85000,
  "ProductStatus": "Đang bán"
}

Response success frontend kỳ vọng:
- `{ data: product }` hoặc product trực tiếp.

Response error frontend kỳ vọng:
- Có `message`.
- Nếu lỗi field, có `fieldErrors`.

Backend cần validate:
- Validate giống insert.
- `productId` path và `ProductID` body nên cùng bản ghi.
- Product phải tồn tại.
- Rule nghiệp vụ trong `sp_UpdateProduct`.

### 5.4. Product delete

Endpoint frontend đang gọi: `DELETE /api/products/:productId`.

Service: `deleteProduct(productId)`.

SQL mapping dự kiến: `sp_DeleteProduct`.

Path param:
- `productId`: tương ứng `@ProductID`.

Response success frontend chấp nhận:

{
  "success": true,
  "message": "Đã xóa sản phẩm thành công.",
  "data": {
    "ProductID": "PRD001"
  }
}

Response error frontend kỳ vọng:
- Có `message` nói rõ lý do không được xóa.
- Nếu lỗi field, có `fieldErrors`.

Backend cần validate:
- `ProductID` phải tồn tại.
- SQL chỉ cho phép xóa khi `ProductStatus = N'Ngừng kinh doanh'`.
- SQL không cho xóa nếu sản phẩm có đơn hàng trong ngày hiện tại.
- Nếu FK hoặc business rule chặn xóa, backend phải trả message cụ thể.

### 5.5. Product sales summary

Endpoint frontend đang gọi: `GET /api/products/sales-summary`.

Service: `fetchProductSalesSummary(filters)`.

SQL mapping dự kiến: `sp_GetProductSalesSummary`.

Query params frontend gửi:

| Query param | SQL param | Default |
|---|---|---|
| `productType` | `@ProductType` | empty |
| `fromDate` | `@FromDate` | empty |
| `toDate` | `@ToDate` | empty |
| `minTotalQuantity` | `@MinTotalQuantity` | `0` |
| `minTotalRevenue` | `@MinTotalRevenue` | `0` |

Response frontend kỳ vọng:

Frontend đọc list ở các dạng `[]`, `{ data: [] }`, `{ items: [] }`, `{ data: { items: [] } }`, `{ results: [] }`, hoặc `{ recordset: [] }`.

Mỗi item nên có:
- `ProductID` / `productId`
- `ProductName` / `productName`
- `ProductType` / `productType`
- `ProductStatus` / `productStatus`
- `TotalOrders` / `totalOrders`
- `TotalQuantitySold` / `totalQuantitySold`
- `TotalRevenue` / `totalRevenue`

Optional meta frontend đọc được:
- `routine`
- `procedure`
- `meta.routine`
- `meta.procedure`

Backend cần validate:
- `productType` thuộc `Bắp`, `Nước`, `Combo`, `Khác` nếu có.
- `fromDate <= toDate` nếu nhập cả hai.
- `minTotalQuantity >= 0`, số nguyên.
- `minTotalRevenue >= 0`.

### 5.6. Customer net value

Endpoint frontend đang gọi: `GET /api/customers/net-value`.

Service: `fetchCustomerNetValue(personId, filters)`.

SQL mapping dự kiến: `dbo.fn_CalculateCustomerNetValue`.

Query params frontend gửi:

| Query param | SQL param | Required |
|---|---|---|
| `personId` | `@PersonID` | Có |
| `fromDate` | `@FromDate` | Có |
| `toDate` | `@ToDate` | Có |

Response frontend kỳ vọng:

Frontend đọc được các dạng:
- `{ data: object }`
- object trực tiếp
- number trực tiếp
- `{ data: number }`

Field chính:
- `netValue` / `NetValue` / `customerNetValue` / `CustomerNetValue` / `value` / `Value`

Field phụ nếu backend có:
- `personId` / `PersonID`
- `customerName` / `CustomerName` / `fullName` / `FullName`
- `fromDate` / `FromDate`
- `toDate` / `ToDate`
- `totalOrders` / `TotalOrders`
- `grossValue` / `GrossValue` / `totalSpent` / `TotalSpent`
- `discountAmount` / `DiscountAmount` / `discountTotal` / `DiscountTotal`
- `refundAmount` / `RefundAmount` / `refundTotal` / `RefundTotal`
- `lastOrderDate` / `LastOrderDate`

Backend cần validate:
- `personId` bắt buộc, tối đa 20 ký tự.
- `fromDate` bắt buộc.
- `toDate` bắt buộc.
- `fromDate <= toDate`.
- Nếu function trả `NULL`, backend có thể trả `netValue: null` kèm message rõ.

## 6. Request/Response Examples

### GET /api/events

Request example:
GET /api/events?Keyword=EV&EventStatus=Đã duyệt&FromDate=2026-01-01&ToDate=2026-12-31

Success response example:
{
  "success": true,
  "data": [
    {
      "EventID": "EV003",
      "OrganizerID": "ORG001",
      "EventName": "Tên sự kiện",
      "EventDesc": "Mô tả",
      "EventStartDate": "2026-06-01",
      "EventEndDate": "2026-06-02",
      "ExpectedScale": 200,
      "TotalBudget": 50000000,
      "EventStatus": "Đã duyệt",
      "ConfirmedSessionCount": 2,
      "OrgName": "Tên nhà tổ chức",
      "OrganizerType": "Corporate"
    }
  ]
}

Error response example:
{
  "success": false,
  "message": "Ngày đến phải lớn hơn hoặc bằng ngày từ."
}

### POST /api/events

Request example:
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

Success response example:
{
  "success": true,
  "message": "Đã tạo sự kiện thành công.",
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

Error response example:
{
  "success": false,
  "message": "Mã sự kiện đã tồn tại.",
  "fieldErrors": {
    "EventID": "Mã sự kiện đã tồn tại."
  }
}

### PUT /api/events/:eventId

Request example:
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

Success response example:
{
  "success": true,
  "message": "Đã cập nhật sự kiện thành công.",
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

Error response example:
{
  "success": false,
  "message": "Không thể cập nhật sự kiện do vi phạm nghiệp vụ."
}

### DELETE /api/events/:eventId

Request example:
DELETE /api/events/EV010

Success response example:
{
  "success": true,
  "message": "Đã xóa sự kiện thành công.",
  "data": {
    "EventID": "EV010"
  }
}

Error response example:
{
  "success": false,
  "message": "Không được xóa sự kiện vì đã phát sinh SESSION."
}

### GET /api/event-organizer-summary

Request example:
GET /api/event-organizer-summary?EventStatus=Đã duyệt&BudgetFloor=0&MinEventCount=1&MinConfirmedRentalFee=0

Success response example:
{
  "success": true,
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

Error response example:
{
  "success": false,
  "message": "Số sự kiện tối thiểu phải là số nguyên từ 1.",
  "fieldErrors": {
    "MinEventCount": "Số sự kiện tối thiểu phải là số nguyên từ 1."
  }
}

### GET /api/events/:eventId/metrics

Request example:
GET /api/events/EV003/metrics

Success response example:
{
  "success": true,
  "data": {
    "EventID": "EV003",
    "TotalConfirmedRentalFee": 25000000,
    "CapacityCoverageLabel": "Đạt hoặc vượt (120.00%)"
  }
}

Error response example:
{
  "success": false,
  "message": "Không tìm thấy sự kiện."
}

### GET /api/products

Request example:
GET /api/products

Success response example:
{
  "success": true,
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

Error response example:
{
  "success": false,
  "message": "Không thể tải danh sách sản phẩm."
}

### POST /api/products

Request example:
{
  "ProductID": "PRD001",
  "ProductName": "Combo bắp nước",
  "ProductType": "Combo",
  "BasePrice": 75000,
  "ProductStatus": "Đang bán"
}

Success response example:
{
  "success": true,
  "message": "Đã thêm sản phẩm thành công.",
  "data": {
    "ProductID": "PRD001",
    "ProductName": "Combo bắp nước",
    "ProductType": "Combo",
    "BasePrice": 75000,
    "ProductStatus": "Đang bán"
  }
}

Error response example:
{
  "success": false,
  "message": "Mã sản phẩm đã tồn tại.",
  "fieldErrors": {
    "ProductID": "Mã sản phẩm đã tồn tại."
  }
}

### PUT /api/products/:productId

Request example:
{
  "ProductID": "PRD001",
  "ProductName": "Combo bắp nước size lớn",
  "ProductType": "Combo",
  "BasePrice": 85000,
  "ProductStatus": "Đang bán"
}

Success response example:
{
  "success": true,
  "message": "Đã cập nhật sản phẩm thành công.",
  "data": {
    "ProductID": "PRD001",
    "ProductName": "Combo bắp nước size lớn",
    "ProductType": "Combo",
    "BasePrice": 85000,
    "ProductStatus": "Đang bán"
  }
}

Error response example:
{
  "success": false,
  "message": "Không tìm thấy sản phẩm.",
  "fieldErrors": {
    "ProductID": "Không tìm thấy sản phẩm."
  }
}

### DELETE /api/products/:productId

Request example:
DELETE /api/products/PRD001

Success response example:
{
  "success": true,
  "message": "Đã xóa sản phẩm thành công.",
  "data": {
    "ProductID": "PRD001"
  }
}

Error response example:
{
  "success": false,
  "message": "Chỉ được xóa sản phẩm ở trạng thái Ngừng kinh doanh."
}

### GET /api/products/sales-summary

Request example:
GET /api/products/sales-summary?productType=Combo&fromDate=2026-01-01&toDate=2026-12-31&minTotalQuantity=0&minTotalRevenue=0

Success response example:
{
  "success": true,
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

Error response example:
{
  "success": false,
  "message": "MinTotalRevenue phải lớn hơn hoặc bằng 0.",
  "fieldErrors": {
    "minTotalRevenue": "MinTotalRevenue phải lớn hơn hoặc bằng 0."
  }
}

### GET /api/customers/net-value

Request example:
GET /api/customers/net-value?personId=P001&fromDate=2026-01-01&toDate=2026-12-31

Success response example:
{
  "success": true,
  "data": {
    "personId": "P001",
    "fromDate": "2026-01-01",
    "toDate": "2026-12-31",
    "netValue": 1250000
  }
}

Error response example:
{
  "success": false,
  "message": "Không có giá trị hợp lệ cho tham số đã nhập."
}

## 7. Validation Rules Backend Must Match

| Module | Field | Frontend validation | Backend validation should match | Error message |
|---|---|---|---|---|
| EVENT | `EventID` | Bắt buộc, tối đa 20 ký tự | Bắt buộc, tối đa 20 ký tự, unique khi insert, tồn tại khi update/delete | `Mã sự kiện không được để trống.` |
| EVENT | `OrganizerID` | Bắt buộc, tối đa 20 ký tự | Bắt buộc, tồn tại trong ORGANIZER | `Mã nhà tổ chức không được để trống.` |
| EVENT | `EventName` | Bắt buộc, tối đa 200 ký tự | Bắt buộc, tối đa 200 ký tự | `Tên sự kiện không được để trống.` |
| EVENT | `EventStartDate` | Bắt buộc | Bắt buộc, date hợp lệ | `Ngày bắt đầu và ngày kết thúc là bắt buộc.` |
| EVENT | `EventEndDate` | Bắt buộc, `>= EventStartDate` | Bắt buộc, date hợp lệ, `>= EventStartDate` | `Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.` |
| EVENT | `ExpectedScale` | Số nguyên > 0 | Số nguyên > 0 | `Quy mô dự kiến phải là số nguyên lớn hơn 0.` |
| EVENT | `TotalBudget` | Number, `>= 0` | Number, `>= 0` | `Tổng ngân sách không được âm.` |
| EVENT | `EventStatus` | `Chờ duyệt`, `Đã duyệt`, `Từ chối`, `Đã hoàn thành` | Cùng danh sách | `Trạng thái sự kiện không hợp lệ.` |
| EVENT | `Keyword` | Tối đa 200 ký tự | Tối đa 200 ký tự | `Từ khóa tìm kiếm tối đa 200 ký tự.` |
| EVENT | `BudgetFloor` | `>= 0` | `>= 0` | `Ngân sách tối thiểu phải lớn hơn hoặc bằng 0.` |
| EVENT | `MinEventCount` | Số nguyên từ 1 | Số nguyên từ 1 | `Số sự kiện tối thiểu phải là số nguyên từ 1.` |
| EVENT | `MinConfirmedRentalFee` | `>= 0` | `>= 0` | `Phí thuê xác nhận tối thiểu không được âm.` |
| PRODUCT | `ProductID` | Bắt buộc, tối đa 20 ký tự | Bắt buộc, tối đa 20 ký tự, unique khi insert, tồn tại khi update/delete | `Mã sản phẩm không được để trống.` |
| PRODUCT | `ProductName` | Bắt buộc, tối đa 100 ký tự | Bắt buộc, tối đa 100 ký tự | `Tên sản phẩm không được để trống.` |
| PRODUCT | `ProductType` | `Bắp`, `Nước`, `Combo`, `Khác` | Cùng danh sách | `Loại sản phẩm không hợp lệ.` |
| PRODUCT | `BasePrice` | Bắt buộc, number, `>= 0` | Bắt buộc, decimal, `>= 0` | `Giá cơ bản phải lớn hơn hoặc bằng 0.` |
| PRODUCT | `ProductStatus` | `Đang bán`, `Tạm ngừng`, `Ngừng kinh doanh` | Cùng danh sách | `Trạng thái sản phẩm không hợp lệ.` |
| PRODUCT | `fromDate/toDate` sales summary | `fromDate <= toDate` nếu có cả hai | Cùng rule | `ToDate phải lớn hơn hoặc bằng FromDate.` |
| PRODUCT | `minTotalQuantity` | Số nguyên, `>= 0` | Số nguyên, `>= 0` | `MinTotalQuantity phải lớn hơn hoặc bằng 0.` |
| PRODUCT | `minTotalRevenue` | Number, `>= 0` | Decimal, `>= 0` | `MinTotalRevenue phải lớn hơn hoặc bằng 0.` |
| PRODUCT | `personId` | Bắt buộc, tối đa 20 ký tự | Bắt buộc, tối đa 20 ký tự, tồn tại nếu function yêu cầu | `PersonID không được để trống.` |
| PRODUCT | `fromDate/toDate` net value | Bắt buộc, `fromDate <= toDate` | Cùng rule | `ToDate phải lớn hơn hoặc bằng FromDate.` |

Backend cần chuyển lỗi SQL procedure/function/trigger thành `message` rõ ràng để frontend hiển thị. Nếu SQL có validate nghiệp vụ mà frontend không kiểm tra được, backend vẫn phải trả lỗi cụ thể.

## 8. Standard Error Format

Frontend hiện tại đang xử lý lỗi như sau:
- `requestJson` đọc JSON response.
- Nếu HTTP không OK, frontend tạo `Error` với `data.message || 'Có lỗi xảy ra khi gọi API'`.
- Frontend đọc thêm `error.code`, `error.fieldErrors`, `error.data`.
- Các page thường hiển thị `error.data.message || error.message || fallback`.

Format backend nên chuẩn hóa:

{
  "success": false,
  "message": "Thông báo lỗi cụ thể",
  "fieldErrors": {
    "FieldName": "Lỗi cụ thể cho field nếu có"
  }
}

Yêu cầu:
- Có `success: false`.
- Có `message` rõ ràng.
- Không trả lỗi chung chung như `Error`, `Failed`, `Invalid input`.
- Nếu lỗi theo field, nên có `fieldErrors`.
- Nếu lỗi nghiệp vụ khi xóa/sửa/thêm, `message` phải nói rõ nguyên nhân.
- Field key trong `fieldErrors` nên dùng PascalCase theo SQL cho form CRUD EVENT/PRODUCT: ví dụ `EventID`, `ProductName`, `BasePrice`.
- Với query params camelCase của PRODUCT summary/net value, backend có thể dùng camelCase trong `fieldErrors` như `minTotalRevenue`, `personId`.

Success response nên chuẩn hóa:

{
  "success": true,
  "message": "Thông báo thành công nếu có",
  "data": {}
}

Frontend vẫn chấp nhận một số shape linh hoạt như `{ data: [] }`, `{ items: [] }`, `{ recordset: [] }`, object trực tiếp, hoặc number trực tiếp cho net value. Tuy nhiên backend nên ưu tiên `{ success, message, data }` để dễ thống nhất.

## 9. Backend Checklist

- [ ] Cấu hình CORS để frontend gọi được backend.
- [ ] Kiểm tra base URL frontend đang dùng: mặc định `http://localhost:5000`.
- [ ] Kiểm tra API prefix frontend đang dùng: mặc định `/api`.
- [ ] Tạo endpoint EVENT `GET /api/events`.
- [ ] Tạo endpoint EVENT `POST /api/events`.
- [ ] Tạo endpoint EVENT `PUT /api/events/:eventId`.
- [ ] Tạo endpoint EVENT `DELETE /api/events/:eventId`.
- [ ] Tạo endpoint EVENT `GET /api/event-organizer-summary`.
- [ ] Tạo endpoint EVENT `GET /api/events/:eventId/metrics`.
- [ ] Tạo endpoint PRODUCT list `GET /api/products`.
- [ ] Tạo endpoint PRODUCT insert `POST /api/products` gọi `sp_InsertProduct`.
- [ ] Tạo endpoint PRODUCT update `PUT /api/products/:productId` gọi `sp_UpdateProduct`.
- [ ] Tạo endpoint PRODUCT delete `DELETE /api/products/:productId` gọi `sp_DeleteProduct`.
- [ ] Tạo endpoint product sales summary `GET /api/products/sales-summary` gọi `sp_GetProductSalesSummary`.
- [ ] Tạo endpoint customer net value `GET /api/customers/net-value` gọi `dbo.fn_CalculateCustomerNetValue`.
- [ ] Chuẩn hóa success response.
- [ ] Chuẩn hóa error response.
- [ ] Test request body từ frontend form EVENT.
- [ ] Test request body từ frontend form PRODUCT.
- [ ] Test query params từ frontend filter EVENT.
- [ ] Test query params từ frontend filter PRODUCT.
- [ ] Test lỗi validate.
- [ ] Test lỗi business rule khi delete EVENT.
- [ ] Test lỗi business rule khi delete PRODUCT.
- [ ] Test loading state trên frontend.
- [ ] Test empty state trên frontend.
- [ ] Test error state trên frontend.
- [ ] Xác nhận không có mock/dev fallback active trong EVENT/PRODUCT mới; frontend hiện đang gọi API thật qua `requestJson`.
- [ ] Nếu muốn tái dùng các page Product legacy, xác nhận lại route `/database/...` và endpoint `/products/management/...` trước khi hiện thực.

## 10. Unknowns / Need Confirmation

- PRODUCT list endpoint `GET /api/products`: frontend cần danh sách PRODUCT, nhưng SQL mapping hiện mới chắc cho insert/update/delete; backend cần xác nhận dùng query trực tiếp bảng `PRODUCT` hay procedure list riêng.
- EVENT SQL mapping được lấy từ `EVENT_API_CONTRACT` trong frontend: `usp_Event_List`, `usp_Event_Insert`, `usp_Event_Update`, `usp_Event_Delete`, `usp_Organizer_Event_Summary`, `fn_Event_TotalConfirmedRentalFee`, `fn_Event_CapacityCoverageLabel`. Backend cần xác nhận tên routine này tồn tại đúng trong SQL hiện hành.
- PRODUCT SQL mapping được lấy từ `PRODUCT_API_CONTRACT` và mapping Product đã phân tích: `sp_InsertProduct`, `sp_UpdateProduct`, `sp_DeleteProduct`, `sp_GetProductSalesSummary`, `dbo.fn_CalculateCustomerNetValue`. Backend cần xác nhận tên routine này tồn tại đúng trong SQL hiện hành.
- EVENT response field `ConfirmedSessionCount`, `OrgName`, `OrganizerType` được frontend hiển thị nếu có. Backend cần xác nhận `usp_Event_List` trả các field này hoặc map tương đương.
- EVENT metrics endpoint gộp hai function trong một API. Backend cần xác nhận có thể gọi cả hai function và trả chung một object.
- PRODUCT customer net value có field phụ `customerName`, `totalOrders`, `grossValue`, `refundAmount`, `lastOrderDate` nếu backend trả. Frontend không bắt buộc các field này, nhưng sẽ hiển thị nếu có.
- Error format hiện frontend chấp nhận `message`, `code`, `fieldErrors`; backend nên chuẩn hóa thêm `success: false`. Cần thống nhất dùng PascalCase hay camelCase cho `fieldErrors` theo từng endpoint.
- Không thấy mock/dev fallback active trong EVENT và PRODUCT mới. Các màn sẽ vào loading/error/empty state dựa trên API thật.
- Có các file Product legacy không nằm trong `App.jsx`/Navbar hiện tại: `ProductCrudPage`, `ProductSalesSummaryPage`, `ProductAnalyticsPage`, `ProductPageShell`, `ProductManagementTabs`, `productManagementApi.js`. Các file này dùng route `/database/products...` và endpoint `/products/management/...`, nhưng hiện không phải tab/route chính. Need backend confirmation nếu sau này muốn kích hoạt lại.
