import { z } from 'zod'

// Del navegador solo se aceptan ids, cantidades, comentarios y datos de contacto: nunca precios.
export const orderSchema = z.object({
  customer: z.object({
    name: z.string().trim().min(2).max(80),
    phone: z.string().trim().min(6).max(30).regex(/^[\d\s+()-]+$/),
  }),
  /** Retiro en el local o delivery; con delivery la dirección es obligatoria. */
  delivery: z.enum(['retiro', 'delivery']).default('retiro'),
  address: z.string().trim().max(200).optional(),
  notes: z.string().trim().max(500).optional(),
  paymentMethodId: z.string().max(40).optional(),
  coupon: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9_-]{1,30}$/)
    .optional(),
  items: z
    .array(z.object({ productId: z.string().min(1).max(100), quantity: z.number().int().min(1).max(99) }))
    .min(1)
    .max(60),
}).refine((order) => order.delivery !== 'delivery' || (order.address?.length ?? 0) >= 5, { path: ['address'] })

export type OrderInput = z.infer<typeof orderSchema>
