import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createOrder, deleteOrder, listOrders, patchOrder } from '../api'
import AppLayout from '../components/AppLayout'
import StatusBadge from '../components/StatusBadge'
import StatusSelect from '../components/StatusSelect'

const STATUS_OPTIONS = [
  'pending',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
]

const CARRIER_OPTIONS = ['dhl', 'ups', 'fedex', 'usps', 'other']

const EMPTY_FORM = {
  carrier: 'dhl',
  tracking_number: '',
  shipping_address: '',
  customer_phone: '',
  total_amount: '',
  status: 'pending',
}

export default function Orders() {
  const navigate = useNavigate()
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null')
    } catch {
      return null
    }
  }, [])

  const [orders, setOrders] = useState([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(5)
  const [status, setStatus] = useState('')
  const [carrier, setCarrier] = useState('')
  const [search, setSearch] = useState('')
  const [ordering, setOrdering] = useState('-created_at')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) navigate('/login')
  }, [user, navigate])

  const loadOrders = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await listOrders({
        page,
        page_size: pageSize,
        status,
        carrier,
        search,
        ordering,
      })
      setOrders(data.results || [])
      setCount(data.count || 0)
    } catch (err) {
      setError(err.message)
      setOrders([])
      setCount(0)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, status, carrier, search, ordering])

  useEffect(() => {
    if (user) loadOrders()
  }, [user, loadOrders])

  if (!user) return null

  const totalPages = Math.max(1, Math.ceil(count / pageSize))

  function logout() {
    localStorage.removeItem('access')
    localStorage.removeItem('refresh')
    localStorage.removeItem('user')
    navigate('/login')
  }

  async function handleCreate(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await createOrder({
        ...form,
        total_amount: form.total_amount,
      })
      setForm(EMPTY_FORM)
      setPage(1)
      await loadOrders()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleStatusChange(orderId, nextStatus) {
    try {
      await patchOrder(orderId, { status: nextStatus })
      await loadOrders()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDelete(orderId) {
    if (!window.confirm('Delete this order?')) return
    try {
      await deleteOrder(orderId)
      await loadOrders()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <AppLayout user={user} onLogout={logout}>
      <section className="orders-panel">
        <div className="glass-card orders-hero">
          <div>
            <p className="eyebrow">Workspace</p>
            <h1>Your Orders</h1>
            <p className="home-sub">Filter, sort, and manage orders for your account.</p>
          </div>
          <div className="orders-count">{count} total</div>
        </div>

        <form className="glass-card orders-filters" onSubmit={(e) => {
          e.preventDefault()
          setPage(1)
          loadOrders()
        }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tracking, address, phone"
          />
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
          <select value={carrier} onChange={(e) => { setCarrier(e.target.value); setPage(1) }}>
            <option value="">All carriers</option>
            {CARRIER_OPTIONS.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
          <select value={ordering} onChange={(e) => setOrdering(e.target.value)}>
            <option value="-created_at">Newest</option>
            <option value="created_at">Oldest</option>
            <option value="-total_amount">Amount high → low</option>
            <option value="total_amount">Amount low → high</option>
            <option value="status">Status A → Z</option>
          </select>
          <button type="submit" className="btn-space">Apply</button>
        </form>

        <form className="glass-card order-create" onSubmit={handleCreate}>
          <h2>Create order</h2>
          <div className="order-create-grid">
            <select
              value={form.carrier}
              onChange={(e) => setForm({ ...form, carrier: e.target.value })}
            >
              {CARRIER_OPTIONS.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
            <input
              value={form.tracking_number}
              onChange={(e) => setForm({ ...form, tracking_number: e.target.value })}
              placeholder="Tracking number"
            />
            <input
              value={form.customer_phone}
              onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
              placeholder="Phone"
            />
            <input
              value={form.total_amount}
              onChange={(e) => setForm({ ...form, total_amount: e.target.value })}
              placeholder="Total amount"
              required
            />
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              {STATUS_OPTIONS.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
            <input
              value={form.shipping_address}
              onChange={(e) => setForm({ ...form, shipping_address: e.target.value })}
              placeholder="Shipping address"
            />
          </div>
          <button type="submit" className="btn-space" disabled={saving}>
            {saving ? 'Saving…' : 'Create order'}
          </button>
        </form>

        {error ? <p className="auth-error">{error}</p> : null}
        {loading ? <p className="home-sub">Loading orders…</p> : null}

        <div className="task-list">
          {orders.map((order) => (
            <article key={order.id} className="glass-card task-card order-row">
              <div>
                <div className="order-title-row">
                  <h3>
                    <Link to={`/orders/${order.id}`}>
                      Order #{order.id}
                    </Link>
                    {' · '}${order.total_amount}
                  </h3>
                  <StatusBadge status={order.status} />
                </div>
                <p>
                  {order.carrier_display || 'No carrier'} · {order.tracking_number || 'No tracking'}
                </p>
                <p>{order.shipping_address || 'No address'}</p>
                <small>{new Date(order.created_at).toLocaleString()}</small>
              </div>
              <div className="order-actions">
                <StatusSelect
                  value={order.status}
                  onChange={(next) => handleStatusChange(order.id, next)}
                />
                <Link to={`/orders/${order.id}`} className="ghost-btn">
                  Details
                </Link>
                <button type="button" className="ghost-btn" onClick={() => handleDelete(order.id)}>
                  Delete
                </button>
              </div>
            </article>
          ))}
          {!loading && orders.length === 0 ? (
            <div className="glass-card task-card">
              <p>No orders found for your filters.</p>
            </div>
          ) : null}
        </div>

        <div className="orders-pagination">
          <button
            type="button"
            className="ghost-btn"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span>
            Page {page} / {totalPages}
          </span>
          <button
            type="button"
            className="ghost-btn"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      </section>
    </AppLayout>
  )
}
