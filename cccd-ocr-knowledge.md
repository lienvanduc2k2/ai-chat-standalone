# Knowledge: CCCD OCR/QR Detection Flow

This document explains how the current source detects and extracts Vietnamese CCCD/CMND information so another project can reproduce the same behavior.

## Scope

The current implementation does not perform full free-text OCR over the whole ID card image. It uses `@invoice-sdk/id_extraction_qr` to:

1. Initialize the OCR/QR model.
2. Check whether the uploaded image is the front side of the ID card.
3. Read the QR code on the front side of the CCCD.
4. Map the QR payload into legal representative form fields.

The back-side image is uploaded and submitted with the order, but it is not OCR-scanned in this source.

## Source References

- Service implementation: `src/services/one-invoice.ts`
- Upload hook: `src/components/one-invoice/register/hooks/useIdCardOcr.ts`
- File input handlers: `src/components/one-invoice/register/hooks/useRegisterFileHandlers.ts`
- SDK type declaration: `src/types/vendor.d.ts`
- Extracted data type: `src/types/one-invoice.ts`
- File/date/gender validation helpers: `src/utils/one-invoice/validation.ts`

## Dependency

Install this package:

```bash
npm install @invoice-sdk/id_extraction_qr
```

The current project uses:

```json
"@invoice-sdk/id_extraction_qr": "^1.8.3"
```

If TypeScript cannot find types for the package, add a local declaration:

```ts
declare module '@invoice-sdk/id_extraction_qr' {
  export function initModel(env?: string, baseURL?: string): Promise<unknown>;
  export function checkImageSide(image: CanvasImageSource): Promise<string>;
  export function detectQR(image: CanvasImageSource): Promise<string>;
}
```

## Required SDK APIs

```ts
import { checkImageSide, detectQR, initModel } from '@invoice-sdk/id_extraction_qr';
```

- `initModel(env, baseURL)`: initializes the model. Current code calls `initModel('stag', BASE_URL)`.
- `checkImageSide(image)`: returns a JSON string. Current code expects `data.isFront`.
- `detectQR(image)`: returns a JSON string. Current code expects `status === 'success'` and a `data` object.

## Output Shape

Use a small normalized output type so the UI does not depend directly on vendor payload keys:

```ts
interface OcrExtractedData {
  repIdCard: string;
  repName: string;
  repDob: string;
  repGender: 'male' | 'female' | '';
  repAddressDetail: string;
}

interface OcrExtractionResult {
  supported: boolean;
  isValidFront: boolean;
  data?: Partial<OcrExtractedData>;
}
```

## Core Service Pattern

The service should initialize the model once, load the uploaded file as an image, validate that it is the front side, then read QR data.

```ts
import { checkImageSide, detectQR, initModel } from '@invoice-sdk/id_extraction_qr';

const BASE_URL = '<your-api-base-url>';
let ocrModelInitPromise: Promise<unknown> | null = null;

const ensureOcrModel = () => {
  if (!ocrModelInitPromise) {
    ocrModelInitPromise = initModel('stag', BASE_URL);
  }

  return ocrModelInitPromise;
};

const loadImageFromFile = (file: File) => new Promise<HTMLImageElement>((resolve, reject) => {
  const objectUrl = URL.createObjectURL(file);
  const image = new Image();

  image.onload = () => {
    URL.revokeObjectURL(objectUrl);
    resolve(image);
  };

  image.onerror = () => {
    URL.revokeObjectURL(objectUrl);
    reject(new Error('Cannot read uploaded image.'));
  };

  image.src = objectUrl;
});

const parseSdkResponse = (value: string) => JSON.parse(value) as {
  data?: Record<string, unknown>;
  message?: string;
  status?: string;
};
```

Main extraction function:

```ts
export const extractIdCardInfo = async (file: File): Promise<OcrExtractionResult> => {
  await ensureOcrModel();

  const image = await loadImageFromFile(file);
  const sideResponse = parseSdkResponse(await checkImageSide(image));
  const isValidFront = Boolean(sideResponse.data?.isFront);

  if (!isValidFront) {
    return {
      supported: true,
      isValidFront: false,
    };
  }

  const qrResponse = parseSdkResponse(await detectQR(image));

  if (qrResponse.status !== 'success' || !qrResponse.data) {
    throw new Error(qrResponse.message || 'Failed to detect QR code');
  }

  return {
    supported: true,
    isValidFront: true,
    data: toOcrData(qrResponse.data),
  };
};
```

## Payload Mapping

The SDK payload can use different field names depending on input/version. Current code checks multiple candidates and keeps the first non-empty string.

```ts
const getStringCandidate = (sources: unknown[], fallback = ''): string => {
  for (const source of sources) {
    if (typeof source === 'string' && source.trim()) {
      return source.trim();
    }
  }

  return fallback;
};

const toDisplayDob = (value: string) => {
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    return value;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return '';
  }

  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
};

const normalizeGender = (value: string): 'male' | 'female' | '' => {
  if (['male', 'nam', 'm'].includes(value.toLowerCase())) {
    return 'male';
  }

  if (['female', 'nu', 'nữ', 'f'].includes(value.toLowerCase())) {
    return 'female';
  }

  return '';
};

const toOcrData = (payload: Record<string, unknown>): Partial<OcrExtractedData> => ({
  repAddressDetail: getStringCandidate([
    payload.address,
    payload.permanentAddress,
    payload.addressDetail,
    payload.home,
    payload.queQuan,
  ]),
  repDob: toDisplayDob(getStringCandidate([
    payload.dob,
    payload.birthDate,
    payload.dateOfBirth,
    payload.date_of_birth,
  ])),
  repGender: normalizeGender(getStringCandidate([payload.gender, payload.sex])),
  repIdCard: getStringCandidate([
    payload.id,
    payload.idNumber,
    payload.identityNumber,
    payload.cccd,
    payload.id_number,
  ]),
  repName: getStringCandidate([payload.name, payload.fullName, payload.full_name]),
});
```

## UI Integration Pattern

When the front-side ID image changes:

1. Save the file into form state.
2. Clear previous OCR message/error.
3. Set OCR loading state.
4. Call `extractIdCardInfo(file)`.
5. If `isValidFront` is false, show an invalid-ID warning.
6. If data exists, merge extracted values into current form data without overwriting already-filled values with empty strings.
7. Always stop loading in `finally`.

Example:

```ts
const handleFrontIdCardUpload = async (file: File) => {
  setFieldValue('idCard', file);
  setOcrMessage(null);
  setOcrError(null);
  setIsOcrLoading(true);

  try {
    const result = await extractIdCardInfo(file);

    if (!result.isValidFront) {
      showInvalidFrontIdCardWarning();
      return;
    }

    const ocrData = result.data;

    if (ocrData) {
      updateRegistrationData((currentData) => ({
        ...currentData,
        repAddressDetail: ocrData.repAddressDetail || currentData.repAddressDetail,
        repDob: ocrData.repDob || currentData.repDob,
        repGender: ocrData.repGender || currentData.repGender,
        repIdCard: ocrData.repIdCard || currentData.repIdCard,
        repName: ocrData.repName || currentData.repName,
      }));

      setOcrMessage('Vui lòng kiểm tra thông tin trước khi chuyển sang bước tiếp theo');
    }
  } catch (error) {
    console.error(error);
    showInvalidFrontIdCardWarning();
  } finally {
    setIsOcrLoading(false);
  }
};
```

## File Input Rules

Current source only allows image files for CCCD/CMND upload:

```ts
const IMAGE_FILE_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];

const isAllowedFileType = (file: File, allowedTypes: string[]) => allowedTypes.includes(file.type);
```

The front image triggers OCR. The back image only updates form state:

```ts
const handleFrontIdCardInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0] || null;

  if (!file || !isAllowedFileType(file, IMAGE_FILE_TYPES)) {
    return;
  }

  await handleFrontIdCardUpload(file);
};

const handleIdCardBackChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0] || null;

  if (!file || !isAllowedFileType(file, IMAGE_FILE_TYPES)) {
    return;
  }

  setFieldValue('idCardBack', file);
};
```

## Validation After OCR

Keep validation separate from extraction. The current source validates:

- ID number must be exactly 12 digits: `/^\d{12}$/`
- Date of birth must be `DD/MM/YYYY`
- Name must be a valid Vietnamese name
- Address must be non-empty and match the allowed address character set
- If OCR fails or the image is not a valid front side, block the next step with an OCR error

## Submit Behavior

When creating an order, both front and back files are appended to the same multipart field:

```ts
if (idCard) {
  formData.append('legalRepresentativeIdCard', idCard);
}

if (idCardBack) {
  formData.append('legalRepresentativeIdCard', idCardBack);
}
```

This is specific to the target backend API. In another source, confirm the expected field name before copying this submit behavior.

## Integration Checklist

- Add `@invoice-sdk/id_extraction_qr`.
- Add TypeScript declaration if the package has no usable bundled types.
- Expose `BASE_URL` from environment/config.
- Implement `ensureOcrModel()` with a cached promise.
- Convert `File` to `HTMLImageElement` before calling SDK functions.
- Call `checkImageSide()` before `detectQR()`.
- Treat non-front-side image as invalid CCCD front image.
- Parse SDK responses with `JSON.parse()` because SDK functions return JSON strings.
- Normalize the SDK payload into app-specific form fields.
- Merge extracted values into form state without replacing existing values with blanks.
- Keep manual editing enabled after OCR because QR data must still be reviewed by the user.
- Validate the final form independently from OCR success.

## Common Failure Cases

- Wrong side uploaded: `checkImageSide()` returns a response where `data.isFront` is falsy.
- QR cannot be read: `detectQR()` does not return `status: 'success'` or does not include `data`.
- Unsupported file type: reject before OCR.
- Image cannot be loaded by browser: reject from `loadImageFromFile()`.
- SDK response shape changes: log the raw parsed payload and update `toOcrData()` candidate keys.

