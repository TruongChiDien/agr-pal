import { PrismaClient, Prisma } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

// Ensure DATABASE_URL is available
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set')
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  pool: Pool | undefined
}

// Create connection pool (singleton)
export const pool =
  globalForPrisma.pool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10, // Maximum 10 connections for development
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.pool = pool

// Create Prisma adapter
const adapter = new PrismaPg(pool)

// Create Prisma Client (singleton)
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  }).$extends({
    result: {
      $allModels: {
        // Áp dụng cho mọi field có type là Decimal
        // Lưu ý: Tên field cụ thể phải match, hoặc bạn phải list từng model nếu muốn strict
      },
    },
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const result = await query(args);

          // Hàm đệ quy để tìm và convert Decimal thành String hoặc Number
          const serializeDecimal = (obj: any): any => {
            // Check null/undefined trước
            if (obj === null || obj === undefined) return obj;
            
            // Bỏ qua Date object để tránh loop vô tận hoặc lỗi
            if (obj instanceof Date) return obj;

            if (typeof obj === "object") {
              // Xử lý Array (findMany trả về array)
              if (Array.isArray(obj)) {
                 return obj.map(item => serializeDecimal(item));
              }

              for (const key in obj) {
                const value = obj[key];
                
                // Kiểm tra nếu value là instance của Decimal
                if (value instanceof Prisma.Decimal) {
                  obj[key] = value.toNumber();
                  // console.log(`Converted ${key}:`, obj[key]);
                } 
                // Đệ quy nếu là object con (nhưng không phải Decimal)
                else if (typeof value === 'object' && value !== null) {
                  serializeDecimal(value);
                }
              }
            }
            return obj;
          };

          return serializeDecimal(result);
        },
      },
    },
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Ensure connection is closed on process termination
if (typeof window === 'undefined') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
    await pool.end()
  })
}
