import React from 'react';

function UserPortal({
  siteData,
  userSession,
  userProfile,
  setUserProfile,
  userFeedback,
  handleProfileSave,
  handleUserLogout,
}) {
  const user = userSession.user || {};

  return (
    <main className="client-shell">
      <section className="client-hero">
        <div>
          <p className="section-tag">Client Portal</p>
          <h1>Welcome back, {user.name || 'MTI client'}</h1>
          <p>
            Keep your contact details updated, start a new consultation, and reach the MTI team from one focused workspace.
          </p>
        </div>
        <div className="client-hero-card">
          <span>Signed in as</span>
          <strong>{user.email}</strong>
          <button className="secondary-action" type="button" onClick={handleUserLogout}>
            Logout
          </button>
        </div>
      </section>

      <section className="client-grid">
        <article className="admin-card client-profile-card">
          <div className="admin-panel-head">
            <div>
              <p className="section-tag">Profile</p>
              <h3>Contact information</h3>
            </div>
            {userFeedback.profile ? <span className="admin-feedback">{userFeedback.profile}</span> : null}
          </div>
          <form className="admin-form-grid" onSubmit={handleProfileSave}>
            <label className="admin-field">
              <span>Name</span>
              <input
                value={userProfile.name}
                onChange={(event) => setUserProfile((current) => ({ ...current, name: event.target.value }))}
              />
            </label>
            <label className="admin-field">
              <span>Phone</span>
              <input
                value={userProfile.phone}
                onChange={(event) => setUserProfile((current) => ({ ...current, phone: event.target.value }))}
              />
            </label>
            <div className="admin-actions">
              <button className="primary-action" type="submit">
                Save profile
              </button>
            </div>
          </form>
        </article>

        <article className="admin-card client-card">
          <p className="section-tag">Next Step</p>
          <h3>Book a consultation</h3>
          <p>Share your project details with the studio and we will confirm timing, scope, and material direction.</p>
          <a className="primary-action" href="#consultation">
            Start booking
          </a>
        </article>

        <article className="admin-card client-card">
          <p className="section-tag">Support</p>
          <h3>Talk to MTI</h3>
          <p>{siteData.contact.address}</p>
          <div className="contact-list">
            <a href={`tel:+92${siteData.contact.primaryPhone.replace(/\D/g, '')}`}>{siteData.contact.primaryPhone}</a>
            <a href={siteData.contact.whatsapp} rel="noreferrer" target="_blank">
              WhatsApp conversation
            </a>
          </div>
        </article>
      </section>
    </main>
  );
}

export default UserPortal;
