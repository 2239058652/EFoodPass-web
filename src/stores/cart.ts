import { defineStore } from 'pinia'
import type { FoodItemItem } from '@/types'

export interface CartItem {
  foodItemId: number
  name: string
  price: number | string
  stock: number
  quantity: number
  description?: string
  categoryId?: number
  categoryName?: string
}

const CART_KEY = 'efoodpass_cart'

function readCache(): CartItem[] {
  const raw = localStorage.getItem(CART_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function toStock(stock: unknown): number {
  const value = Number(stock || 0)
  return Number.isFinite(value) ? Math.max(0, value) : 0
}

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: readCache() as CartItem[]
  }),
  getters: {
    totalCount: (state): number => state.items.reduce((sum, item) => sum + item.quantity, 0),
    totalAmount: (state): number => state.items.reduce((sum, item) => sum + Number(item.price || 0) * item.quantity, 0),
    isEmpty: (state): boolean => state.items.length === 0
  },
  actions: {
    persist(): void {
      localStorage.setItem(CART_KEY, JSON.stringify(this.items))
    },
    addItem(food: FoodItemItem, quantity = 1): number {
      const stock = toStock(food.stock)
      if (!food.id || stock <= 0) return 0

      const resolvedQuantity = Math.max(1, Number(quantity || 1))
      const target = this.items.find((item) => item.foodItemId === food.id)

      if (target) {
        const nextQuantity = Math.min(stock, target.quantity + resolvedQuantity)
        const added = Math.max(0, nextQuantity - target.quantity)
        target.name = food.name
        target.price = food.price
        target.stock = stock
        target.description = food.description
        target.categoryId = food.categoryId
        target.categoryName = food.categoryName
        target.quantity = nextQuantity
        this.persist()
        return added
      }

      const insertedQuantity = Math.min(stock, resolvedQuantity)
      this.items.push({
        foodItemId: food.id,
        name: food.name,
        price: food.price,
        stock,
        quantity: insertedQuantity,
        description: food.description,
        categoryId: food.categoryId,
        categoryName: food.categoryName
      })
      this.persist()
      return insertedQuantity
    },
    updateQuantity(foodItemId: number, quantity: number): void {
      const target = this.items.find((item) => item.foodItemId === foodItemId)
      if (!target) return
      const max = target.stock > 0 ? target.stock : target.quantity
      target.quantity = Math.max(1, Math.min(max, Number(quantity || 1)))
      this.persist()
    },
    removeItem(foodItemId: number): void {
      this.items = this.items.filter((item) => item.foodItemId !== foodItemId)
      this.persist()
    },
    clear(): void {
      this.items = []
      this.persist()
    },
    syncItems(foods: FoodItemItem[]): void {
      if (!foods.length || !this.items.length) return
      const map = new Map<number, FoodItemItem>()
      foods.forEach((food) => {
        if (food.id) map.set(food.id, food)
      })

      this.items = this.items.map((item) => {
        const latest = map.get(item.foodItemId)
        if (!latest) return item

        const stock = toStock(latest.stock)
        return {
          ...item,
          name: latest.name,
          price: latest.price,
          stock,
          description: latest.description,
          categoryId: latest.categoryId,
          categoryName: latest.categoryName,
          quantity: stock > 0 ? Math.min(item.quantity, stock) : item.quantity
        }
      })
      this.persist()
    }
  }
})
