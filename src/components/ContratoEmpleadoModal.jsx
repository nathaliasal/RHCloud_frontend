import { useLayoutEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ContratoEmpleadoStep1 } from '@/components/ContratoEmpleadoStep1'
import { ContratoEmpleadoStep2 } from '@/components/ContratoEmpleadoStep2'
import { ContratoEmpleadoStep3 } from '@/components/ContratoEmpleadoStep3'
import { ContratoEmpleadoStep4 } from '@/components/ContratoEmpleadoStep4'
import '@/pages/admin/ContratosPlantillas.css'

const STEPS = [
  { id: 1, label: 'Generalidades' },
  { id: 2, label: 'Incrementos' },
  { id: 3, label: 'Deducciones' },
  { id: 4, label: 'Horarios' },
]

export function ContratoEmpleadoModal({ show, onClose, employee, initialTemplate, existingContract }) {
  const queryClient = useQueryClient()
  const [step, setStep] = useState(1)
  const [activeContract, setActiveContract] = useState(null)

  useLayoutEffect(() => {
    if (show) {
      setStep(1)
      setActiveContract(existingContract ?? null)
    }
  }, [show, existingContract])

  if (!show) return null

  const isEditing = !!existingContract

  const canGoToStep = (targetStep) =>
    targetStep < step || (!!activeContract && targetStep !== step)

  const handleStep1Success = (contract) => {
    setActiveContract(contract)
    setStep(2)
  }

  const handleFinish = () => {
    queryClient.invalidateQueries({ queryKey: ['empleado-contratos', employee.id] })
    onClose()
  }

  return (
    <div className="cp-overlay" style={{ zIndex: 150 }} onClick={onClose}>
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
          <ContratoEmpleadoStep1
            employee={employee}
            initialTemplate={isEditing ? null : initialTemplate}
            existingContract={activeContract}
            onSuccess={handleStep1Success}
            onCancel={onClose}
          />
        )}
        {step === 2 && (
          <ContratoEmpleadoStep2
            contractId={activeContract?.id}
            templateId={isEditing ? null : initialTemplate?.id}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
            onFinish={handleFinish}
          />
        )}
        {step === 3 && (
          <ContratoEmpleadoStep3
            contractId={activeContract?.id}
            templateId={isEditing ? null : initialTemplate?.id}
            onBack={() => setStep(2)}
            onNext={() => setStep(4)}
            onFinish={handleFinish}
          />
        )}
        {step === 4 && (
          <ContratoEmpleadoStep4
            contractId={activeContract?.id}
            templateId={isEditing ? null : initialTemplate?.id}
            onBack={() => setStep(3)}
            onFinish={handleFinish}
          />
        )}
      </div>
    </div>
  )
}
