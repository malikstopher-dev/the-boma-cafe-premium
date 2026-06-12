'use client'

import { SupabaseOrder, OrderStatus, PaymentMethod, OrderItem, OrderMeta, OrderType, TableStatus, TableInfo, buildItemsJson, parseOrderItems, getOrderTableNumber, getPaymentStatus, getPaymentMethod } from '@/types/pos'

const API_BASE = '/api/supabase/orders'

async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export const posService = {
  async getAllOrders(): Promise<SupabaseOrder[]> {
    return fetchApi<SupabaseOrder[]>(API_BASE)
  },

  async createOrder(params: {
    customer_name: string
    phone: string
    order_type: OrderType
    items: OrderItem[]
    total: number
    tableNumber?: number
    requested_time?: string
  }): Promise<{ success: boolean; order: SupabaseOrder }> {
    const meta: OrderMeta = {}
    if (params.tableNumber !== undefined) meta.tableNumber = params.tableNumber
    const itemsJson = buildItemsJson(params.items, Object.keys(meta).length > 0 ? meta : undefined)
    return fetchApi(API_BASE, {
      method: 'POST',
      body: JSON.stringify({
        customer_name: params.customer_name,
        phone: params.phone,
        order_type: params.order_type,
        requested_time: params.requested_time || 'ASAP',
        items_json: itemsJson,
        total: params.total,
      }),
    })
  },

  async updateStatus(orderId: string, status: OrderStatus): Promise<{ success: boolean }> {
    return fetchApi(`${API_BASE}?id=${orderId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
  },

  async payOrder(orderId: string, method: PaymentMethod): Promise<{ success: boolean }> {
    return fetchApi(`${API_BASE}?id=${orderId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'completed',
        payment_method: method,
      }),
    })
  },

  async deleteOrder(orderId: string): Promise<{ success: boolean }> {
    return fetchApi(`${API_BASE}?id=${orderId}`, { method: 'DELETE' })
  },
}

export function computeTables(orders: SupabaseOrder[]): TableInfo[] {
  const tables: TableInfo[] = []
  for (let i = 1; i <= 20; i++) {
    tables.push({ tableNumber: i, status: 'empty', total: 0 })
  }

  const active = orders.filter((o) => !['completed', 'cancelled'].includes(o.status))
  for (const order of active) {
    const tn = getOrderTableNumber(order)
    if (tn !== undefined && tn >= 1 && tn <= 20) {
      const idx = tn - 1
      tables[idx] = {
        tableNumber: tn,
        status: order.status === 'ready' || order.status === 'pending' ? 'occupied' : 'occupied',
        currentOrderId: order.id,
        total: order.total,
        customerName: order.customer_name,
      }
    }
  }
  return tables
}
