# AI Chat Standalone

App Next.js độc lập cho luồng AI chat onboarding. Folder này không import file từ landing invoice, có thể copy sang repo khác và chạy riêng.

## Deploy production lên GitHub Pages

Repo đã có sẵn workflow tại `.github/workflows/deploy.yml`.

1. Push code lên GitHub.
2. Vào **Settings → Pages**.
3. Chọn **Source: GitHub Actions**.
4. Push vào branch `main`.
5. Workflow sẽ chạy `yarn build`, tạo static export trong `out`, rồi deploy lên GitHub Pages.

App được cấu hình để chạy đúng ở dạng project page:

```txt
https://username.github.io/repository-name/
```

Các cấu hình quan trọng:

- `next.config.ts` dùng `output: 'export'` để build static site.
- `images.unoptimized = true` vì GitHub Pages không chạy Next Image Optimization server.
- `NEXT_PUBLIC_BASE_PATH=/repository-name` để asset và route hoạt động đúng khi host dưới sub-path.
- Workflow tự set `NEXT_PUBLIC_BASE_PATH` theo tên repo khi build production.

## Chạy local

```bash
yarn install
yarn dev
```

Mở `http://localhost:3000`.

## Build production giống GitHub Pages

```bash
NEXT_PUBLIC_BASE_PATH=/repository-name yarn build
```

## Cấu hình

Copy `.env.example` thành `.env.local`. Cần cấu hình invoice hub để tra cứu MST, tải gói, tạo đơn, tạo QR, kiểm tra thanh toán và gửi hồ sơ.

Các biến chính:

- `NEXT_PUBLIC_INVOICE_HUB_URL`: base URL invoice hub.
- `NEXT_PUBLIC_INVOICE_HUB_PROVIDER_CODE`: provider code khi tạo đơn.
- `NEXT_PUBLIC_INVOICE_HUB_BANK_CODE`: bank code khi tạo đơn.
- `NEXT_PUBLIC_BASE_PATH`: GitHub Pages base path, ví dụ `/repository-name`.
- `NEXT_PUBLIC_SITE_URL`: production URL, ví dụ `https://username.github.io/repository-name`.
