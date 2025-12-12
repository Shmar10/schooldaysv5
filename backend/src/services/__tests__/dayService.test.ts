import { PrismaClient } from '@prisma/client';
import {
  calculateSchoolDaysRemaining,
  calculateCalendarDaysRemaining,
  isDayASchoolDay,
} from '../dayService';
import { DayType } from '@prisma/client';

// Mock Prisma Client
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    schoolYear: {
      findUnique: jest.fn(),
    },
    day: {
      count: jest.fn(),
    },
  };
  return {
    PrismaClient: jest.fn(() => mockPrisma),
    DayType: {
      INSTRUCTIONAL: 'INSTRUCTIONAL',
      NON_ATTENDANCE: 'NON_ATTENDANCE',
      BREAK: 'BREAK',
      SPECIAL_SCHEDULE: 'SPECIAL_SCHEDULE',
    },
  };
});

describe('dayService', () => {
  const mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isDayASchoolDay', () => {
    it('should return true for INSTRUCTIONAL days', () => {
      expect(isDayASchoolDay(DayType.INSTRUCTIONAL)).toBe(true);
    });

    it('should return true for SPECIAL_SCHEDULE days', () => {
      expect(isDayASchoolDay(DayType.SPECIAL_SCHEDULE)).toBe(true);
    });

    it('should return false for NON_ATTENDANCE days', () => {
      expect(isDayASchoolDay(DayType.NON_ATTENDANCE)).toBe(false);
    });

    it('should return false for BREAK days', () => {
      expect(isDayASchoolDay(DayType.BREAK)).toBe(false);
    });

    it('should respect explicit isSchoolDay value', () => {
      expect(isDayASchoolDay(DayType.INSTRUCTIONAL, false)).toBe(false);
      expect(isDayASchoolDay(DayType.NON_ATTENDANCE, true)).toBe(true);
    });
  });

  describe('calculateSchoolDaysRemaining', () => {
    it('should calculate school days remaining correctly', async () => {
      const schoolYearId = 'test-id';
      const fromDate = new Date('2024-01-15');
      const endDate = new Date('2024-06-30');

      (mockPrisma.schoolYear.findUnique as jest.Mock).mockResolvedValue({
        id: schoolYearId,
        endDate,
      });

      (mockPrisma.day.count as jest.Mock).mockResolvedValue(100);

      const result = await calculateSchoolDaysRemaining(schoolYearId, fromDate);

      expect(result).toBe(100);
      expect(mockPrisma.day.count).toHaveBeenCalledWith({
        where: {
          schoolYearId,
          date: {
            gte: fromDate,
            lte: endDate,
          },
          isSchoolDay: true,
        },
      });
    });

    it('should return 0 if fromDate is after endDate', async () => {
      const schoolYearId = 'test-id';
      const fromDate = new Date('2024-07-01');
      const endDate = new Date('2024-06-30');

      (mockPrisma.schoolYear.findUnique as jest.Mock).mockResolvedValue({
        id: schoolYearId,
        endDate,
      });

      const result = await calculateSchoolDaysRemaining(schoolYearId, fromDate);

      expect(result).toBe(0);
      expect(mockPrisma.day.count).not.toHaveBeenCalled();
    });
  });

  describe('calculateCalendarDaysRemaining', () => {
    it('should calculate calendar days remaining correctly', async () => {
      const schoolYearId = 'test-id';
      const fromDate = new Date('2024-01-15');
      const endDate = new Date('2024-01-20'); // 6 days inclusive

      (mockPrisma.schoolYear.findUnique as jest.Mock).mockResolvedValue({
        id: schoolYearId,
        endDate,
      });

      const result = await calculateCalendarDaysRemaining(schoolYearId, fromDate);

      // Jan 15 to Jan 20 inclusive = 6 days
      expect(result).toBe(6);
    });

    it('should return 0 if fromDate is after endDate', async () => {
      const schoolYearId = 'test-id';
      const fromDate = new Date('2024-07-01');
      const endDate = new Date('2024-06-30');

      (mockPrisma.schoolYear.findUnique as jest.Mock).mockResolvedValue({
        id: schoolYearId,
        endDate,
      });

      const result = await calculateCalendarDaysRemaining(schoolYearId, fromDate);

      expect(result).toBe(0);
    });
  });
});

