import { useCallback, useDeferredValue, useEffect, useRef, useState } from 'react';
import './App.css';
import { bookingDefaults, inquiryDefaults } from './siteContent';
import { fallbackSiteState } from './fallbackSiteState';
import { collectionConfigs, navigation } from './adminConfig';
import PublicSite from './PublicSite';
import AdminPanel from './AdminPanel';
import UserPortal from './UserPortal';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from './firebase';

const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';
const publicUrl = process.env.PUBLIC_URL || '';
const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';
const authStorageKey = 'mti-admin-session';
const userStorageKey = 'mti-user-session';

const brandAssets = {
  banner: `${publicUrl}/brand/a1.jpeg`,
  letterhead: `${publicUrl}/brand/a2.jpeg`,
  identity: `${publicUrl}/brand/a3.jpeg`,
  showroom: `${publicUrl}/brand/a4.jpeg`,
};

const currencyFormatter = new Intl.NumberFormat('en-PK', {
  style: 'currency',
  currency: 'PKR',
  maximumFractionDigits: 0,
});

function App() {
  const [siteData, setSiteData] = useState(fallbackSiteState);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [viewMode, setViewMode] = useState('site');
  const [authPanelOpen, setAuthPanelOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [projectCategory, setProjectCategory] = useState('All');
  const [productCategory, setProductCategory] = useState('All');
  const [projectSearch, setProjectSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [bookingForm, setBookingForm] = useState(bookingDefaults);
  const [inquiryForm, setInquiryForm] = useState(inquiryDefaults);
  const [statusMessage, setStatusMessage] = useState({ booking: '', inquiry: '' });
  const [adminAuth, setAdminAuth] = useState({
    email: 'admin@mtiinteriors.com',
    password: 'Admin123!',
    currentPassword: '',
    newPassword: '',
  });
  const [adminSession, setAdminSession] = useState({ token: '', user: null });
  const [userSession, setUserSession] = useState({ token: '', user: null });
  const [userAuth, setUserAuth] = useState({
    name: '',
    email: 'sara@example.com',
    phone: '',
    password: 'Client123!',
  });
  const [userProfile, setUserProfile] = useState({ name: '', phone: '' });
  const [userFeedback, setUserFeedback] = useState({});
  const [adminTab, setAdminTab] = useState('overview');
  const [adminData, setAdminData] = useState({
    overview: null,
    users: [],
    services: [],
    projects: [],
    products: [],
    bookings: [],
    inquiries: [],
    reviews: [],
    content: {
      home: fallbackSiteState.home,
      about: fallbackSiteState.about,
      contact: fallbackSiteState.contact,
    },
    blogs: [],
    notifications: [],
    settings: null,
    report: null,
  });
  const [adminDrafts, setAdminDrafts] = useState(
    Object.fromEntries(
      Object.entries(collectionConfigs).map(([key, config]) => [key, config.emptyItem])
    )
  );
  const [adminFeedback, setAdminFeedback] = useState({});
  const [adminLoading, setAdminLoading] = useState(false);

  const deferredProjectSearch = useDeferredValue(projectSearch);
  const deferredProductSearch = useDeferredValue(productSearch);
  const googleButtonRef = useRef(null);

  const apiFetch = useCallback(async (path, options = {}) => {
    const response = await fetch(`${apiBase}${path}`, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.message || 'Request failed');
    }

    return payload;
  }, []);

  const handleGoogleCredential = useCallback(async (credential) => {
    try {
      const result = await apiFetch('/auth/google', {
        method: 'POST',
        body: { credential },
      });
      if (result.user.role !== 'user') {
        throw new Error('Google sign-in is only available for client accounts.');
      }
      const session = { token: result.token, user: result.user };
      setUserSession(session);
      setUserProfile({ name: result.user.name || '', phone: result.user.phone || '' });
      setViewMode('account');
      window.localStorage.setItem(userStorageKey, JSON.stringify(session));
      setAuthPanelOpen(false);
    } catch (error) {
      setUserFeedback((current) => ({ ...current, auth: error.message }));
    }
  }, [apiFetch, setUserSession, setUserProfile, setViewMode, setAuthPanelOpen, setUserFeedback]);

  const loadAdminWorkspace = useCallback(async (token) => {
    setAdminLoading(true);
    try {
      const [
        overview,
        usersPayload,
        servicesPayload,
        projectsPayload,
        productsPayload,
        bookingsPayload,
        inquiriesPayload,
        reviewsPayload,
        contentPayload,
        blogsPayload,
        notificationsPayload,
        settingsPayload,
      ] = await Promise.all([
        apiFetch('/admin/overview', { token }),
        apiFetch('/admin/users', { token }),
        apiFetch('/admin/services', { token }),
        apiFetch('/admin/projects', { token }),
        apiFetch('/admin/products', { token }),
        apiFetch('/admin/bookings', { token }),
        apiFetch('/admin/inquiries', { token }),
        apiFetch('/admin/reviews', { token }),
        apiFetch('/admin/content', { token }),
        apiFetch('/admin/blogs', { token }),
        apiFetch('/admin/notifications', { token }),
        apiFetch('/admin/settings', { token }),
      ]);

      setAdminData({
        overview,
        users: usersPayload.users,
        services: servicesPayload.services,
        projects: projectsPayload.projects,
        products: productsPayload.products,
        bookings: bookingsPayload.bookings,
        inquiries: inquiriesPayload.inquiries,
        reviews: reviewsPayload.reviews,
        content: contentPayload.content,
        blogs: blogsPayload.blogs,
        notifications: notificationsPayload.notifications,
        settings: settingsPayload,
        report: null,
      });
    } finally {
      setAdminLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    apiFetch('/site/public')
      .then((payload) => setSiteData((current) => ({ ...current, ...payload })))
      .catch(() => {});

    const storedAdmin = window.localStorage.getItem(authStorageKey);
    if (storedAdmin) {
      try {
        const parsed = JSON.parse(storedAdmin);
        if (parsed.token && (parsed.user?.role === 'admin' || parsed.user?.role === 'superadmin')) {
          setAdminSession(parsed);
        }
      } catch (error) {
        window.localStorage.removeItem(authStorageKey);
      }
    }

    const storedUser = window.localStorage.getItem(userStorageKey);
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed.token && parsed.user?.role === 'user') {
          setUserSession(parsed);
          setUserProfile({ name: parsed.user.name || '', phone: parsed.user.phone || '' });
        }
      } catch (error) {
        window.localStorage.removeItem(userStorageKey);
      }
    }
  }, [apiFetch]);

  useEffect(() => {
    if (!adminSession.token) {
      return;
    }

    loadAdminWorkspace(adminSession.token).catch(() => {
      setAdminFeedback((current) => ({ ...current, auth: 'Admin data could not be loaded.' }));
    });
  }, [adminSession.token, loadAdminWorkspace]);

  useEffect(() => {
    if (!userSession.token) {
      return;
    }

    apiFetch('/auth/profile', { token: userSession.token })
      .then((payload) => {
        const session = { token: userSession.token, user: payload.user };
        setUserSession(session);
        setUserProfile({ name: payload.user.name || '', phone: payload.user.phone || '' });
        window.localStorage.setItem(userStorageKey, JSON.stringify(session));
      })
      .catch(() => {
        setUserFeedback((current) => ({ ...current, auth: 'Client session could not be refreshed.' }));
      });
  }, [apiFetch, userSession.token]);

  useEffect(() => {
    if (!googleClientId || window.google?.accounts?.id) {
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    if (!authPanelOpen || !googleClientId || !googleButtonRef.current || !window.google?.accounts?.id) {
      return;
    }

    googleButtonRef.current.innerHTML = '';
    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: (response) => handleGoogleCredential(response.credential),
    });
    window.google.accounts.id.renderButton(googleButtonRef.current, {
      theme: 'outline',
      size: 'large',
      width: 320,
      text: 'continue_with',
    });
  }, [authPanelOpen, handleGoogleCredential]);

  function openAuthPanel(mode = 'login') {
    setAuthMode(mode);
    setAuthPanelOpen(true);
    setUserFeedback({});
  }

  function closeAuthPanel() {
    setAuthPanelOpen(false);
  }

  const handleUserSignUp = async (email, password) => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      alert("User Registered via Firebase Successfully!");
    } catch (error) {
      alert("Firebase Signup Error: " + error.message);
      throw error;
    }
  };

  const handleUserLogin = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert("User Authenticated via Firebase!");
    } catch (error) {
      alert("Firebase Login Error: " + error.message);
      throw error;
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      // Force account selection taake browser ghalati se purana ya disabled session auto-select na kare
      googleProvider.setCustomParameters({
        prompt: 'select_account'
      });

      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      const idToken = await user.getIdToken();
      
      const syncResult = await apiFetch('/auth/login', {
        method: 'POST',
        body: { email: user.email, isGoogleAuth: true, firebaseToken: idToken }
      }).catch(async () => {
        return await apiFetch('/auth/register', {
          method: 'POST',
          body: { name: user.displayName, email: user.email, password: 'GoogleVerifiedBypass123!', role: 'user' }
        }).then(() => apiFetch('/auth/login', {
          method: 'POST',
          body: { email: user.email, isGoogleAuth: true }
        }));
      });

      const session = { token: syncResult.token, user: syncResult.user };
      setUserSession(session);
      setUserProfile({ name: syncResult.user.name || user.displayName || '', phone: syncResult.user.phone || '' });
      
      // Modal panel ko close karein aur seedha home site par redirect karein
      setViewMode('site');
      window.localStorage.setItem(userStorageKey, JSON.stringify(session));
      setAuthPanelOpen(false);
      
      alert(`Welcome ${user.displayName}! Google Sign-In Successful.`);
    } catch (error) {
      alert("Google Auth Error: " + error.message);
      setUserFeedback((current) => ({ ...current, auth: error.message }));
    }
  };
async function handleUserAuthSubmit(event) {
    event.preventDefault();
    setUserFeedback((current) => ({ ...current, auth: '' })); // Pehle wale errors clear karein
    
    try {
      const credentials = { email: userAuth.email, password: userAuth.password };

      if (authMode === 'register') {
        // 1. Firebase par user register karein
        try {
          await handleUserSignUp(userAuth.email, userAuth.password);
        } catch (fbErr) {
          console.log("Firebase signup handled or already exists", fbErr);
        }
        
        // 2. Apne Node.js backend par user register karein
        await apiFetch('/auth/register', {
          method: 'POST',
          body: {
            name: userAuth.name,
            email: userAuth.email,
            phone: userAuth.phone,
            password: userAuth.password,
          },
        });
      }

      // 3. Backend par login karwein token lene ke liye
      const result = await apiFetch('/auth/login', {
        method: 'POST',
        body: credentials,
      });

      // 4. Firebase par sign in confirm karein
      try {
        await handleUserLogin(userAuth.email, userAuth.password);
      } catch (fbLogErr) {
        console.log("Firebase login bypass/handled", fbLogErr);
      }

      const session = { token: result.token, user: result.user };

      if (result.user.role === 'admin' || result.user.role === 'superadmin') {
        setAdminSession(session);
        setViewMode('admin');
        window.localStorage.setItem(authStorageKey, JSON.stringify(session));
        setAdminFeedback((current) => ({ ...current, auth: 'Admin login successful.' }));
      } else {
        setUserSession(session);
        setUserProfile({ name: result.user.name || '', phone: result.user.phone || '' });
        setViewMode('site'); // Home page par bhejne ke liye
        window.localStorage.setItem(userStorageKey, JSON.stringify(session));
        setUserFeedback((current) => ({ ...current, auth: 'Client login successful.' }));
      }
      
      // Har haal mein panel ko close karein agar backend success de chuka hai
      setAuthPanelOpen(false); 
      
    } catch (error) {
      // Agar error aaye toh usey state mein set karein taake user ko saaf dikhe
      setUserFeedback((current) => ({ ...current, auth: error.message }));
    }
  }
  async function handleUserLogout() {
    try {
      if (userSession.token) {
        await apiFetch('/auth/logout', { method: 'POST', token: userSession.token });
      }
    } finally {
      setUserSession({ token: '', user: null });
      setUserProfile({ name: '', phone: '' });
      setViewMode('site');
      window.localStorage.removeItem(userStorageKey);
    }
  }

  async function handleProfileSave(event) {
    event.preventDefault();
    try {
      const result = await apiFetch('/auth/profile', {
        method: 'PATCH',
        token: userSession.token,
        body: userProfile,
      });
      const session = { token: userSession.token, user: result.user };
      setUserSession(session);
      setUserProfile({ name: result.user.name || '', phone: result.user.phone || '' });
      window.localStorage.setItem(userStorageKey, JSON.stringify(session));
      setUserFeedback((current) => ({ ...current, profile: 'Profile updated.' }));
    } catch (error) {
      setUserFeedback((current) => ({ ...current, profile: error.message }));
    }
  }

  function updateObjectForm(setter) {
    return ({ target: { name, value } }) => setter((current) => ({ ...current, [name]: value }));
  }

  function syncPublicState(resourceKey, items) {
    if (['services', 'projects', 'products', 'reviews', 'blogs'].includes(resourceKey)) {
      setSiteData((current) => ({
        ...current,
        [resourceKey]:
          resourceKey === 'reviews'
            ? items.filter((item) => item.approved === true)
            : resourceKey === 'blogs'
              ? items.filter((item) => item.published !== false)
              : items,
      }));
    }
  }

  function setDraftValue(resourceKey, field, value) {
    setAdminDrafts((current) => ({
      ...current,
      [resourceKey]: {
        ...current[resourceKey],
        [field]: value,
      },
    }));
  }

  function updateCollectionItem(resourceKey, itemId, field, value) {
    const dataKey = resourceKey === 'superadmin' ? 'users' : resourceKey;
    setAdminData((current) => ({
      ...current,
      [dataKey]: current[dataKey].map((item) =>
        item.id === itemId ? { ...item, [field]: value } : item
      ),
    }));
  }

  async function handleBookingSubmit(event) {
    event.preventDefault();
    try {
      const result = await apiFetch('/bookings', { method: 'POST', body: bookingForm });
      setStatusMessage((current) => ({ ...current, booking: `Booking request ${result.booking.reference} submitted successfully.` }));
      setBookingForm(bookingDefaults);
    } catch (error) {
      setStatusMessage((current) => ({ ...current, booking: error.message }));
    }
  }

  async function handleInquirySubmit(event) {
    event.preventDefault();
    try {
      const result = await apiFetch('/inquiries', { method: 'POST', body: inquiryForm });
      setStatusMessage((current) => ({ ...current, inquiry: `Inquiry ${result.inquiry.id} sent successfully.` }));
      setInquiryForm(inquiryDefaults);
    } catch (error) {
      setStatusMessage((current) => ({ ...current, inquiry: error.message }));
    }
  }

  async function handleAdminLogin(event) {
    event.preventDefault();
    try {
      const adminCredential = await signInWithEmailAndPassword(
        auth,
        adminAuth.email,
        adminAuth.password
      );

      const user = adminCredential.user;
      const session = {
        token: await user.getIdToken(),
        user: {
          id: user.uid,
          name: user.displayName || 'Admin',
          email: user.email,
          role: 'admin',
        },
      };

      setAdminSession(session);
      setViewMode('admin');
      window.localStorage.setItem(authStorageKey, JSON.stringify(session));
      setAdminFeedback((current) => ({
        ...current,
        auth: 'Admin login successful.',
      }));
    } catch (error) {
      setAdminFeedback((current) => ({
        ...current,
        auth: error.message,
      }));
    }
  }

  async function handleAdminLogout() {
    try {
      if (adminSession.token) {
        await apiFetch('/auth/logout', { method: 'POST', token: adminSession.token });
      }
    } finally {
      setAdminSession({ token: '', user: null });
      setViewMode('site');
      window.localStorage.removeItem(authStorageKey);
    }
  }

  async function handlePasswordChange(event) {
    event.preventDefault();
    try {
      const result = await apiFetch('/auth/change-password', {
        method: 'POST',
        token: adminSession.token,
        body: {
          currentPassword: adminAuth.currentPassword,
          newPassword: adminAuth.newPassword,
        },
      });
      setAdminFeedback((current) => ({ ...current, settings: result.message }));
      setAdminAuth((current) => ({ ...current, currentPassword: '', newPassword: '' }));
    } catch (error) {
      setAdminFeedback((current) => ({ ...current, settings: error.message }));
    }
  }

  async function createCollectionItem(resourceKey) {
    const config = collectionConfigs[resourceKey];
    const dataKey = resourceKey === 'superadmin' ? 'users' : resourceKey;
    try {
      const result = await apiFetch(`/admin/${config.endpoint}`, {
        method: 'POST',
        token: adminSession.token,
        body: adminDrafts[resourceKey],
      });
      const created = result[config.responseOne];
      const nextItems = [created, ...adminData[dataKey]];
      setAdminData((current) => ({ ...current, [dataKey]: nextItems }));
      syncPublicState(dataKey, nextItems);
      setAdminDrafts((current) => ({ ...current, [resourceKey]: config.emptyItem }));
      setAdminFeedback((current) => ({ ...current, [resourceKey]: `${config.title} updated.` }));
    } catch (error) {
      setAdminFeedback((current) => ({ ...current, [resourceKey]: error.message }));
    }
  }

  async function saveCollectionItem(resourceKey, item) {
    const config = collectionConfigs[resourceKey];
    const dataKey = resourceKey === 'superadmin' ? 'users' : resourceKey;
    try {
      const result = await apiFetch(`/admin/${config.endpoint}/${item.id}`, {
        method: 'PATCH',
        token: adminSession.token,
        body: item,
      });
      const updated = result[config.responseOne];
      const nextItems = adminData[dataKey].map((entry) => (entry.id === updated.id ? updated : entry));
      setAdminData((current) => ({ ...current, [dataKey]: nextItems }));
      syncPublicState(dataKey, nextItems);
      setAdminFeedback((current) => ({ ...current, [resourceKey]: `${config.title} saved.` }));
    } catch (error) {
      setAdminFeedback((current) => ({ ...current, [resourceKey]: error.message }));
    }
  }

  async function deleteCollectionItem(resourceKey, itemId) {
    const config = collectionConfigs[resourceKey];
    const dataKey = resourceKey === 'superadmin' ? 'users' : resourceKey;
    try {
      await apiFetch(`/admin/${config.endpoint}/${itemId}`, {
        method: 'DELETE',
        token: adminSession.token,
      });
      const nextItems = adminData[dataKey].filter((item) => item.id !== itemId);
      setAdminData((current) => ({ ...current, [dataKey]: nextItems }));
      syncPublicState(dataKey, nextItems);
      setAdminFeedback((current) => ({ ...current, [resourceKey]: `${config.title} item removed.` }));
    } catch (error) {
      setAdminFeedback((current) => ({ ...current, [resourceKey]: error.message }));
    }
  }

  function updateSimpleRecord(groupKey, itemId, field, value) {
    setAdminData((current) => ({
      ...current,
      [groupKey]: current[groupKey].map((item) => (item.id === itemId ? { ...item, [field]: value } : item)),
    }));
  }

  async function saveSimpleRecord(groupKey, endpoint, item) {
    try {
      const result = await apiFetch(`/admin/${endpoint}/${item.id}`, {
        method: 'PATCH',
        token: adminSession.token,
        body: item,
      });
      const responseKeys = { bookings: 'booking', inquiries: 'inquiry', reviews: 'review', users: 'user' };
      const updated = result[responseKeys[groupKey]];
      const nextItems = adminData[groupKey].map((entry) => (entry.id === updated.id ? updated : entry));
      setAdminData((current) => ({ ...current, [groupKey]: nextItems }));
      if (groupKey === 'reviews') {
        syncPublicState('reviews', nextItems);
      }
      setAdminFeedback((current) => ({ ...current, [groupKey]: 'Changes saved.' }));
    } catch (error) {
      setAdminFeedback((current) => ({ ...current, [groupKey]: error.message }));
    }
  }

  async function deleteSimpleRecord(groupKey, endpoint, itemId) {
    try {
      await apiFetch(`/admin/${endpoint}/${itemId}`, {
        method: 'DELETE',
        token: adminSession.token,
      });
      const nextItems = adminData[groupKey].filter((item) => item.id !== itemId);
      setAdminData((current) => ({ ...current, [groupKey]: nextItems }));
      if (groupKey === 'reviews') {
        syncPublicState('reviews', nextItems);
      }
      setAdminFeedback((current) => ({ ...current, [groupKey]: 'Item deleted.' }));
    } catch (error) {
      setAdminFeedback((current) => ({ ...current, [groupKey]: error.message }));
    }
  }

  async function saveContent() {
    try {
      const result = await apiFetch('/admin/content', {
        method: 'PATCH',
        token: adminSession.token,
        body: adminData.content,
      });
      setAdminData((current) => ({ ...current, content: result.content }));
      setSiteData((current) => ({
        ...current,
        home: result.content.home,
        about: result.content.about,
        contact: result.content.contact,
      }));
      setAdminFeedback((current) => ({ ...current, content: 'Content updated.' }));
    } catch (error) {
      setAdminFeedback((current) => ({ ...current, content: error.message }));
    }
  }

  async function saveSettings() {
    try {
      const result = await apiFetch('/admin/settings', {
        method: 'PATCH',
        token: adminSession.token,
        body: adminData.settings,
      });
      setAdminData((current) => ({ ...current, settings: result }));
      setAdminFeedback((current) => ({ ...current, settings: 'Settings updated.' }));
    } catch (error) {
      setAdminFeedback((current) => ({ ...current, settings: error.message }));
    }
  }

  async function createBackup() {
    try {
      const result = await apiFetch('/admin/backups', { method: 'POST', token: adminSession.token });
      setAdminData((current) => ({
        ...current,
        settings: {
          ...current.settings,
          backups: [result.backup, ...current.settings.backups],
          security: { ...current.settings.security, lastBackupAt: result.backup.createdAt },
        },
      }));
      setAdminFeedback((current) => ({ ...current, settings: 'Backup created.' }));
    } catch (error) {
      setAdminFeedback((current) => ({ ...current, settings: error.message }));
    }
  }

  async function exportReport(format) {
    try {
      const report = await apiFetch(`/admin/reports/export?format=${format}`, { token: adminSession.token });
      setAdminData((current) => ({ ...current, report }));
      setAdminFeedback((current) => ({ ...current, reports: `${format.toUpperCase()} report generated.` }));
    } catch (error) {
      setAdminFeedback((current) => ({ ...current, reports: error.message }));
    }
  }

  const filteredProjects = siteData.projects.filter((project) => {
    const categoryMatch = projectCategory === 'All' || project.category === projectCategory;
    const search = deferredProjectSearch.trim().toLowerCase();
    if (!search) {
      return categoryMatch;
    }
    return categoryMatch && `${project.title} ${project.description} ${project.location}`.toLowerCase().includes(search);
  });

  const filteredProducts = siteData.products.filter((product) => {
    const categoryMatch = productCategory === 'All' || product.category === productCategory;
    const search = deferredProductSearch.trim().toLowerCase();
    if (!search) {
      return categoryMatch;
    }
    return categoryMatch && `${product.name} ${product.material} ${product.specification}`.toLowerCase().includes(search);
  });

  return (
    <div className="page-shell" id="top">
      <div className="utility-bar">
        <div className="utility-copy">
          <span>MTI Professional Interiors and Decor</span>
          <span>Made to Inspire</span>
          <span>{siteData.contact.address}</span>
        </div>
        <div className="utility-links">
          <a href={`tel:+92${siteData.contact.primaryPhone.replace(/\D/g, '')}`}>{siteData.contact.primaryPhone}</a>
          <a href={`tel:+92${siteData.contact.secondaryPhone.replace(/\D/g, '')}`}>{siteData.contact.secondaryPhone}</a>
          <a href={siteData.contact.whatsapp} rel="noreferrer" target="_blank">WhatsApp</a>
        </div>
      </div>

      {adminSession.user && viewMode === 'site' ? (
        <div className="admin-floating-toolbar">
          <div className="toolbar-info">
            <span className="toolbar-dot"></span>
            <span><strong>Admin Mode Active</strong> — Logged in as <em>{adminSession.user.name}</em></span>
          </div>
          <div className="toolbar-actions">
            <button type="button" onClick={() => setViewMode('admin')} className="toolbar-btn primary">
              Go to Dashboard
            </button>
            <button type="button" onClick={handleAdminLogout} className="toolbar-btn secondary">
              Logout
            </button>
          </div>
        </div>
      ) : null}

      {viewMode !== 'admin' ? (
        <header className="site-header">
          <a className="brand-lockup" href="#top">
            <div className="brand-monogram"><span>M</span><span>T</span><span>I</span></div>
            <div className="brand-copy"><strong>MTI Professional Interiors & Decor</strong><span>Made to Inspire</span></div>
          </a>

          <button
            className="menu-toggle"
            type="button"
            aria-expanded={mobileMenuOpen}
            aria-controls="primary-navigation"
            onClick={() => setMobileMenuOpen((current) => !current)}
          >
            Menu
          </button>

          <nav id="primary-navigation" className={`site-nav ${mobileMenuOpen ? 'is-open' : ''}`} aria-label="Primary navigation">
            {navigation.map((item) => (
              <a href={item.href} key={item.label} onClick={() => setMobileMenuOpen(false)}>{item.label}</a>
            ))}
          </nav>

          <div className="header-actions">
            {userSession.user ? (
              <button className="secondary-action header-link-button" type="button" onClick={() => setViewMode('account')}>
                Client Portal
              </button>
            ) : (
              <button className="secondary-action header-link-button" type="button" onClick={() => openAuthPanel('login')}>
                Sign In
              </button>
            )}
            <a className="header-cta" href="#consultation">Request a proposal</a>
          </div>
        </header>
      ) : null}

      {viewMode === 'site' ? (
        <PublicSite
          siteData={siteData}
          brandAssets={brandAssets}
          projectSearch={projectSearch}
          setProjectSearch={setProjectSearch}
          productSearch={productSearch}
          setProductSearch={setProductSearch}
          projectCategory={projectCategory}
          setProjectCategory={setProjectCategory}
          productCategory={productCategory}
          setProductCategory={setProductCategory}
          filteredProjects={filteredProjects}
          filteredProducts={filteredProducts}
          currencyFormatter={currencyFormatter}
          bookingForm={bookingForm}
          inquiryForm={inquiryForm}
          updateBookingForm={updateObjectForm(setBookingForm)}
          updateInquiryForm={updateObjectForm(setInquiryForm)}
          handleBookingSubmit={handleBookingSubmit}
          handleInquirySubmit={handleInquirySubmit}
          statusMessage={statusMessage}
        />
      ) : viewMode === 'account' ? (
        <UserPortal
          siteData={siteData}
          userSession={userSession}
          userProfile={userProfile}
          setUserProfile={setUserProfile}
          userFeedback={userFeedback}
          handleProfileSave={handleProfileSave}
          handleUserLogout={handleUserLogout}
        />
      ) : (
        <AdminPanel
          adminSession={adminSession}
          adminAuth={adminAuth}
          setAdminAuth={setAdminAuth}
          adminTab={adminTab}
          setAdminTab={setAdminTab}
          adminData={adminData}
          adminDrafts={adminDrafts}
          adminFeedback={adminFeedback}
          adminLoading={adminLoading}
          handleAdminLogin={handleAdminLogin}
          handleAdminLogout={handleAdminLogout}
          handlePasswordChange={handlePasswordChange}
          setDraftValue={setDraftValue}
          updateCollectionItem={updateCollectionItem}
          createCollectionItem={createCollectionItem}
          saveCollectionItem={saveCollectionItem}
          deleteCollectionItem={deleteCollectionItem}
          updateSimpleRecord={updateSimpleRecord}
          saveSimpleRecord={saveSimpleRecord}
          deleteSimpleRecord={deleteSimpleRecord}
          saveContent={saveContent}
          saveSettings={saveSettings}
          createBackup={createBackup}
          exportReport={exportReport}
          setAdminData={setAdminData}
          setViewMode={setViewMode}
          viewMode={viewMode}
        />
      )}

      {authPanelOpen ? (
        <div className="auth-overlay" role="presentation">
          <section className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
            <button className="auth-close" type="button" onClick={closeAuthPanel} aria-label="Close login panel">
              x
            </button>
            <div className="auth-modal-copy">
              <p className="section-tag">Secure Access</p>
              <h2 id="auth-title">{authMode === 'register' ? 'Create Client Account' : 'Sign In / Portal Login'}</h2>
              <p>
                Sign in using your credentials to access either your personalized Client Portal or the MTI Professional Staff Dashboard.
              </p>
              <div className="auth-benefits">
                <span>Track requests</span>
                <span>Save profile details</span>
                <span>Manage workspace</span>
              </div>
            </div>
            
            {/* Display authentication context errors/feedbacks if any */}
            {userFeedback.auth && (
              <div style={{ color: '#ff3b30', marginBottom: '15px', fontSize: '14px', textAlign: 'center', fontWeight: 'bold' }}>
                {userFeedback.auth}
              </div>
            )}

            <form className="auth-form" onSubmit={handleUserAuthSubmit}>
              {authMode === 'register' ? (
                <>
                  <label className="admin-field">
                    <span>Name</span>
                    <input value={userAuth.name} onChange={(event) => setUserAuth((current) => ({ ...current, name: event.target.value }))} />
                  </label>
                  <label className="admin-field">
                    <span>Phone</span>
                    <input value={userAuth.phone} onChange={(event) => setUserAuth((current) => ({ ...current, phone: event.target.value }))} />
                  </label>
                </>
              ) : null}
              <label className="admin-field">
                <span>Email</span>
                <input
                  value={userAuth.email}
                  onChange={(event) => setUserAuth((current) => ({ ...current, email: event.target.value }))}
                />
              </label>
              <label className="admin-field">
                <span>Password</span>
                <input
                  type="password"
                  value={userAuth.password}
                  onChange={(event) => setUserAuth((current) => ({ ...current, password: event.target.value }))}
                />
              </label>
              
              <button type="submit" className="toolbar-btn primary" style={{ width: '100%', marginTop: '10px', padding: '12px' }}>
                {authMode === 'register' ? 'Register Account' : 'Login Securely'}
              </button>

              <div style={{ margin: '15px 0', textHighlight: 'none', color: '#888', fontSize: '13px' }}>— OR —</div>

              <div className="google-auth-slot" style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center', width: '100%' }}>
                {/* Firebase Popup Google Sign-In Mechanism */}
                <button 
                  type="button" 
                  onClick={handleGoogleSignIn}
                  style={{
                    width: '100%',
                    maxWidth: '320px',
                    padding: '10px',
                    backgroundColor: '#4285F4',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}
                >
                  Continue with Google
                </button>

                {/* Legacy script ref slot fallback placeholder if env setup is present */}
                {googleClientId && <div ref={googleButtonRef} style={{ marginTop: '5px' }} />}
              </div>

              <div style={{ marginTop: '20px', fontSize: '14px' }}>
                {authMode === 'register' ? (
                  <span>Already have an account? <button type="button" onClick={() => setAuthMode('login')} style={{ background: 'none', border: 'none', color: '#007aff', cursor: 'pointer', textDecoration: 'underline' }}>Sign In</button></span>
                ) : (
                  <span>New client? <button type="button" onClick={() => setAuthMode('register')} style={{ background: 'none', border: 'none', color: '#007aff', cursor: 'pointer', textDecoration: 'underline' }}>Create an account</button></span>
                )}
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </div>
  );
}

export default App;
