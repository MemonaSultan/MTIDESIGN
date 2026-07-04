export const navigation = [
  { label: "Services", href: "#services" },
  { label: "Portfolio", href: "#portfolio" },
  { label: "Catalog", href: "#catalog" },
  { label: "Journal", href: "#journal" },
  { label: "Contact", href: "#consultation" },
];

export const adminTabs = [
  { id: "overview", label: "Overview" },
  { id: "content", label: "Content" },
  { id: "services", label: "Services" },
  { id: "projects", label: "Portfolio" },
  { id: "products", label: "Catalog" },
  { id: "bookings", label: "Bookings" },
  { id: "inquiries", label: "Inquiries" },
  { id: "reviews", label: "Reviews" },
  { id: "users", label: "Users" },
  { id: "blogs", label: "Blogs" },
  { id: "notifications", label: "Notifications" },
  { id: "settings", label: "Settings" },
  { id: "reports", label: "Reports" },
  { id: "superadmin", label: "Super Admin" },
];

export const collectionConfigs = {
  services: {
    collection: "services",
    title: "Service Management",
    createLabel: "Add Service",
    emptyItem: {
      name: "",
      category: "",
      description: "",
      timeline: "",
      price: "",
      featured: false,
      createdAt: Date.now(),
    },
    fields: [
      { key: "name", label: "Name" },
      { key: "category", label: "Category" },
      { key: "timeline", label: "Timeline" },
      { key: "price", label: "Price", type: "number" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "featured", label: "Featured", type: "checkbox" },
    ],
  },

  projects: {
    collection: "projects",
    title: "Portfolio Management",
    createLabel: "Add Project",
    emptyItem: {
      title: "",
      category: "",
      location: "",
      description: "",
      imageUrl: "",
      videoUrl: "",
      featured: false,
      createdAt: Date.now(),
    },
    fields: [
      { key: "title", label: "Title" },
      {
        key: "category",
        label: "Category",
        type: "select",
        required: true,
        options: ["Curtains", "Wallpapers", "Flooring", "Furniture", "Blinds"],
      },
      { key: "location", label: "Location" },
      { key: "imageUrl", label: "Project Image", type: "image" },
      { key: "videoUrl", label: "Video URL" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "featured", label: "Featured", type: "checkbox" },
    ],
  },

  products: {
    collection: "products",
    title: "Catalog Management",
    createLabel: "Add Product",
    emptyItem: {
      name: "",
      category: "",
      material: "",
      specification: "",
      price: 0,
      imageUrl: "",
      swatch: "",
      featured: false,
      createdAt: Date.now(),
    },
    fields: [
      { key: "name", label: "Name" },
      {
        key: "category",
        label: "Category",
        type: "select",
        required: true,
        options: ["Furniture", "Decor", "Blinds", "Lighting", "Flooring"],
      },
      { key: "material", label: "Material" },
      { key: "price", label: "Price", type: "number" },
      { key: "imageUrl", label: "Product Image", type: "image" },
      { key: "swatch", label: "Swatch" },
      { key: "specification", label: "Specification", type: "textarea" },
      { key: "featured", label: "Featured", type: "checkbox" },
    ],
  },

  blogs: {
    collection: "blogs",
    title: "Blog Management",
    createLabel: "Add Blog",
    emptyItem: {
      title: "",
      excerpt: "",
      published: false,
      createdAt: Date.now(),
    },
    fields: [
      { key: "title", label: "Title" },
      { key: "excerpt", label: "Excerpt", type: "textarea" },
      { key: "published", label: "Published", type: "checkbox" },
    ],
  },

  notifications: {
    collection: "notifications",
    title: "Notifications",
    createLabel: "Add Notification",
    emptyItem: {
      title: "",
      channel: "email",
      body: "",
      active: true,
      createdAt: Date.now(),
    },
    fields: [
      { key: "title", label: "Title" },
      { key: "channel", label: "Channel" },
      { key: "body", label: "Body", type: "textarea" },
      { key: "active", label: "Active", type: "checkbox" },
    ],
  },

  superadmin: {
    collection: "users",
    title: "User Management",
    createLabel: "Add User",
    emptyItem: {
      name: "",
      email: "",
      password: "",
      phone: "",
      role: "admin",
      status: "active",
      createdAt: Date.now(),
    },
    fields: [
      { key: "name", label: "Name" },
      { key: "email", label: "Email" },
      { key: "phone", label: "Phone" },
      {
        key: "role",
        label: "Role",
      },
      {
        key: "status",
        label: "Status",
      },
    ],
  },
};
