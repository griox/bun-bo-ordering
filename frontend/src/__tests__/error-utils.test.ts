import { describe, it, expect } from 'vitest';
import { getErrorMessage } from '@/lib/errorUtils';

describe('getErrorMessage', () => {
    // ── Happy Path ──────────────────────────────────────────────────────────

    it('returns first validation error from FluentValidation response', () => {
        const err = {
            response: {
                data: {
                    errors: {
                        Name: ['Tên không được để trống', 'Tên quá ngắn'],
                        Price: ['Giá phải lớn hơn 0'],
                    },
                },
            },
        };
        expect(getErrorMessage(err)).toBe('Tên không được để trống');
    });

    it('returns string error when errors value is a string', () => {
        const err = {
            response: {
                data: {
                    errors: {
                        Email: 'Email không hợp lệ',
                    },
                },
            },
        };
        expect(getErrorMessage(err)).toBe('Email không hợp lệ');
    });

    it('returns ProblemDetails detail field', () => {
        const err = {
            response: {
                data: {
                    detail: 'Không tìm thấy tài nguyên',
                    status: 404,
                },
            },
        };
        expect(getErrorMessage(err)).toBe('Không tìm thấy tài nguyên');
    });

    it('returns legacy message field', () => {
        const err = {
            response: {
                data: {
                    message: 'Token hết hạn',
                },
            },
        };
        expect(getErrorMessage(err)).toBe('Token hết hạn');
    });

    it('returns raw string response data', () => {
        const err = {
            response: {
                data: 'Internal Server Error',
            },
        };
        expect(getErrorMessage(err)).toBe('Internal Server Error');
    });

    // ── Priority: errors > detail > message ─────────────────────────────────

    it('prioritizes errors over detail and message', () => {
        const err = {
            response: {
                data: {
                    errors: { Field: ['Lỗi validation'] },
                    detail: 'Chi tiết lỗi',
                    message: 'Thông báo lỗi',
                },
            },
        };
        expect(getErrorMessage(err)).toBe('Lỗi validation');
    });

    it('prioritizes detail over message when no errors', () => {
        const err = {
            response: {
                data: {
                    detail: 'Chi tiết lỗi',
                    message: 'Thông báo lỗi',
                },
            },
        };
        expect(getErrorMessage(err)).toBe('Chi tiết lỗi');
    });

    // ── Edge Cases ──────────────────────────────────────────────────────────

    it('returns null when response has no data', () => {
        const err = { response: {} };
        expect(getErrorMessage(err)).toBeNull();
    });

    it('returns null when no response at all', () => {
        const err = {};
        expect(getErrorMessage(err)).toBeNull();
    });

    it('returns null when data is an empty object', () => {
        const err = { response: { data: {} } };
        expect(getErrorMessage(err)).toBeNull();
    });

    it('returns null when data is a number', () => {
        const err = { response: { data: 500 } };
        expect(getErrorMessage(err)).toBeNull();
    });
});
