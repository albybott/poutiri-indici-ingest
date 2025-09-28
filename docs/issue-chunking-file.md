# CSV Parsing Issue: Row Separator Not Found

## Problem Summary

The CSV parsing system is treating the entire Indici data file as **one massive row** instead of multiple patient records. This results in all data being concatenated into a single `patient_id` field in the database, with all other fields showing as `(NULL)`.

## Root Cause Analysis

### 1. **Encoding Issue** 🚨
The primary issue is a **character encoding problem**. The debug logs show:

```
rawText: '9\x005\x004\x005\x003\x005\x001\x00|\x00^\x00^\x00|\x00|\x00^\x00^\x00|\x001\x00|\x00^\x00^\x00|\x00M\x00s\x00|\x00^\x00^\x00|...'
```

**Every character is being encoded as a 2-byte sequence** (e.g., `9` becomes `\x009\x00`). This means:
- `|^^|` becomes `\x00|\x00^\x00^\x00|\x00`
- `|~~|` becomes `\x00|\x00~\x00~\x00|\x00`

### 2. **Row Separator Detection Failure**
The system is looking for `|~~|` but the actual data contains `\x00|\x00~\x00~\x00|\x00`, so it never finds the row separators:

```
🔍 Debug - Row separator found at positions: []
🔍 Debug - Split into 1 parts
🔍 Debug - Complete rows: 0
```

### 3. **Stream Processing Impact**
- The entire 4.9MB file is treated as one row
- No row boundaries are detected
- All data gets concatenated into the first field (`patient_id`)
- Database insertion succeeds but with incorrect data structure

## Technical Details

### Current Data Flow
1. **S3 Stream** (`src/services/discovery/adapters/s3-file-system-adapter.ts`) → Reads file in chunks
2. **Buffer Accumulation** (`src/services/raw-loader/indici-csv-parser.ts:70-75`) → Concatenates chunks into buffer
3. **Row Detection** (`src/services/raw-loader/indici-csv-parser.ts:213-217`) → Looks for `|~~|` separator (FAILS)
4. **Field Detection** (`src/services/raw-loader/indici-csv-parser.ts:235`) → Looks for `|^^|` separator (FAILS)
5. **Database Insert** (`src/services/raw-loader/raw-table-loader.ts`) → Treats entire buffer as one row

### Expected Data Flow
1. **S3 Stream** (`src/services/discovery/adapters/s3-file-system-adapter.ts`) → Reads file in chunks
2. **Buffer Accumulation** (`src/services/raw-loader/indici-csv-parser.ts:70-75`) → Concatenates chunks into buffer
3. **Row Detection** (`src/services/raw-loader/indici-csv-parser.ts:213-217`) → Finds `|~~|` separators, splits into multiple rows
4. **Field Detection** (`src/services/raw-loader/indici-csv-parser.ts:235`) → Finds `|^^|` separators, splits each row into fields
5. **Database Insert** (`src/services/raw-loader/raw-table-loader.ts`) → Inserts multiple properly structured rows

## Evidence from Debug Logs

### Configuration (Correct)
**Location**: `src/services/raw-loader/indici-csv-parser.ts:54-57`
```
🔍 Debug - fieldSeparator: "|^^|" (length: 4)
🔍 Debug - rowSeparator: "|~~|" (length: 4)
🔍 Debug - maxRowLength: 10000000
```

### Detection Results (Failed)
**Location**: `src/services/raw-loader/indici-csv-parser.ts:213-217`
```
🔍 Debug - Row separator found at positions: []
🔍 Debug - Split into 1 parts
🔍 Debug - Complete rows: 0
🔍 Debug - Remaining buffer length: 4925460
```

### Final Buffer Content (Shows Encoding Issue)
**Location**: `src/services/raw-loader/indici-csv-parser.ts:95-97`
```
🔍 Debug - Final buffer content (last 200 chars): "...^^||^^||^^||^^||^^||^^|0|^^|0|^^|0|^^|1|^^||^^|0|^^|0|^^|1|^^|1|^^|1|^^|1|^^|0|^^|0|^^||^^|1|^^||~~|"
```

**Note**: The `|~~|` is visible in the debug output, but the actual buffer contains the encoded version `\x00|\x00~\x00~\x00|\x00`.

## Impact Assessment

### Database Impact
- **Data Structure**: All data in single `patient_id` field
- **Data Integrity**: Lost - no proper field separation
- **Query Capability**: Severely limited - cannot query individual fields
- **Data Volume**: 1 row instead of expected multiple patient records

### System Impact
- **Memory Usage**: High (97MB for single row processing)
- **Performance**: Poor (treating 4.9MB as single row)
- **Scalability**: Cannot handle multiple records properly

## Proposed Solutions

### Option 1: Fix Character Encoding (Recommended)
**Approach**: Ensure proper UTF-8 encoding when reading from S3 stream

**Implementation**:
1. Add explicit UTF-8 encoding to stream reading
2. Convert buffer to proper string format before processing
3. Test with encoding detection/conversion

**Pros**:
- Fixes root cause
- Minimal code changes
- Preserves data integrity

**Cons**:
- Requires understanding of S3 stream encoding
- May need to handle different file encodings

### Option 2: Update Separator Detection
**Approach**: Look for encoded versions of separators

**Implementation**:
1. Convert separators to encoded format for detection
2. Update `processBuffer` method to handle encoded separators
3. Decode data after splitting

**Pros**:
- Works with current encoding
- Targeted fix

**Cons**:
- Doesn't fix underlying encoding issue
- May break with different encodings
- More complex logic

### Option 3: Pre-process File Content
**Approach**: Decode entire file content before parsing

**Implementation**:
1. Read entire file into memory
2. Decode from current encoding to UTF-8
3. Process decoded content

**Pros**:
- Clean separation of concerns
- Handles encoding properly

**Cons**:
- Higher memory usage
- May not work with streaming approach

## Recommended Solution

**Option 1: Fix Character Encoding** is recommended because:

1. **Root Cause Fix**: Addresses the underlying encoding issue
2. **Future-Proof**: Will work with properly encoded files
3. **Minimal Changes**: Requires small modifications to stream handling
4. **Performance**: Maintains streaming approach

## Implementation Plan

### Phase 1: Investigation
1. **Identify Encoding Source**: Determine why S3 stream is producing 2-byte encoding
2. **Test Encoding Conversion**: Verify UTF-8 conversion works correctly
3. **Validate Separators**: Ensure `|^^|` and `|~~|` are properly detected after conversion

### Phase 2: Implementation
1. **Update Stream Reading**: Add proper encoding handling
2. **Test with Sample Data**: Verify row/field detection works
3. **Update Error Handling**: Add encoding-related error detection

### Phase 3: Validation
1. **Test with Real Data**: Process actual Indici files
2. **Verify Database Output**: Ensure multiple rows are created
3. **Performance Testing**: Confirm streaming still works efficiently

## Next Steps

1. **Investigate S3 Stream Encoding**: Check how the S3FileSystemAdapter is reading data
2. **Test Encoding Conversion**: Try converting the buffer to UTF-8 before processing
3. **Update Separator Detection**: Ensure separators work with proper encoding
4. **Validate Results**: Confirm multiple rows are created in database

## Files to Modify

### Primary Files
- **`src/services/raw-loader/indici-csv-parser.ts`** - Update stream processing and encoding handling
- **`src/services/discovery/adapters/s3-file-system-adapter.ts`** - Check S3 stream encoding
- **`src/services/raw-loader/raw-table-loader.ts`** - Update buffer processing logic

### Configuration Files
- **`src/services/raw-loader/types/config.ts`** - CSV configuration constants
- **`src/index.ts`** - Main application configuration

### Related Files
- **`src/services/raw-loader/raw-loader-service.ts`** - Main service orchestration
- **`src/services/raw-loader/types/raw-loader.ts`** - Type definitions
- **`src/services/raw-loader/types/csv.ts`** - CSV-specific types

### Test Files
- **`src/services/raw-loader/__tests__/raw-loader-service.test.ts`** - Test configuration

## Success Criteria

- [ ] Row separator `|~~|` is detected and splits data into multiple rows
- [ ] Field separator `|^^|` is detected and splits each row into proper fields
- [ ] Database contains multiple patient records (not just one concatenated row)
- [ ] All patient data fields are properly populated (not NULL)
- [ ] System maintains streaming performance and memory efficiency
