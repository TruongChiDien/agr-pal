import { z } from 'zod'

export const createCustomerSchema = z.object({
  name: z.string().min(1, 'Tên khách hàng không được để trống').max(200, 'Tên khách hàng tối đa 200 ký tự'),
  phone: z.string().max(20, 'Số điện thoại tối đa 20 ký tự').optional(),
  address: z.string().max(500, 'Địa chỉ tối đa 500 ký tự').optional(),
})

export const updateCustomerSchema = createCustomerSchema.partial()

export const createLandSchema = z.object({
  customer_id: z.string().min(1, 'ID khách hàng không được để trống'),
  name: z.string().min(1, 'Tên thửa đất không được để trống').max(200, 'Tên thửa đất tối đa 200 ký tự'),
  gps_lat: z.number().min(-90, 'Vĩ độ phải từ -90 đến 90').max(90, 'Vĩ độ phải từ -90 đến 90').optional(),
  gps_lng: z.number().min(-180, 'Kinh độ phải từ -180 đến 180').max(180, 'Kinh độ phải từ -180 đến 180').optional(),
})

export const updateLandSchema = createLandSchema.partial().omit({ customer_id: true })
