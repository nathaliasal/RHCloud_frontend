import { useEffect, useMemo, useRef } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { gsap } from 'gsap'
import { AdminLayout } from '@/components/AdminLayout'
import { getMe } from '@/services/auth'
import { getDocumentTypes, getGenders } from '@/services/personas'
import { http } from '@/services/http'
import { useAuthStore } from '@/stores/auth'
import './MiPerfil.css'

function getMyProfile() {
  return http.get('/api/v1/persons/me/profile').then((response) => response.data)
}

function updateMyProfile(body) {
  return http.put('/api/v1/persons/me/profile', body).then((response) => response.data)
}

function updatePassword(body) {
  return http.patch('/api/v1/users/password', body).then((response) => response.data)
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

function buildProfilePayload(values) {
  return {
    first_name: values.first_name.trim() || null,
    last_name: values.last_name.trim() || null,
    email: values.email.trim() || null,
    birth_date: values.birth_date || null,
    gender: values.gender || null,
    code_department: values.code_department.trim() || null,
    code_city: values.code_city.trim() || null,
    phone: values.phone.trim() || null,
    address: values.address.trim() || null,
  }
}

function formatDate(value) {
  if (!value) return 'Sin fecha'

  const date = new Date(`${value}T00:00:00`)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export default function MiPerfil() {
  const queryClient = useQueryClient()
  const rootRef = useRef(null)
  const { user, setUser } = useAuthStore()

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    reset: resetProfile,
    setError: setProfileError,
    formState: { errors: profileErrors },
  } = useForm({
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      birth_date: '',
      gender: '',
      code_department: '',
      code_city: '',
      phone: '',
      address: '',
    },
  })

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    setError: setPasswordError,
    control: passwordControl,
    formState: { errors: passwordErrors },
  } = useForm({
    defaultValues: {
      old_password: '',
      password: '',
      password_confirm: '',
    },
  })

  const newPasswordValue = useWatch({
    control: passwordControl,
    name: 'password',
  })

  const { data: meData } = useQuery({
    queryKey: ['mi-perfil', 'me'],
    queryFn: getMe,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  const { data: profileData, isLoading, isError } = useQuery({
    queryKey: ['mi-perfil', 'profile'],
    queryFn: getMyProfile,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  const { data: docTypesData } = useQuery({
    queryKey: ['mi-perfil', 'document-types'],
    queryFn: getDocumentTypes,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  const { data: gendersData } = useQuery({
    queryKey: ['mi-perfil', 'genders'],
    queryFn: getGenders,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  const profileMutation = useMutation({
    mutationFn: (values) => updateMyProfile(buildProfilePayload(values)),
    onSuccess: (updatedProfile) => {
      const full_name = `${updatedProfile.first_name ?? ''} ${updatedProfile.last_name ?? ''}`.trim()
      setUser({
        ...user,
        email: updatedProfile.email ?? user?.email,
        full_name: full_name || user?.full_name,
      })
      queryClient.invalidateQueries({ queryKey: ['mi-perfil', 'profile'] })
      queryClient.invalidateQueries({ queryKey: ['mi-perfil', 'me'] })
    },
    onError: (error) => {
      const detail = error?.response?.data?.detail

      if (Array.isArray(detail)) {
        detail.forEach(({ loc, msg }) => {
          const field = loc[loc.length - 1]
          if (typeof field === 'string') {
            setProfileError(field, { message: msg })
          }
        })
      }
    },
  })

  const passwordMutation = useMutation({
    mutationFn: updatePassword,
    onSuccess: () => {
      resetPassword()
    },
    onError: (error) => {
      const detail = error?.response?.data?.detail

      if (Array.isArray(detail)) {
        detail.forEach(({ loc, msg }) => {
          const field = loc[loc.length - 1]
          if (typeof field === 'string') {
            setPasswordError(field, { message: msg })
          }
        })
      }
    },
  })

  useEffect(() => {
    if (!profileData) return

    resetProfile({
      first_name: profileData.first_name ?? '',
      last_name: profileData.last_name ?? '',
      email: profileData.email ?? '',
      birth_date: profileData.birth_date ?? '',
      gender: profileData.gender ?? '',
      code_department: profileData.code_department ?? '',
      code_city: profileData.code_city ?? '',
      phone: profileData.phone ?? '',
      address: profileData.address ?? '',
    })
  }, [profileData, resetProfile])

  useEffect(() => {
    if (isLoading) return

    const ctx = gsap.context(() => {
      gsap.from('.profile-header, .profile-summary, .profile-grid', {
        opacity: 0,
        y: 14,
        duration: 0.4,
        stagger: 0.08,
        ease: 'power2.out',
      })
    }, rootRef)

    return () => ctx.revert()
  }, [isLoading])

  const documentTypes = useMemo(() => docTypesData?.document_types ?? [], [docTypesData])
  const genders = gendersData?.genders ?? []

  const documentTypeLabel = useMemo(() => {
    const current = documentTypes.find((item) => item.value === profileData?.document_type)
    return current?.name ?? profileData?.document_type ?? 'No registrado'
  }, [documentTypes, profileData?.document_type])

  const roleLabel = meData?.role ?? user?.role ?? 'Sin rol'

  return (
    <AdminLayout>
      <div className="profile-page" ref={rootRef}>
        <div className="profile-header">
          <nav className="profile-header__breadcrumb">
            <span>PANEL</span>
            <span className="profile-header__sep">/</span>
            <span className="profile-header__crumb-active">MI PERFIL</span>
          </nav>

          <div className="profile-header__row">
            <div>
              <h1 className="profile-header__title">Mi perfil</h1>
              <p className="profile-header__sub">
                Administre su informacion personal y actualice las credenciales de acceso del sistema.
              </p>
            </div>

            <div className="profile-header__note">
              <span className="profile-header__note-label">Rol</span>
              <strong className="profile-header__note-value">{roleLabel}</strong>
            </div>
          </div>
        </div>

        <div className="profile-summary">
          <div className="profile-summary__card">
            <span className="profile-summary__label">Nombre completo</span>
            <strong className="profile-summary__value">
              {profileData ? `${profileData.first_name} ${profileData.last_name}` : 'Cargando'}
            </strong>
          </div>
          <div className="profile-summary__card">
            <span className="profile-summary__label">Correo</span>
            <strong className="profile-summary__value profile-summary__value--small">
              {profileData?.email ?? meData?.email ?? 'Sin correo'}
            </strong>
          </div>
          <div className="profile-summary__card">
            <span className="profile-summary__label">Documento</span>
            <strong className="profile-summary__value profile-summary__value--small">
              {profileData?.document_number ?? 'No registrado'}
            </strong>
          </div>
          <div className="profile-summary__card">
            <span className="profile-summary__label">Estado</span>
            <strong className="profile-summary__value">
              {profileData?.is_active ? 'ACTIVO' : 'INACTIVO'}
            </strong>
          </div>
        </div>

        {isLoading ? (
          <div className="profile-state">
            <div className="profile-spinner" />
            <span>Cargando perfil...</span>
          </div>
        ) : isError ? (
          <div className="profile-state profile-state--error">
            No fue posible cargar la informacion del perfil.
          </div>
        ) : (
          <div className="profile-grid">
            <section className="profile-card">
              <div className="profile-card__header">
                <div>
                  <h2 className="profile-card__title">Informacion personal</h2>
                  <p className="profile-card__sub">
                    Actualice los datos visibles en su cuenta administrativa.
                  </p>
                </div>
              </div>

              {profileMutation.isError && !Array.isArray(profileMutation.error?.response?.data?.detail) && (
                <div className="profile-alert profile-alert--error">
                  {normalizeError(profileMutation.error)}
                </div>
              )}

              {profileMutation.isSuccess && (
                <div className="profile-alert profile-alert--success">
                  La informacion del perfil fue actualizada correctamente.
                </div>
              )}

              <form className="profile-form" onSubmit={handleProfileSubmit((values) => profileMutation.mutate(values))}>
                <div className="profile-form__grid">
                  <div className="profile-field">
                    <label className="profile-field__label" htmlFor="first_name">Nombre</label>
                    <input
                      id="first_name"
                      className={`profile-field__input${profileErrors.first_name ? ' profile-field__input--error' : ''}`}
                      {...registerProfile('first_name', { required: 'El nombre es obligatorio.' })}
                    />
                    {profileErrors.first_name && <span className="profile-field__error">{profileErrors.first_name.message}</span>}
                  </div>

                  <div className="profile-field">
                    <label className="profile-field__label" htmlFor="last_name">Apellido</label>
                    <input
                      id="last_name"
                      className={`profile-field__input${profileErrors.last_name ? ' profile-field__input--error' : ''}`}
                      {...registerProfile('last_name', { required: 'El apellido es obligatorio.' })}
                    />
                    {profileErrors.last_name && <span className="profile-field__error">{profileErrors.last_name.message}</span>}
                  </div>

                  <div className="profile-field">
                    <label className="profile-field__label" htmlFor="email">Correo</label>
                    <input
                      id="email"
                      type="email"
                      className={`profile-field__input${profileErrors.email ? ' profile-field__input--error' : ''}`}
                      {...registerProfile('email', {
                        required: 'El correo es obligatorio.',
                        pattern: {
                          value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                          message: 'Correo invalido.',
                        },
                      })}
                    />
                    {profileErrors.email && <span className="profile-field__error">{profileErrors.email.message}</span>}
                  </div>

                  <div className="profile-field">
                    <label className="profile-field__label" htmlFor="birth_date">Fecha de nacimiento</label>
                    <input
                      id="birth_date"
                      type="date"
                      className={`profile-field__input${profileErrors.birth_date ? ' profile-field__input--error' : ''}`}
                      {...registerProfile('birth_date')}
                    />
                    {profileErrors.birth_date && <span className="profile-field__error">{profileErrors.birth_date.message}</span>}
                  </div>

                  <div className="profile-field">
                    <label className="profile-field__label" htmlFor="gender">Genero</label>
                    <select
                      id="gender"
                      className={`profile-field__input${profileErrors.gender ? ' profile-field__input--error' : ''}`}
                      {...registerProfile('gender')}
                    >
                      <option value="">Seleccionar</option>
                      {genders.map((gender) => (
                        <option key={gender.value} value={gender.value}>{gender.name}</option>
                      ))}
                    </select>
                    {profileErrors.gender && <span className="profile-field__error">{profileErrors.gender.message}</span>}
                  </div>

                  <div className="profile-field">
                    <label className="profile-field__label" htmlFor="phone">Telefono</label>
                    <input
                      id="phone"
                      className={`profile-field__input${profileErrors.phone ? ' profile-field__input--error' : ''}`}
                      {...registerProfile('phone')}
                    />
                    {profileErrors.phone && <span className="profile-field__error">{profileErrors.phone.message}</span>}
                  </div>

                  <div className="profile-field">
                    <label className="profile-field__label" htmlFor="code_department">Codigo departamento</label>
                    <input
                      id="code_department"
                      className={`profile-field__input${profileErrors.code_department ? ' profile-field__input--error' : ''}`}
                      {...registerProfile('code_department')}
                    />
                    {profileErrors.code_department && <span className="profile-field__error">{profileErrors.code_department.message}</span>}
                  </div>

                  <div className="profile-field">
                    <label className="profile-field__label" htmlFor="code_city">Codigo ciudad</label>
                    <input
                      id="code_city"
                      className={`profile-field__input${profileErrors.code_city ? ' profile-field__input--error' : ''}`}
                      {...registerProfile('code_city')}
                    />
                    {profileErrors.code_city && <span className="profile-field__error">{profileErrors.code_city.message}</span>}
                  </div>

                  <div className="profile-field profile-field--full">
                    <label className="profile-field__label" htmlFor="address">Direccion</label>
                    <input
                      id="address"
                      className={`profile-field__input${profileErrors.address ? ' profile-field__input--error' : ''}`}
                      {...registerProfile('address')}
                    />
                    {profileErrors.address && <span className="profile-field__error">{profileErrors.address.message}</span>}
                  </div>
                </div>

                <div className="profile-form__actions">
                  <button type="submit" className="profile-btn profile-btn--primary" disabled={profileMutation.isPending}>
                    {profileMutation.isPending ? 'Guardando' : 'Guardar cambios'}
                  </button>
                </div>
              </form>
            </section>

            <aside className="profile-side">
              <section className="profile-card">
                <div className="profile-card__header">
                  <div>
                    <h2 className="profile-card__title">Datos de identidad</h2>
                    <p className="profile-card__sub">
                      Campos informativos de la persona autenticada.
                    </p>
                  </div>
                </div>

                <div className="profile-info-list">
                  <div className="profile-info-list__item">
                    <span className="profile-info-list__label">Tipo de documento</span>
                    <span className="profile-info-list__value">{documentTypeLabel}</span>
                  </div>
                  <div className="profile-info-list__item">
                    <span className="profile-info-list__label">Numero de documento</span>
                    <span className="profile-info-list__value">{profileData?.document_number ?? 'No registrado'}</span>
                  </div>
                  <div className="profile-info-list__item">
                    <span className="profile-info-list__label">Fecha de nacimiento</span>
                    <span className="profile-info-list__value">{formatDate(profileData?.birth_date)}</span>
                  </div>
                  <div className="profile-info-list__item">
                    <span className="profile-info-list__label">Rol actual</span>
                    <span className="profile-info-list__value">{roleLabel}</span>
                  </div>
                </div>
              </section>

              <section className="profile-card">
                <div className="profile-card__header">
                  <div>
                    <h2 className="profile-card__title">Seguridad</h2>
                    <p className="profile-card__sub">
                      Actualice la contrasena de acceso de su usuario.
                    </p>
                  </div>
                </div>

                {passwordMutation.isError && !Array.isArray(passwordMutation.error?.response?.data?.detail) && (
                  <div className="profile-alert profile-alert--error">
                    {normalizeError(passwordMutation.error)}
                  </div>
                )}

                {passwordMutation.isSuccess && (
                  <div className="profile-alert profile-alert--success">
                    La contrasena fue actualizada correctamente.
                  </div>
                )}

                <form className="profile-form" onSubmit={handlePasswordSubmit((values) => passwordMutation.mutate(values))}>
                  <div className="profile-form__stack">
                    <div className="profile-field">
                      <label className="profile-field__label" htmlFor="old_password">Contrasena actual</label>
                      <input
                        id="old_password"
                        type="password"
                        className={`profile-field__input${passwordErrors.old_password ? ' profile-field__input--error' : ''}`}
                        {...registerPassword('old_password', { required: 'La contrasena actual es obligatoria.' })}
                      />
                      {passwordErrors.old_password && <span className="profile-field__error">{passwordErrors.old_password.message}</span>}
                    </div>

                    <div className="profile-field">
                      <label className="profile-field__label" htmlFor="password">Nueva contrasena</label>
                      <input
                        id="password"
                        type="password"
                        className={`profile-field__input${passwordErrors.password ? ' profile-field__input--error' : ''}`}
                        {...registerPassword('password', {
                          required: 'La nueva contrasena es obligatoria.',
                          minLength: {
                            value: 8,
                            message: 'La nueva contrasena debe tener al menos 8 caracteres.',
                          },
                        })}
                      />
                      {passwordErrors.password && <span className="profile-field__error">{passwordErrors.password.message}</span>}
                    </div>

                    <div className="profile-field">
                      <label className="profile-field__label" htmlFor="password_confirm">Confirmar contrasena</label>
                      <input
                        id="password_confirm"
                        type="password"
                        className={`profile-field__input${passwordErrors.password_confirm ? ' profile-field__input--error' : ''}`}
                        {...registerPassword('password_confirm', {
                          required: 'La confirmacion es obligatoria.',
                          validate: (value) =>
                            value === newPasswordValue || 'Las contrasenas no coinciden.',
                        })}
                      />
                      {passwordErrors.password_confirm && <span className="profile-field__error">{passwordErrors.password_confirm.message}</span>}
                    </div>
                  </div>

                  <div className="profile-form__actions">
                    <button type="submit" className="profile-btn profile-btn--primary" disabled={passwordMutation.isPending}>
                      {passwordMutation.isPending ? 'Actualizando' : 'Actualizar contrasena'}
                    </button>
                  </div>
                </form>
              </section>
            </aside>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
