import { CalendarClock, Eye, X } from "lucide-react";
import type { ReactNode } from "react";

import type { FormAccessSettings, WhoCanFillValue } from "../../hooks/useFormAccessSettings";
import { formatRelativeTime } from "../../lib/formatRelativeTime";
import { LOCAL_TIMEZONE } from "../../lib/responseWindow";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { SpecificPeopleField } from "./SpecificPeopleField";

type CheckboxFieldProps = {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
};

type RadioOptionProps = {
  value: string;
  title: string;
  description?: string;
  children?: ReactNode;
};

type SettingsSectionProps = {
  icon: ReactNode;
  title: string;
  children: ReactNode;
};

export type FormSettingsPanelProps = {
  settings: FormAccessSettings;
  onUpdateSettings: (partial: Partial<FormAccessSettings>) => void;
  onClose: () => void;
};

const dividerClass = "h-px w-full bg-[#e8eaf1]";

function SettingsSection({ icon, title, children }: SettingsSectionProps) {
  return (
    <section className="mt-7">
      <div className="mb-5 flex items-center gap-2.5 text-[#3f4045]">
        {icon}
        <h3 className="m-0 text-[16px] font-bold tracking-[0.16px] text-[#3f4045]">
          {title}
        </h3>
      </div>
      {children}
    </section>
  );
}

function RadioOption({
  value,
  title,
  description,
  children,
}: RadioOptionProps) {
  return (
    <label className="block cursor-pointer">
      <div className="flex items-start gap-2.5">
        <RadioGroupItem value={value} />
        <div className="min-w-0 flex-1">
          <span className="block text-[14px] leading-5 font-medium tracking-[0.14px] text-[#3f4045]">
            {title}
          </span>
          {description ? (
            <span className="mt-1 block text-[12px] leading-4 tracking-[0.12px] text-[#8b8e98]">
              {description}
            </span>
          ) : null}
          {children}
        </div>
      </div>
    </label>
  );
}

function CheckboxField({
  label,
  checked,
  onCheckedChange,
  disabled = false,
}: CheckboxFieldProps) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-[14px] leading-5 font-medium tracking-[0.14px] text-[#3f4045] data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-60">
      <Checkbox
        checked={checked}
        disabled={disabled}
        onCheckedChange={(value) => onCheckedChange(value === true)}
      />
      <span>{label}</span>
    </label>
  );
}

/** `datetime-local` inputs read/write a floating (no-timezone) local string — convert via the Date's local getters, not `toISOString()`, or the displayed time shifts by the viewer's UTC offset. */
function toDatetimeLocalValue(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromDatetimeLocalValue(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function DateCheckboxField({
  label,
  value,
  onChange,
  seed,
  error,
}: {
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
  /** Timestamp used when the box is first ticked (event handler, so `Date.now()` here is fine). */
  seed: () => string;
  error?: string;
}) {
  const checked = value !== null;

  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex cursor-pointer items-center gap-2.5 text-[14px] leading-5 font-medium tracking-[0.14px] text-[#3f4045]">
        <Checkbox
          checked={checked}
          onCheckedChange={(next) => onChange(next === true ? seed() : null)}
        />
        <span>{label}</span>
      </label>
      {checked ? (
        <>
          <input
            className={cn(
              "ml-7.5 h-9.5 rounded-[5px] border bg-[#f8f9fc] px-3 text-[14px] text-[#3f4045] outline-none",
              error ? "border-[#e0507a]" : "border-[#e8eaf1] focus:border-[#1e55c5]",
            )}
            aria-label={label}
            onChange={(event) => onChange(fromDatetimeLocalValue(event.target.value))}
            type="datetime-local"
            value={toDatetimeLocalValue(value)}
          />
          {value ? (
            <span className="ml-7.5 text-[11px] leading-4 text-[#8b8e98]">{formatRelativeTime(value)}</span>
          ) : null}
          {error ? (
            <span className="ml-7.5 text-[11px] leading-4 text-[#e0507a]">{error}</span>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function FormSettingsPanel({
  settings,
  onUpdateSettings,
  onClose,
}: FormSettingsPanelProps) {
  const scheduleError =
    settings.startDate &&
    settings.endDate &&
    Date.parse(settings.endDate) <= Date.parse(settings.startDate)
      ? "End date must be after the start date."
      : undefined;

  return (
    <aside
      className="min-h-[822px] w-full max-w-[380px] rounded-[10px] bg-white px-7.5 pt-7.5 pb-9 max-[1200px]:max-w-[978px] max-[760px]:min-h-0 max-[560px]:px-5"
      aria-label="Create form settings"
    >
      <div className="mb-7 flex items-center justify-between gap-4">
        <h2 className="m-0 text-[24px] leading-8 font-semibold tracking-[0.24px] text-[#050608]">
          Setting
        </h2>
        <Button
          className="text-[#3f4045]"
          aria-label="Close settings"
          onClick={onClose}
          size="icon"
          variant="ghost"
        >
          <X className="size-5.5" />
        </Button>
      </div>

      <div className={dividerClass} />

      <SettingsSection
        icon={<Eye size={24} strokeWidth={2.2} />}
        title="Who can fill this form"
      >
        <RadioGroup
          onValueChange={(value) =>
            onUpdateSettings({ whoCanFill: value as WhoCanFillValue })
          }
          value={settings.whoCanFill}
          aria-label="Who can fill this form"
        >
          <RadioOption value="anyone" title="Anyone can respond">
            {settings.whoCanFill === "anyone" ? (
              <div className="mt-3 flex flex-col gap-3">
                <CheckboxField
                  checked={settings.anyoneOneResponsePerPerson}
                  label="One response per person"
                  onCheckedChange={(checked) =>
                    onUpdateSettings({ anyoneOneResponsePerPerson: checked })
                  }
                />
              </div>
            ) : null}
          </RadioOption>

          <RadioOption
            value="organization"
            title="Only people in my organization can respond"
            description="Sign-in required to validate access with organization"
          >
            {settings.whoCanFill === "organization" ? (
              <div className="mt-3 flex flex-col gap-3">
                <CheckboxField
                  checked={settings.organizationRecordName}
                  label="Record name"
                  onCheckedChange={(checked) =>
                    onUpdateSettings({ organizationRecordName: checked })
                  }
                />
                <CheckboxField
                  checked={settings.organizationOneResponsePerPerson}
                  label="One response per person"
                  onCheckedChange={(checked) =>
                    onUpdateSettings({
                      organizationOneResponsePerPerson: checked,
                    })
                  }
                />
              </div>
            ) : null}
          </RadioOption>

          <RadioOption
            value="specific"
            title="Specific people in my organization can respond"
          >
            {settings.whoCanFill === "specific" ? (
              <div className="mt-3 flex flex-col gap-3">
                <CheckboxField
                  checked={settings.specificRecordName}
                  label="Record name"
                  onCheckedChange={(checked) =>
                    onUpdateSettings({ specificRecordName: checked })
                  }
                />
                <CheckboxField
                  checked={settings.specificOneResponsePerPerson}
                  label="One response per person"
                  onCheckedChange={(checked) =>
                    onUpdateSettings({
                      specificOneResponsePerPerson: checked,
                    })
                  }
                />
                <SpecificPeopleField
                  emails={settings.specificEmails}
                  onChange={(emails) =>
                    onUpdateSettings({ specificEmails: emails })
                  }
                />
              </div>
            ) : null}
          </RadioOption>
        </RadioGroup>
      </SettingsSection>

      <div className={cn(dividerClass, "my-7")} />

      <SettingsSection
        icon={<CalendarClock size={24} strokeWidth={2.2} />}
        title="Response window"
      >
        <div className="flex flex-col gap-3">
          <p className="m-0 text-[12px] leading-4 tracking-[0.12px] text-[#8b8e98]">
            Optional. With neither set, the form accepts responses until you pause it. Times are in
            your timezone{LOCAL_TIMEZONE ? ` (${LOCAL_TIMEZONE})` : ""}.
          </p>
          <DateCheckboxField
            label="Start date"
            onChange={(value) => onUpdateSettings({ startDate: value })}
            seed={() => new Date().toISOString()}
            value={settings.startDate}
          />
          <DateCheckboxField
            error={scheduleError}
            label="End date"
            onChange={(value) => onUpdateSettings({ endDate: value })}
            seed={() =>
              new Date(
                (settings.startDate ? Date.parse(settings.startDate) : Date.now()) + 7 * DAY_MS,
              ).toISOString()
            }
            value={settings.endDate}
          />
        </div>
      </SettingsSection>
    </aside>
  );
}
