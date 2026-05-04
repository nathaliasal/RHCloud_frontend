import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { gsap } from 'gsap'
import { AdminLayout } from '@/components/AdminLayout'
import { http } from '@/services/http'
import './Notificaciones.css'

const PAGE_SIZE = 10

function buildPageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1)
  if (current <= 4) return [1, 2, 3, 4, 5, '...', total]
  if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total]
  return [1, '...', current - 1, current, current + 1, '...', total]
}

function getNotifications(params) {
  return http.get('/api/v1/notifications/me', { params }).then((response) => response.data)
}

function getUnreadCount() {
  return http.get('/api/v1/notifications/me/unread-count').then((response) => response.data)
}

function markNotificationAsRead(notificationId) {
  return http.patch(`/api/v1/notifications/${notificationId}/read`, {}).then((response) => response.data)
}

function normalizeError(error) {
  const detail = error?.response?.data?.detail

  if (Array.isArray(detail)) {
    return detail.map(({ msg }) => msg).join(' ')
  }

  if (typeof detail === 'string') {
    return detail
  }

  if (typeof error?.response?.data?.message === 'string') {
    return error.response.data.message
  }

  return 'No fue posible procesar la solicitud.'
}

function formatDateTime(value) {
  if (!value) return 'Sin fecha'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function getEventLabel(eventType) {
  if (!eventType) return 'General'

  return eventType
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function getStatusClass(notification) {
  if (!notification.is_read) return 'noti-badge--warning'
  return 'noti-badge--accent'
}

export default function Notificaciones() {
  const queryClient = useQueryClient()
  const rootRef = useRef(null)
  const [page, setPage] = useState(1)
  const [readFilter, setReadFilter] = useState('todas')
  const [selectedId, setSelectedId] = useState(null)
  const [actionError, setActionError] = useState('')

  const queryParams = useMemo(() => ({
    page,
    page_size: PAGE_SIZE,
    ...(readFilter === 'leidas' && { is_read: true }),
    ...(readFilter === 'no-leidas' && { is_read: false }),
  }), [page, readFilter])

  const { data, isLoading, isError } = useQuery({
    queryKey: ['notificaciones', queryParams],
    queryFn: () => getNotifications(queryParams),
    staleTime: 60 * 1000,
    retry: 1,
    refetchInterval: 30_000,
  })

  const { data: unreadData } = useQuery({
    queryKey: ['notificaciones', 'unread-count'],
    queryFn: getUnreadCount,
    staleTime: 30_000,
    retry: 1,
    refetchInterval: 30_000,
  })

  const markReadMutation = useMutation({
    mutationFn: (notificationId) => markNotificationAsRead(notificationId),
    onSuccess: () => {
      setActionError('')
      queryClient.invalidateQueries({ queryKey: ['notificaciones'] })
    },
    onError: (error) => {
      setActionError(normalizeError(error))
    },
  })

  useEffect(() => {
    if (isLoading) return

    const ctx = gsap.context(() => {
      gsap.from('.noti-header, .noti-summary, .noti-filters, .noti-list-card', {
        opacity: 0,
        y: 14,
        duration: 0.4,
        stagger: 0.08,
        ease: 'power2.out',
      })
    }, rootRef)

    return () => ctx.revert()
  }, [isLoading])

  const items = useMemo(() => data?.items ?? [], [data])
  const total = data?.total ?? 0
  const totalPages = data?.total_pages ?? 1
  const unreadCount = unreadData?.unread_count ?? 0
  const pageNumbers = buildPageNumbers(page, totalPages)

  const summary = useMemo(() => {
    const counts = {
      read: 0,
      unread: 0,
    }

    items.forEach((notification) => {
      if (notification.is_read) {
        counts.read += 1
      } else {
        counts.unread += 1
      }
    })

    return counts
  }, [items])

  const handleReadFilterChange = (event) => {
    setReadFilter(event.target.value)
    setPage(1)
  }

  return (
    <AdminLayout>
      <div className="noti-page" ref={rootRef}>
        <div className="noti-header">
          <nav className="noti-header__breadcrumb">
            <span>PANEL</span>
            <span className="noti-header__sep">/</span>
            <span className="noti-header__crumb-active">NOTIFICACIONES</span>
          </nav>

          <div className="noti-header__row">
            <div>
              <h1 className="noti-header__title">Centro de notificaciones</h1>
              <p className="noti-header__sub">
                Consulte las novedades del sistema, revise el estado de lectura y marque alertas como atendidas.
              </p>
            </div>

            <div className="noti-header__note">
              <span className="noti-header__note-label">Sin leer</span>
              <strong className="noti-header__note-value">{unreadCount}</strong>
            </div>
          </div>
        </div>

        <div className="noti-summary">
          <div className="noti-summary__card">
            <span className="noti-summary__label">Leidas en pagina</span>
            <strong className="noti-summary__value">{summary.read}</strong>
          </div>
          <div className="noti-summary__card">
            <span className="noti-summary__label">Total en pagina</span>
            <strong className="noti-summary__value">{items.length}</strong>
          </div>
          <div className="noti-summary__card">
            <span className="noti-summary__label">Total filtrado</span>
            <strong className="noti-summary__value">{total}</strong>
          </div>
        </div>

        <div className="noti-filters">
          <div className="noti-filters__control">
            <span className="noti-filters__label">LECTURA:</span>
            <select
              className="noti-filters__select"
              value={readFilter}
              onChange={handleReadFilterChange}
            >
              <option value="todas">TODAS</option>
              <option value="no-leidas">NO LEIDAS</option>
              <option value="leidas">LEIDAS</option>
            </select>
          </div>
        </div>

        <div className="noti-list-card">
          <div className="noti-list-card__header">
            <div>
              <h2 className="noti-list-card__title">Bandeja personal</h2>
              <p className="noti-list-card__sub">
                Las notificaciones se actualizan automaticamente y conservan su estado de lectura.
              </p>
            </div>
          </div>

          {actionError && <div className="noti-alert noti-alert--error">{actionError}</div>}

          {isLoading ? (
            <div className="noti-state">
              <div className="noti-spinner" />
              <span>Cargando notificaciones...</span>
            </div>
          ) : isError ? (
            <div className="noti-state noti-state--error">
              No fue posible cargar las notificaciones.
            </div>
          ) : items.length === 0 ? (
            <div className="noti-state">
              No hay notificaciones para el filtro seleccionado.
            </div>
          ) : (
            <div className="noti-list">
              {items.map((notification) => {
                const isSelected = selectedId === notification.id
                const isPending = markReadMutation.isPending && markReadMutation.variables === notification.id

                return (
                  <article
                    key={notification.id}
                    className={`noti-item${notification.is_read ? '' : ' noti-item--unread'}`}
                  >
                    <button
                      type="button"
                      className="noti-item__main"
                      onClick={() => setSelectedId(isSelected ? null : notification.id)}
                    >
                      <div className="noti-item__top">
                        <span className={`noti-badge ${getStatusClass(notification)}`}>
                          {notification.is_read ? 'LEIDA' : 'NUEVA'}
                        </span>
                        <span className="noti-item__event">{getEventLabel(notification.event_type)}</span>
                      </div>

                      <h3 className="noti-item__title">{notification.title}</h3>
                      <p className="noti-item__message">{notification.message}</p>

                      <div className="noti-item__meta">
                        <span>Estado: {notification.status}</span>
                        <span>Creada: {formatDateTime(notification.created_at)}</span>
                      </div>
                    </button>

                    <div className="noti-item__actions">
                      {!notification.is_read && (
                        <button
                          type="button"
                          className="noti-action-btn noti-action-btn--accent"
                          disabled={isPending}
                          onClick={() => markReadMutation.mutate(notification.id)}
                        >
                          {isPending ? 'Procesando' : 'Marcar leida'}
                        </button>
                      )}
                    </div>

                    {isSelected && (
                      <div className="noti-item__detail">
                        <div className="noti-item__detail-grid">
                          <div className="noti-item__detail-card">
                            <span className="noti-item__detail-label">Fecha de lectura</span>
                            <p className="noti-item__detail-text">
                              {notification.read_at ? formatDateTime(notification.read_at) : 'Aun no ha sido leida.'}
                            </p>
                          </div>
                          <div className="noti-item__detail-card">
                            <span className="noti-item__detail-label">Payload</span>
                            <pre className="noti-item__payload">
                              {notification.payload
                                ? JSON.stringify(notification.payload, null, 2)
                                : 'Sin payload asociado.'}
                            </pre>
                          </div>
                        </div>
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          )}

          {!isLoading && !isError && total > 0 && (
            <div className="noti-pagination">
              <span className="noti-pagination__info">
                MOSTRANDO {items.length} DE {total} REGISTROS
              </span>

              <div className="noti-pagination__controls">
                <button
                  type="button"
                  className="noti-pagination__btn"
                  disabled={page === 1}
                  onClick={() => setPage((currentPage) => currentPage - 1)}
                >
                  Anterior
                </button>

                {pageNumbers.map((value, index) =>
                  value === '...'
                    ? (
                      <span key={`ellipsis-${index}`} className="noti-pagination__ellipsis">
                        ...
                      </span>
                    )
                    : (
                      <button
                        key={value}
                        type="button"
                        className={`noti-pagination__btn${value === page ? ' noti-pagination__btn--active' : ''}`}
                        onClick={() => setPage(value)}
                      >
                        {value}
                      </button>
                    )
                )}

                <button
                  type="button"
                  className="noti-pagination__btn"
                  disabled={page >= totalPages}
                  onClick={() => setPage((currentPage) => currentPage + 1)}
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
