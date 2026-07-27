// ============================================
// Database types matching Supabase PostgreSQL schema
// ============================================

// --- Profiles ---
export type Profile = {
  id: string // UUID from auth.users
  name: string
  role: 'admin' | 'mekanik'
  is_active: boolean
  profile_picture: string | null
  created_at: string
  updated_at: string
}

// --- Items ---
export type Item = {
  id: number
  name: string
  description: string | null
  sku: string | null
  category: string | null
  category_id: number | null
  brand_id: number | null
  category_name: string | null
  brand_name: string | null
  purchase_price: number
  selling_price: number
  service_fee: number
  picture: string | null
  created_at: string
  updated_at: string
}

export type ItemInsert = Omit<Item, 'id' | 'created_at' | 'updated_at'>
export type ItemUpdate = Partial<ItemInsert>

// --- Categories ---
export type Category = {
  id: number
  name: string
  description: string | null
  created_at: string
}

export type CategoryInsert = Omit<Category, 'id' | 'created_at'>
export type CategoryUpdate = Partial<CategoryInsert>

// --- Brands ---
export type Brand = {
  id: number
  name: string
  created_at: string
}

export type BrandInsert = Omit<Brand, 'id' | 'created_at'>
export type BrandUpdate = Partial<BrandInsert>

// --- Customers ---
export type Customer = {
  id: number
  name: string
  phone: string | null
  address: string | null
  created_at: string
  updated_at: string
}

export type CustomerInsert = Omit<Customer, 'id' | 'created_at' | 'updated_at'>
export type CustomerUpdate = Partial<CustomerInsert>

// --- Suppliers ---
export type Supplier = {
  id: number
  name: string
  phone: string | null
  address: string | null
  created_at: string
  updated_at: string
}

export type SupplierInsert = Omit<Supplier, 'id' | 'created_at' | 'updated_at'>
export type SupplierUpdate = Partial<SupplierInsert>

// --- Purchases ---
export type Purchase = {
  id: number
  supplier_id: number
  invoice_number: string
  purchase_date: string
  total_amount: number
  status: 'completed' | 'pending' | 'cancelled'
  created_by: string // UUID
  created_at: string
  updated_at: string
}

export type PurchaseInsert = Omit<Purchase, 'id' | 'created_at' | 'updated_at'>
export type PurchaseUpdate = Partial<Omit<PurchaseInsert, 'created_by'>>

export type PurchaseDetail = {
  id: number
  purchase_id: number
  item_id: number
  quantity: number
  price: number
  subtotal: number
}

export type PurchaseDetailInsert = Omit<PurchaseDetail, 'id'>

// --- Purchases with joined data ---
export type PurchaseWithDetails = Purchase & {
  supplier?: Supplier
  details: (PurchaseDetail & { item?: Item })[]
}

// --- Payment Methods ---
export type PaymentMethod = {
  id: number
  name: string
  icon: string | null
  is_active: boolean
}

export type PaymentMethodInsert = Omit<PaymentMethod, 'id'>
export type PaymentMethodUpdate = Partial<PaymentMethodInsert>

// --- Sales ---
export type Sale = {
  id: number
  customer_id: number | null
  mechanic_id: string // UUID
  invoice_number: string
  sale_date: string
  total_amount: number
  status: 'completed' | 'pending' | 'in_progress' | 'cancelled'
  payment_method_id: number | null
  cash_amount: number | null
  change_amount: number | null
  notes: string | null
  created_by: string // UUID
  created_at: string
  updated_at: string
}

export type SaleInsert = Omit<Sale, 'id' | 'created_at' | 'updated_at'>
export type SaleUpdate = Partial<Omit<SaleInsert, 'created_by'>>

export type SaleDetail = {
  id: number
  sale_id: number
  item_id: number
  quantity: number
  base_price: number
  discount_amount: number
  final_price: number
  service_fee: number
  subtotal: number
}

export type SaleDetailInsert = Omit<SaleDetail, 'id'>

// --- Sales with joined data ---
export type SaleWithDetails = Sale & {
  customer?: Customer | null
  mechanic?: Profile
  payment_method?: PaymentMethod | null
  details: (SaleDetail & { item?: Item })[]
}

// --- Stock Movements ---
export type StockMovement = {
  id: number
  item_id: number
  type: 'IN' | 'OUT'
  quantity: number
  reference_type: 'purchase' | 'sale' | null
  reference_id: number | null
  created_at: string
}

export type StockMovementInsert = Omit<StockMovement, 'id' | 'created_at'>

// --- Stock Summary (from VIEW) ---
export type StockSummary = {
  item_id: number
  name: string
  sku: string | null
  category: string | null
  total_in: number
  total_out: number
  current_stock: number
}

// --- Discounts ---
export type Discount = {
  id: number
  name: string
  type: 'percent' | 'fixed'
  value: number
  min_transaction: number
  max_percent: number | null
  is_active: boolean
  start_date: string | null
  end_date: string | null
}

export type DiscountInsert = Omit<Discount, 'id'>
export type DiscountUpdate = Partial<DiscountInsert>

export type DiscountItem = {
  discount_id: number
  item_id: number
}

export type DiscountWithItems = Discount & {
  items: Item[]
}

// --- Pagination ---
export type PaginationParams = {
  page?: number
  limit?: number
}

export type PaginatedResponse<T> = {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// --- API Response ---
export type ApiResponse<T = unknown> = {
  data?: T
  error?: string
  message?: string
}

// --- Dashboard ---
export type DashboardSummary = {
  totalSales: number
  totalPurchases: number
  totalItems: number
  totalCustomers: number
  totalExpenses: number
  salesGrowth: number
  purchasesGrowth: number
}

export type SalesChartData = {
  date: string
  amount: number
  count: number
}

export type TopSellingItem = {
  item_id: number
  name: string
  total_sold: number
  total_revenue: number
}

export type LowStockAlert = {
  item_id: number
  name: string
  sku: string | null
  current_stock: number
}

// --- Reports ---
export type ReportDateRange = {
  start_date: string
  end_date: string
}

export type SalesReport = {
  total_sales: number
  total_transactions: number
  daily_breakdown: SalesChartData[]
}

export type PurchasesReport = {
  total_purchases: number
  total_transactions: number
  daily_breakdown: { date: string; amount: number; count: number }[]
}

export type ProfitLossReport = {
  total_sales: number
  total_purchases: number
  gross_profit: number
  total_service_fees: number
  net_profit: number
  hpp_total: number
}

// --- Activity Logs ---
export type ActivityLog = {
  id: number
  user_id: string | null
  action: 'create' | 'update' | 'delete'
  entity: string
  entity_id: string | null
  description: string | null
  metadata: string | null
  created_at: string
}

export type ActivityLogInsert = Omit<ActivityLog, 'id' | 'created_at'>

// --- Expenses ---
export type Expense = {
  id: number
  description: string
  amount: number
  category: 'operational' | 'utilities' | 'rent' | 'salary' | 'others'
  expense_date: string
  payment_method_id: number | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export type ExpenseInsert = Omit<Expense, 'id' | 'created_at' | 'updated_at'>
export type ExpenseUpdate = Partial<ExpenseInsert>

// --- Sales Returns ---
export type SalesReturn = {
  id: number
  sale_id: number
  return_date: string
  reason: string
  total_refund: number
  status: 'pending' | 'processed' | 'rejected'
  processed_by: string | null
  created_at: string
}

export type SalesReturnInsert = Omit<SalesReturn, 'id' | 'created_at'>
export type SalesReturnUpdate = Partial<Omit<SalesReturnInsert, 'sale_id'>>

export type SalesReturnDetail = {
  id: number
  return_id: number
  item_id: number
  quantity: number
  refund_amount: number
}

export type SalesReturnDetailInsert = Omit<SalesReturnDetail, 'id'>

export type SalesReturnWithDetails = SalesReturn & {
  details: (SalesReturnDetail & { item?: Item })[]
}

// --- Purchase Returns ---
export type PurchaseReturn = {
  id: number
  purchase_id: number
  return_date: string
  reason: string
  total_refund: number
  status: 'pending' | 'processed' | 'rejected'
  processed_by: string | null
  created_at: string
}

export type PurchaseReturnInsert = Omit<PurchaseReturn, 'id' | 'created_at'>
export type PurchaseReturnUpdate = Partial<Omit<PurchaseReturnInsert, 'purchase_id'>>

export type PurchaseReturnDetail = {
  id: number
  return_id: number
  item_id: number
  quantity: number
  refund_amount: number
}

export type PurchaseReturnDetailInsert = Omit<PurchaseReturnDetail, 'id'>

export type PurchaseReturnWithDetails = PurchaseReturn & {
  details: (PurchaseReturnDetail & { item?: Item })[]
}
