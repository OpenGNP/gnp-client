import { Check, Circle, Eye, FormInput, X } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { Checkbox as RadixCheckbox, RadioGroup } from "radix-ui";

import { cn } from "../../lib/utils";

type CheckboxFieldProps = {
  label: string;
  defaultChecked?: boolean;
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
        <RadioGroup.Item
          className="mt-0.75 inline-flex size-5 shrink-0 items-center justify-center rounded-full border border-[#b0b1b3] bg-white text-[#1e55c5] outline-none data-[state=checked]:border-[#1e55c5] focus-visible:ring-2 focus-visible:ring-[#1e55c5]/30"
          value={value}
        >
          <RadioGroup.Indicator>
            <Circle className="fill-current" size={10} strokeWidth={0} />
          </RadioGroup.Indicator>
        </RadioGroup.Item>
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
  defaultChecked = false,
  disabled = false,
}: CheckboxFieldProps) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-[14px] leading-5 font-medium tracking-[0.14px] text-[#3f4045] data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-60">
      <RadixCheckbox.Root
        className="inline-flex size-5 shrink-0 items-center justify-center rounded-[3px] border border-[#b0b1b3] bg-white text-white outline-none data-[state=checked]:border-[#1e55c5] data-[state=checked]:bg-[#1e55c5] focus-visible:ring-2 focus-visible:ring-[#1e55c5]/30"
        defaultChecked={defaultChecked}
        disabled={disabled}
      >
        <RadixCheckbox.Indicator>
          <Check size={14} strokeWidth={3} />
        </RadixCheckbox.Indicator>
      </RadixCheckbox.Root>
      <span>{label}</span>
    </label>
  );
}

function DateCheckboxField({ label }: { label: string }) {
  const [checked, setChecked] = useState(false);
  const [dateValue, setDateValue] = useState("");

  return (
    <div className="flex flex-col gap-2">
      <label className="flex cursor-pointer items-center gap-2.5 text-[14px] leading-5 font-medium tracking-[0.14px] text-[#3f4045]">
        <RadixCheckbox.Root
          checked={checked}
          className="inline-flex size-5 shrink-0 items-center justify-center rounded-[3px] border border-[#b0b1b3] bg-white text-white outline-none data-[state=checked]:border-[#1e55c5] data-[state=checked]:bg-[#1e55c5] focus-visible:ring-2 focus-visible:ring-[#1e55c5]/30"
          onCheckedChange={(value) => setChecked(value === true)}
        >
          <RadixCheckbox.Indicator>
            <Check size={14} strokeWidth={3} />
          </RadixCheckbox.Indicator>
        </RadixCheckbox.Root>
        <span>{label}</span>
      </label>
      {checked ? (
        <input
          className="ml-7.5 h-9.5 rounded-[5px] border border-[#e8eaf1] bg-[#f8f9fc] px-3 text-[14px] text-[#3f4045] outline-none focus:border-[#1e55c5]"
          aria-label={label}
          onChange={(event) => setDateValue(event.target.value)}
          type="datetime-local"
          value={dateValue}
        />
      ) : null}
    </div>
  );
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function SpecificPeopleField() {
  const [emails, setEmails] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState("");

  const addEmail = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) {
      return;
    }
    if (!EMAIL_PATTERN.test(trimmed)) {
      setError("Enter a valid email address");
      return;
    }
    if (emails.includes(trimmed)) {
      setError("This person has already been added");
      return;
    }
    setEmails((previous) => [...previous, trimmed]);
    setInputValue("");
    setError("");
  };

  const removeEmail = (email: string) => {
    setEmails((previous) => previous.filter((existing) => existing !== email));
  };

  return (
    <div className="mt-3 flex flex-col gap-2.5">
      <div className="flex items-center gap-2">
        <input
          className="h-9.5 min-w-0 flex-1 rounded-[5px] border border-[#e8eaf1] bg-[#f8f9fc] px-3 text-[14px] text-[#3f4045] outline-none placeholder:text-[#b0b1b3] focus:border-[#1e55c5]"
          onChange={(event) => {
            setInputValue(event.target.value);
            if (error) {
              setError("");
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === ",") {
              event.preventDefault();
              addEmail();
            }
          }}
          placeholder="Enter email"
          type="email"
          value={inputValue}
        />
        <button
          className="inline-flex h-9.5 shrink-0 cursor-pointer items-center justify-center rounded-[5px] border border-[#1e55c5] px-3.5 text-[14px] font-medium text-[#1e55c5] transition-colors hover:bg-[#eef3ff] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!inputValue.trim()}
          onClick={addEmail}
          type="button"
        >
          Add
        </button>
      </div>

      {error ? <span className="text-[12px] text-[#e0507a]">{error}</span> : null}

      {emails.length > 0 ? (
        <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
          {emails.map((email) => (
            <li
              className="inline-flex items-center gap-1.5 rounded-full bg-[#eef3ff] py-1 pr-1.5 pl-3 text-[12px] font-medium text-[#1e55c5]"
              key={email}
            >
              <span className="max-w-[220px] truncate">{email}</span>
              <button
                className="inline-flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-[#1e55c5] hover:bg-[#d9e6fb] focus-visible:ring-2 focus-visible:ring-[#1e55c5]/40 focus-visible:outline-none"
                aria-label={`Remove ${email}`}
                onClick={() => removeEmail(email)}
                type="button"
              >
                <X size={12} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <span className="text-[12px] text-[#8b8e98]">
          No one added yet — enter an email and select Add.
        </span>
      )}
    </div>
  );
}

export function FormSettingsPanel({ onClose }: FormSettingsPanelProps) {
  const [whoCanFill, setWhoCanFill] = useState("organization");

  return (
    <aside
      className="min-h-[822px] w-full max-w-[380px] rounded-[10px] bg-white px-7.5 pt-7.5 pb-9 max-[1200px]:max-w-[978px] max-[760px]:min-h-0 max-[560px]:px-5"
      aria-label="Create form settings"
    >
      <div className="mb-7 flex items-center justify-between gap-4">
        <h2 className="m-0 text-[24px] leading-8 font-semibold tracking-[0.24px] text-[#050608]">
          Setting
        </h2>
        <button
          className="inline-flex size-8 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent text-[#3f4045] hover:bg-[#f7f8fb] focus-visible:ring-2 focus-visible:ring-[#1e55c5]/40 focus-visible:outline-none"
          aria-label="Close settings"
          onClick={onClose}
          type="button"
        >
          <X size={22} />
        </button>
      </div>

      <div className={dividerClass} />

      <SettingsSection
        icon={<Eye size={24} strokeWidth={2.2} />}
        title="Who can fill this form"
      >
        <RadioGroup.Root
          className="flex flex-col gap-5"
          onValueChange={setWhoCanFill}
          value={whoCanFill}
          aria-label="Who can fill this form"
        >
          <RadioOption value="anyone" title="Anyone can respond">
            {whoCanFill === "anyone" ? (
              <div className="mt-3 flex flex-col gap-3">
                <CheckboxField label="One response per person" />
              </div>
            ) : null}
          </RadioOption>

          <RadioOption
            value="organization"
            title="Only people in my organization can respond"
            description="Sign-in required to validate access with organization"
          >
            {whoCanFill === "organization" ? (
              <div className="mt-3 flex flex-col gap-3">
                <CheckboxField label="Record name" defaultChecked />
                <CheckboxField label="One response per person" />
              </div>
            ) : null}
          </RadioOption>

          <RadioOption
            value="specific"
            title="Specific people in my organization can respond"
          >
            {whoCanFill === "specific" ? (
              <div className="mt-3 flex flex-col gap-3">
                <CheckboxField label="Record name" defaultChecked />
                <CheckboxField label="One response per person" />
                <SpecificPeopleField />
              </div>
            ) : null}
          </RadioOption>
        </RadioGroup.Root>
      </SettingsSection>

      <div className={cn(dividerClass, "my-7")} />

      <SettingsSection
        icon={<FormInput size={24} strokeWidth={2.2} />}
        title="Option for responses"
      >
        <div className="flex flex-col gap-3">
          <DateCheckboxField label="Start date" />
          <DateCheckboxField label="End date" />
        </div>
      </SettingsSection>
    </aside>
  );
}
