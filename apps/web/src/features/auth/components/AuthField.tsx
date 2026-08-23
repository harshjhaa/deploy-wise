type AuthFieldProps = Readonly<{
  id: string;
  label: string;
  type?: "text" | "email" | "password";
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
}>;

export function AuthField({
  id,
  label,
  type = "text",
  value,
  onChange,
  autoComplete,
}: AuthFieldProps) {
  return (
    <label className="auth-field" htmlFor={id}>
      <span>{label}</span>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        required
      />
    </label>
  );
}
