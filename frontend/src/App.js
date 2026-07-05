import { useCallback, useDeferredValue, useEffect, useState } from 'react';
import './App.css';
import { bookingDefaults, inquiryDefaults } from './siteContent';
import { fallbackSiteState } from './fallbackSiteState';
import { collectionConfigs, navigation } from './adminConfig';
import PublicSite from './PublicSite';
import AdminPanel from './AdminPanel';
import UserPortal from './UserPortal';

// Firebase Modules standard imports
import { deleteApp, initializeApp } from 'firebase/app';
import { createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { 
  collection, doc, setDoc, addDoc, getDocs, getDoc, deleteDoc, query, getFirestore
} from 'firebase/firestore'; 

// Humaray apnay config exports
import { auth, db, firebaseConfig } from './firebase';

const authStorageKey = 'mti-admin-session';
const userStorageKey = 'mti-user-session';
const staffStorageKey = 'mti-staff-accounts';
const defaultAdminEmail = 'admin@mtiinteriors.com';
const defaultAdminPassword = 'Admin123!';
function isDefaultAdminEmail(email = '') {
  return email.trim().toLowerCase() === defaultAdminEmail;
}

function normalizeAdminSession(session) {
  if (!session?.user) return session;

  const isDefaultAdmin = isDefaultAdminEmail(session.user.email);
  const role = isDefaultAdmin ? 'superadmin' : session.user.role;
  const isAdminAccount = role === 'admin' || role === 'superadmin';
  if (!isAdminAccount) return session;

  const displayName = role === 'superadmin' ? 'Super Admin' : 'Admin';
  return {
    ...session,
    user: {
      ...session.user,
      id: session.user.id || (isDefaultAdmin ? 'default-superadmin' : session.user.email),
      name: displayName,
      email: isDefaultAdmin ? defaultAdminEmail : session.user.email,
      role,
      status: 'active',
      permissions: role === 'superadmin' ? 'Full business control' : session.user.permissions || 'Site management',
      department: role === 'superadmin' ? 'Management' : session.user.department || 'Operations',
    },
  };
}

const defaultAdminContent = {
  home: fallbackSiteState.home,
  about: fallbackSiteState.about,
  contact: fallbackSiteState.contact,
};
const defaultAdminSettings = {
  appName: 'MTI Interiors',
  maintenanceMode: false,
  seo: {
    siteTitle: 'MTI Professional Interiors and Decor',
    keywords: 'interior design, decor, furniture, Pakistan',
    metaDescription: 'Premium interior design, decor, consultation, and catalog services from MTI.',
    focusKeyword: 'interior design Pakistan',
    localArea: 'Pakistan',
    canonicalUrl: '',
    ogImage: '',
    ogTitle: '',
    ogDescription: '',
    twitterHandle: '',
    googleSiteVerification: '',
    analyticsId: '',
    sitemapUrl: '',
    robotsIndex: true,
    robotsFollow: true,
  },
  appearance: {
    primaryColor: '#2f1b12',
    accentColor: '#c6954f',
    themeMode: 'warm',
    announcementText: '',
    showAnnouncement: false,
  },
  operations: {
    timezone: 'Asia/Karachi',
    currency: 'PKR',
    businessHours: 'Mon-Sat, 10:00 AM - 8:00 PM',
    leadResponseTarget: 'Within 24 hours',
  },
  notifications: {
    adminEmail: defaultAdminEmail,
    whatsappNumber: '+92 321 2323611',
    bookingAutoReply: true,
    inquiryAutoReply: true,
  },
  security: {
    recoveryEmail: defaultAdminEmail,
    sessionTimeout: '8 hours',
    requireStrongPasswords: true,
  },
};

function normalizeAdminContent(content = {}) {
  return {
    home: {
      ...defaultAdminContent.home,
      ...(content.home || {}),
      hero: { ...defaultAdminContent.home.hero, ...(content.home?.hero || content.hero || {}) },
      offer: { ...defaultAdminContent.home.offer, ...(content.home?.offer || content.offer || {}) },
    },
    about: { ...defaultAdminContent.about, ...(content.about || {}) },
    contact: { ...defaultAdminContent.contact, ...(content.contact || {}) },
  };
}

function normalizeAdminSettings(settings = {}) {
  return {
    ...defaultAdminSettings,
    ...settings,
    seo: { ...defaultAdminSettings.seo, ...(settings.seo || {}) },
    appearance: { ...defaultAdminSettings.appearance, ...(settings.appearance || {}) },
    operations: { ...defaultAdminSettings.operations, ...(settings.operations || {}) },
    notifications: { ...defaultAdminSettings.notifications, ...(settings.notifications || {}) },
    security: { ...defaultAdminSettings.security, ...(settings.security || {}) },
  };
}

const publicUrl = process.env.PUBLIC_URL || '';
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
  const [authSubmitting, setAuthSubmitting] = useState(false);

  const [adminAuth, setAdminAuth] = useState({
    email: '',
    password: '',
    currentPassword: '',
    newPassword: '',
  });
  const [adminSession, setAdminSession] = useState({ token: '', user: null });
  const [userSession, setUserSession] = useState({ token: '', user: null });
  const [userAuth, setUserAuth] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
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
    content: defaultAdminContent,
    blogs: [],
    notifications: [],
    settings: defaultAdminSettings,
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

  useEffect(() => {
    const seo = normalizeAdminSettings(adminData.settings).seo;
    const setMeta = (attribute, key, content) => {
      if (!content && key !== 'robots') return;
      let element = document.head.querySelector(`meta[${attribute}="${key}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, key);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };
    const setCanonical = (href) => {
      let link = document.head.querySelector('link[rel="canonical"]');
      if (!href) {
        if (link) link.remove();
        return;
      }
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      link.setAttribute('href', href);
    };

    document.title = seo.siteTitle || defaultAdminSettings.seo.siteTitle;
    setMeta('name', 'description', seo.metaDescription);
    setMeta('name', 'keywords', seo.keywords);
    setMeta('name', 'robots', `${seo.robotsIndex === false ? 'noindex' : 'index'}, ${seo.robotsFollow === false ? 'nofollow' : 'follow'}`);
    setMeta('name', 'google-site-verification', seo.googleSiteVerification);
    setMeta('property', 'og:title', seo.ogTitle || seo.siteTitle);
    setMeta('property', 'og:description', seo.ogDescription || seo.metaDescription);
    setMeta('property', 'og:image', seo.ogImage);
    setMeta('property', 'og:type', 'website');
    setMeta('name', 'twitter:card', seo.ogImage ? 'summary_large_image' : 'summary');
    setMeta('name', 'twitter:title', seo.ogTitle || seo.siteTitle);
    setMeta('name', 'twitter:description', seo.ogDescription || seo.metaDescription);
    setMeta('name', 'twitter:site', seo.twitterHandle);
    setCanonical(seo.canonicalUrl);
  }, [adminData.settings]);

  // Helper function to fetch all docs from a collection
  const fetchCollection = async (collectionName) => {
    try {
      const q = query(collection(db, collectionName));
      const querySnapshot = await getDocs(q);
      const items = [];
      querySnapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() });
      });
      return items;
    } catch (e) {
      console.error(`Error fetching collection ${collectionName}:`, e);
      return [];
    }
  };

  // Direct Firebase Admin Workspace Loader
  const loadAdminWorkspace = useCallback(async () => {
    setAdminLoading(true);
    try {
      const [
        usersList, servicesList, projectsList, productsList,
        bookingsList, inquiriesList, reviewsList, blogsList, notificationsList
      ] = await Promise.all([
        fetchCollection('users'),
        fetchCollection('services'),
        fetchCollection('projects'),
        fetchCollection('products'),
        fetchCollection('bookings'),
        fetchCollection('inquiries'),
        fetchCollection('reviews'),
        fetchCollection('blogs'),
        fetchCollection('notifications')
      ]);

      let contentData = defaultAdminContent;
      const contentDoc = await getDoc(doc(db, 'config', 'content'));
      if (contentDoc.exists()) contentData = normalizeAdminContent(contentDoc.data());

      let settingsData = defaultAdminSettings;
      const settingsDoc = await getDoc(doc(db, 'config', 'settings'));
      if (settingsDoc.exists()) settingsData = normalizeAdminSettings(settingsDoc.data());

      const overviewStats = {
        totalUsers: usersList.length,
        totalBookings: bookingsList.length,
        totalInquiries: inquiriesList.length,
        totalProjects: projectsList.length,
        pendingBookings: bookingsList.filter(b => b.status === 'pending').length
      };
      const localStaffAccounts = getLocalStaffAccounts().map(({ password, ...account }) => account);
      const defaultSuperAdmin = {
        id: 'default-superadmin',
        name: 'Super Admin',
        email: defaultAdminEmail,
        phone: '',
        role: 'superadmin',
        status: 'active',
      };
      const mergedUsers = [defaultSuperAdmin, ...usersList, ...localStaffAccounts].filter(
        (user, index, list) => index === list.findIndex((item) => item.email === user.email || item.id === user.id)
      );

      setAdminData({
        overview: overviewStats,
        users: mergedUsers,
        services: servicesList,
        projects: projectsList,
        products: productsList,
        bookings: bookingsList,
        inquiries: inquiriesList,
        reviews: reviewsList,
        content: contentData,
        blogs: blogsList,
        notifications: notificationsList,
        settings: settingsData,
        report: null,
      });
    } catch (error) {
      console.error("Failed to load admin workspace from Firebase", error);
    } finally {
      setAdminLoading(false);
    }
  }, []);

  // Public Sync Initial Check
  useEffect(() => {
    const loadPublicData = async () => {
      const projectsList = await fetchCollection('projects');
      const productsList = await fetchCollection('products');
      const servicesList = await fetchCollection('services');
      const reviewsList = await fetchCollection('reviews');
      const blogsList = await fetchCollection('blogs');

      const contentDoc = await getDoc(doc(db, 'config', 'content'));
      const contentData = contentDoc.exists() ? normalizeAdminContent(contentDoc.data()) : defaultAdminContent;

      setSiteData({
        ...fallbackSiteState,
        ...contentData,
        projects: projectsList,
        products: productsList,
        services: servicesList,
        reviews: reviewsList.filter(r => r.approved === true),
        blogs: blogsList.filter(b => b.published !== false),
      });
    };

    loadPublicData().catch(err => console.log("Public state load failure", err));

    const storedAdmin = window.localStorage.getItem(authStorageKey);
    if (storedAdmin) {
      try {
        const parsed = JSON.parse(storedAdmin);
        if (parsed.token) {
          const normalizedAdmin = normalizeAdminSession(parsed);
          setAdminSession(normalizedAdmin);
          window.localStorage.setItem(authStorageKey, JSON.stringify(normalizedAdmin));
        }
      } catch (error) {
        window.localStorage.removeItem(authStorageKey);
      }
    }

    const storedUser = window.localStorage.getItem(userStorageKey);
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed.token) {
          setUserSession(parsed);
          setUserProfile({ name: parsed.user.name || '', phone: parsed.user.phone || '' });
        }
      } catch (error) {
        window.localStorage.removeItem(userStorageKey);
      }
    }
  }, []);

  // Admin Workspace Trigger
  useEffect(() => {
    if (!adminSession.token) return;
    loadAdminWorkspace().catch(() => {
      setAdminFeedback((current) => ({ ...current, auth: 'Admin data could not be loaded.' }));
    });
  }, [adminSession.token, loadAdminWorkspace]);

  // Client User Sync
  useEffect(() => {
    if (!userSession.token || !auth.currentUser) return;
    setUserProfile({
      name: auth.currentUser.displayName || userProfile.name || 'Client',
      phone: userProfile.phone || '',
    });
  }, [userSession.token, userProfile.name, userProfile.phone]);

  function openAuthPanel(mode = 'login') {
    setAuthMode(mode);
    setAuthPanelOpen(true);
    setUserFeedback({});
  }

  function closeAuthPanel() {
    setAuthPanelOpen(false);
  }

  useEffect(() => {
    if (!authPanelOpen) return undefined;

    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') closeAuthPanel();
    };

    document.body.classList.add('auth-modal-open');
    window.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.body.classList.remove('auth-modal-open');
      window.removeEventListener('keydown', handleEscapeKey);
    };
  }, [authPanelOpen]);

  function isDefaultAdminLogin(email, password) {
    return email.trim().toLowerCase() === defaultAdminEmail && password === defaultAdminPassword;
  }

  function getLocalStaffAccounts() {
    try {
      const stored = window.localStorage.getItem(staffStorageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      window.localStorage.removeItem(staffStorageKey);
      return [];
    }
  }

  function saveLocalStaffAccounts(accounts) {
    window.localStorage.setItem(staffStorageKey, JSON.stringify(accounts));
  }

  function buildAdminSession(account) {
    const session = normalizeAdminSession({
      token: `local-${account.role}-session`,
      user: {
        id: account.id,
        name: account.name,
        email: account.email,
        role: account.role,
        phone: account.phone || '',
        status: account.status || 'active',
      },
    });

    window.localStorage.removeItem(userStorageKey);
    window.localStorage.setItem(authStorageKey, JSON.stringify(session));
    setUserSession({ token: '', user: null });
    setAdminSession(session);
    setAdminFeedback((current) => ({ ...current, auth: '' }));
    setAuthPanelOpen(false);
    setViewMode('admin');
    return session;
  }

  function openDefaultAdminSession() {
    return buildAdminSession({
      id: 'default-superadmin',
      name: 'Super Admin',
      email: defaultAdminEmail,
      role: 'superadmin',
      phone: '',
    });
  }

  function findLocalStaffLogin(email, password) {
    const loginEmail = email.trim().toLowerCase();
    return getLocalStaffAccounts().find((account) =>
      account.email?.trim().toLowerCase() === loginEmail &&
      account.password === password &&
      account.status !== 'suspended' &&
      ['admin', 'superadmin'].includes(account.role)
    );
  }

  function upsertLocalStaffAccount(account) {
    const email = account.email.trim().toLowerCase();
    const normalizedAccount = {
      ...account,
      email,
      password: account.password || '',
      status: account.status || 'active',
      role: account.role || 'admin',
    };
    const accounts = getLocalStaffAccounts().filter(
      (item) => item.email?.trim().toLowerCase() !== email && item.id !== account.id
    );
    saveLocalStaffAccounts([normalizedAccount, ...accounts]);
  }

  function buildBackendUserProfile(account, id) {
    const profile = { ...account };
    delete profile.password;
    return {
      ...profile,
      id,
      email: account.email?.trim().toLowerCase() || '',
      role: account.role || 'user',
      status: account.status || 'active',
      name: account.name || '',
      phone: account.phone || '',
      department: account.department || 'Operations',
      permissions: account.permissions || (account.role === 'superadmin' ? 'Full business control' : account.role === 'admin' ? 'Site management' : 'Client access only'),
      createdAt: account.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  async function ensureBackendUserProfile(firebaseUser, profileFallback = {}) {
    const role = profileFallback.role || 'user';
    const accountProfile = buildBackendUserProfile({
      ...profileFallback,
      email: firebaseUser.email,
      name: profileFallback.name || firebaseUser.displayName || (role === 'user' ? 'Client' : 'Admin Account'),
      role,
      status: profileFallback.status || 'active',
    }, firebaseUser.uid);

    try {
      await setDoc(doc(db, 'users', firebaseUser.uid), accountProfile, { merge: true });
    } catch (error) {
      console.warn('Could not sync Firebase user profile:', error);
    }

    return accountProfile;
  }

  async function createBackendAuthUser(account) {
    const secondaryApp = initializeApp(firebaseConfig, `mti-admin-create-${Date.now()}`);
    const secondaryAuth = getAuth(secondaryApp);

    try {
      let credential;
      try {
        credential = await createUserWithEmailAndPassword(secondaryAuth, account.email, account.password);
      } catch (error) {
        if (error.code !== 'auth/email-already-in-use') throw error;
        try {
          credential = await signInWithEmailAndPassword(secondaryAuth, account.email, account.password);
        } catch {
          const existingEmailError = new Error('This email already exists in Firebase with a different password.');
          existingEmailError.code = 'mti/existing-email-password-mismatch';
          throw existingEmailError;
        }
      }

      const profile = buildBackendUserProfile(account, credential.user.uid);
      const secondaryDb = getFirestore(secondaryApp);
      await setDoc(doc(secondaryDb, 'users', credential.user.uid), profile, { merge: true });
      return { user: credential.user, profile };
    } finally {
      try {
        await signOut(secondaryAuth);
      } catch {
        // Secondary auth may already be signed out.
      }
      await deleteApp(secondaryApp);
    }
  }

  function showSiteSection(sectionId) {
    setViewMode('site');
    setMobileMenuOpen(false);
    window.setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  }

  function getFriendlyAuthError(error) {
    const messageMap = {
      'auth/email-already-in-use': 'An account already exists with this email. Please sign in instead.',
      'auth/invalid-credential': 'The email or password is incorrect. Please check and try again.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/missing-password': 'Please enter your password.',
      'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
      'auth/user-not-found': 'No account was found for this email. You can create one below.',
      'auth/weak-password': 'Please use a stronger password with at least 6 characters.',
      'auth/wrong-password': 'The password is incorrect. Please try again.',
      'auth/configuration-not-found': 'Firebase Authentication is not configured for this project.',
      'auth/operation-not-allowed': 'Email/password sign-in is disabled in Firebase Authentication.',
      'auth/admin-restricted-operation': 'Firebase blocked this account creation from the client app.',
      'auth/network-request-failed': 'Network error. Please check internet connection and try again.',
      'permission-denied': 'Firestore rules blocked saving the admin role profile. Allow authenticated users/admins to write users/{uid}.',
      'mti/existing-email-password-mismatch': 'This email already exists in Firebase with a different password. Use the existing Firebase password or create admin with a different email.',
      'mti/not-admin': 'This account is a client account. Please use an admin email and password for the admin panel.',
      'mti/staff-suspended': 'This staff account is suspended. Please contact the super admin.',
    };

    return messageMap[error?.code] || `${error?.code || 'auth/error'}: ${error?.message || 'Sign in could not be completed.'}`;
  }

  function getFriendlyDataError(error, action = 'save this change') {
    const message = error?.message || '';
    if (error?.code === 'permission-denied' || message.toLowerCase().includes('missing or insufficient permissions')) {
      return `Firebase backend rules are blocking this admin action. Ask the super admin to recreate/save this admin account once, then logout, login again, and ${action}.`;
    }

    return message || 'This admin action could not be completed.';
  }

  async function repairAdminRoleProfile(firebaseUser, staffAccount) {
    if (!firebaseUser || !staffAccount) return null;

    const profile = buildBackendUserProfile({
      ...staffAccount,
      email: firebaseUser.email || staffAccount.email,
      role: staffAccount.role || 'admin',
      status: staffAccount.status || 'active',
      permissions: staffAccount.permissions || 'Site management',
    }, firebaseUser.uid);

    await setDoc(doc(db, 'users', firebaseUser.uid), profile, { merge: true });
    return profile;
  }

  async function routeSignedInUser(firebaseUser, profileFallback = {}, options = {}) {
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userDoc = await getDoc(userDocRef);
    const savedProfile = userDoc.exists() ? userDoc.data() : {};
    const isDefaultAdmin = isDefaultAdminEmail(firebaseUser.email);
    const role = isDefaultAdmin ? 'superadmin' : savedProfile.role || profileFallback.role || 'user';
    const status = isDefaultAdmin ? 'active' : savedProfile.status || profileFallback.status || 'active';
    const isAdminAccount = role === 'admin' || role === 'superadmin';

    if (options.requireAdmin && !isAdminAccount) {
      const error = new Error('This account is not assigned an admin role.');
      error.code = 'mti/not-admin';
      throw error;
    }

    if (isAdminAccount && status === 'suspended') {
      const error = new Error('This staff account is suspended.');
      error.code = 'mti/staff-suspended';
      throw error;
    }

    const name = isDefaultAdmin ? 'Super Admin' : savedProfile.name || profileFallback.name || firebaseUser.displayName || 'Client';
    const phone = savedProfile.phone || profileFallback.phone || firebaseUser.phoneNumber || '';
    const session = normalizeAdminSession({
      token: await firebaseUser.getIdToken(),
      user: {
        id: firebaseUser.uid,
        name: isAdminAccount ? name || 'Admin Account' : name,
        email: firebaseUser.email,
        role,
        phone,
        status,
      },
    });

    window.localStorage.removeItem(authStorageKey);
    window.localStorage.removeItem(userStorageKey);

    if (isAdminAccount) {
      setAdminSession(session);
      setUserSession({ token: '', user: null });
      setViewMode('admin');
      window.localStorage.setItem(authStorageKey, JSON.stringify(session));
    } else {
      setUserSession(session);
      setAdminSession({ token: '', user: null });
      setUserProfile({ name, phone });
      setViewMode('account');
      window.localStorage.setItem(userStorageKey, JSON.stringify(session));
    }

    setAdminFeedback((current) => ({ ...current, auth: '' }));
    setAuthPanelOpen(false);
    return session;
  }

  // User Email Password Flow
  async function handleUserAuthSubmit(event) {
    event.preventDefault();
    if (authSubmitting) return;
    setAuthSubmitting(true);
    setUserFeedback((current) => ({ ...current, auth: '' }));
    try {
      let userCredential;
      if (authMode === 'register') {
        userCredential = await createUserWithEmailAndPassword(auth, userAuth.email, userAuth.password);
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          name: userAuth.name,
          phone: userAuth.phone,
          email: userAuth.email,
          role: 'user',
          createdAt: new Date().toISOString()
        });
        alert('Registration Successful!');
      } else {
        if (isDefaultAdminLogin(userAuth.email, userAuth.password)) {
          openDefaultAdminSession();
          return;
        }
        const localStaffAccount = findLocalStaffLogin(userAuth.email, userAuth.password);
        if (localStaffAccount) {
          buildAdminSession(localStaffAccount);
          return;
        }
        const localStaffEmail = getLocalStaffAccounts().find(
          (account) => account.email?.trim().toLowerCase() === userAuth.email.trim().toLowerCase()
        );
        if (localStaffEmail) {
          const error = new Error(localStaffEmail.status === 'suspended' ? 'This staff account is suspended.' : 'The staff account password is incorrect.');
          error.code = localStaffEmail.status === 'suspended' ? 'mti/staff-suspended' : 'auth/wrong-password';
          throw error;
        }
        userCredential = await signInWithEmailAndPassword(auth, userAuth.email, userAuth.password);
      }

      await routeSignedInUser(userCredential.user, {
        name: userAuth.name || 'Client',
        phone: userAuth.phone || '',
        role: authMode === 'register' ? 'user' : undefined,
      });
    } catch (error) {
      setUserFeedback((current) => ({ ...current, auth: getFriendlyAuthError(error) }));
    } finally {
      setAuthSubmitting(false);
    }
  }

  // Action Logout Process
  async function handleUserLogout() {
    try {
      if (auth.currentUser) await auth.signOut();
    } finally {
      setUserSession({ token: '', user: null });
      setUserProfile({ name: '', phone: '' });
      setViewMode('site');
      window.localStorage.removeItem(userStorageKey);
    }
  }

  // Update Client Profile Record 
  async function handleProfileSave(event) {
    event.preventDefault();
    try {
      const currentUser = auth.currentUser;
      const sessionUser = userSession.user;
      const userId = currentUser?.uid || sessionUser?.id;
      const userEmail = currentUser?.email || sessionUser?.email;
      if (!userId) throw new Error("No active user configuration session found.");

      await setDoc(doc(db, "users", userId), {
        name: userProfile.name,
        phone: userProfile.phone,
        email: userEmail,
        role: sessionUser?.role || 'user',
        updatedAt: new Date().toISOString()
      }, { merge: true });

      const updatedSession = {
        ...userSession,
        user: { ...userSession.user, name: userProfile.name, phone: userProfile.phone }
      };
      setUserSession(updatedSession);
      window.localStorage.setItem(userStorageKey, JSON.stringify(updatedSession));
      alert('Profile saved successfully in Firebase Firestore!');
    } catch (error) {
      setUserFeedback((current) => ({ ...current, profile: error.message }));
    }
  }

  // Balanced single-click input handler without immediate state-clearing race conditions
  function updateObjectForm(setter) {
    return ({ target }) => {
      const { name, value, type, checked } = target;
      setter((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
    };
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
      [resourceKey]: { ...current[resourceKey], [field]: value },
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

  function validateAdminCollectionItem(resourceKey, item, config) {
    const categoryRequired = ['services', 'projects', 'products', 'blogs'].includes(resourceKey);
    if (categoryRequired && !item.category) {
      setAdminFeedback((current) => ({ ...current, [resourceKey]: `Please select a category before saving this ${config.title.toLowerCase()} item.` }));
      return false;
    }
    if (resourceKey === 'blogs' && !item.title) {
      setAdminFeedback((current) => ({ ...current, blogs: 'Please add a blog title before saving.' }));
      return false;
    }
    if (resourceKey === 'notifications' && (!item.title || !item.body)) {
      setAdminFeedback((current) => ({ ...current, notifications: 'Please add a notification title and body before saving.' }));
      return false;
    }
    return true;
  }

  // Booking Form Submit Logic (With instant state-locking feedback)
  async function handleBookingSubmit(event) {
    event.preventDefault();
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDate = bookingForm.date ? new Date(`${bookingForm.date}T00:00:00`) : null;

      if (!bookingForm.consent) {
        setStatusMessage((current) => ({ ...current, booking: 'Please confirm that MTI may contact you about this consultation.' }));
        return;
      }

      if (selectedDate && selectedDate < today) {
        setStatusMessage((current) => ({ ...current, booking: 'Please choose today or a future date for your consultation.' }));
        return;
      }

      const bookingRef = 'MTI-' + Math.floor(100000 + Math.random() * 900000);
      const finalBookingData = {
        ...bookingForm,
        name: bookingForm.name.trim(),
        email: bookingForm.email.trim(),
        phone: bookingForm.phone.trim(),
        location: bookingForm.location.trim(),
        spaceType: bookingForm.spaceType.trim(),
        requirements: bookingForm.requirements.trim(),
        reference: bookingRef,
        source: 'public-site',
        createdAt: new Date().toISOString(),
        status: 'new'
      };

      const docRef = await addDoc(collection(db, 'bookings'), finalBookingData);
      const createdBooking = { id: docRef.id, ...finalBookingData };
      setAdminData((current) => ({ ...current, bookings: [createdBooking, ...current.bookings] }));

      setStatusMessage({
        booking: `Booking request ${bookingRef} submitted. MTI will contact you by ${bookingForm.preferredContact}.`,
        inquiry: ''
      });
      setBookingForm(bookingDefaults);

      setTimeout(() => {
        setStatusMessage((current) => ({ ...current, booking: '' }));
      }, 5000);
    } catch (error) {
      setStatusMessage((current) => ({ ...current, booking: 'Error: ' + error.message }));
    }
  }

  // Inquiry Form Submit Logic (With instant single-click dispatch)
  async function handleInquirySubmit(event) {
    event.preventDefault();
    try {
      const inquiryPhone = inquiryForm.phone?.trim() || '';
      const inquiryEmail = inquiryForm.email?.trim() || '';

      if (!inquiryPhone && !inquiryEmail) {
        setStatusMessage((current) => ({ ...current, inquiry: 'Please add a phone number or email so we can reply.' }));
        return;
      }

      if (!inquiryForm.consent) {
        setStatusMessage((current) => ({ ...current, inquiry: 'Please confirm that MTI may contact you about this inquiry.' }));
        return;
      }

      const inquiryRef = 'INQ-' + Math.floor(100000 + Math.random() * 900000);
      const finalInquiryData = {
        ...inquiryForm,
        name: inquiryForm.name?.trim() || '',
        email: inquiryEmail,
        phone: inquiryPhone,
        subject: inquiryForm.subject?.trim() || '',
        serviceInterest: inquiryForm.serviceInterest?.trim() || '',
        projectType: inquiryForm.projectType?.trim() || '',
        budgetRange: inquiryForm.budgetRange?.trim() || '',
        message: inquiryForm.message?.trim() || '',
        reference: inquiryRef,
        source: 'public-site',
        status: 'new',
        createdAt: new Date().toISOString(),
      };

      const docRef = await addDoc(collection(db, 'inquiries'), finalInquiryData);
      const createdInquiry = { id: docRef.id, ...finalInquiryData };
      setAdminData((current) => ({ ...current, inquiries: [createdInquiry, ...current.inquiries] }));

      setStatusMessage({
        booking: '',
        inquiry: `Inquiry sent successfully. Reference: ${inquiryRef}`
      });
      setInquiryForm(inquiryDefaults);

      setTimeout(() => {
        setStatusMessage((current) => ({ ...current, inquiry: '' }));
      }, 5000);
    } catch (error) {
      setStatusMessage((current) => ({ ...current, inquiry: 'Error: ' + error.message }));
    }
  }

  // Admin Account Logins
  async function handleAdminLogin(event) {
    event.preventDefault();
    setAdminFeedback((current) => ({ ...current, auth: '' }));

    if (isDefaultAdminLogin(adminAuth.email, adminAuth.password)) {
      try {
        const adminCredential = await signInWithEmailAndPassword(auth, adminAuth.email, adminAuth.password);
        await ensureBackendUserProfile(adminCredential.user, {
          name: 'Super Admin',
          role: 'superadmin',
          status: 'active',
          permissions: 'Full business control',
          department: 'Management',
        });
        await routeSignedInUser(adminCredential.user, { name: 'Super Admin', role: 'superadmin', status: 'active' }, { requireAdmin: true });
      } catch (error) {
        try {
          if (auth.currentUser) await signOut(auth);
        } catch {
          // Continue with local default superadmin fallback.
        }
        openDefaultAdminSession();
      }
      return;
    }

    try {
      const adminCredential = await signInWithEmailAndPassword(auth, adminAuth.email, adminAuth.password);
      await routeSignedInUser(adminCredential.user, {}, { requireAdmin: true });
    } catch (error) {
      const localStaffAccount = findLocalStaffLogin(adminAuth.email, adminAuth.password);
      if (localStaffAccount) {
        if (auth.currentUser?.email?.trim().toLowerCase() === localStaffAccount.email?.trim().toLowerCase()) {
          try {
            const repairedProfile = await repairAdminRoleProfile(auth.currentUser, localStaffAccount);
            await routeSignedInUser(auth.currentUser, repairedProfile, { requireAdmin: true });
            setAdminFeedback((current) => ({
              ...current,
              auth: 'Admin profile restored in Firebase. Backend actions are ready now.',
            }));
            return;
          } catch (repairError) {
            setAdminFeedback((current) => ({
              ...current,
              auth: getFriendlyDataError(repairError, 'use admin backend actions'),
            }));
            return;
          }
        }
        buildAdminSession(localStaffAccount);
        return;
      }

      const localStaffEmail = getLocalStaffAccounts().find(
        (account) => account.email?.trim().toLowerCase() === adminAuth.email.trim().toLowerCase()
      );
      if (localStaffEmail) {
        setAdminFeedback((current) => ({
          ...current,
          auth: localStaffEmail.status === 'suspended'
            ? 'This staff account is suspended.'
            : 'The password for this staff account is incorrect.',
        }));
        return;
      }

      setAdminFeedback((current) => ({ ...current, auth: getFriendlyAuthError(error) }));
    }
  }

  async function handleAdminLogout() {
    try {
      if (auth.currentUser) await auth.signOut();
    } finally {
      setAdminSession({ token: '', user: null });
      setViewMode('site');
      window.localStorage.removeItem(authStorageKey);
    }
  }

  async function handlePasswordChange(event) {
    event.preventDefault();
    setAdminFeedback((current) => ({ ...current, settings: 'Password changes should be completed in Firebase Authentication for deployed accounts.' }));
  }

  // Direct Admin Create Collection Operations to Firestore
  async function createCollectionItem(resourceKey) {
    const config = collectionConfigs[resourceKey];
    const dataKey = resourceKey === 'superadmin' ? 'users' : resourceKey;
    try {
      const itemData = { ...adminDrafts[resourceKey], createdAt: new Date().toISOString() };
      if (!validateAdminCollectionItem(resourceKey, itemData, config)) return;
      if (resourceKey === 'superadmin') {
        itemData.email = itemData.email?.trim().toLowerCase() || '';
        itemData.role = itemData.role || 'admin';
        itemData.status = itemData.status || 'active';
        if (!itemData.name || !itemData.email) {
          setAdminFeedback((current) => ({ ...current, superadmin: 'Name and email are required.' }));
          return;
        }
        if (['admin', 'superadmin'].includes(itemData.role) && !itemData.password) {
          setAdminFeedback((current) => ({ ...current, superadmin: 'Password is required for admin accounts.' }));
          return;
        }
      }
      let createdItem;

      if (resourceKey === 'superadmin') {
        if (itemData.password) {
          const backendAccount = await createBackendAuthUser(itemData);
          createdItem = backendAccount.profile;
          if (['admin', 'superadmin'].includes(createdItem.role)) {
            upsertLocalStaffAccount({ ...createdItem, password: itemData.password });
          }
        } else {
          const backendProfile = buildBackendUserProfile(itemData, `profile-${Date.now()}`);
          const docRef = await addDoc(collection(db, config.collection), backendProfile);
          createdItem = { ...backendProfile, id: docRef.id };
        }
      } else {
        const docRef = await addDoc(collection(db, config.collection), itemData);
        createdItem = { id: docRef.id, ...itemData };
      }

      const nextItems = [createdItem, ...adminData[dataKey]];
      setAdminData((current) => ({ ...current, [dataKey]: nextItems }));
      syncPublicState(dataKey, nextItems);
      setAdminDrafts((current) => ({ ...current, [resourceKey]: config.emptyItem }));
      setAdminFeedback((current) => ({
        ...current,
        [resourceKey]: resourceKey === 'superadmin'
          ? ['admin', 'superadmin'].includes(createdItem.role)
            ? `${createdItem.role === 'superadmin' ? 'Super admin' : 'Admin'} account is ready in Firebase. Use ${createdItem.email} with the password you entered.`
            : `Client account for ${createdItem.email} is ready.`
          : `${config.title} dynamic entry added.`,
      }));
    } catch (error) {
      if (resourceKey === 'superadmin') {
        setAdminFeedback((current) => ({ ...current, superadmin: `Firebase account could not be created: ${getFriendlyAuthError(error)}` }));
        return;
      }
      setAdminFeedback((current) => ({ ...current, [resourceKey]: getFriendlyDataError(error, `add ${config.title.toLowerCase()}`) }));
    }
  }

  // Direct Admin Save / Patch Item Changes inside Firestore
  async function saveCollectionItem(resourceKey, item) {
    const config = collectionConfigs[resourceKey];
    const dataKey = resourceKey === 'superadmin' ? 'users' : resourceKey;
    try {
      const { id, ...cleanData } = item;
      if (!validateAdminCollectionItem(resourceKey, item, config)) return;
      if (!String(id).startsWith('local-') && id !== 'default-superadmin') {
        await setDoc(doc(db, config.collection, id), cleanData, { merge: true });
      }
      if (resourceKey === 'superadmin') {
        const existing = getLocalStaffAccounts().find((account) => account.id === id || account.email === item.email);
        if (['admin', 'superadmin'].includes(item.role)) {
          upsertLocalStaffAccount({ ...existing, ...item, password: item.password || existing?.password || '' });
        } else {
          saveLocalStaffAccounts(getLocalStaffAccounts().filter((account) => account.id !== id && account.email !== item.email));
        }
      }

      const nextItems = adminData[dataKey].map((entry) => (entry.id === item.id ? item : entry));
      setAdminData((current) => ({ ...current, [dataKey]: nextItems }));
      syncPublicState(dataKey, nextItems);
      setAdminFeedback((current) => ({ ...current, [resourceKey]: `${config.title} item saved successfully.` }));
    } catch (error) {
      setAdminFeedback((current) => ({ ...current, [resourceKey]: getFriendlyDataError(error, `save ${config.title.toLowerCase()}`) }));
    }
  }

  // Direct Admin Delete Item Collections matching Document IDs
  async function deleteCollectionItem(resourceKey, itemId) {
      const config = collectionConfigs[resourceKey];
      const dataKey = resourceKey === 'superadmin' ? 'users' : resourceKey;
    try {
      if (!String(itemId).startsWith('local-') && itemId !== 'default-superadmin') {
        await deleteDoc(doc(db, config.collection, itemId));
      }
      if (resourceKey === 'superadmin') {
        saveLocalStaffAccounts(getLocalStaffAccounts().filter((account) => account.id !== itemId));
      }

      const nextItems = adminData[dataKey].filter((item) => item.id !== itemId);
      setAdminData((current) => ({ ...current, [dataKey]: nextItems }));
      syncPublicState(dataKey, nextItems);
      setAdminFeedback((current) => ({ ...current, [resourceKey]: `${config.title} element permanently deleted.` }));
    } catch (error) {
      setAdminFeedback((current) => ({ ...current, [resourceKey]: getFriendlyDataError(error, `delete ${config.title.toLowerCase()}`) }));
    }
  }

  function updateSimpleRecord(groupKey, itemId, field, value) {
    setAdminData((current) => ({
      ...current,
      [groupKey]: current[groupKey].map((item) => (item.id === itemId ? { ...item, [field]: value } : item)),
    }));
  }

  // Direct Admin Save Process for Simple Records (Bookings/Reviews/Inquiries)
  async function saveSimpleRecord(groupKey, endpoint, item) {
    try {
      const { id, ...cleanData } = item;
      await setDoc(doc(db, endpoint, id), cleanData, { merge: true });

      const nextItems = adminData[groupKey].map((entry) => (entry.id === item.id ? item : entry));
      setAdminData((current) => ({ ...current, [groupKey]: nextItems }));
      if (groupKey === 'reviews') syncPublicState('reviews', nextItems);
      setAdminFeedback((current) => ({ ...current, [groupKey]: 'Record updated in Firebase.' }));
    } catch (error) {
      setAdminFeedback((current) => ({ ...current, [groupKey]: getFriendlyDataError(error, `save this ${groupKey.slice(0, -1)} record`) }));
    }
  }

  // Direct Admin Simple Record Deletion Flows
  async function deleteSimpleRecord(groupKey, endpoint, itemId) {
    try {
      await deleteDoc(doc(db, endpoint, itemId));
      const nextItems = adminData[groupKey].filter((item) => item.id !== itemId);
      setAdminData((current) => ({ ...current, [groupKey]: nextItems }));
      if (groupKey === 'reviews') syncPublicState('reviews', nextItems);
      setAdminFeedback((current) => ({ ...current, [groupKey]: 'Record removed.' }));
    } catch (error) {
      setAdminFeedback((current) => ({ ...current, [groupKey]: getFriendlyDataError(error, `delete this ${groupKey.slice(0, -1)} record`) }));
    }
  }

  // Save Content Management Updates Directly into centralized Firestore Document
  async function saveContent() {
    try {
      const nextContent = normalizeAdminContent(adminData.content);
      await setDoc(doc(db, 'config', 'content'), nextContent, { merge: true });
      setSiteData((current) => ({
        ...current,
        home: nextContent.home,
        about: nextContent.about,
        contact: nextContent.contact,
      }));
      setAdminData((current) => ({ ...current, content: nextContent }));
      setAdminFeedback((current) => ({ ...current, content: 'Global public site copy saved to Firestore.' }));
    } catch (error) {
      setAdminFeedback((current) => ({ ...current, content: getFriendlyDataError(error, 'save site content') }));
    }
  }

  // Save Admin Application Settings Directly into Firestore
  async function saveSettings() {
    try {
      const nextSettings = normalizeAdminSettings(adminData.settings);
      await setDoc(doc(db, 'config', 'settings'), nextSettings, { merge: true });
      setAdminData((current) => ({ ...current, settings: nextSettings }));
      setAdminFeedback((current) => ({ ...current, settings: 'System settings synced online.' }));
    } catch (error) {
      setAdminFeedback((current) => ({ ...current, settings: getFriendlyDataError(error, 'save settings') }));
    }
  }

  function createBackup() {
    const backup = {
      createdAt: new Date().toISOString(),
      siteData,
      adminData: {
        services: adminData.services,
        projects: adminData.projects,
        products: adminData.products,
        bookings: adminData.bookings,
        inquiries: adminData.inquiries,
        reviews: adminData.reviews,
        blogs: adminData.blogs,
        notifications: adminData.notifications,
        content: normalizeAdminContent(adminData.content),
        settings: normalizeAdminSettings(adminData.settings),
      },
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `mti-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    setAdminFeedback((current) => ({ ...current, settings: 'Backup JSON downloaded.' }));
  }

  function exportReport(format) {
    const report = {
      format,
      generatedAt: new Date().toISOString(),
      summary: {
        bookings: adminData.bookings.length,
        inquiries: adminData.inquiries.length,
        users: adminData.users.length,
        projects: adminData.projects.length,
        products: adminData.products.length,
        reviews: adminData.reviews.length,
      },
    };
    setAdminData((current) => ({ ...current, report }));
    setAdminFeedback((current) => ({ ...current, reports: `${format.toUpperCase()} report generated.` }));
  }

  const filteredProjects = siteData.projects.filter((project) => {
    const categoryMatch = projectCategory === 'All' || project.category === projectCategory;
    const search = deferredProjectSearch.trim().toLowerCase();
    if (!search) return categoryMatch;
    return categoryMatch && `${project.title} ${project.description} ${project.location}`.toLowerCase().includes(search);
  });

  const filteredProducts = siteData.products.filter((product) => {
    const categoryMatch = productCategory === 'All' || product.category === productCategory;
    const search = deferredProductSearch.trim().toLowerCase();
    if (!search) return categoryMatch;
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

      {adminSession.user && viewMode === 'site' && (
        <div className="admin-floating-toolbar">
          <div className="toolbar-info">
            <span className="toolbar-dot"></span>
            <span><strong>Admin Mode Active</strong> — Logged in as <em>{adminSession.user.name}</em></span>
          </div>
          <div className="toolbar-actions">
            <button type="button" onClick={() => setViewMode('admin')} className="toolbar-btn primary">Go to Dashboard</button>
            <button type="button" onClick={handleAdminLogout} className="toolbar-btn secondary">Logout</button>
          </div>
        </div>
      )}

      {viewMode !== 'admin' && (
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
              <a
                href={item.href}
                key={item.label}
                onClick={(event) => {
                  setMobileMenuOpen(false);
                  if (viewMode !== 'site' && item.href.startsWith('#')) {
                    event.preventDefault();
                    showSiteSection(item.href.slice(1));
                  }
                }}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="header-actions">
            {adminSession.user ? (
              <button className="secondary-action header-link-button" type="button" onClick={() => setViewMode('admin')}>Admin Dashboard</button>
            ) : userSession.user ? (
              <button className="secondary-action header-link-button" type="button" onClick={() => setViewMode('account')}>Client Portal</button>
            ) : (
              <button className="secondary-action header-link-button" type="button" onClick={() => openAuthPanel('login')}>Sign In</button>
            )}
            <a
              className="header-cta"
              href="#consultation"
              onClick={(event) => {
                if (viewMode !== 'site') {
                  event.preventDefault();
                  showSiteSection('consultation');
                }
              }}
            >
              Request a proposal
            </a>
          </div>
        </header>
      )}

      {viewMode === 'site' ? (
        <PublicSite
          siteData={siteData} brandAssets={brandAssets}
          projectSearch={projectSearch} setProjectSearch={setProjectSearch}
          productSearch={productSearch} setProductSearch={setProductSearch}
          projectCategory={projectCategory} setProjectCategory={setProjectCategory}
          productCategory={productCategory} setProductCategory={setProductCategory}
          filteredProjects={filteredProjects} filteredProducts={filteredProducts}
          currencyFormatter={currencyFormatter} bookingForm={bookingForm} inquiryForm={inquiryForm}
          updateBookingForm={updateObjectForm(setBookingForm)} 
          updateInquiryForm={updateObjectForm(setInquiryForm)}
          handleBookingSubmit={handleBookingSubmit} handleInquirySubmit={handleInquirySubmit}
          statusMessage={statusMessage}
        />
      ) : viewMode === 'account' ? (
        <UserPortal
          siteData={siteData} userSession={userSession}
          userProfile={userProfile} setUserProfile={setUserProfile}
          userFeedback={userFeedback} handleProfileSave={handleProfileSave}
          handleUserLogout={handleUserLogout}
          showSiteSection={showSiteSection}
        />
      ) : (
        <AdminPanel
          adminSession={adminSession} adminAuth={adminAuth} setAdminAuth={setAdminAuth}
          adminTab={adminTab} setAdminTab={setAdminTab} adminData={adminData}
          adminDrafts={adminDrafts} adminFeedback={adminFeedback} adminLoading={adminLoading}
          handleAdminLogin={handleAdminLogin} handleAdminLogout={handleAdminLogout}
          handlePasswordChange={handlePasswordChange} setDraftValue={setDraftValue}
          updateCollectionItem={updateCollectionItem} createCollectionItem={createCollectionItem}
          saveCollectionItem={saveCollectionItem} deleteCollectionItem={deleteCollectionItem}
          updateSimpleRecord={updateSimpleRecord} saveSimpleRecord={saveSimpleRecord}
          deleteSimpleRecord={deleteSimpleRecord} saveContent={saveContent}
          saveSettings={saveSettings} createBackup={createBackup} exportReport={exportReport}
          setAdminData={setAdminData} setViewMode={setViewMode} viewMode={viewMode}
        />
      )}

      {authPanelOpen && (
        <div className="signin-overlay" role="presentation" onMouseDown={closeAuthPanel}>
          <section
            className="signin-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-title"
            aria-describedby="auth-description"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button className="signin-close" type="button" onClick={closeAuthPanel} aria-label="Close sign in panel">X</button>

            <div className="signin-visual" style={{ backgroundImage: `linear-gradient(140deg, rgba(27, 17, 12, 0.38), rgba(47, 27, 18, 0.82)), url(${brandAssets.showroom})` }}>
              <div className="signin-brand">
                <div className="signin-logo">MTI</div>
                <div>
                  <strong>MTI Interiors</strong>
                  <span>Client Portal</span>
                </div>
              </div>

              <div className="signin-visual-copy">
                <p className="signin-kicker">Made to Inspire</p>
                <h1>Your design journey, beautifully managed.</h1>
                <p>
                  Review consultations, keep your profile current, and continue conversations with the MTI team from one polished place.
                </p>
              </div>

              <div className="signin-trust-row" aria-label="Account benefits">
                <span>Secure access</span>
                <span>Saved profile</span>
                <span>Fast follow-up</span>
              </div>
            </div>

            <div className="signin-panel">
              <div className="signin-form-shell">
                <div className="signin-header">
                  <p className="signin-kicker">Secure Access</p>
                  <h2 id="auth-title">{authMode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
                  <p id="auth-description">
                    {authMode === 'login'
                      ? 'Access your MTI account to manage consultations, profile details, and project updates.'
                      : 'Set up your client profile and keep project details organized.'}
                  </p>
                </div>

                <form onSubmit={handleUserAuthSubmit} className="signin-form">
                  {authMode === 'register' && (
                    <div className="signin-two-fields">
                      <div className="signin-field">
                        <label htmlFor="auth-name">Full Name</label>
                        <input
                          id="auth-name"
                          type="text"
                          value={userAuth.name}
                          onChange={(e) => setUserAuth({ ...userAuth, name: e.target.value })}
                          required
                          autoComplete="name"
                          placeholder="Your full name"
                        />
                      </div>
                      <div className="signin-field">
                        <label htmlFor="auth-phone">Phone Number</label>
                        <input
                          id="auth-phone"
                          type="tel"
                          value={userAuth.phone}
                          onChange={(e) => setUserAuth({ ...userAuth, phone: e.target.value })}
                          autoComplete="tel"
                          inputMode="tel"
                          placeholder="+92 300 1234567"
                        />
                      </div>
                    </div>
                  )}

                  <div className="signin-field">
                    <label htmlFor="auth-email">Email Address</label>
                    <input
                      id="auth-email"
                      type="email"
                      value={userAuth.email}
                      onChange={(e) => setUserAuth({ ...userAuth, email: e.target.value })}
                      required
                      autoComplete="email"
                      inputMode="email"
                      placeholder="you@example.com"
                    />
                  </div>

                  <div className="signin-field">
                    <label htmlFor="auth-password">Password</label>
                    <input
                      id="auth-password"
                      type="password"
                      value={userAuth.password}
                      onChange={(e) => setUserAuth({ ...userAuth, password: e.target.value })}
                      required
                      minLength={authMode === 'register' ? 6 : undefined}
                      autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                      placeholder={authMode === 'login' ? 'Enter your password' : 'At least 6 characters'}
                    />
                  </div>

                  {userFeedback.auth && <p className="signin-error">{userFeedback.auth}</p>}

                  <button type="submit" className="signin-submit" disabled={authSubmitting}>
                    {authSubmitting
                      ? 'Please wait...'
                      : authMode === 'login'
                        ? 'Sign in securely'
                        : 'Create account'}
                  </button>
                </form>

                <div className="signin-switch-row">
                  <span>{authMode === 'login' ? 'New to MTI?' : 'Already registered?'}</span>
                  <button
                    type="button"
                    className="signin-switch"
                    onClick={() => {
                      setAuthMode(authMode === 'login' ? 'register' : 'login');
                      setUserFeedback({});
                    }}
                  >
                    {authMode === 'login' ? 'Create account' : 'Sign in'}
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;
