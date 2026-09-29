import "./ProfilePage.scss";
import { useAuthStore } from "../../store/authStore";

export function ProfilePage() {
  const user = useAuthStore((state) => state.user);

  return (
    <main className="profile-page">
      <p className="eyebrow">Profile</p>
      <h1>Your workspace profile</h1>
      <p className="profile-copy">Your account information.</p>

      <section className="profile-card" aria-label="Account information">
        <div className="profile-field">
          <span className="profile-label">Name</span>
          <span className="profile-value">{user?.name || "Not provided"}</span>
        </div>
        <div className="profile-field">
          <span className="profile-label">Email address</span>
          <span className="profile-value">{user?.email || "Not available"}</span>
        </div>
      </section>
    </main>
  );
}
