import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import bcrypt from 'bcryptjs'

// Load environment variables from .env.local
config({ path: '.env.local' })

const pool = new pg.Pool({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
})

const adapter = new PrismaPg(pool)

const prisma = new PrismaClient({
  adapter,
})


async function main() {
  console.log('🌱 Starting seed...')

  // ============================================
  // 1. Admin User
  // ============================================
  console.log('Creating admin user...')
  const passwordHash = await bcrypt.hash('admin123', 10)
  const adminUser = await prisma.user.create({
    data: {
      name: 'Admin',
      email: 'admin@agrpal.local',
      password_hash: passwordHash,
      role: 'ADMIN',
    },
  })
  console.log(`✓ Created admin user: ${adminUser.email}`)

  // ============================================
  // 2. Machine Types (with embedded Job Types)
  // Job Types now belong to a specific MachineType
  // ============================================
  console.log('Creating machine types with job types...')

  // Máy cắt lúa: Tài xế + Cột bao
  const machineTypeCatLua = await prisma.machineType.create({
    data: {
      name: 'Máy cắt lúa',
      description: 'Máy thu hoạch lúa — cần 1 tài xế và nhiều người cột bao',
      job_types: {
        create: [
          { name: 'Tài xế', default_base_salary: 500000 },
          { name: 'Cột bao', default_base_salary: 300000 },
        ],
      },
    },
    include: { job_types: true },
  })

  // Máy cày: Tài xế + Công phụ
  const machineTypeCay = await prisma.machineType.create({
    data: {
      name: 'Máy cày',
      description: 'Máy cày đất — cần 1 tài xế và 1 công phụ',
      job_types: {
        create: [
          { name: 'Tài xế', default_base_salary: 500000 },
          { name: 'Công phụ', default_base_salary: 250000 },
        ],
      },
    },
    include: { job_types: true },
  })

  // Resolve individual job types for worker assignment
  const jtCatLua_TaiXe = machineTypeCatLua.job_types.find((jt) => jt.name === 'Tài xế')!
  const jtCatLua_CotBao = machineTypeCatLua.job_types.find((jt) => jt.name === 'Cột bao')!

  console.log('✓ Created 2 machine types with 4 job types total')

  // ============================================
  // 3. Workers
  // ============================================
  console.log('Creating workers...')

  const worker1 = await prisma.worker.create({
    data: { name: 'Trần Văn B', phone: '0912345678', address: 'An Giang' },
  })
  const worker2 = await prisma.worker.create({
    data: { name: 'Nguyễn Văn C', phone: '0923456789', address: 'Đồng Tháp' },
  })
  const worker3 = await prisma.worker.create({
    data: { name: 'Lê Thị D', phone: '0934567890', address: 'Long An' },
  })
  const worker4 = await prisma.worker.create({
    data: { name: 'Phạm Văn E', phone: '0945678901', address: 'Tiền Giang' },
  })
  await prisma.worker.create({
    data: { name: 'Hoàng Thị F', phone: '0956789012', address: 'Vĩnh Long' },
  })

  console.log('✓ Created 5 workers')

  // ============================================
  // 4. Customers & Lands
  // ============================================
  console.log('Creating customers and lands...')

  const customer1 = await prisma.customer.create({
    data: {
      name: 'Nguyễn Văn A',
      phone: '0987654321',
      address: 'Ấp 1, Xã Tân Lập, Huyện Mộc Hóa, Long An',
      lands: {
        create: [
          { name: 'Ruộng ông Bảy', gps_lat: 10.123456, gps_lng: 106.654321 },
          { name: 'Ruộng cạnh sông', gps_lat: 10.125678, gps_lng: 106.656543 },
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
        create: [{ name: 'Ruộng đồng sau nhà', gps_lat: 10.234567, gps_lng: 106.765432 }],
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
          { name: 'Ruộng phía Đông', gps_lat: 10.345678, gps_lng: 106.876543 },
          { name: 'Ruộng phía Tây', gps_lat: 10.347890, gps_lng: 106.878765 },
        ],
      },
    },
    include: { lands: true },
  })

  console.log('✓ Created 3 customers with lands')

  // ============================================
  // 5. Machines
  // ============================================
  console.log('Creating machines...')

  const machine1 = await prisma.machine.create({
    data: {
      name: 'Máy gặt 01',
      model: 'Kubota DC-70',
      machine_type_id: machineTypeCatLua.id,
      purchase_date: new Date('2023-01-15'),
      status: 'AVAILABLE',
    },
  })

  const machine2 = await prisma.machine.create({
    data: {
      name: 'Máy gặt 02',
      model: 'Yanmar YH880',
      machine_type_id: machineTypeCatLua.id,
      purchase_date: new Date('2024-06-20'),
      status: 'AVAILABLE',
    },
  })

  await prisma.machine.create({
    data: {
      name: 'Máy cày 01',
      model: 'Kubota L4508',
      machine_type_id: machineTypeCay.id,
      purchase_date: new Date('2022-03-10'),
      status: 'AVAILABLE',
    },
  })

  console.log('✓ Created 3 machines')

  // ============================================
  // 6. Bookings
  // ============================================
  console.log('Creating bookings...')

  const booking1 = await prisma.booking.create({
    data: {
      customer_id: customer1.id,
      land_id: customer1.lands[0].id,
      amount: 2500000,
      status: 'COMPLETED',
      payment_status: 'PENDING_BILL',
    },
  })

  const booking2 = await prisma.booking.create({
    data: {
      customer_id: customer1.id,
      land_id: customer1.lands[1].id,
      amount: 1750000,
      status: 'COMPLETED',
      payment_status: 'PENDING_BILL',
    },
  })

  await prisma.booking.create({
    data: {
      customer_id: customer2.id,
      land_id: customer2.lands[0].id,
      amount: 2000000,
      status: 'IN_PROGRESS',
      payment_status: 'PENDING_BILL',
    },
  })

  await prisma.booking.create({
    data: {
      customer_id: customer3.id,
      land_id: customer3.lands[0].id,
      status: 'NEW',
      payment_status: 'PENDING_BILL',
    },
  })

  console.log('✓ Created 4 bookings')

  // ============================================
  // 7. Sample WorkDay + DailyMachines + Workers + Bookings
  // DailyMachineWorker.job_type_id references Job_Type directly
  // ============================================
  console.log('Creating sample work day...')

  const workDay = await prisma.workDay.create({
    data: {
      date: new Date('2026-03-20T00:00:00.000Z'),
      notes: 'Ngày mẫu',
    },
  })

  // Machine 1 on this day
  const dailyMachine1 = await prisma.dailyMachine.create({
    data: {
      work_day_id: workDay.id,
      machine_id: machine1.id,
      amount: 2500000,
    },
  })

  // Workers: snapshot applied_base from job_type.default_base_salary
  await prisma.dailyMachineWorker.create({
    data: {
      daily_machine_id: dailyMachine1.id,
      worker_id: worker1.id,
      job_type_id: jtCatLua_TaiXe.id,
      applied_base: Number(jtCatLua_TaiXe.default_base_salary),
      applied_weight: 1.0,
    },
  })
  await prisma.dailyMachineWorker.create({
    data: {
      daily_machine_id: dailyMachine1.id,
      worker_id: worker2.id,
      job_type_id: jtCatLua_CotBao.id,
      applied_base: Number(jtCatLua_CotBao.default_base_salary),
      applied_weight: 1.0,
    },
  })

  // Machine 2 on this day
  const dailyMachine2 = await prisma.dailyMachine.create({
    data: {
      work_day_id: workDay.id,
      machine_id: machine2.id,
      amount: 1750000,
    },
  })

  await prisma.dailyMachineWorker.create({
    data: {
      daily_machine_id: dailyMachine2.id,
      worker_id: worker3.id,
      job_type_id: jtCatLua_TaiXe.id,
      applied_base: Number(jtCatLua_TaiXe.default_base_salary),
      applied_weight: 1.0,
    },
  })
  await prisma.dailyMachineWorker.create({
    data: {
      daily_machine_id: dailyMachine2.id,
      worker_id: worker4.id,
      job_type_id: jtCatLua_CotBao.id,
      applied_base: Number(jtCatLua_CotBao.default_base_salary),
      applied_weight: 1.0,
    },
  })

  // Bookings on this day
  const dailyBooking1 = await prisma.dailyBooking.create({
    data: { work_day_id: workDay.id, booking_id: booking1.id, amount: 2500000 },
  })
  const dailyBooking2 = await prisma.dailyBooking.create({
    data: { work_day_id: workDay.id, booking_id: booking2.id, amount: 1750000 },
  })

  // Trace-back links: booking ↔ machine
  await prisma.dailyBookingMachine.create({
    data: { daily_booking_id: dailyBooking1.id, daily_machine_id: dailyMachine1.id },
  })
  await prisma.dailyBookingMachine.create({
    data: { daily_booking_id: dailyBooking2.id, daily_machine_id: dailyMachine2.id },
  })

  console.log('✓ Created sample work day with machines, workers, and bookings')

  // ============================================
  // Summary
  // ============================================
  console.log('\n✅ Seed data created successfully!')
  console.log('─────────────────────────────────')
  console.log('Admin User:    1 (admin@agrpal.local / admin123)')
  console.log('Machine Types: 2 (with embedded job types)')
  console.log('Workers:       5')
  console.log('Customers:     3')
  console.log('Machines:      3')
  console.log('Bookings:      4')
  console.log('WorkDays:      1 (sample)')
  console.log('─────────────────────────────────')
}

main()
  .then(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e)
    await prisma.$disconnect()
    await pool.end()
    process.exit(1)
  })
