import { AppShell } from "./components/layout/AppShell";
import { FoundationPage } from "./features/foundation/FoundationPage";
import { ProfilePage } from "./features/profile/ProfilePage";
import { Route, Routes } from "react-router-dom";

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<FoundationPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
    </AppShell>
  );
}
