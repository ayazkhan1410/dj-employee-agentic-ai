import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getOrder, patchOrder } from '../api'
import AppLayout from '../components/AppLayout'
import { getStatusMeta } from '../components/StatusBadge'
import StatusSelect from '../components/StatusSelect'

export default function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null')
    } catch {
      return null
    }
  }, [])

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) navigate('/login')
  }, [user, navigate])

  useEffect(() => {
    if (!user || !id) return

    let active = true
    setLoading(true)
    getOrder(id)
      .then((data) => {
        if (active) setOrder(data)
      })
      .catch((err) => {
        if (active) setError(err.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [user, id])

  if (!user) return null

  function logout() {
    localStorage.removeItem('access')
    localStorage.removeItem('refresh')
    localStorage.removeItem('user')
    navigate('/login')
  }

  async function handleStatusChange(nextStatus) {
    try {
      const updated = await patchOrder(id, { status: nextStatus })
      setOrder(updated)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <AppLayout
      user={user}
      onLogout={logout}
      orderChatId={id}
      title="Order"
      accent={`#${id}`}
      sub={order ? `$${order.total_amount} · ${getStatusMeta(order.status).label}` : ''}
    >
      <section className="page">
        <div className="detail-top">
          <Link to="/orders">Orders</Link>
        </div>

        {loading ? <p className="muted">Loading…</p> : null}
        {error ? <p className="auth-error">{error}</p> : null}

        {order ? (
          <>
            <dl className="facts">
              <dt>Change status</dt>
              <dd>
                <StatusSelect value={order.status} onChange={handleStatusChange} />
              </dd>
              <dt>Carrier</dt>
              <dd>{order.carrier_display || '—'}</dd>
              <dt>Tracking</dt>
              <dd className="mono">{order.tracking_number || '—'}</dd>
              <dt>Phone</dt>
              <dd>{order.customer_phone || '—'}</dd>
              <dt>Placed</dt>
              <dd>{new Date(order.created_at).toLocaleString()}</dd>
              <dt>Ship to</dt>
              <dd>{order.shipping_address || '—'}</dd>
            </dl>

            <div className="section-head">
              <h2>Items</h2>
            </div>
            {order.items?.length ? (
              <table className="table">
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.product_name || `Product #${item.product}`}</td>
                      <td className="num">× {item.quantity}</td>
                      <td className="num">${item.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="muted">No line items on this order.</p>
            )}
          </>
        ) : null}
      </section>
    </AppLayout>
  )
}
