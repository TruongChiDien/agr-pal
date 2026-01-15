import { z } from 'zod'

export const createCustomerSchema = z.object({
  name: z.string().min(1, 'Tên khách hàng là bắt buộc'),
  phone: z.string().optional(),
  address: z.string().optional(),
})

export const updateCustomerSchema = createCustomerSchema.partial()

export const createLandSchema = z.object({
  customer_id: z.string().min(1, 'Customer ID là bắt buộc'),
  name: z.string().min(1, 'Tên ruộng là bắt buộc'),
  gps_lat: z.number().optional(),
  gps_lng: z.number().optional(),
})

export const updateLandSchema = createLandSchema.partial().omit({ customer_id: true })
