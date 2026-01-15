import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

// Load environment variables from .env.local
config({ path: '.env.local' })

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
})

const adapter = new PrismaPg(pool)

const prisma = new PrismaClient({
  adapter,
})

async function main() {
  console.log('🌱 Starting seed...')

  // ============================================
  // 1. Services & Job Types (2 services)
  // ============================================
  console.log('Creating services...')

  const riceHarvest = await prisma.service.create({
    data: {
      name: 'Thu hoạch lúa',
      unit: 'hectare',
      description: 'Dịch vụ thu hoạch lúa',
      price: 500000,
      job_types: {
        create: [
          { name: 'Lái máy', default_base_salary: 100000 },
          { name: 'Công nhặt', default_base_salary: 80000 },
        ],
      },
    },
    include: { job_types: true },
  })

  const cornHarvest = await prisma.service.create({
    data: {
      name: 'Thu hoạch ngô',
      unit: 'hectare',
      description: 'Dịch vụ thu hoạch ngô',
      price: 450000,
      job_types: {
        create: [
          { name: 'Lái máy', default_base_salary: 95000 },
          { name: 'Công phụ', default_base_salary: 75000 },
        ],
      },
    },
    include: { job_types: true },
  })

  console.log(`✓ Created 2 services with ${riceHarvest.job_types.length + cornHarvest.job_types.length} job types`)

  // ============================================
  // 2. Workers & Weights (5 workers)
  // ============================================
  console.log('Creating workers...')

  const worker1 = await prisma.worker.create({
    data: {
      name: 'Trần Văn B',
      phone: '0912345678',
      address: 'An Giang',
      worker_weights: {
        create: [
          { job_type_id: riceHarvest.job_types[0].id, weight: 1.2 }, // Driver rice: 1.2x
          { job_type_id: riceHarvest.job_types[1].id, weight: 1.0 }, // Bagger rice: 1.0x
          { job_type_id: cornHarvest.job_types[0].id, weight: 1.1 }, // Driver corn: 1.1x
        ],
      },
    },
  })

  const worker2 = await prisma.worker.create({
    data: {
      name: 'Nguyễn Văn C',
      phone: '0923456789',
      address: 'Đồng Tháp',
      worker_weights: {
        create: [
          { job_type_id: riceHarvest.job_types[1].id, weight: 1.1 }, // Bagger rice: 1.1x
          { job_type_id: cornHarvest.job_types[1].id, weight: 1.0 }, // Helper corn: 1.0x
        ],
      },
    },
  })

  const worker3 = await prisma.worker.create({
    data: {
      name: 'Lê Thị D',
      phone: '0934567890',
      address: 'Long An',
      worker_weights: {
        create: [
          { job_type_id: riceHarvest.job_types[1].id, weight: 0.9 }, // Bagger rice: 0.9x
        ],
      },
    },
  })

  const worker4 = await prisma.worker.create({
    data: {
      name: 'Phạm Văn E',
      phone: '0945678901',
      address: 'Tiền Giang',
      worker_weights: {
        create: [
          { job_type_id: riceHarvest.job_types[0].id, weight: 1.3 }, // Driver rice: 1.3x
          { job_type_id: cornHarvest.job_types[0].id, weight: 1.2 }, // Driver corn: 1.2x
        ],
      },
    },
  })

  const worker5 = await prisma.worker.create({
    data: {
      name: 'Hoàng Thị F',
      phone: '0956789012',
      address: 'Vĩnh Long',
      worker_weights: {
        create: [
          { job_type_id: cornHarvest.job_types[1].id, weight: 1.1 }, // Helper corn: 1.1x
        ],
      },
    },
  })

  console.log('✓ Created 5 workers with weight assignments')

  // ============================================
  // 3. Customers & Lands (3 customers, 5 lands)
  // ============================================
  console.log('Creating customers and lands...')

  const customer1 = await prisma.customer.create({
    data: {
      name: 'Nguyễn Văn A',
      phone: '0987654321',
      address: 'Ấp 1, Xã Tân Lập, Huyện Mộc Hóa, Long An',
      lands: {
        create: [
          {
            name: 'Ruộng ông Bảy',
            gps_lat: 10.123456,
            gps_lng: 106.654321
          },
          {
            name: 'Ruộng cạnh sông',
            gps_lat: 10.125678,
            gps_lng: 106.656543
          },
        ],
      },
    },
    include: { lands: true },
  })

  const customer2 = await prisma.customer.create({
    data: {
      name: 'Trần Thị B',
      phone: '0976543210',
      address: 'Ấp 2, Xã Tân Thành, Huyện Tân Hưng, Long An',
      lands: {
        create: [
          {
            name: 'Ruộng đồng sau nhà',
            gps_lat: 10.234567,
            gps_lng: 106.765432
          },
        ],
      },
    },
    include: { lands: true },
  })

  const customer3 = await prisma.customer.create({
    data: {
      name: 'Lê Văn C',
      phone: '0965432109',
      address: 'Ấp 3, Xã Vĩnh Hưng, Huyện Vĩnh Hưng, Long An',
      lands: {
        create: [
          {
            name: 'Ruộng phía Đông',
            gps_lat: 10.345678,
            gps_lng: 106.876543
          },
          {
            name: 'Ruộng phía Tây',
            gps_lat: 10.347890,
            gps_lng: 106.878765
          },
        ],
      },
    },
    include: { lands: true },
  })

  console.log('✓ Created 3 customers with 5 land parcels')

  // ============================================
  // 4. Machines (2 machines)
  // ============================================
  console.log('Creating machines...')

  const machine1 = await prisma.machine.create({
    data: {
      name: 'Máy gặt 01',
      model: 'Kubota DC-70',
      type: 'Harvester',
      purchase_date: new Date('2023-01-15'),
      status: 'AVAILABLE',
    },
  })

  const machine2 = await prisma.machine.create({
    data: {
      name: 'Máy gặt 02',
      model: 'Yanmar YH880',
      type: 'Harvester',
      purchase_date: new Date('2024-06-20'),
      status: 'AVAILABLE',
    },
  })

  console.log('✓ Created 2 machines')

  // ============================================
  // 5. Sample Bookings (10 bookings)
  // ============================================
  console.log('Creating sample bookings...')

  // Customer 1 - Bookings
  await prisma.booking.createMany({
    data: [
      {
        customer_id: customer1.id,
        land_id: customer1.lands[0].id,
        service_id: riceHarvest.id,
        quantity: 5,
        captured_price: 500000,
        total_amount: 2500000,
        status: 'COMPLETED',
        payment_status: 'FULLY_PAID',
      },
      {
        customer_id: customer1.id,
        land_id: customer1.lands[1].id,
        service_id: riceHarvest.id,
        quantity: 3.5,
        captured_price: 500000,
        total_amount: 1750000,
        status: 'COMPLETED',
        payment_status: 'ADDED_BILL',
      },
      {
        customer_id: customer1.id,
        land_id: customer1.lands[0].id,
        service_id: cornHarvest.id,
        quantity: 2,
        captured_price: 450000,
        total_amount: 900000,
        status: 'IN_PROGRESS',
        payment_status: 'PENDING_BILL',
      },
    ],
  })

  // Customer 2 - Bookings
  await prisma.booking.createMany({
    data: [
      {
        customer_id: customer2.id,
        land_id: customer2.lands[0].id,
        service_id: riceHarvest.id,
        quantity: 4,
        captured_price: 500000,
        total_amount: 2000000,
        status: 'COMPLETED',
        payment_status: 'ADDED_BILL',
      },
      {
        customer_id: customer2.id,
        land_id: customer2.lands[0].id,
        service_id: cornHarvest.id,
        quantity: 3,
        captured_price: 450000,
        total_amount: 1350000,
        status: 'NEW',
        payment_status: 'PENDING_BILL',
      },
    ],
  })

  // Customer 3 - Bookings
  await prisma.booking.createMany({
    data: [
      {
        customer_id: customer3.id,
        land_id: customer3.lands[0].id,
        service_id: riceHarvest.id,
        quantity: 6,
        captured_price: 500000,
        total_amount: 3000000,
        status: 'COMPLETED',
        payment_status: 'FULLY_PAID',
      },
      {
        customer_id: customer3.id,
        land_id: customer3.lands[1].id,
        service_id: riceHarvest.id,
        quantity: 4.5,
        captured_price: 500000,
        total_amount: 2250000,
        status: 'IN_PROGRESS',
        payment_status: 'PENDING_BILL',
      },
      {
        customer_id: customer3.id,
        land_id: customer3.lands[0].id,
        service_id: cornHarvest.id,
        quantity: 2.5,
        captured_price: 450000,
        total_amount: 1125000,
        status: 'NEW',
        payment_status: 'PENDING_BILL',
      },
    ],
  })

  // Additional mix bookings
  await prisma.booking.createMany({
    data: [
      {
        customer_id: customer1.id,
        land_id: customer1.lands[0].id,
        service_id: riceHarvest.id,
        quantity: 7,
        captured_price: 500000,
        total_amount: 3500000,
        status: 'NEW',
        payment_status: 'PENDING_BILL',
      },
      {
        customer_id: customer2.id,
        land_id: customer2.lands[0].id,
        service_id: riceHarvest.id,
        quantity: 5.5,
        captured_price: 500000,
        total_amount: 2750000,
        status: 'BLOCKED',
        payment_status: 'PENDING_BILL',
        notes: 'Chờ máy gặt sửa chữa',
      },
    ],
  })

  console.log('✓ Created 10 sample bookings')

  // ============================================
  // Summary
  // ============================================
  console.log('\n✅ Seed data created successfully!')
  console.log('─────────────────────────────────')
  console.log('Services:     2')
  console.log('Job Types:    4')
  console.log('Workers:      5')
  console.log('Customers:    3')
  console.log('Lands:        5')
  console.log('Machines:     2')
  console.log('Bookings:    10')
  console.log('─────────────────────────────────')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
