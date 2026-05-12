import { useEffect, useLayoutEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ContratoPlantillaStep1, CONTRACT_TYPES } from '@/components/ContratoPlantillaStep1'
import { ContratoPlantillaStep2 } from '@/components/ContratoPlantillaStep2'
import { ContratoPlantillaStep3 } from '@/components/ContratoPlantillaStep3'
import { ContratoPlantillaStep4 } from '@/components/ContratoPlantillaStep4'
import { getContratoPlantilla } from '@/services/contratosPlantillas'

export { CONTRACT_TYPES }

const STEPS = [
  { id: 1, label: 'Generalidades' },
  { id: 2, label: 'Incrementos' },
  { id: 3, label: 'Deducciones' },
  { id: 4, label: 'Horarios' },
]

export function ContratoPlantillaModal({ show, onClose, empresas, cargos, initialContract }) {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [createdContract, setCreatedContract] = useState(null)

  const isEditing = !!initialContract

  // Fetch full contract detail — the list response omits many fields
  const { data: fullContract, isLoading: detailLoading } = useQuery({
    queryKey: ['contrato-plantilla-detail', initialContract?.id],
    queryFn: () => getContratoPlantilla(initialContract.id),
    enabled: !!initialContract?.id && show,
    staleTime: 0,
  })

  useLayoutEffect(() => {
    if (show) {
      setStep(1)
      // Seed with list-level data immediately (contractId available right away)
      setCreatedContract(initialContract ?? null)
    }
  }, [show, initialContract])

  // Replace with the full detail once it arrives so Step 1 gets all fields
  useEffect(() => {
    if (fullContract) setCreatedContract(fullContract)
  }, [fullContract])

  const handleClose = () => {
    onClose()
    if (!isEditing && createdContract) {
      navigate(`/contratos/plantillas/${createdContract.id}`)
    }
  }

  const handleFinish = () => {
    onClose()
  }

  const canGoToStep = (targetStep) =>
    isEditing
      ? targetStep !== step
      : targetStep < step || (!!createdContract && targetStep !== step)

  if (!show) return null

  const loadingStep1 = isEditing && detailLoading

  return (
    <div className="cp-overlay" onClick={handleClose}>
      <div className="cp-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cp-modal__stepper">
          {STEPS.map((s, i) => {
            const isDone   = step > s.id
            const isActive = step === s.id
            const navable  = canGoToStep(s.id)
            return (
              <div key={s.id} className="cp-stepper__item">
                <div
                  className={[
                    'cp-stepper__circle',
                    isActive && 'cp-stepper__circle--active',
                    isDone   && 'cp-stepper__circle--done',
                    navable  && 'cp-stepper__circle--nav',
                  ].filter(Boolean).join(' ')}
                  onClick={() => navable && setStep(s.id)}
                >
                  {isDone ? '✓' : s.id}
                </div>
                <span className={`cp-stepper__label${isActive ? ' cp-stepper__label--active' : ''}`}>
                  {s.label}
                </span>
                {i < STEPS.length - 1 && (
                  <div className={`cp-stepper__line${isDone ? ' cp-stepper__line--done' : ''}`} />
                )}
              </div>
            )
          })}
        </div>

        {step === 1 && (
          loadingStep1 ? (
            <>
              <div className="cp-modal__body">
                <div className="cp-state" style={{ padding: '4rem 0' }}>
                  <div className="cp-spinner" />
                  <span>Cargando contrato...</span>
                </div>
              </div>
              <div className="cp-modal__footer">
                <button type="button" className="cp-modal__btn cp-modal__btn--cancel" onClick={handleClose}>
                  Cancelar
                </button>
              </div>
            </>
          ) : (
            <ContratoPlantillaStep1
              empresas={empresas}
              cargos={cargos}
              existingContract={createdContract}
              onSuccess={(contract) => { setCreatedContract(contract); setStep(2) }}
              onCancel={handleClose}
            />
          )
        )}
        {step === 2 && (
          <ContratoPlantillaStep2
            contractId={createdContract?.id}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
            onFinish={handleFinish}
          />
        )}
        {step === 3 && (
          <ContratoPlantillaStep3
            contractId={createdContract?.id}
            onBack={() => setStep(2)}
            onNext={() => setStep(4)}
            onFinish={handleFinish}
          />
        )}
        {step === 4 && (
          <ContratoPlantillaStep4
            contractId={createdContract?.id}
            onBack={() => setStep(3)}
            onFinish={handleFinish}
          />
        )}
      </div>
    </div>
  )
}
