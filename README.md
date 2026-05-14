# AI Chat Standalone

App Next.js độc lập cho luồng AI chat onboarding. Folder này không import file từ landing invoice, có thể copy sang repo khác và chạy riêng.

## Chạy local

```bash
npm install
npm run dev
```

Mở `http://localhost:3000`.

## Cấu hình

Copy `.env.example` thành `.env.local`. Cần cấu hình invoice hub để tra cứu MST, tải gói, tạo đơn, tạo QR, kiểm tra thanh toán và gửi hồ sơ.

Các biến chính:

- `NEXT_PUBLIC_INVOICE_HUB_URL`: base URL invoice hub.
- `NEXT_PUBLIC_INVOICE_HUB_PROVIDER_CODE`: provider code khi tạo đơn.
- `NEXT_PUBLIC_INVOICE_HUB_BANK_CODE`: bank code khi tạo đơn.
