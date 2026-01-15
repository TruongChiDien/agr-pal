// Test Prisma database connection
import { config } from 'dotenv'

// Load .env.local
config({ path: '.env.local' })

import { prisma } from './src/lib/db'

async function testConnection() {
  try {
    console.log('🔍 Testing database connection...')

    // Test 1: Connection
    await prisma.$connect()
    console.log('✓ Database connected successfully')

    // Test 2: Query test
    const serviceCount = await prisma.service.count()
    console.log(`✓ Query successful: Found ${serviceCount} services`)

    // Test 3: Fetch sample data
    const services = await prisma.service.findMany({
      take: 2,
      include: { job_types: true },
    })
    console.log(`✓ Fetched ${services.length} services with job types`)

    const customerCount = await prisma.customer.count()
    const workerCount = await prisma.worker.count()
    const machineCount = await prisma.machine.count()
    const bookingCount = await prisma.booking.count()

    console.log('\n📊 Database Summary:')
    console.log(`   Services:  ${serviceCount}`)
    console.log(`   Customers: ${customerCount}`)
    console.log(`   Workers:   ${workerCount}`)
    console.log(`   Machines:  ${machineCount}`)
    console.log(`   Bookings:  ${bookingCount}`)

    console.log('\n✅ All tests passed!')

  } catch (error) {
    console.error('❌ Test failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()
