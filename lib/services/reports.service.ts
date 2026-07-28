import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  SalesReport,
  PurchasesReport,
  ProfitLossReport,
  MechanicPerformanceRow,
  WeeklySalaryRow,
  ReportDateRange,
} from '@/lib/types/database'

export async function getSalesReport(
  supabase: SupabaseClient,
  dateRange: ReportDateRange,
): Promise<{ data: SalesReport | null; error: Error | null }> {
  try {
    const { data: rows, error } = await supabase
      .from('sales')
      .select('sale_date, total_amount')
      .eq('status', 'completed')
      .gte('sale_date', dateRange.start_date)
      .lte('sale_date', dateRange.end_date)
      .order('sale_date', { ascending: true })

    if (error) return { data: null, error: new Error(error.message) }

    const total_sales = (rows ?? []).reduce((sum, s) => sum + Number(s.total_amount), 0)

    const grouped: Record<string, { amount: number; count: number }> = {}
    for (const row of rows ?? []) {
      const date = row.sale_date
      if (!grouped[date]) grouped[date] = { amount: 0, count: 0 }
      grouped[date].amount += Number(row.total_amount)
      grouped[date].count += 1
    }

    return {
      data: {
        total_sales,
        total_transactions: (rows ?? []).length,
        daily_breakdown: Object.entries(grouped).map(([date, vals]) => ({
          date,
          amount: vals.amount,
          count: vals.count,
        })),
      },
      error: null,
    }
  } catch (err) {
    return { data: null, error: err as Error }
  }
}

export async function getPurchasesReport(
  supabase: SupabaseClient,
  dateRange: ReportDateRange,
): Promise<{ data: PurchasesReport | null; error: Error | null }> {
  try {
    const { data: rows, error } = await supabase
      .from('purchases')
      .select('purchase_date, total_amount')
      .eq('status', 'completed')
      .gte('purchase_date', dateRange.start_date)
      .lte('purchase_date', dateRange.end_date)
      .order('purchase_date', { ascending: true })

    if (error) return { data: null, error: new Error(error.message) }

    const total_purchases = (rows ?? []).reduce((sum, p) => sum + Number(p.total_amount), 0)

    const grouped: Record<string, { amount: number; count: number }> = {}
    for (const row of rows ?? []) {
      const date = row.purchase_date
      if (!grouped[date]) grouped[date] = { amount: 0, count: 0 }
      grouped[date].amount += Number(row.total_amount)
      grouped[date].count += 1
    }

    return {
      data: {
        total_purchases,
        total_transactions: (rows ?? []).length,
        daily_breakdown: Object.entries(grouped).map(([date, vals]) => ({
          date,
          amount: vals.amount,
          count: vals.count,
        })),
      },
      error: null,
    }
  } catch (err) {
    return { data: null, error: err as Error }
  }
}

export async function getProfitLossReport(
  supabase: SupabaseClient,
  dateRange: ReportDateRange,
): Promise<{ data: ProfitLossReport | null; error: Error | null }> {
  try {
    // Get completed sales in range
    const { data: salesData, error: salesError } = await supabase
      .from('sales')
      .select('id, total_amount')
      .eq('status', 'completed')
      .gte('sale_date', dateRange.start_date)
      .lte('sale_date', dateRange.end_date)

    if (salesError) return { data: null, error: new Error(salesError.message) }

    // Get completed purchases in range
    const { data: purchasesData, error: purchasesError } = await supabase
      .from('purchases')
      .select('total_amount')
      .eq('status', 'completed')
      .gte('purchase_date', dateRange.start_date)
      .lte('purchase_date', dateRange.end_date)

    if (purchasesError) return { data: null, error: new Error(purchasesError.message) }

    const saleIds = (salesData ?? []).map((s) => s.id)
    let total_service_fees = 0
    let hpp_total = 0

    if (saleIds.length > 0) {
      const { data: detailData, error: detailError } = await supabase
        .from('sale_details')
        .select('item_id, quantity, service_fee')
        .in('sale_id', saleIds)

      if (detailError) return { data: null, error: new Error(detailError.message) }

      total_service_fees = (detailData ?? []).reduce((sum, sd) => sum + Number(sd.service_fee), 0)

      // HPP: get purchase_price from items for each sold item
      const itemIds = [...new Set((detailData ?? []).map((d) => d.item_id))]
      if (itemIds.length > 0) {
        const { data: items } = await supabase
          .from('items')
          .select('id, purchase_price')
          .in('id', itemIds)

        const priceMap = new Map((items ?? []).map((i) => [i.id, Number(i.purchase_price)]))

        hpp_total = (detailData ?? []).reduce((sum, sd) => {
          const purchasePrice = priceMap.get(sd.item_id) ?? 0
          return sum + purchasePrice * sd.quantity
        }, 0)
      }
    }

    const total_sales = (salesData ?? []).reduce((sum, s) => sum + Number(s.total_amount), 0)
    const total_purchases = (purchasesData ?? []).reduce((sum, p) => sum + Number(p.total_amount), 0)

    const gross_profit = total_sales - hpp_total
    const net_profit = gross_profit + total_service_fees

    // 5. Get total expenses in range
    const { data: expenseData, error: expenseError } = await supabase
      .from('expenses')
      .select('amount')
      .gte('expense_date', dateRange.start_date)
      .lte('expense_date', dateRange.end_date)

    // Don't fail the whole report if expenses query fails — just use 0
    const total_expenses = expenseError ? 0 : (expenseData ?? []).reduce((sum, e) => sum + Number(e.amount), 0)

    // 6. Get total mechanic salaries from active mekanik profiles
    const { data: salaryData, error: salaryError } = await supabase
      .from('profiles')
      .select('weekly_salary')
      .eq('role', 'mekanik')
      .eq('is_active', true)

    const total_mechanic_salaries = salaryError ? 0 : (salaryData ?? []).reduce((sum, p) => sum + Number(p.weekly_salary || 0), 0)

    // 7. Get total mechanic commissions from sale_details by mechanic
    let total_mechanic_commissions = 0
    if (saleIds.length > 0) {
      // Map sales to mechanic_id
      const { data: mechSales } = await supabase
        .from('sales')
        .select('id, mechanic_id')
        .in('id', saleIds)

      const saleMechMap = new Map<number, string>()
      for (const s of mechSales ?? []) {
        saleMechMap.set(s.id, s.mechanic_id)
      }

      // Get mechanic commission pcts
      const { data: mechProfiles } = await supabase
        .from('profiles')
        .select('id, service_commission_pct')
        .eq('role', 'mekanik')
        .eq('is_active', true)

      const commissionPctMap = new Map<string, number>()
      for (const p of mechProfiles ?? []) {
        commissionPctMap.set(p.id, Number(p.service_commission_pct) || 0)
      }

      // Get service fees per sale
      const { data: allDetails } = await supabase
        .from('sale_details')
        .select('sale_id, service_fee')
        .in('sale_id', saleIds)

      // Aggregate commissions per mechanic
      const mechCommissions = new Map<string, number>()
      for (const d of allDetails ?? []) {
        const mechId = saleMechMap.get(d.sale_id)
        if (!mechId) continue
        const pct = commissionPctMap.get(mechId) ?? 0
        const comm = Number(d.service_fee) * (pct / 100)
        mechCommissions.set(mechId, (mechCommissions.get(mechId) ?? 0) + comm)
      }

      total_mechanic_commissions = [...mechCommissions.values()].reduce((sum, c) => sum + c, 0)
    }

    // 8. Owner net profit = net_profit - expenses - salaries - commissions
    const net_profit_owner = net_profit - total_expenses - total_mechanic_salaries - total_mechanic_commissions

    return {
      data: {
        total_sales,
        total_purchases,
        gross_profit,
        total_service_fees,
        net_profit,
        hpp_total,
        total_expenses,
        total_mechanic_salaries,
        total_mechanic_commissions,
        net_profit_owner,
      },
      error: null,
    }
  } catch (err) {
    return { data: null, error: err as Error }
  }
}

export async function getMechanicPerformance(
  supabase: SupabaseClient,
  dateRange: ReportDateRange,
): Promise<{ data: MechanicPerformanceRow[] | null; error: Error | null }> {
  try {
    // 1. Get completed sales in range
    const { data: salesData, error: salesError } = await supabase
      .from('sales')
      .select('id, mechanic_id, total_amount')
      .eq('status', 'completed')
      .gte('sale_date', dateRange.start_date)
      .lte('sale_date', dateRange.end_date)

    if (salesError) return { data: null, error: new Error(salesError.message) }

    // 2. Get ALL mekanik profiles (including those with 0 sales)
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, weekly_salary, service_commission_pct')
      .eq('role', 'mekanik')
      .eq('is_active', true)

    if (profilesError) return { data: null, error: new Error(profilesError.message) }

    // 3. Get sale_details for service_fee
    const saleIds = (salesData ?? []).map((s) => s.id)
    let detailsBySale = new Map<number, { serviceFees: number; itemId: number; quantity: number }[]>()
    let allDetailRows: { sale_id: number; item_id: number; quantity: number; service_fee: number }[] = []

    if (saleIds.length > 0) {
      // Batch sale_ids in chunks of 300 to avoid oversized queries
      const chunks: number[][] = []
      for (let i = 0; i < saleIds.length; i += 300) {
        chunks.push(saleIds.slice(i, i + 300))
      }

      for (const chunk of chunks) {
        const { data: detailChunk, error: detailError } = await supabase
          .from('sale_details')
          .select('sale_id, item_id, quantity, service_fee')
          .in('sale_id', chunk)

        if (detailError) return { data: null, error: new Error(detailError.message) }
        allDetailRows.push(...(detailChunk ?? []))
      }
    }

    // 4. Get items for HPP
    const itemIds = [...new Set(allDetailRows.map((d) => d.item_id))]
    let priceMap = new Map<number, number>()
    if (itemIds.length > 0) {
      const { data: items } = await supabase
        .from('items')
        .select('id, purchase_price')
        .in('id', itemIds)
      priceMap = new Map((items ?? []).map((i) => [i.id, Number(i.purchase_price)]))
    }

    // 5. Aggregate per mechanic
    type MechAgg = {
      name: string
      totalSales: number
      transactions: Set<number>
      serviceFees: number
      hpp: number
      weeklySalary: number
      commissionPct: number
    }

    const mechanicMap = new Map<string, MechAgg>()

    // Init all active mekanik
    for (const p of profiles ?? []) {
      mechanicMap.set(p.id, {
        name: p.name,
        totalSales: 0,
        transactions: new Set(),
        serviceFees: 0,
        hpp: 0,
        weeklySalary: Number(p.weekly_salary) || 0,
        commissionPct: Number(p.service_commission_pct) || 0,
      })
    }

    // Map sale_id -> mechanic_id for quick lookup
    const saleMechanicMap = new Map<number, string>()
    for (const s of salesData ?? []) {
      saleMechanicMap.set(s.id, s.mechanic_id)
      const mech = mechanicMap.get(s.mechanic_id)
      if (mech) {
        mech.totalSales += Number(s.total_amount)
        mech.transactions.add(s.id)
      }
    }

    // Aggregate details
    for (const d of allDetailRows) {
      const mechanicId = saleMechanicMap.get(d.sale_id)
      if (!mechanicId) continue
      const mech = mechanicMap.get(mechanicId)
      if (!mech) continue

      mech.serviceFees += Number(d.service_fee)
      const purchasePrice = priceMap.get(d.item_id) ?? 0
      mech.hpp += purchasePrice * d.quantity
    }

    // 6. Build result rows
    const rows: MechanicPerformanceRow[] = []
    for (const [mechanicId, mech] of mechanicMap) {
      const commission = mech.serviceFees * (mech.commissionPct / 100)
      const grossProfit = mech.totalSales - mech.hpp
      rows.push({
        mechanic_id: mechanicId,
        mechanic_name: mech.name,
        total_sales: mech.totalSales,
        total_transactions: mech.transactions.size,
        total_service_fees: mech.serviceFees,
        hpp_total: mech.hpp,
        gross_profit: grossProfit,
        weekly_salary: mech.weeklySalary,
        service_commission_pct: mech.commissionPct,
        commission,
        total_earnings: mech.weeklySalary + commission,
      })
    }

    rows.sort((a, b) => b.total_sales - a.total_sales)

    return { data: rows, error: null }
  } catch (err) {
    return { data: null, error: err as Error }
  }
}

export async function getWeeklySalarySummary(
  supabase: SupabaseClient,
  dateRange: ReportDateRange,
): Promise<{ data: WeeklySalaryRow[] | null; error: Error | null }> {
  try {
    // 1. Get all active mekanik
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, weekly_salary, service_commission_pct')
      .eq('role', 'mekanik')
      .eq('is_active', true)

    if (profilesError) return { data: null, error: new Error(profilesError.message) }

    // 2. Get all completed sales in range
    const { data: salesData, error: salesError } = await supabase
      .from('sales')
      .select('id, mechanic_id')
      .eq('status', 'completed')
      .gte('sale_date', dateRange.start_date)
      .lte('sale_date', dateRange.end_date)

    if (salesError) return { data: null, error: new Error(salesError.message) }

    const saleIds = (salesData ?? []).map((s) => s.id)
    const saleMechanicMap = new Map<number, string>()
    for (const s of salesData ?? []) {
      saleMechanicMap.set(s.id, s.mechanic_id)
    }

    // 3. Get total service fees per mechanic from sale_details
    const mechanicServiceFees = new Map<string, number>()
    // Initialize all mekanik with 0
    for (const p of profiles ?? []) {
      mechanicServiceFees.set(p.id, 0)
    }

    if (saleIds.length > 0) {
      // Batch in chunks
      const chunks: number[][] = []
      for (let i = 0; i < saleIds.length; i += 300) {
        chunks.push(saleIds.slice(i, i + 300))
      }

      for (const chunk of chunks) {
        const { data: detailChunk, error: detailError } = await supabase
          .from('sale_details')
          .select('sale_id, service_fee')
          .in('sale_id', chunk)

        if (detailError) return { data: null, error: new Error(detailError.message) }

        for (const d of detailChunk ?? []) {
          const mechanicId = saleMechanicMap.get(d.sale_id)
          if (!mechanicId) continue
          const current = mechanicServiceFees.get(mechanicId) ?? 0
          mechanicServiceFees.set(mechanicId, current + Number(d.service_fee))
        }
      }
    }

    // 4. Build result
    const rows: WeeklySalaryRow[] = (profiles ?? []).map((p) => {
      const serviceFees = mechanicServiceFees.get(p.id) ?? 0
      const salary = Number(p.weekly_salary) || 0
      const pct = Number(p.service_commission_pct) || 0
      const commission = serviceFees * (pct / 100)
      return {
        mechanic_id: p.id,
        mechanic_name: p.name,
        weekly_salary: salary,
        total_service_fees: serviceFees,
        service_commission_pct: pct,
        commission,
        total_earnings: salary + commission,
      }
    })

    rows.sort((a, b) => b.total_earnings - a.total_earnings)

    return { data: rows, error: null }
  } catch (err) {
    return { data: null, error: err as Error }
  }
}
