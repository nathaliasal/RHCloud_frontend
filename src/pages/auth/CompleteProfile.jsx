import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useQuery, useMutation } from '@tanstack/react-query'
import { gsap } from 'gsap'
import { getDocumentTypes, getGenders, createPerson } from '@/services/personas'
import { useAuthStore } from '@/stores/auth'
import './CompleteProfile.css'

export default function CompleteProfile() {
  const navigate  = useNavigate()
  const { user, setUser } = useAuthStore()
  const cardRef   = useRef(null)

  const { data: docTypesData } = useQuery({
    queryKey: ['document-types'],
    queryFn: getDocumentTypes,
  })
  const { data: gendersData } = useQuery({
    queryKey: ['genders'],
    queryFn: getGenders,
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: { birth_date: new Date().toISOString().split('T')[0] },
  })

  useEffect(() => {
    gsap.fromTo(
      cardRef.current,
      { opacity: 0, y: 32 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' },
    )
  }, [])

  const mutation = useMutation({
    mutationFn: createPerson,
    onSuccess: (data) => {
      setUser({ ...user, is_verified: true, id_employee: data.id })
      navigate('/dashboard', { replace: true })
    },
  })

  const onSubmit = (data) => mutation.mutate(data)

  const documentTypes = docTypesData?.document_types ?? []
  const genders       = gendersData?.genders ?? []

  return (
    <div className="cp-bg">
      <div className="cp-bg__orb cp-bg__orb--1" />
      <div className="cp-bg__orb cp-bg__orb--2" />

      <div className="cp-card" ref={cardRef}>
        <header className="cp-card__header">
          <div className="cp-badge">Paso requerido</div>
          <h2 className="cp-title">Completa tu perfil</h2>
          <p className="cp-subtitle">
            Necesitamos algunos datos personales antes de continuar.
          </p>
        </header>

        {mutation.isError && (
          <div className="cp-alert" role="alert">
            <span>⚠</span>{' '}
            {(() => {
              const detail = mutation.error?.response?.data?.detail
              if (Array.isArray(detail)) return detail.map((d) => d.msg).join('. ')
              if (typeof detail === 'string') return detail
              return 'Ocurrió un error. Verifica los datos e inténtalo de nuevo.'
            })()}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="cp-form">
          <div className="cp-row">
            <div className="cp-field">
              <label className="cp-label" htmlFor="first_name">Nombre(s)</label>
              <input
                id="first_name"
                className={`cp-input ${errors.first_name ? 'cp-input--error' : ''}`}
                placeholder="Ana María"
                {...register('first_name', { required: 'Requerido' })}
              />
              {errors.first_name && <span className="cp-error">{errors.first_name.message}</span>}
            </div>
            <div className="cp-field">
              <label className="cp-label" htmlFor="last_name">Apellido(s)</label>
              <input
                id="last_name"
                className={`cp-input ${errors.last_name ? 'cp-input--error' : ''}`}
                placeholder="Gómez Torres"
                {...register('last_name', { required: 'Requerido' })}
              />
              {errors.last_name && <span className="cp-error">{errors.last_name.message}</span>}
            </div>
          </div>

          <div className="cp-row">
            <div className="cp-field">
              <label className="cp-label" htmlFor="document_type">Tipo de documento</label>
              <select
                id="document_type"
                className={`cp-select ${errors.document_type ? 'cp-input--error' : ''}`}
                {...register('document_type', { required: 'Requerido' })}
              >
                <option value="">Seleccionar…</option>
                {documentTypes.map((t) => (
                  <option key={t.value} value={t.value}>{t.name}</option>
                ))}
              </select>
              {errors.document_type && <span className="cp-error">{errors.document_type.message}</span>}
            </div>
            <div className="cp-field">
              <label className="cp-label" htmlFor="document_number">Número de documento</label>
              <input
                id="document_number"
                className={`cp-input ${errors.document_number ? 'cp-input--error' : ''}`}
                placeholder="1234567890"
                {...register('document_number', { required: 'Requerido' })}
              />
              {errors.document_number && <span className="cp-error">{errors.document_number.message}</span>}
            </div>
          </div>

          <div className="cp-row">
            <div className="cp-field">
              <label className="cp-label" htmlFor="birth_date">Fecha de nacimiento</label>
              <input
                id="birth_date"
                type="date"
                className={`cp-input ${errors.birth_date ? 'cp-input--error' : ''}`}
                {...register('birth_date', { required: 'Requerido' })}
              />
              {errors.birth_date && <span className="cp-error">{errors.birth_date.message}</span>}
            </div>
            <div className="cp-field">
              <label className="cp-label" htmlFor="gender">Género</label>
              <select
                id="gender"
                className={`cp-select ${errors.gender ? 'cp-input--error' : ''}`}
                {...register('gender', { required: 'Requerido' })}
              >
                <option value="">Seleccionar…</option>
                {genders.map((g) => (
                  <option key={g.value} value={g.value}>{g.name}</option>
                ))}
              </select>
              {errors.gender && <span className="cp-error">{errors.gender.message}</span>}
            </div>
          </div>

          <div className="cp-row">
            <div className="cp-field">
              <label className="cp-label" htmlFor="code_department">Código departamento</label>
              <input
                id="code_department"
                className={`cp-input ${errors.code_department ? 'cp-input--error' : ''}`}
                placeholder="05"
                {...register('code_department', { required: 'Requerido' })}
              />
              {errors.code_department && <span className="cp-error">{errors.code_department.message}</span>}
            </div>
            <div className="cp-field">
              <label className="cp-label" htmlFor="code_city">Código ciudad</label>
              <input
                id="code_city"
                className={`cp-input ${errors.code_city ? 'cp-input--error' : ''}`}
                placeholder="05001"
                {...register('code_city', { required: 'Requerido' })}
              />
              {errors.code_city && <span className="cp-error">{errors.code_city.message}</span>}
            </div>
          </div>

          <div className="cp-row">
            <div className="cp-field">
              <label className="cp-label" htmlFor="phone">Teléfono</label>
              <input
                id="phone"
                type="tel"
                className={`cp-input ${errors.phone ? 'cp-input--error' : ''}`}
                placeholder="+57 300 0000000"
                {...register('phone', { required: 'Requerido' })}
              />
              {errors.phone && <span className="cp-error">{errors.phone.message}</span>}
            </div>
            <div className="cp-field">
              <label className="cp-label" htmlFor="address">Dirección</label>
              <input
                id="address"
                className={`cp-input ${errors.address ? 'cp-input--error' : ''}`}
                placeholder="Calle 10 # 5-20"
                {...register('address', { required: 'Requerido' })}
              />
              {errors.address && <span className="cp-error">{errors.address.message}</span>}
            </div>
          </div>

          <button type="submit" className="cp-btn" disabled={mutation.isPending}>
            {mutation.isPending ? (
              <span className="cp-spinner" />
            ) : (
              <>
                Guardar y continuar
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
