import {
  DEFAULT_AW2_UI_PREFERENCES,
  type Aw2UiPreferences,
} from "../../src/aw2/ui/preferences"

type ToggleKey = keyof Omit<Aw2UiPreferences, "version">

interface Props {
  preferences: Aw2UiPreferences
  announcement: string
  onChange: (patch: Partial<Omit<Aw2UiPreferences, "version">>) => void
  onReset: () => void
}

const CONTROLS: ReadonlyArray<{
  key: ToggleKey
  label: string
  detail: string
}> = [
  {
    key: "largeText",
    label: "Chữ lớn",
    detail: "Tăng cỡ chữ giao diện và cho phép panel cuộn khi cần.",
  },
  {
    key: "highContrast",
    label: "Tương phản cao",
    detail: "Tăng độ tách nền, viền, trạng thái chọn và focus.",
  },
  {
    key: "reducedMotion",
    label: "Giảm chuyển động",
    detail: "Dừng animation không cần thiết ngoài lựa chọn của hệ điều hành.",
  },
  {
    key: "largeTouchTargets",
    label: "Nút chạm lớn",
    detail: "Nâng các nút điều khiển chính từ 44–48px lên tối thiểu 52px.",
  },
]

export function GameAccessibilityPanel({
  preferences,
  announcement,
  onChange,
  onReset,
}: Props) {
  const isDefault = CONTROLS.every(
    ({ key }) => preferences[key] === DEFAULT_AW2_UI_PREFERENCES[key],
  )
  return (
    <section
      className="aw2-accessibility-settings"
      aria-labelledby="aw2-accessibility-heading"
    >
      <h3 id="aw2-accessibility-heading">Hiển thị và điều khiển</h3>
      <p>Phím nhanh: J nhiệm vụ · I túi · P đội · M bản đồ · H hướng dẫn.</p>
      <div className="aw2-accessibility-options">
        {CONTROLS.map((control) => {
          const active = preferences[control.key]
          return (
            <div key={control.key}>
              <button
                type="button"
                aria-pressed={active}
                aria-describedby={`aw2-setting-${control.key}`}
                onClick={() => onChange({ [control.key]: !active })}
              >
                {control.label}: {active ? "Bật" : "Tắt"}
              </button>
              <small id={`aw2-setting-${control.key}`}>{control.detail}</small>
            </div>
          )
        })}
      </div>
      <button type="button" disabled={isDefault} onClick={onReset}>
        Dùng mặc định hệ thống
      </button>
      <p role="status" aria-live="polite" className="aw2-setting-status">
        {announcement}
      </p>
    </section>
  )
}
