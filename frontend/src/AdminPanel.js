import React from 'react';
import { adminTabs, collectionConfigs } from './adminConfig';
import { CollectionEditor, FieldControl } from './adminComponents';

function renderSimpleManager({
  adminData,
  adminFeedback,
  adminTab,
  manageableFieldMap,
  updateSimpleRecord,
  saveSimpleRecord,
  deleteSimpleRecord,
  simpleEndpointMap,
}) {
  return (
    <section className="admin-panel-block">
      <div className="admin-panel-head">
        <div>
          <p className="section-tag">{adminTabs.find((tab) => tab.id === adminTab)?.label}</p>
          <h3>Manage records dynamically</h3>
        </div>
        {adminFeedback[adminTab] ? <span className="admin-feedback">{adminFeedback[adminTab]}</span> : null}
      </div>

      <div className="resource-list">
        {adminData[adminTab].map((item) => (
          <article className="admin-card resource-item" key={item.id}>
            <div className="admin-form-grid">
              {manageableFieldMap[adminTab].map((field) => (
                <FieldControl
                  field={field}
                  key={field.key}
                  value={item[field.key]}
                  onChange={(value) => updateSimpleRecord(adminTab, item.id, field.key, value)}
                />
              ))}
            </div>
            <div className="admin-actions">
              <button className="primary-action" type="button" onClick={() => saveSimpleRecord(adminTab, simpleEndpointMap[adminTab], item)}>
                Save
              </button>
              {adminTab !== 'bookings' ? (
                <button className="secondary-action" type="button" onClick={() => deleteSimpleRecord(adminTab, simpleEndpointMap[adminTab], item.id)}>
                  Delete
                </button>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function AdminPanel(props) {
  const {
    adminSession,
    adminAuth,
    setAdminAuth,
    adminTab,
    setAdminTab,
    adminData,
    adminDrafts,
    adminFeedback,
    adminLoading,
    handleAdminLogin,
    handleAdminLogout,
    handlePasswordChange,
    setDraftValue,
    updateCollectionItem,
    createCollectionItem,
    saveCollectionItem,
    deleteCollectionItem,
    updateSimpleRecord,
    saveSimpleRecord,
    deleteSimpleRecord,
    saveContent,
    saveSettings,
    createBackup,
    exportReport,
    setAdminData,
    setViewMode,
  } = props;

  const manageableFieldMap = {
    bookings: [
      { key: 'name', label: 'Client' },
      { key: 'phone', label: 'Phone' },
      { key: 'email', label: 'Email' },
      { key: 'consultationType', label: 'Consultation' },
      { key: 'date', label: 'Date' },
      { key: 'time', label: 'Time' },
      { key: 'location', label: 'Location' },
      { key: 'spaceType', label: 'Space Type' },
      { key: 'budgetRange', label: 'Budget' },
      { key: 'urgency', label: 'Timeline' },
      { key: 'preferredContact', label: 'Contact By' },
      { key: 'status', label: 'Status' },
      { key: 'requirements', label: 'Estimate & Requirements', type: 'textarea' },
      { key: 'notes', label: 'Staff Notes', type: 'textarea' },
    ],
    inquiries: [
      { key: 'name', label: 'Name' },
      { key: 'subject', label: 'Subject' },
      { key: 'status', label: 'Status' },
      { key: 'reply', label: 'Reply', type: 'textarea' },
    ],
    reviews: [
      { key: 'name', label: 'Name' },
      { key: 'rating', label: 'Rating', type: 'number' },
      { key: 'approved', label: 'Approved', type: 'checkbox' },
      { key: 'comment', label: 'Comment', type: 'textarea' },
    ],
    users: [
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'role', label: 'Role' },
      { key: 'status', label: 'Status' },
    ],
  };

  const simpleEndpointMap = {
    bookings: 'bookings',
    inquiries: 'inquiries',
    reviews: 'reviews',
    users: 'users',
  };

  const selectedTab = adminTabs.find((tab) => tab.id === adminTab);
  const isSuperAdmin = adminSession.user?.role === 'superadmin';
  const roleName = isSuperAdmin ? 'Super Admin' : 'Admin';
  const accessSummary = isSuperAdmin
    ? 'Full access: manage site content, catalog, orders, messages, publishing, reports, settings, staff, and client accounts.'
    : 'Site manager access: manage content, catalog, orders, messages, reviews, publishing, reports, and settings.';
  const visibleAdminTabs = adminTabs.filter((tab) => {
    if (tab.id === 'superadmin' || tab.id === 'users') return isSuperAdmin;
    return true;
  });
  const content = {
    home: {
      hero: adminData.content?.home?.hero || {},
      offer: adminData.content?.home?.offer || {},
    },
    about: adminData.content?.about || {},
    contact: adminData.content?.contact || {},
  };
  const settings = {
    seo: adminData.settings?.seo || {},
    appearance: adminData.settings?.appearance || {},
    security: adminData.settings?.security || {},
  };
  const recentBookings = adminData.overview?.recentBookings || adminData.bookings.slice(0, 5);
  const recentInquiries = adminData.overview?.recentInquiries || adminData.inquiries.slice(0, 5);
  const overviewMetrics = adminData.overview?.metrics || [
    { label: 'Users', value: adminData.users.length },
    { label: 'Bookings', value: adminData.bookings.length },
    { label: 'Inquiries', value: adminData.inquiries.length },
    { label: 'Projects', value: adminData.projects.length },
    { label: 'Products', value: adminData.products.length },
    { label: 'Reviews', value: adminData.reviews.length },
  ];
  const overviewAnalytics = adminData.overview?.analytics || {
    visitorsToday: 'Live',
    weeklyVisitors: 'Live',
    monthlyVisitors: 'Live',
    conversionRate: 'Live',
  };
  const overviewPending = adminData.overview?.pending || {
    bookings: adminData.bookings.filter((item) => item.status === 'pending').length,
    inquiries: adminData.inquiries.filter((item) => item.status === 'new' || item.status === 'pending').length,
    reviews: adminData.reviews.filter((item) => item.approved !== true).length,
  };
  const liveContent = [
    { label: 'Published posts', value: adminData.blogs.filter((item) => item.published !== false).length },
    { label: 'Featured projects', value: adminData.projects.filter((item) => item.featured !== false).length },
    { label: 'Live catalog items', value: adminData.products.filter((item) => item.featured !== false).length },
    { label: 'Approved reviews', value: adminData.reviews.filter((item) => item.approved === true).length },
  ];

  let body = null;

  if (!adminSession.token || (adminSession.user?.role !== 'admin' && adminSession.user?.role !== 'superadmin')) {
    body = (
      <section className="admin-login-shell">
        <article className="admin-card auth-card">
          <p className="section-tag">Staff Access</p>
          <h2>Staff dashboard login</h2>
          <p>Sign in with an admin or super admin account. Admins can manage the site, while super admins also manage staff and client accounts.</p>
          <form className="admin-stack" onSubmit={handleAdminLogin}>
            <label className="admin-field">
              <span>Email</span>
              <input
                name="email"
                value={adminAuth.email}
                onChange={(event) => setAdminAuth((current) => ({ ...current, email: event.target.value }))}
              />
            </label>
            <label className="admin-field">
              <span>Password</span>
              <input
                name="password"
                type="password"
                value={adminAuth.password}
                onChange={(event) => setAdminAuth((current) => ({ ...current, password: event.target.value }))}
              />
            </label>
            <button className="primary-action" type="submit">Login as admin</button>
            {adminFeedback.auth ? <p className="admin-feedback">{adminFeedback.auth}</p> : null}
          </form>
        </article>
      </section>
    );
  } else if (adminLoading) {
    body = <div className="admin-card admin-loading">Loading admin workspace...</div>;
  } else if ((adminTab === 'superadmin' || adminTab === 'users') && !isSuperAdmin) {
    body = (
      <section className="admin-panel-block">
        <article className="admin-card">
          <p className="section-tag">Super Admin Required</p>
          <h3>Staff and user control is locked</h3>
          <p>Admins can manage the website, bookings, inquiries, catalog, content, reviews, reports, and settings. Only the super admin can create admins, suspend users, or delete accounts.</p>
        </article>
      </section>
    );
  } else if (['services', 'projects', 'products', 'blogs', 'notifications'].includes(adminTab)) {
    body = (
      <CollectionEditor
        config={collectionConfigs[adminTab]}
        items={adminData[adminTab]}
        draft={adminDrafts[adminTab]}
        feedback={adminFeedback[adminTab]}
        onDraftChange={(field, value) => setDraftValue(adminTab, field, value)}
        onItemChange={(id, field, value) => updateCollectionItem(adminTab, id, field, value)}
        onCreate={() => createCollectionItem(adminTab)}
        onSave={(item) => saveCollectionItem(adminTab, item)}
        onDelete={(id) => deleteCollectionItem(adminTab, id)}
      />
    );
  } else if (adminTab === 'superadmin') {
    body = (
      <section className="admin-panel-block superadmin-console">
        <div className="admin-panel-head">
          <div>
            <p className="section-tag">Super Admin Console</p>
            <h3>Manage Staff & Client Accounts</h3>
          </div>
          {adminFeedback.superadmin ? <span className="admin-feedback">{adminFeedback.superadmin}</span> : null}
        </div>

        <div className="superadmin-grid-layout">
          <article className="admin-card staff-add-card">
            <h3 className="card-heading-premium">Create New Account</h3>
            <div className="admin-form-grid">
              <FieldControl
                field={{ key: 'name', label: 'Full Name' }}
                value={adminDrafts.superadmin.name}
                onChange={(value) => setDraftValue('superadmin', 'name', value)}
              />
              <FieldControl
                field={{ key: 'email', label: 'Email Address' }}
                value={adminDrafts.superadmin.email}
                onChange={(value) => setDraftValue('superadmin', 'email', value)}
              />
              <FieldControl
                field={{ key: 'password', label: 'Login Password', type: 'password' }}
                value={adminDrafts.superadmin.password}
                onChange={(value) => setDraftValue('superadmin', 'password', value)}
              />
              <FieldControl
                field={{ key: 'phone', label: 'Phone Number' }}
                value={adminDrafts.superadmin.phone}
                onChange={(value) => setDraftValue('superadmin', 'phone', value)}
              />
              <label className="admin-field">
                <span>Access Level (Role)</span>
                <select
                  value={adminDrafts.superadmin.role}
                  onChange={(e) => setDraftValue('superadmin', 'role', e.target.value)}
                  className="admin-select-luxury"
                >
                  <option value="admin">Admin - can manage site</option>
                  <option value="superadmin">Super Admin - full access</option>
                  <option value="user">Client account</option>
                </select>
              </label>
              <label className="admin-field">
                <span>Account Status</span>
                <select
                  value={adminDrafts.superadmin.status}
                  onChange={(e) => setDraftValue('superadmin', 'status', e.target.value)}
                  className="admin-select-luxury"
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </label>
            </div>
            <div className="admin-actions">
              <button className="primary-action luxury-btn" type="button" onClick={() => createCollectionItem('superadmin')}>
                Create Account
              </button>
            </div>
          </article>

          <div className="staff-directory">
            <h3 className="card-heading-premium">User Directory ({adminData.users.length})</h3>
            <div className="staff-cards-container">
              {adminData.users.map((user) => (
                <article className={`admin-card staff-user-card role-${user.role}`} key={user.id}>
                  <div className="staff-user-header">
                    <div className="staff-user-identity">
                      <span className="staff-avatar-monogram">
                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                      </span>
                      <div>
                        <h4 className="staff-user-name-text">{user.name}</h4>
                        <p className="staff-email-sub">{user.email}</p>
                      </div>
                    </div>
              <span className={`role-badge badge-${user.role}`}>
                      {user.role === 'superadmin' ? 'Super Admin' : user.role === 'admin' ? 'Admin' : 'Client'}
                    </span>
                  </div>

                  <div className="staff-details">
                    <span><strong>Phone:</strong> {user.phone || 'N/A'}</span>
                    <span>
                      <strong>Status:</strong>{' '}
                      <span className={`status-text-badge ${user.status}`}>
                        {user.status}
                      </span>
                    </span>
                  </div>

                  <div className="admin-actions staff-actions-row">
                    <button
                      className="secondary-action compact-action"
                      type="button"
                      onClick={() => {
                        const nextStatus = user.status === 'active' ? 'suspended' : 'active';
                        const updatedUser = { ...user, status: nextStatus };
                        saveCollectionItem('superadmin', updatedUser);
                      }}
                    >
                      {user.status === 'active' ? '⚠️ Suspend' : '✅ Activate'}
                    </button>
                    {user.id !== adminSession.user?.id ? (
                      <button
                        className="secondary-action delete-action-red"
                        type="button"
                        onClick={() => deleteCollectionItem('superadmin', user.id)}
                      >
                        Delete
                      </button>
                    ) : (
                      <span className="self-tag-badge">Your Account</span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  } else if (['bookings', 'inquiries', 'reviews', 'users'].includes(adminTab)) {
    body = renderSimpleManager({
      adminData,
      adminFeedback,
      adminTab,
      manageableFieldMap,
      updateSimpleRecord,
      saveSimpleRecord,
      deleteSimpleRecord,
      simpleEndpointMap,
    });
  } else if (adminTab === 'content') {
    body = (
      <section className="admin-stack">
        <article className="admin-card">
          <div className="admin-panel-head">
            <div>
              <p className="section-tag">Content Management</p>
              <h3>Homepage, company information, and contact details</h3>
            </div>
            {adminFeedback.content ? <span className="admin-feedback">{adminFeedback.content}</span> : null}
          </div>
          <div className="admin-form-grid">
            <FieldControl field={{ label: 'Hero title' }} value={content.home.hero.title} onChange={(value) => setAdminData((current) => ({ ...current, content: { ...(current.content || {}), home: { ...(current.content?.home || {}), hero: { ...(current.content?.home?.hero || {}), title: value } } } }))} />
            <FieldControl field={{ label: 'Offer title' }} value={content.home.offer.title} onChange={(value) => setAdminData((current) => ({ ...current, content: { ...(current.content || {}), home: { ...(current.content?.home || {}), offer: { ...(current.content?.home?.offer || {}), title: value } } } }))} />
            <FieldControl field={{ label: 'Hero description', type: 'textarea' }} value={content.home.hero.description} onChange={(value) => setAdminData((current) => ({ ...current, content: { ...(current.content || {}), home: { ...(current.content?.home || {}), hero: { ...(current.content?.home?.hero || {}), description: value } } } }))} />
            <FieldControl field={{ label: 'Offer description', type: 'textarea' }} value={content.home.offer.description} onChange={(value) => setAdminData((current) => ({ ...current, content: { ...(current.content || {}), home: { ...(current.content?.home || {}), offer: { ...(current.content?.home?.offer || {}), description: value } } } }))} />
            <FieldControl field={{ label: 'About title' }} value={content.about.title} onChange={(value) => setAdminData((current) => ({ ...current, content: { ...(current.content || {}), about: { ...(current.content?.about || {}), title: value } } }))} />
            <FieldControl field={{ label: 'About description', type: 'textarea' }} value={content.about.description} onChange={(value) => setAdminData((current) => ({ ...current, content: { ...(current.content || {}), about: { ...(current.content?.about || {}), description: value } } }))} />
            <FieldControl field={{ label: 'Address' }} value={content.contact.address} onChange={(value) => setAdminData((current) => ({ ...current, content: { ...(current.content || {}), contact: { ...(current.content?.contact || {}), address: value } } }))} />
            <FieldControl field={{ label: 'Primary phone' }} value={content.contact.primaryPhone} onChange={(value) => setAdminData((current) => ({ ...current, content: { ...(current.content || {}), contact: { ...(current.content?.contact || {}), primaryPhone: value } } }))} />
          </div>
          <div className="admin-actions">
            <button className="primary-action" type="button" onClick={saveContent}>Save content</button>
          </div>
        </article>
      </section>
    );
  } else if (adminTab === 'settings') {
    body = (
      <section className="admin-stack">
        <article className="admin-card">
          <div className="admin-panel-head">
            <div>
              <p className="section-tag">SEO and Website Settings</p>
              <h3>Search, appearance, security, and backups</h3>
            </div>
            {adminFeedback.settings ? <span className="admin-feedback">{adminFeedback.settings}</span> : null}
          </div>
          <div className="admin-form-grid">
            <FieldControl field={{ label: 'Site title' }} value={settings.seo.siteTitle} onChange={(value) => setAdminData((current) => ({ ...current, settings: { ...(current.settings || {}), seo: { ...(current.settings?.seo || {}), siteTitle: value } } }))} />
            <FieldControl field={{ label: 'Keywords' }} value={settings.seo.keywords} onChange={(value) => setAdminData((current) => ({ ...current, settings: { ...(current.settings || {}), seo: { ...(current.settings?.seo || {}), keywords: value } } }))} />
            <FieldControl field={{ label: 'Meta description', type: 'textarea' }} value={settings.seo.metaDescription} onChange={(value) => setAdminData((current) => ({ ...current, settings: { ...(current.settings || {}), seo: { ...(current.settings?.seo || {}), metaDescription: value } } }))} />
            <FieldControl field={{ label: 'Primary color' }} value={settings.appearance.primaryColor} onChange={(value) => setAdminData((current) => ({ ...current, settings: { ...(current.settings || {}), appearance: { ...(current.settings?.appearance || {}), primaryColor: value } } }))} />
            <FieldControl field={{ label: 'Accent color' }} value={settings.appearance.accentColor} onChange={(value) => setAdminData((current) => ({ ...current, settings: { ...(current.settings || {}), appearance: { ...(current.settings?.appearance || {}), accentColor: value } } }))} />
            <FieldControl field={{ label: 'Recovery email' }} value={settings.security.recoveryEmail} onChange={(value) => setAdminData((current) => ({ ...current, settings: { ...(current.settings || {}), security: { ...(current.settings?.security || {}), recoveryEmail: value } } }))} />
          </div>
          <div className="admin-actions">
            <button className="primary-action" type="button" onClick={saveSettings}>Save settings</button>
            <button className="secondary-action" type="button" onClick={createBackup}>Create backup</button>
          </div>
        </article>
        <article className="admin-card">
          <p className="section-tag">Admin Authentication</p>
          <h3>Change password</h3>
          <form className="admin-form-grid" onSubmit={handlePasswordChange}>
            <FieldControl field={{ label: 'Current password' }} value={adminAuth.currentPassword} onChange={(value) => setAdminAuth((current) => ({ ...current, currentPassword: value }))} />
            <FieldControl field={{ label: 'New password' }} value={adminAuth.newPassword} onChange={(value) => setAdminAuth((current) => ({ ...current, newPassword: value }))} />
            <div className="admin-actions">
              <button className="primary-action" type="submit">Change password</button>
            </div>
          </form>
        </article>
      </section>
    );
  } else if (adminTab === 'reports') {
    body = (
      <section className="admin-stack">
        <article className="admin-card">
          <div className="admin-panel-head">
            <div>
              <p className="section-tag">Analytics and Reports</p>
              <h3>Export summaries and monitor visitor activity</h3>
            </div>
            {adminFeedback.reports ? <span className="admin-feedback">{adminFeedback.reports}</span> : null}
          </div>
          <div className="admin-actions">
            <button className="primary-action" type="button" onClick={() => exportReport('pdf')}>Export PDF</button>
            <button className="secondary-action" type="button" onClick={() => exportReport('excel')}>Export Excel</button>
          </div>
          {adminData.report ? (
            <div className="list-block">
              <span>Format: {adminData.report.format}</span>
              <span>Bookings: {adminData.report.summary?.bookings || 0}</span>
              <span>Inquiries: {adminData.report.summary?.inquiries || 0}</span>
              <span>Users: {adminData.report.summary?.users || 0}</span>
              <span>Projects: {adminData.report.summary?.projects || 0}</span>
            </div>
          ) : null}
        </article>
      </section>
    );
  } else {
    body = (
      <section className="admin-stack">
        <div className="metric-grid pro-metric-grid">
          {overviewMetrics.map((metric) => (
            <article className="admin-card metric-card" key={metric.label}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
              <small>Live workspace total</small>
            </article>
          ))}
        </div>

        <div className="admin-command-center">
          <article className="admin-card operations-card">
            <div className="admin-panel-head">
              <div>
                <p className="section-tag">Storefront Performance</p>
                <h3>Sales and traffic pulse</h3>
              </div>
              <span className="status-pill is-live">Live</span>
            </div>
            <div className="analytics-grid">
              <div>
                <span>Today</span>
                <strong>{overviewAnalytics.visitorsToday}</strong>
              </div>
              <div>
                <span>This week</span>
                <strong>{overviewAnalytics.weeklyVisitors}</strong>
              </div>
              <div>
                <span>This month</span>
                <strong>{overviewAnalytics.monthlyVisitors}</strong>
              </div>
              <div>
                <span>Conversion</span>
                <strong>{overviewAnalytics.conversionRate}</strong>
              </div>
            </div>
          </article>

          <article className="admin-card operations-card">
            <div className="admin-panel-head">
              <div>
                <p className="section-tag">Tasks</p>
                <h3>Pending activity</h3>
              </div>
            </div>
            <div className="task-list">
              <button type="button" onClick={() => setAdminTab('bookings')}>
                <span>{overviewPending.bookings}</span>
                New orders
              </button>
              <button type="button" onClick={() => setAdminTab('inquiries')}>
                <span>{overviewPending.inquiries}</span>
                Customer messages
              </button>
              <button type="button" onClick={() => setAdminTab('reviews')}>
                <span>{overviewPending.reviews}</span>
                Review queue
              </button>
            </div>
          </article>
        </div>

        <div className="admin-grid">
          <article className="admin-card">
            <div className="admin-panel-head">
              <div>
                <p className="section-tag">Orders</p>
                <h3>Recent service orders</h3>
              </div>
              <button className="secondary-action compact-action" type="button" onClick={() => setAdminTab('bookings')}>
                Manage orders
              </button>
            </div>
            <div className="activity-list">
              {recentBookings.map((booking) => (
                <div className="activity-row" key={booking.id}>
                  <div>
                    <strong>{booking.name}</strong>
                    <span>{booking.consultationType} - {booking.date} at {booking.time}</span>
                  </div>
                  <span className={`status-pill status-${booking.status}`}>{booking.status}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="admin-card">
            <div className="admin-panel-head">
              <div>
                <p className="section-tag">Inbox</p>
                <h3>Customer conversations</h3>
              </div>
              <button className="secondary-action compact-action" type="button" onClick={() => setAdminTab('inquiries')}>
                Open inbox
              </button>
            </div>
            <div className="activity-list">
              {recentInquiries.map((inquiry) => (
                <div className="activity-row" key={inquiry.id}>
                  <div>
                    <strong>{inquiry.name}</strong>
                    <span>{inquiry.subject}</span>
                  </div>
                  <span className={`status-pill status-${inquiry.status}`}>{inquiry.status}</span>
                </div>
              ))}
            </div>
          </article>
        </div>

        <div className="admin-grid">
          <article className="admin-card">
            <div className="admin-panel-head">
              <div>
                <p className="section-tag">Storefront Health</p>
                <h3>Live client-site controls</h3>
              </div>
              <button className="secondary-action compact-action" type="button" onClick={() => setAdminTab('content')}>
                Edit site
              </button>
            </div>
            <div className="content-health-grid">
              {liveContent.map((item) => (
                <div key={item.label}>
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="admin-card">
            <div className="admin-panel-head">
              <div>
                <p className="section-tag">Store Manager</p>
                <h3>Fast admin actions</h3>
              </div>
            </div>
            <div className="quick-action-grid">
              {[
                ['services', 'Add service category'],
                ['projects', 'Update showroom'],
                ['products', 'Manage catalog'],
                ['reports', 'Export report'],
              ].map(([target, label]) => (
                <button type="button" key={target} onClick={() => setAdminTab(target)}>
                  {label}
                </button>
              ))}
            </div>
          </article>
        </div>
      </section>
    );
  }

  return (
    <main className="admin-shell" id="admin-workspace">
      {adminSession.user ? (
        <header className="admin-dashboard-header">
          <div className="admin-brand-lockup">
            <div className="admin-brand-monogram">M</div>
            <div>
              <strong className="admin-brand-title">MTI Workspace</strong>
              <span className="admin-brand-sub">Management Portal</span>
            </div>
          </div>
          
          <div className="admin-header-actions">
            <button 
              className="view-site-btn" 
              type="button" 
              onClick={() => setViewMode('site')}
              title="Toggle to preview and navigate public client site without logging out"
            >
              ← View Public Site
            </button>
            <div className="admin-user-menu">
              <span className="admin-user-avatar">
                {adminSession.user.name.charAt(0).toUpperCase()}
              </span>
              <span className="admin-user-name">{adminSession.user.name}</span>
              <button className="admin-logout-btn" type="button" onClick={handleAdminLogout}>
                Logout
              </button>
            </div>
          </div>
        </header>
      ) : null}

      <section className="admin-hero">
        <div>
          <p className="section-tag">{selectedTab?.label || 'Admin Workspace'}</p>
          <h1>MTI Store Admin</h1>
          <p>{adminSession.user ? accessSummary : 'Sign in with a staff account to manage MTI site operations.'}</p>
        </div>
      </section>

      {adminSession.user ? (
        <>
          <section className="admin-access-strip" aria-label="Admin access level">
            <article className="admin-card access-card is-active-access">
              <span className="access-eyebrow">Signed in as</span>
              <strong>{roleName}</strong>
              <p>{accessSummary}</p>
            </article>
            <article className={`admin-card access-card ${isSuperAdmin ? 'is-active-access' : 'is-locked-access'}`}>
              <span className="access-eyebrow">Staff & users</span>
              <strong>{isSuperAdmin ? 'Unlocked' : 'Super admin only'}</strong>
              <p>{isSuperAdmin ? 'Create admins, update roles, suspend users, and remove accounts.' : 'Site admins can manage the website, but account control stays protected.'}</p>
            </article>
          </section>

          <div className="admin-tabs">
            {visibleAdminTabs.map((tab) => (
              <button
                className={adminTab === tab.id ? 'is-active' : ''}
                key={tab.id}
                type="button"
                onClick={() => setAdminTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </>
      ) : null}

      {body}
    </main>
  );
}

export default AdminPanel;
