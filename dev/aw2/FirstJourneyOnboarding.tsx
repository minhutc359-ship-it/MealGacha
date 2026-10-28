import { useEffect, useRef, useState, type KeyboardEvent } from "react"
import {
  AW2_ONBOARDING_STEPS,
  onboardingStepFromKey,
} from "../../src/aw2/ui/onboarding"

interface Props {
  busy: boolean
  production?: boolean
  onStart: () => void
}

export function FirstJourneyOnboarding({ busy, production, onStart }: Props) {
  const [index, setIndex] = useState(0)
  const heading = useRef<HTMLHeadingElement>(null)
  const step = AW2_ONBOARDING_STEPS[index]
  const last = index === AW2_ONBOARDING_STEPS.length - 1

  useEffect(() => {
    heading.current?.focus({ preventScroll: true })
  }, [index])

  function handleKey(event: KeyboardEvent<HTMLElement>) {
    const nativeControl =
      event.target instanceof Element &&
      !!event.target.closest(
        "input, textarea, select, [contenteditable='true']",
      )
    const next = onboardingStepFromKey(index, event.key, nativeControl)
    if (next === index) return
    event.preventDefault()
    setIndex(next)
  }

  return (
    <section
      className="aw2-first-journey"
      aria-labelledby="aw2-onboarding-title"
      onKeyDown={handleKey}
    >
      <p className="aw2-onboarding-progress" role="status" aria-live="polite">
        Bước {index + 1}/{AW2_ONBOARDING_STEPS.length}
      </p>
      <h2 id="aw2-onboarding-title" ref={heading} tabIndex={-1}>
        {step.title}
      </h2>
      <p>{step.body}</p>
      <div className="aw2-onboarding-actions">
        <button
          type="button"
          disabled={busy || index === 0}
          onClick={() => setIndex((value) => Math.max(0, value - 1))}
        >
          Quay lại
        </button>
        {last ? (
          <button type="button" disabled={busy} onClick={onStart}>
            {production ? "Bắt đầu hành trình" : "Tạo bản lưu AW2"}
          </button>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              setIndex((value) =>
                Math.min(AW2_ONBOARDING_STEPS.length - 1, value + 1),
              )
            }
          >
            Tiếp tục
          </button>
        )}
      </div>
      {!last && (
        <button
          type="button"
          className="aw2-onboarding-skip"
          disabled={busy}
          onClick={onStart}
        >
          Bỏ qua hướng dẫn và bắt đầu
        </button>
      )}
    </section>
  )
}
