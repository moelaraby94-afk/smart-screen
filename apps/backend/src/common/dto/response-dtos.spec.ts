import 'reflect-metadata';
import {
  toResponseDto,
  toResponseDtoList,
  toPaginatedResponseDto,
  CustomerListItemDto,
  UserResponseDto,
  StaffListItemDto,
} from './response-dtos';

describe('Response DTOs', () => {
  describe('toResponseDto', () => {
    it('maps only @Expose fields, strips everything else', () => {
      const plain = {
        id: 'cl_123',
        email: 'user@test.com',
        fullName: 'Test User',
        // Fields NOT in the DTO:
        passwordHash: '$2b$10$secret',
        isSuperAdmin: false,
        deletedAt: null,
        internalFlag: true,
      };

      const dto = toResponseDto(UserResponseDto, plain);

      expect(dto.id).toBe('cl_123');
      expect(dto.email).toBe('user@test.com');
      expect(dto.fullName).toBe('Test User');
      expect(dto.isSuperAdmin).toBe(false);
      // Fields not in the DTO should be undefined
      expect(
        (dto as unknown as Record<string, unknown>).passwordHash,
      ).toBeUndefined();
      expect(
        (dto as unknown as Record<string, unknown>).internalFlag,
      ).toBeUndefined();
    });

    it('handles missing fields gracefully (undefined)', () => {
      const dto = toResponseDto(UserResponseDto, { id: 'cl_1' });
      expect(dto.id).toBe('cl_1');
      expect(dto.email).toBeUndefined();
    });
  });

  describe('toResponseDtoList', () => {
    it('maps each item in an array', () => {
      const plains = [
        { id: '1', email: 'a@test.com', fullName: 'A' },
        { id: '2', email: 'b@test.com', fullName: 'B' },
      ];

      const dtos = toResponseDtoList(UserResponseDto, plains);

      expect(dtos).toHaveLength(2);
      expect(dtos[0].id).toBe('1');
      expect(dtos[1].id).toBe('2');
    });

    it('returns empty array for empty input', () => {
      expect(toResponseDtoList(UserResponseDto, [])).toEqual([]);
    });
  });

  describe('toPaginatedResponseDto', () => {
    it('maps items and preserves pagination metadata', () => {
      const result = {
        items: [
          {
            id: 'cl_1',
            email: 'a@test.com',
            fullName: 'A',
            businessName: 'Acme',
            subscriptionStatus: 'ACTIVE',
            subscriptionPlan: 'pro',
            workspaceCount: 2,
            screenCount: 5,
            createdAt: '2026-01-01T00:00:00.000Z',
            lastLoginAt: null,
            // Should be stripped:
            passwordHash: 'secret',
          },
        ],
        nextCursor: 'eyJpZCI6ImNsXzEifQ==',
        hasMore: true,
      };

      const dto = toPaginatedResponseDto(CustomerListItemDto, result);

      expect(dto.items).toHaveLength(1);
      expect(dto.items[0].id).toBe('cl_1');
      expect(dto.items[0].email).toBe('a@test.com');
      expect(
        (dto.items[0] as unknown as Record<string, unknown>).passwordHash,
      ).toBeUndefined();
      expect(dto.nextCursor).toBe('eyJpZCI6ImNsXzEifQ==');
      expect(dto.hasMore).toBe(true);
    });

    it('handles empty paginated result', () => {
      const result = {
        items: [],
        nextCursor: null,
        hasMore: false,
      };

      const dto = toPaginatedResponseDto(CustomerListItemDto, result);

      expect(dto.items).toEqual([]);
      expect(dto.nextCursor).toBeNull();
      expect(dto.hasMore).toBe(false);
    });
  });

  describe('StaffListItemDto', () => {
    it('exposes only safe fields', () => {
      const plain = {
        id: 'staff_1',
        email: 'admin@cloud.com',
        fullName: 'Admin',
        platformStaffRole: 'SUPER_ADMIN',
        isActive: true,
        lastLoginAt: '2026-07-18T10:00:00.000Z',
        createdAt: '2026-01-01T00:00:00.000Z',
        passwordHash: '$2b$10$secret',
      };

      const dto = toResponseDto(StaffListItemDto, plain);

      expect(dto.id).toBe('staff_1');
      expect(dto.platformStaffRole).toBe('SUPER_ADMIN');
      expect(
        (dto as unknown as Record<string, unknown>).passwordHash,
      ).toBeUndefined();
    });
  });
});
