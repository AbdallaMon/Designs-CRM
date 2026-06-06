# Feature Report: v2 Upload Module

## Summary

Created a dedicated v2 upload module with clear separation between HTTP upload handling and infra storage.

Delivered flows:

- Authenticated HTTP upload endpoint
- Authenticated single-file upload endpoint
- Authenticated chunked upload endpoint
- Internal buffer upload helper for server-generated files such as PDFs
- Renamed local disk storage provider in infra with compatibility exports to avoid breaking existing imports

## Files Created/Updated/Deleted

### Created

- v2/infra/upload/local-disk-storage.provider.js
- v2/modules/upload/upload.routes.js
- v2/modules/upload/upload.controller.js
- v2/modules/upload/upload.usecase.js
- v2/modules/upload/upload.validation.js
- v2/modules/upload/upload.middleware.js
- v2/modules/upload/upload.internal.js
- feature-reports/v2-upload-module.md

### Updated

- v2/infra/upload/index.js
- v2/shared/routes.js

### Deleted

- None

## API Changes

### New Endpoints

#### POST /v2/upload/http

Uploads one file from multipart field `file`.

Body:

- folder: optional string folder under uploads root
- createThumbnail: optional boolean, default true

Response:

- originalName
- storageKey
- url
- thumbnailUrl
- fileMimeType
- fileSize

#### POST /v2/upload/files/single

Same behavior as `/v2/upload/http`, kept as a clearer endpoint for normal file uploads.

#### POST /v2/upload/files/chunks

Uploads one chunk from multipart field `chunk`.

Body:

- filename: original file name
- chunkIndex: zero-based chunk index
- totalChunks: total chunk count
- uploadSessionId: optional stable session id
- folder: optional string folder under uploads root
- createThumbnail: optional boolean, default true

Behavior:

- Non-final chunks return a received response with `completed: false`
- Final chunk merges parts, stores the final file, and returns the final upload payload with `completed: true`

## Data/Model Changes

No database schema changes.

## Validation/Security Changes

- All v2 upload routes require authentication via cookie token
- Request bodies are validated with Zod
- Folder and session identifiers are sanitized before touching disk paths
- Multer stays in the upload module, not infra
- File type filtering is intentionally open for now as requested

## Migration Details

No Prisma or SQL migration required.

## Manual Test Checklist

- [ ] POST `/v2/upload/http` with multipart `file` uploads successfully
- [ ] POST `/v2/upload/files/single` returns file URL and metadata
- [ ] POST `/v2/upload/files/chunks` for non-final chunk returns `completed: false`
- [ ] Final chunk request merges all parts and returns final URL
- [ ] Uploading an image creates a thumbnail URL
- [ ] Uploading a PDF returns no thumbnail and stores under requested folder
- [ ] `uploadInternalFile()` works for generated PDF buffers
- [ ] Unauthorized requests to v2 upload routes are rejected

## Risks/Known Limitations

- File type filtering is currently open and should be tightened later per endpoint
- Chunk completion assumes chunks arrive exactly once and in a valid total count
- No DB metadata is stored yet; this module only manages storage and HTTP upload flow
- Existing legacy upload and PDF code outside v2 still exists and is not fully migrated
