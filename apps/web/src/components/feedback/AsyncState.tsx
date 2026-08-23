type AsyncStateProps = Readonly<{
  isLoading: boolean;
  error: Error | null;
}>;

export function AsyncState({ isLoading, error }: AsyncStateProps) {
  if (isLoading) {
    return <p className="error-message">Loading foundation data...</p>;
  }
  if (error) {
    return (
      <p className="error-message" role="alert">
        {error.message || "The API could not be reached."}
      </p>
    );
  }
  return null;
}
