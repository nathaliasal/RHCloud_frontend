import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { gsap } from 'gsap'
import { AdminLayout } from '@/components/AdminLayout'
import { getEmpresa } from '@/services/empresas'
import { getTerminos, deleteTermino, toggleActivacionTermino } from '@/services/terminos'
import { EmpresaEditModal } from '@/components/EmpresaEditModal'
import { TermEditModal } from '@/components/TermEditModal'
import './EmpresaDetalle.css'

const TERMS_PAGE_SIZE = 10

function normalizeLogoUrl(url) {
  if (!url) return null
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `https://${url}`
}

function buildPageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 4) return [1, 2, 3, 4, 5, '...', total]
  if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total]
  return [1, '...', current - 1, current, current + 1, '...', total]
}

function InfoCard({ icon, label, value }) {
  return (
    <div className="ed-info-card">
      <span className="ed-info-card__icon">{icon}</span>
      <span className="ed-info-card__label">{label}</span>
      <span className="ed-info-card__value">{value || '—'}</span>
    </div>
  )
}

export default function EmpresaDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const rootRef = useRef(null)
  const [termsPage, setTermsPage] = useState(1)
  const [editingEmpresa, setEditingEmpresa] = useState(false)
  const [addingTerm, setAddingTerm] = useState(false)
  const [editingTerm, setEditingTerm] = useState(null)
  const [deletingTermId, setDeletingTermId] = useState(null)
  const [termActionError, setTermActionError] = useState(null)

  const { data: empresa, isLoading, isError } = useQuery({
    queryKey: ['empresas', id],
    queryFn: () => getEmpresa(id),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  const { data: termsData, isLoading: termsLoading } = useQuery({
    queryKey: ['terminos', { company_id: id, page: termsPage }],
    queryFn: () => getTerminos({ company_id: id, page: termsPage, page_size: TERMS_PAGE_SIZE }),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    enabled: !!id,
  })

  const terms = termsData?.items ?? []
  const termsTotal = termsData?.total ?? 0
  const termsTotalPages = termsData?.total_pages ?? 1
  const pageNumbers = buildPageNumbers(termsPage, termsTotalPages)

  const toggleMutation = useMutation({
    mutationFn: ({ termId, is_active }) => toggleActivacionTermino(termId, is_active),
    onSuccess: () => {
      setTermActionError(null)
      queryClient.invalidateQueries({ queryKey: ['terminos'] })
    },
    onError: (err) => {
      const detail = err.response?.data?.detail
      const msg = Array.isArray(detail)
        ? detail.map(d => d.msg).join(' ')
        : (err.response?.data?.message ?? 'Error al cambiar el estado del término.')
      setTermActionError(msg)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (termId) => deleteTermino(termId),
    onSuccess: () => {
      setDeletingTermId(null)
      setTermActionError(null)
      queryClient.invalidateQueries({ queryKey: ['terminos'] })
    },
    onError: (err) => {
      setDeletingTermId(null)
      const detail = err.response?.data?.detail
      const msg = Array.isArray(detail)
        ? detail.map(d => d.msg).join(' ')
        : (err.response?.data?.message ?? 'Error al eliminar el término.')
      setTermActionError(msg)
    },
  })

  useEffect(() => {
    if (isLoading) return
    const ctx = gsap.context(() => {
      gsap.from('.ed-hero, .ed-info-grid, .ed-description, .ed-terms-card', {
        opacity: 0, y: 14, duration: 0.4, stagger: 0.08, ease: 'power2.out',
      })
    }, rootRef)
    return () => ctx.revert()
  }, [isLoading])

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="ed-state">
          <div className="ed-spinner" />
          <span>Cargando empresa...</span>
        </div>
      </AdminLayout>
    )
  }

  if (isError || !empresa) {
    return (
      <AdminLayout>
        <div className="ed-state ed-state--error">
          No se pudo cargar la información de la empresa.
        </div>
      </AdminLayout>
    )
  }

  const logoSrc = normalizeLogoUrl(empresa.logo_url)
  const tid = [empresa.document_type, empresa.document_number].filter(Boolean).join('-') || '—'
  const initials = empresa.name
    ? empresa.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
    : '?'

  return (
    <AdminLayout>
      <div className="ed-page" ref={rootRef}>

        {/* ── Breadcrumb ── */}
        <nav className="ed-breadcrumb">
          <button className="ed-breadcrumb__back" onClick={() => navigate('/empresas')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <span className="ed-breadcrumb__item" onClick={() => navigate('/empresas')}>PANEL</span>
          <span className="ed-breadcrumb__sep">›</span>
          <span className="ed-breadcrumb__item" onClick={() => navigate('/empresas')}>GESTIÓN DE EMPRESAS</span>
          <span className="ed-breadcrumb__sep">›</span>
          <span className="ed-breadcrumb__current">{empresa.name}</span>
        </nav>

        {/* ── Hero ── */}
        <div className="ed-hero">
          <div className="ed-hero__logo-wrap">
            {logoSrc ? (
              <img
                src={logoSrc}
                alt={empresa.name}
                className="ed-hero__logo-img"
                onError={e => { e.currentTarget.style.display = 'none' }}
              />
            ) : (
              <div className="ed-hero__logo-fallback">{initials}</div>
            )}
          </div>
          <div className="ed-hero__info">
            <div className="ed-hero__name-row">
              <h1 className="ed-hero__name">{empresa.name}</h1>
              <span className={`ed-badge ${empresa.is_active ? 'ed-badge--success' : 'ed-badge--error'}`}>
                {empresa.is_active ? 'ACTIVA' : 'INACTIVA'}
              </span>
            </div>
            {empresa.responsible_user && (
              <p className="ed-hero__responsible">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                {empresa.responsible_user}
              </p>
            )}
          </div>
          <div className="ed-hero__actions">
            <button className="ed-hero__edit-btn" onClick={() => setEditingEmpresa(true)}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Editar
            </button>
          </div>
        </div>

        {/* ── Info grid ── */}
        <div className="ed-info-grid">
          <InfoCard
            label="Identidad Fiscal"
            value={tid}
            icon={
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
            }
          />
          <InfoCard
            label="Email"
            value={empresa.email}
            icon={
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            }
          />
          <InfoCard
            label="Teléfono"
            value={empresa.phone}
            icon={
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.65 3.22 2 2 0 0 1 3.62 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.55a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            }
          />
          <InfoCard
            label="Dirección"
            value={empresa.address}
            icon={
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            }
          />
        </div>

        {/* ── Description ── */}
        {empresa.description && (
          <div className="ed-description">
            <h2 className="ed-section-title">Descripción</h2>
            <p className="ed-description__text">{empresa.description}</p>
          </div>
        )}

        {/* ── Terms ── */}
        <div className="ed-terms-card">
          <div className="ed-terms-card__header">
            <h2 className="ed-section-title">Términos y Condiciones</h2>
            <div className="ed-terms-card__header-right">
              {termsTotal > 0 && (
                <span className="ed-terms-card__count">{termsTotal} término{termsTotal !== 1 ? 's' : ''}</span>
              )}
              <button className="ed-terms-add-btn" onClick={() => setAddingTerm(true)}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Agregar
              </button>
            </div>
          </div>

          {termActionError && (
            <p className="ed-terms-error">{termActionError}</p>
          )}

          {termsLoading ? (
            <div className="ed-state ed-state--inline">
              <div className="ed-spinner ed-spinner--sm" />
              <span>Cargando términos...</span>
            </div>
          ) : terms.length === 0 ? (
            <p className="ed-terms-empty">Esta empresa no tiene términos registrados.</p>
          ) : (
            <>
              <div className="ed-terms-list">
                {terms.map(term => (
                  <div key={term.id} className="ed-term">
                    <div className="ed-term__top">
                      <div className="ed-term__title-wrap">
                        <h3 className="ed-term__title">{term.title}</h3>
                      </div>
                      <div className="ed-term__actions">
                        <span className={`ed-term__badge ${term.is_active ? 'ed-term__badge--active' : 'ed-term__badge--inactive'}`}>
                          {term.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                        <button
                          className="ed-term__icon-btn ed-term__icon-btn--edit"
                          onClick={() => setEditingTerm(term)}
                          title="Editar término"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          className="ed-term__icon-btn ed-term__icon-btn--toggle"
                          onClick={() => toggleMutation.mutate({ termId: term.id, is_active: !term.is_active })}
                          disabled={toggleMutation.isPending && toggleMutation.variables?.termId === term.id}
                          title={term.is_active ? 'Desactivar término' : 'Activar término'}
                        >
                          {term.is_active ? (
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                              <line x1="1" y1="1" x2="23" y2="23" />
                            </svg>
                          ) : (
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          )}
                        </button>
                        {deletingTermId === term.id ? (
                          <>
                            <button
                              className="ed-term__icon-btn ed-term__icon-btn--confirm"
                              onClick={() => deleteMutation.mutate(term.id)}
                              disabled={deleteMutation.isPending}
                              title="Confirmar eliminación"
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </button>
                            <button
                              className="ed-term__icon-btn"
                              onClick={() => setDeletingTermId(null)}
                              title="Cancelar"
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                            </button>
                          </>
                        ) : (
                          <button
                            className="ed-term__icon-btn ed-term__icon-btn--danger"
                            onClick={() => setDeletingTermId(term.id)}
                            title="Eliminar término"
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                              <path d="M10 11v6M14 11v6" />
                              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="ed-term__desc">{term.description}</p>
                  </div>
                ))}
              </div>

              {termsTotalPages > 1 && (
                <div className="ed-pagination">
                  <span className="ed-pagination__info">
                    MOSTRANDO {terms.length} DE {termsTotal} TÉRMINOS
                  </span>
                  <div className="ed-pagination__controls">
                    <button
                      className="ed-pagination__btn"
                      disabled={termsPage === 1}
                      onClick={() => setTermsPage(p => p - 1)}
                    >‹</button>
                    {pageNumbers.map((n, i) =>
                      n === '...'
                        ? <span key={`e${i}`} className="ed-pagination__ellipsis">…</span>
                        : (
                          <button
                            key={n}
                            className={`ed-pagination__btn${n === termsPage ? ' ed-pagination__btn--active' : ''}`}
                            onClick={() => setTermsPage(n)}
                          >{n}</button>
                        )
                    )}
                    <button
                      className="ed-pagination__btn"
                      disabled={termsPage >= termsTotalPages}
                      onClick={() => setTermsPage(p => p + 1)}
                    >›</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

      </div>

      {editingEmpresa && (
        <EmpresaEditModal empresa={empresa} onClose={() => setEditingEmpresa(false)} />
      )}
      {addingTerm && (
        <TermEditModal companyId={id} onClose={() => setAddingTerm(false)} />
      )}
      {editingTerm && (
        <TermEditModal term={editingTerm} companyId={id} onClose={() => setEditingTerm(null)} />
      )}
    </AdminLayout>
  )
}
