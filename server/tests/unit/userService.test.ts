import { UserService } from '../../src/services/userService';

// Create mock prisma object
const mockPrisma = {
  studios: {
    findUnique: jest.fn(),
  },
  users: {
    findUnique: jest.fn(),
  },
};

// Mock the prisma config module
jest.mock('../../src/config/prisma', () => ({
  prisma: mockPrisma,
}));

// Suppress pino logger output during tests
jest.mock('../../src/logger', () => ({
  logger: {
    child: () => ({
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    }),
  },
}));

describe('UserService.validateStudioSerial', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns studio when serial exists', async () => {
    const studio = { id: 'studio-1', name: 'Main Studio' };
    mockPrisma.studios.findUnique.mockResolvedValue(studio);

    const result = await UserService.validateStudioSerial('ABC-123');

    expect(mockPrisma.studios.findUnique).toHaveBeenCalledWith({
      where: { serial_number: 'ABC-123' },
      select: { id: true, name: true },
    });
    expect(result).toEqual(studio);
  });

  it('returns null when serial is not found', async () => {
    mockPrisma.studios.findUnique.mockResolvedValue(null);

    const result = await UserService.validateStudioSerial('MISSING');

    expect(mockPrisma.studios.findUnique).toHaveBeenCalledWith({
      where: { serial_number: 'MISSING' },
      select: { id: true, name: true },
    });
    expect(result).toBeNull();
  });

  it('throws on unexpected errors', async () => {
    mockPrisma.studios.findUnique.mockRejectedValue(new Error('DB connection failed'));

    await expect(UserService.validateStudioSerial('ERR')).rejects.toThrow(
      'DB connection failed'
    );
  });
});

describe('UserService.getUserProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns user profile when found', async () => {
    const user = { id: 'user-1', email: 'test@example.com', full_name: 'Test User' };
    mockPrisma.users.findUnique.mockResolvedValue(user);

    const result = await UserService.getUserProfile('user-1');

    expect(mockPrisma.users.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-1' },
    });
    expect(result).toEqual(user);
  });

  it('throws when user is not found', async () => {
    mockPrisma.users.findUnique.mockResolvedValue(null);

    await expect(UserService.getUserProfile('missing-id')).rejects.toThrow(
      'User profile not found'
    );
  });
});
