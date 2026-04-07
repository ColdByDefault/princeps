type CustomToggleProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  "aria-label"?: string;
  id?: string;
};

export function CustomToggle({
  checked,
  onCheckedChange,
  disabled = false,
  "aria-label": ariaLabel,
  id,
}: CustomToggleProps) {
  return (
    <label
      className="relative inline-block h-5 w-9 cursor-pointer rounded-full bg-input transition [-webkit-tap-highlight-color:transparent] has-checked:bg-foreground data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-50"
      data-disabled={disabled}
    >
      <input
        id={id}
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        disabled={disabled}
        aria-label={ariaLabel}
        onChange={(e) => onCheckedChange(e.target.checked)}
      />
      <span className="absolute inset-y-0 inset-s-0 m-0.5 size-4 rounded-full bg-background ring-[5px] ring-inset ring-background transition-all peer-checked:inset-s-5 peer-checked:w-1.5 peer-checked:bg-background peer-checked:ring-transparent" />
    </label>
  );
}
