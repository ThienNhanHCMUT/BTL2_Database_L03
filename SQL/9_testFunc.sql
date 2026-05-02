
/*
Test hàm fn_CalculateCustomerNetValue với khách P098

Data nguồn:
P098 có trong CUSTOMER.

Order của P098:
O026 | 2026-04-12
O027 | 2026-04-20

Mong muốn theo logic của function:
TotalPaid   = 140000 + 210000 = 350000
TotalRefund = 60000
NetValue    = 350000 - 60000 = 290000

Kết quả mong muốn:
290000.00
*/
SELECT dbo.fn_CalculateCustomerNetValue(
    'P098',
    '2026-04-12',
    '2026-04-20'
) AS NetValue;
GO

SELECT dbo.fn_CalculateCustomerNetValue(
    'P0101',
    '2026-04-01',
    '2026-04-29'
) AS NetValue;
GO



/*
Test hàm fn_CalculateCustomerNetValue với khách P116

Data nguồn:
P116 có trong CUSTOMER.

Order của P116 trong khoảng:
O028 | 2026-04-13
O029 | 2026-04-21

Payment thành công:
PT028 | O028 | 160000
PT029 | O029 | 235000

Refund:
REQ004 | O028 | Refund | Rejected | NULL
=> Không tính hoàn tiền.

REQ006 | O029 | Refund | Approved | 45000
=> Tính hoàn tiền 45000.

Mong muốn:
TotalPaid   = 160000 + 235000 = 395000
TotalRefund = 45000
NetValue    = 395000 - 45000 = 350000

Kết quả mong muốn:
350000.00
*/
SELECT dbo.fn_CalculateCustomerNetValue(
    'P116',
    '2026-04-13',
    '2026-04-21'
) AS NetValue;
GO