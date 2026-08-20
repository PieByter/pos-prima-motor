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
  weekly_salary: number
  service_commission_pct: number
  hire_date: string | null
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
  supplier_ids: number[]
  suppliers: { id: number; name: string; purchase_price: number | null }[]
  purchase_price: number
  selling_price: number
  service_fee: number
  stock: number
  warranty_months: number | null
  picture: string | null
  created_at: string
  updated_at: string
}

/** Relasi item ↔ supplier + harga beli khusus dari supplier tsb */
export type ItemSupplierLink = {
  supplier_id: number
  purchase_price?: number | null
}

export type ItemInsert = Omit<Item, 'id' | 'created_at' | 'updated_at' | 'supplier_ids' | 'suppliers'> & {
  supplier_ids?: number[]
  /** Prioritas: kalau ada, pakai ini (bisa berisi harga per supplier) */
  supplier_links?: ItemSupplierLink[]
}
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
export type CustomerType = 'retail' | 'garage'

export type Customer = {
  id: number
  name: string
  phone: string | null
  address: string | null
  nik: string | null
  email: string | null
  birth_date: string | null
  customer_type: CustomerType
  notes: string | null
  points: number
  created_at: string
  updated_at: string
}

export type CustomerInsert = Omit<Customer, 'id' | 'created_at' | 'updated_at' | 'points'>
export type CustomerUpdate = Partial<CustomerInsert>

// --- Point transactions (loyalty poin pelanggan) ---
export type PointTransaction = {
  id: number
  customer_id: number
  points: number
  type: 'earn' | 'redeem' | 'adjust'
  reference: string | null
  created_by: string | null
  created_at: string
}

export type CustomerLoyalty = {
  customer_id: number
  customer_name: string
  balance: number
  transactions: PointTransaction[]
}

// --- Vehicles (motor milik customer) ---
export type Vehicle = {
  id: number
  customer_id: number
  plate_number: string
  brand: string | null
  model: string | null
  year: number | null
  color: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type VehicleInsert = Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>
export type VehicleUpdate = Partial<VehicleInsert>

export type CustomerWithVehicles = Customer & {
  vehicles?: Vehicle[]
}

// --- Suppliers ---
export type Supplier = {
  id: number
  name: string
  phone: string | null
  address: string | null
  email: string | null
  is_active: boolean
  bank_name: string | null
  bank_account: string | null
  bank_account_holder: string | null
  npwp: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type SupplierInsert = Omit<Supplier, 'id' | 'created_at' | 'updated_at'>
export type SupplierUpdate = Partial<SupplierInsert>

// --- Supplier Contacts (banyak kontak per supplier) ---
export type SupplierContact = {
  id: number
  supplier_id: number
  name: string
  phone: string | null
  position: string | null
  email: string | null
  is_primary: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export type SupplierContactInsert = Omit<SupplierContact, 'id' | 'created_at' | 'updated_at'>
export type SupplierContactUpdate = Partial<SupplierContactInsert>

export type SupplierWithContacts = Supplier & {
  contacts?: SupplierContact[]
}

// --- Purchase Orders (PO ke supplier) ---
export type PurchaseOrderStatus = 'draft' | 'sent' | 'partial' | 'received' | 'cancelled'

export type PurchaseOrder = {
  id: number
  supplier_id: number
  po_number: string
  order_date: string
  expected_date: string | null
  status: PurchaseOrderStatus
  total_amount: number
  notes: string | null
  created_by: string // UUID
  created_at: string
  updated_at: string
}

export type PurchaseOrderInsert = Omit<PurchaseOrder, 'id' | 'created_at' | 'updated_at'>
export type PurchaseOrderUpdate = Partial<Omit<PurchaseOrderInsert, 'created_by'>>

export type PurchaseOrderDetail = {
  id: number
  po_id: number
  item_id: number
  quantity: number
  received_quantity: number
  price: number
  subtotal: number
}

/** Input dari form (po_id & subtotal dihitung di service) */
export type PurchaseOrderDetailInsert = {
  item_id: number
  quantity: number
  price: number
}

export type PurchaseOrderWithDetails = PurchaseOrder & {
  supplier?: Supplier
  details: (PurchaseOrderDetail & { item?: Item })[]
}

// --- Estimates (estimasi / quotation service) ---
export type EstimateStatus = 'draft' | 'sent' | 'approved' | 'converted' | 'cancelled'

export type Estimate = {
  id: number
  customer_id: number | null
  vehicle_id: number | null
  estimate_number: string
  description: string | null
  status: EstimateStatus
  total_amount: number
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export type EstimateInsert = Omit<Estimate, 'id' | 'created_at' | 'updated_at'>

export type EstimateItem = {
  id: number
  estimate_id: number
  item_id: number | null
  name: string
  type: 'part' | 'service'
  quantity: number
  price: number
  subtotal: number
}

/** Input baris estimasi (estimate_id & subtotal diisi di service) */
export type EstimateItemInsert = Omit<EstimateItem, 'id' | 'estimate_id' | 'subtotal'>

export type EstimateWithDetails = Estimate & {
  customer?: { id: number; name: string; phone: string | null } | null
  vehicle?: { id: number; plate_number: string; brand: string | null; model: string | null } | null
  items: EstimateItem[]
}

// --- Salary Payments (gaji mekanik) ---
export type SalaryPayment = {
  id: number
  mechanic_id: string // UUID
  payment_date: string
  amount: number
  period_start: string | null
  period_end: string | null
  payment_method_id: number | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export type SalaryPaymentInsert = Omit<SalaryPayment, 'id' | 'created_at' | 'updated_at'>
export type SalaryPaymentUpdate = Partial<Omit<SalaryPaymentInsert, 'created_by'>>

export type SalaryPaymentWithMechanic = SalaryPayment & {
  mechanic?: Profile
  payment_method?: PaymentMethod | null
}

// --- Stock Adjustments (stok opname / rusak / hilang) ---
export type StockAdjustmentType = 'IN' | 'OUT'
export type StockAdjustmentReason = 'damaged' | 'lost' | 'count_fix' | 'stock_in' | 'other'

export type StockAdjustment = {
  id: number
  item_id: number
  adjustment_date: string
  type: StockAdjustmentType
  quantity: number
  reason: StockAdjustmentReason
  notes: string | null
  created_by: string | null
  created_at: string
}

export type StockAdjustmentInsert = Omit<StockAdjustment, 'id' | 'created_at'>
export type StockAdjustmentWithItem = StockAdjustment & {
  item?: Item
}

// --- Warranty Claims (klaim garansi) ---
export type WarrantyClaimStatus = 'pending' | 'approved' | 'rejected' | 'completed'
export type WarrantyClaimResolution = 'repair' | 'replace' | 'refund' | 'none'

export type WarrantyClaim = {
  id: number
  sale_detail_id: number
  item_id: number
  claim_date: string
  description: string
  status: WarrantyClaimStatus
  resolution: WarrantyClaimResolution
  cost: number
  resolved_date: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export type WarrantyClaimInsert = Omit<WarrantyClaim, 'id' | 'created_at' | 'updated_at'>
export type WarrantyClaimUpdate = Partial<WarrantyClaimInsert>

export type WarrantyClaimWithDetails = WarrantyClaim & {
  item?: Item
  sale_detail?: SaleDetail
  sale?: Sale
}

// --- Purchases ---
export type Purchase = {
  id: number
  supplier_id: number
  invoice_number: string
  purchase_date: string
  total_amount: number
  status: 'completed' | 'pending' | 'cancelled'
  payment_status: 'paid' | 'partial' | 'unpaid'
  paid_amount: number | null
  remaining_amount: number | null
  created_by: string // UUID
  created_at: string
  updated_at: string
}

export type PurchaseInsert = Omit<Purchase, 'id' | 'created_at' | 'updated_at'>
export type PurchaseUpdate = Partial<Omit<PurchaseInsert, 'created_by'>>

// --- Purchase Payments (riwayat pembayaran hutang supplier) ---
export type PurchasePayment = {
  id: number
  purchase_id: number
  amount: number
  payment_date: string
  payment_method_id: number | null
  notes: string | null
  created_by: string | null
  created_at: string
}

export type PurchasePaymentInsert = Omit<PurchasePayment, 'id' | 'created_at'>
export type PurchasePaymentWithMethod = PurchasePayment & {
  payment_method?: PaymentMethod | null
}

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
export type SaleType = 'purchase' | 'service' | 'hybrid'
export type PaymentStatus = 'paid' | 'partial' | 'unpaid'

export type Sale = {
  id: number
  customer_id: number | null
  vehicle_id: number | null
  mechanic_id: string // UUID
  invoice_number: string
  sale_date: string
  total_amount: number
  status: 'completed' | 'pending' | 'in_progress' | 'cancelled'
  sale_type: SaleType
  payment_status: PaymentStatus
  paid_amount: number | null
  remaining_amount: number | null
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

// --- Sale Payments (riwayat pembayaran utang) ---
export type SalePayment = {
  id: number
  sale_id: number
  amount: number
  payment_date: string
  payment_method_id: number | null
  notes: string | null
  created_by: string | null
  created_at: string
}

export type SalePaymentInsert = Omit<SalePayment, 'id' | 'created_at'>
export type SalePaymentWithMethod = SalePayment & {
  payment_method?: PaymentMethod | null
}

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
  warranty_months: number | null
}

export type SaleDetailInsert = Omit<SaleDetail, 'id'>

// --- Sales with joined data ---
export type SaleWithDetails = Sale & {
  customer?: Customer | null
  vehicle?: Vehicle | null
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
  total_expenses: number
  total_mechanic_salaries: number
  total_mechanic_commissions: number
  net_profit_owner: number
}

export type MechanicPerformanceRow = {
  mechanic_id: string
  mechanic_name: string
  total_sales: number
  total_transactions: number
  total_service_fees: number
  hpp_total: number
  gross_profit: number
  weekly_salary: number
  service_commission_pct: number
  commission: number
  total_earnings: number
}

export type WeeklySalaryRow = {
  mechanic_id: string
  mechanic_name: string
  weekly_salary: number
  total_service_fees: number
  service_commission_pct: number
  commission: number
  total_earnings: number
}

// --- Receivables (piutang) ---
export type ReceivableRow = {
  sale_id: number
  invoice_number: string
  sale_date: string
  customer_id: number | null
  customer_name: string
  customer_phone: string | null
  total_amount: number
  paid_amount: number
  remaining_amount: number
  payment_status: 'paid' | 'partial' | 'unpaid'
  /** Umur utang dalam hari (dari sale_date sampai hari ini) */
  aging_days: number
}

export type ReceivablesReport = {
  total_outstanding: number
  total_customers: number
  aging_0_7: number
  aging_8_30: number
  aging_31_60: number
  aging_60_plus: number
  rows: ReceivableRow[]
}

// --- Payables (hutang supplier) ---
export type PayableRow = {
  purchase_id: number
  invoice_number: string
  purchase_date: string
  supplier_id: number | null
  supplier_name: string
  supplier_phone: string | null
  total_amount: number
  paid_amount: number
  remaining_amount: number
  payment_status: 'paid' | 'partial' | 'unpaid'
  aging_days: number
}

export type PayablesReport = {
  total_outstanding: number
  total_suppliers: number
  aging_0_7: number
  aging_8_30: number
  aging_31_60: number
  aging_60_plus: number
  rows: PayableRow[]
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
